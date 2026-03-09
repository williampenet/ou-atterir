-- ==========================================================
-- Ou Atterir — Climadiag climate projections
-- Source: Météo-France Climadiag Commune (TRACC 2030/2050/2100)
-- Adds commune_climat table, materialized view, RLS,
-- get_commune_climat RPC, and target_heat_wave filter
-- to search_communes / count_communes.
-- ==========================================================

BEGIN;

-- ==========================================================
-- 0. Table: commune_climat
-- ==========================================================

CREATE TABLE IF NOT EXISTS commune_climat (
  code_insee text PRIMARY KEY,
  icu smallint,
  s3_ref numeric, s3_2030 numeric, s3_2050 numeric, s3_2100 numeric,
  s1_ref numeric, s1_2030 numeric, s1_2050 numeric, s1_2100 numeric,
  s2_ref numeric, s2_2030 numeric, s2_2050 numeric, s2_2100 numeric,
  s4_ref numeric, s4_2030 numeric, s4_2050 numeric, s4_2100 numeric,
  r2_ref numeric, r2_2030 numeric, r2_2050 numeric, r2_2100 numeric,
  r4_ref numeric, r4_2030 numeric, r4_2050 numeric, r4_2100 numeric,
  r5_ete_ref numeric, r5_ete_2030 numeric, r5_ete_2050 numeric, r5_ete_2100 numeric,
  g4_ete_ref numeric, g4_ete_2030 numeric, g4_ete_2050 numeric, g4_ete_2100 numeric
);

-- ==========================================================
-- 1. Materialized view: heat wave level (based on S3 2050)
--    Thresholds based on TRACC projections distribution:
--    - faible     : < 5 jours/an
--    - modere     : 5–15 jours/an
--    - eleve      : 15–30 jours/an
--    - tres_eleve : ≥ 30 jours/an
-- ==========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS commune_climat_summary AS
SELECT
  code_insee,
  icu,
  s3_2050,
  CASE
    WHEN s3_2050 IS NULL THEN NULL
    WHEN s3_2050 < 5 THEN 'faible'
    WHEN s3_2050 < 15 THEN 'modere'
    WHEN s3_2050 < 30 THEN 'eleve'
    ELSE 'tres_eleve'
  END AS heat_wave_level
FROM commune_climat;

CREATE UNIQUE INDEX IF NOT EXISTS idx_climat_summary_insee ON commune_climat_summary(code_insee);
CREATE INDEX IF NOT EXISTS idx_climat_summary_hw ON commune_climat_summary(heat_wave_level);

-- ==========================================================
-- 2. RLS
-- ==========================================================

ALTER TABLE commune_climat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on commune_climat"
  ON commune_climat FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on commune_climat"
  ON commune_climat FOR INSERT TO anon WITH CHECK (true);

-- ==========================================================
-- 3. RPC: get climate data for a single commune
-- ==========================================================

