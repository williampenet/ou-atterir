-- ==========================================================
-- Ou Atterir — Air quality filter (PM2.5 annual mean)
-- Source: EEA interpolated PM2.5 data (1 km resolution)
-- Adds commune_air_quality table, materialized view, and
-- target_air_quality parameter to search/count functions
-- ==========================================================

BEGIN;

-- ==========================================================
-- 0. Table: commune_air_quality
-- ==========================================================

CREATE TABLE IF NOT EXISTS commune_air_quality (
  code_insee text PRIMARY KEY,
  pm25_concentration numeric NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_air_quality_pm25 ON commune_air_quality(pm25_concentration);

-- ==========================================================
-- 1. Materialized view: air quality level per commune
--    Thresholds based on WHO 2021 guidelines and French distribution:
--    - bonne    : < 5 µg/m³  (WHO 2021 guideline)
--    - moyenne   : 5–7 µg/m³  (around the national median)
--    - degradee  : 7–9 µg/m³  (above average)
--    - mauvaise  : ≥ 9 µg/m³  (well above average)
-- ==========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS commune_air_summary AS
SELECT
  code_insee,
  pm25_concentration,
  CASE
    WHEN pm25_concentration < 5.0 THEN 'bonne'
    WHEN pm25_concentration < 7.0 THEN 'moyenne'
    WHEN pm25_concentration < 9.0 THEN 'degradee'
    ELSE 'mauvaise'
  END AS air_quality_level
FROM commune_air_quality;

CREATE UNIQUE INDEX IF NOT EXISTS idx_air_summary_insee ON commune_air_summary(code_insee);
CREATE INDEX IF NOT EXISTS idx_air_summary_level ON commune_air_summary(air_quality_level);

-- ==========================================================
-- 2. RLS
-- ==========================================================

ALTER TABLE commune_air_quality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on commune_air_quality"
  ON commune_air_quality FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on commune_air_quality"
  ON commune_air_quality FOR INSERT TO anon WITH CHECK (true);

-- ==========================================================
-- 3. Replace search_communes with air_quality filter
-- ==========================================================

DROP FUNCTION IF EXISTS search_communes(text, text, text, text[], text[], text, text[], int, int, int);
DROP FUNCTION IF EXISTS search_communes(text, text, text, text[], text[], text, text[], int, text, int, int);

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
    JOIN election_results er ON er.commune_id = c.id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE (target_department IS NULL OR c.department = target_department)
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
-- 4. Replace count_communes with air_quality filter
-- ==========================================================

DROP FUNCTION IF EXISTS count_communes(text, text, text, text[], text[], text, text[], int);
DROP FUNCTION IF EXISTS count_communes(text, text, text, text[], text[], text, text[], int, text);

CREATE OR REPLACE FUNCTION count_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_equipment_filters text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL,
  target_risk_level text DEFAULT NULL,
  target_geo_tags text[] DEFAULT NULL,
  target_prix_m2_max integer DEFAULT NULL,
  target_air_quality text DEFAULT NULL
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
    JOIN election_results er ON er.commune_id = c.id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE (target_department IS NULL OR c.department = target_department)
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
    GROUP BY c.id
  ),
  latest AS (
    SELECT DISTINCT ON (er.commune_id)
      er.commune_id,
      n.bloc
    FROM election_results er
    JOIN commune_stats cs ON cs.id = er.commune_id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
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

-- ==========================================================
-- 5. RPC: get air quality for a single commune
-- ==========================================================

CREATE OR REPLACE FUNCTION get_commune_air_quality(target_insee text)
RETURNS TABLE (
  pm25_concentration numeric,
  air_quality_level text
) AS $$
BEGIN
  RETURN QUERY
  SELECT cas.pm25_concentration, cas.air_quality_level
  FROM commune_air_summary cas
  WHERE cas.code_insee = target_insee;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