CREATE OR REPLACE FUNCTION get_commune_climat(target_insee text)
RETURNS TABLE (
  icu smallint,
  s3_ref numeric, s3_2030 numeric, s3_2050 numeric, s3_2100 numeric,
  s1_ref numeric, s1_2030 numeric, s1_2050 numeric, s1_2100 numeric,
  s2_ref numeric, s2_2030 numeric, s2_2050 numeric, s2_2100 numeric,
  s4_ref numeric, s4_2030 numeric, s4_2050 numeric, s4_2100 numeric,
  r2_ref numeric, r2_2030 numeric, r2_2050 numeric, r2_2100 numeric,
  r4_ref numeric, r4_2030 numeric, r4_2050 numeric, r4_2100 numeric,
  r5_ete_ref numeric, r5_ete_2030 numeric, r5_ete_2050 numeric, r5_ete_2100 numeric,
  g4_ete_ref numeric, g4_ete_2030 numeric, g4_ete_2050 numeric, g4_ete_2100 numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.icu,
    cc.s3_ref, cc.s3_2030, cc.s3_2050, cc.s3_2100,
    cc.s1_ref, cc.s1_2030, cc.s1_2050, cc.s1_2100,
    cc.s2_ref, cc.s2_2030, cc.s2_2050, cc.s2_2100,
    cc.s4_ref, cc.s4_2030, cc.s4_2050, cc.s4_2100,
    cc.r2_ref, cc.r2_2030, cc.r2_2050, cc.r2_2100,
    cc.r4_ref, cc.r4_2030, cc.r4_2050, cc.r4_2100,
    cc.r5_ete_ref, cc.r5_ete_2030, cc.r5_ete_2050, cc.r5_ete_2100,
    cc.g4_ete_ref, cc.g4_ete_2030, cc.g4_ete_2050, cc.g4_ete_2100
  FROM commune_climat cc
  WHERE cc.code_insee = target_insee;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================================
-- 4. Replace search_communes — add target_heat_wave
-- ==========================================================

DROP FUNCTION IF EXISTS search_communes(text, text, text, text[], text[], text, text[], int, text, text[], double precision, double precision, double precision, double precision, int, int);

CREATE OR REPLACE FUNCTION search_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_equipment_filters text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL,
  target_risk_level text DEFAULT NULL,
  target_geo_tags text[] DEFAULT NULL,
  target_prix_m2_max integer DEFAULT NULL,
  target_air_quality text DEFAULT NULL,
  target_insee_list text[] DEFAULT NULL,
  target_lat_min double precision DEFAULT NULL,
  target_lat_max double precision DEFAULT NULL,
  target_lng_min double precision DEFAULT NULL,
  target_lng_max double precision DEFAULT NULL,
  target_heat_wave text DEFAULT NULL,
  page_limit int DEFAULT 30,
  page_offset int DEFAULT 0
)
RETURNS TABLE (
  commune_id uuid,
  insee text,
  zipcode text,
  name text,
  department text,
  lat double precision,
  lng double precision,
  stability text,
  current_mayor text,
  match_level text,
  total_elections bigint,
  matching_elections bigint,
  latest_nuance text,
  latest_nuance_label text,
  latest_bloc text,
  latest_winner text,
  latest_year int,
  latest_score double precision
) AS $$
BEGIN
  RETURN QUERY
  WITH commune_stats AS (
    SELECT
      c.id,
      c.insee,
      c.zipcode,
      c.name,
      c.department,
      c.lat,
      c.lng,
      c.stability,
      c.current_mayor,
      COUNT(*) AS total_el,
      CASE
        WHEN target_bloc IS NOT NULL THEN
          COUNT(*) FILTER (WHERE n.bloc = target_bloc)
        ELSE COUNT(*)
      END AS matching_el
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id AND er.election_type = 'municipales'
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE (target_department IS NULL OR c.department = target_department)
      AND (target_insee_list IS NULL OR c.insee = ANY(target_insee_list))
      AND (target_lat_min IS NULL OR (c.lat BETWEEN target_lat_min AND target_lat_max AND c.lng BETWEEN target_lng_min AND target_lng_max))
      AND (target_equipment_filters IS NULL OR NOT EXISTS (
        SELECT f.fk
        FROM unnest(target_equipment_filters) AS f(fk)
        WHERE NOT EXISTS (
          SELECT 1
          FROM commune_equipments ce
          JOIN equipment_types et ON et.code = ce.typequ
          WHERE ce.insee = c.insee
            AND (
              (f.fk = 'commerces' AND et.domain = 'B')
              OR (f.fk = 'ecole' AND et.subdomain = 'C1')
              OR (f.fk = 'college' AND et.subdomain = 'C2')
              OR (f.fk = 'lycee' AND et.subdomain = 'C3')
              OR (f.fk = 'sup' AND et.subdomain IN ('C4', 'C5'))
              OR (f.fk = 'etab_sante' AND et.subdomain = 'D1')
              OR (f.fk = 'prof_med' AND et.subdomain = 'D2')
              OR (f.fk = 'creche' AND et.code = 'D502')
              OR (f.fk = 'transports' AND et.domain = 'E')
              OR (f.fk = 'sport' AND et.subdomain = 'F1')
              OR (f.fk = 'culture' AND et.subdomain = 'F3')
            )
        )
      ))
      AND (target_pop_ranges IS NULL OR (
        (c.population < 200 AND 'hameau' = ANY(target_pop_ranges)) OR
        (c.population >= 200 AND c.population < 500 AND 'village' = ANY(target_pop_ranges)) OR
        (c.population >= 500 AND c.population < 2000 AND 'bourg' = ANY(target_pop_ranges)) OR
        (c.population >= 2000 AND c.population < 10000 AND 'petite_ville' = ANY(target_pop_ranges)) OR
        (c.population >= 10000 AND c.population < 50000 AND 'ville_moyenne' = ANY(target_pop_ranges)) OR
        (c.population >= 50000 AND c.population < 200000 AND 'grande_ville' = ANY(target_pop_ranges)) OR
        (c.population >= 200000 AND 'metropole' = ANY(target_pop_ranges))
      ))
      AND (target_risk_level IS NULL OR EXISTS (
        SELECT 1 FROM commune_risk_summary crs
        WHERE crs.code_insee = c.insee
          AND crs.risk_level = target_risk_level
      ) OR (target_risk_level = 'peu_expose' AND NOT EXISTS (
        SELECT 1 FROM commune_risk_summary crs
        WHERE crs.code_insee = c.insee
      )))
      AND (target_geo_tags IS NULL OR c.geo_tags @> target_geo_tags)
      AND (target_prix_m2_max IS NULL OR EXISTS (
        SELECT 1 FROM commune_prix_m2_latest cpl
        WHERE cpl.code_insee = c.insee
          AND (
            (target_prix_m2_max < 99999 AND cpl.prix_m2_min <= target_prix_m2_max)
            OR (target_prix_m2_max = 99999 AND cpl.prix_m2_min > 5000)
          )
      ))
      AND (target_air_quality IS NULL OR EXISTS (
        SELECT 1 FROM commune_air_summary cas
        WHERE cas.code_insee = c.insee
          AND cas.air_quality_level = target_air_quality
      ))
      AND (target_heat_wave IS NULL OR EXISTS (
        SELECT 1 FROM commune_climat_summary ccs
        WHERE ccs.code_insee = c.insee
          AND ccs.heat_wave_level = target_heat_wave
      ))
    GROUP BY c.id
  ),
  latest AS (
    SELECT DISTINCT ON (er.commune_id)
      er.commune_id,
      er.winner_nuance,
      n.label AS nuance_label,
      n.bloc,
      er.winner_name,
      er.year,
      er.score
    FROM election_results er
    JOIN commune_stats cs ON cs.id = er.commune_id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE er.election_type = 'municipales'
    ORDER BY er.commune_id, er.year DESC
  ),
  classified AS (
    SELECT
      cs.id AS commune_id,
      cs.insee,
      cs.zipcode,
      cs.name,
      cs.department,
      cs.lat,
      cs.lng,
      cs.stability,
      cs.current_mayor,
      cs.total_el AS total_elections,
      cs.matching_el AS matching_elections,
      l.winner_nuance AS latest_nuance,
      l.nuance_label AS latest_nuance_label,
      l.bloc AS latest_bloc,
      l.winner_name AS latest_winner,
      l.year AS latest_year,
      l.score AS latest_score,
      CASE
        WHEN target_bloc IS NULL THEN 'all'
        WHEN cs.matching_el = cs.total_el AND cs.total_el >= 2 THEN 'forteresse'
        WHEN l.bloc = target_bloc THEN 'tendance'
        ELSE NULL
      END AS match_level
    FROM commune_stats cs
    JOIN latest l ON l.commune_id = cs.id
  )
  SELECT
    classified.commune_id,
    classified.insee,
    classified.zipcode,
    classified.name,
    classified.department,
    classified.lat,
    classified.lng,
    classified.stability,
    classified.current_mayor,
    classified.match_level,
    classified.total_elections,
    classified.matching_elections,
    classified.latest_nuance,
    classified.latest_nuance_label,
    classified.latest_bloc,
    classified.latest_winner,
    classified.latest_year,
    classified.latest_score
  FROM classified
  WHERE classified.match_level IS NOT NULL
    AND (target_match_level IS NULL OR classified.match_level = target_match_level)
  ORDER BY
    CASE classified.match_level WHEN 'forteresse' THEN 0 WHEN 'tendance' THEN 1 ELSE 2 END,
    classified.name
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================================
-- 5. Replace count_communes — add target_heat_wave
-- ==========================================================

DROP FUNCTION IF EXISTS count_communes(text, text, text, text[], text[], text, text[], int, text, text[], double precision, double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION count_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_equipment_filters text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL,
  target_risk_level text DEFAULT NULL,
  target_geo_tags text[] DEFAULT NULL,
  target_prix_m2_max integer DEFAULT NULL,
  target_air_quality text DEFAULT NULL,
  target_insee_list text[] DEFAULT NULL,
  target_lat_min double precision DEFAULT NULL,
  target_lat_max double precision DEFAULT NULL,
  target_lng_min double precision DEFAULT NULL,
  target_lng_max double precision DEFAULT NULL,
  target_heat_wave text DEFAULT NULL
)
RETURNS bigint AS $$
DECLARE
  result bigint;
BEGIN
  WITH commune_stats AS (
    SELECT
      c.id,
      c.insee,
      COUNT(*) AS total_el,
      CASE
        WHEN target_bloc IS NOT NULL THEN
          COUNT(*) FILTER (WHERE n.bloc = target_bloc)
        ELSE COUNT(*)
      END AS matching_el
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id AND er.election_type = 'municipales'
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE (target_department IS NULL OR c.department = target_department)
      AND (target_insee_list IS NULL OR c.insee = ANY(target_insee_list))
      AND (target_lat_min IS NULL OR (c.lat BETWEEN target_lat_min AND target_lat_max AND c.lng BETWEEN target_lng_min AND target_lng_max))
      AND (target_equipment_filters IS NULL OR NOT EXISTS (
        SELECT f.fk
        FROM unnest(target_equipment_filters) AS f(fk)
        WHERE NOT EXISTS (
          SELECT 1
          FROM commune_equipments ce
          JOIN equipment_types et ON et.code = ce.typequ
          WHERE ce.insee = c.insee
            AND (
              (f.fk = 'commerces' AND et.domain = 'B')
              OR (f.fk = 'ecole' AND et.subdomain = 'C1')
              OR (f.fk = 'college' AND et.subdomain = 'C2')
              OR (f.fk = 'lycee' AND et.subdomain = 'C3')
              OR (f.fk = 'sup' AND et.subdomain IN ('C4', 'C5'))
              OR (f.fk = 'etab_sante' AND et.subdomain = 'D1')
              OR (f.fk = 'prof_med' AND et.subdomain = 'D2')
              OR (f.fk = 'creche' AND et.code = 'D502')
              OR (f.fk = 'transports' AND et.domain = 'E')
              OR (f.fk = 'sport' AND et.subdomain = 'F1')
              OR (f.fk = 'culture' AND et.subdomain = 'F3')
            )
        )
      ))
      AND (target_pop_ranges IS NULL OR (
        (c.population < 200 AND 'hameau' = ANY(target_pop_ranges)) OR
        (c.population >= 200 AND c.population < 500 AND 'village' = ANY(target_pop_ranges)) OR
        (c.population >= 500 AND c.population < 2000 AND 'bourg' = ANY(target_pop_ranges)) OR
        (c.population >= 2000 AND c.population < 10000 AND 'petite_ville' = ANY(target_pop_ranges)) OR
        (c.population >= 10000 AND c.population < 50000 AND 'ville_moyenne' = ANY(target_pop_ranges)) OR
        (c.population >= 50000 AND c.population < 200000 AND 'grande_ville' = ANY(target_pop_ranges)) OR
        (c.population >= 200000 AND 'metropole' = ANY(target_pop_ranges))
      ))
      AND (target_risk_level IS NULL OR EXISTS (
        SELECT 1 FROM commune_risk_summary crs
        WHERE crs.code_insee = c.insee
          AND crs.risk_level = target_risk_level
      ) OR (target_risk_level = 'peu_expose' AND NOT EXISTS (
        SELECT 1 FROM commune_risk_summary crs
        WHERE crs.code_insee = c.insee
      )))
      AND (target_geo_tags IS NULL OR c.geo_tags @> target_geo_tags)
      AND (target_prix_m2_max IS NULL OR EXISTS (
        SELECT 1 FROM commune_prix_m2_latest cpl
        WHERE cpl.code_insee = c.insee
          AND (
            (target_prix_m2_max < 99999 AND cpl.prix_m2_min <= target_prix_m2_max)
            OR (target_prix_m2_max = 99999 AND cpl.prix_m2_min > 5000)
          )
      ))
      AND (target_air_quality IS NULL OR EXISTS (
        SELECT 1 FROM commune_air_summary cas
        WHERE cas.code_insee = c.insee
          AND cas.air_quality_level = target_air_quality
      ))
      AND (target_heat_wave IS NULL OR EXISTS (
        SELECT 1 FROM commune_climat_summary ccs
        WHERE ccs.code_insee = c.insee
          AND ccs.heat_wave_level = target_heat_wave
      ))
    GROUP BY c.id
  ),
  latest AS (
    SELECT DISTINCT ON (er.commune_id)
      er.commune_id,
      n.bloc
    FROM election_results er
    JOIN commune_stats cs ON cs.id = er.commune_id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE er.election_type = 'municipales'
    ORDER BY er.commune_id, er.year DESC
  ),
  classified AS (
    SELECT
      cs.id,
      CASE
        WHEN target_bloc IS NULL THEN 'all'
        WHEN cs.matching_el = cs.total_el AND cs.total_el >= 2 THEN 'forteresse'
        WHEN l.bloc = target_bloc THEN 'tendance'
        ELSE NULL
      END AS match_level
    FROM commune_stats cs
    JOIN latest l ON l.commune_id = cs.id
  )
  SELECT COUNT(*) INTO result
  FROM classified
  WHERE classified.match_level IS NOT NULL
    AND (target_match_level IS NULL OR classified.match_level = target_match_level);

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
