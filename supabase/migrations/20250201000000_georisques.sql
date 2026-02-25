-- ==========================================================
-- Ou Atterir — Géorisques migration
-- Adds risk data per commune from Géorisques API
-- ==========================================================

BEGIN;

-- ==========================================================
-- 1. Table: commune_risques
-- ==========================================================

CREATE TABLE IF NOT EXISTS commune_risques (
  code_insee text NOT NULL,
  num_risque text NOT NULL,
  libelle_risque text NOT NULL,
  PRIMARY KEY (code_insee, num_risque)
);

CREATE INDEX IF NOT EXISTS idx_commune_risques_insee ON commune_risques(code_insee);

-- ==========================================================
-- 2. Materialized view: risk summary per commune
-- ==========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS commune_risk_summary AS
SELECT
  code_insee,
  COUNT(DISTINCT num_risque) AS risk_count,
  CASE
    WHEN COUNT(DISTINCT num_risque) >= 5 THEN 'tres_expose'
    WHEN COUNT(DISTINCT num_risque) >= 2 THEN 'modere'
    ELSE 'peu_expose'
  END AS risk_level
FROM commune_risques
GROUP BY code_insee;

CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_summary_insee ON commune_risk_summary(code_insee);
CREATE INDEX IF NOT EXISTS idx_risk_summary_level ON commune_risk_summary(risk_level);

-- ==========================================================
-- 3. RLS
-- ==========================================================

ALTER TABLE commune_risques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on commune_risques"
  ON commune_risques FOR SELECT TO anon USING (true);

-- ==========================================================
-- 4. RPC: get risks for a single commune
-- ==========================================================

CREATE OR REPLACE FUNCTION get_commune_risques(target_insee text)
RETURNS TABLE (
  num_risque text,
  libelle_risque text
) AS $$
BEGIN
  RETURN QUERY
  SELECT cr.num_risque, cr.libelle_risque
  FROM commune_risques cr
  WHERE cr.code_insee = target_insee
  ORDER BY cr.num_risque;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================================
-- 5. Update search_communes to support risk_level filter
-- ==========================================================

CREATE OR REPLACE FUNCTION search_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_domains text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL,
  target_risk_level text DEFAULT NULL,
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
      AND (target_domains IS NULL OR NOT EXISTS (
        SELECT unnest(target_domains) AS d
        EXCEPT
        SELECT DISTINCT et.domain
        FROM commune_equipments ce
        JOIN equipment_types et ON et.code = ce.typequ
        WHERE ce.insee = c.insee
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
-- 6. Update count_communes to support risk_level filter
-- ==========================================================

CREATE OR REPLACE FUNCTION count_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_domains text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL,
  target_risk_level text DEFAULT NULL
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
      AND (target_domains IS NULL OR NOT EXISTS (
        SELECT unnest(target_domains) AS d
        EXCEPT
        SELECT DISTINCT et.domain
        FROM commune_equipments ce
        JOIN equipment_types et ON et.code = ce.typequ
        WHERE ce.insee = c.insee
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

COMMIT;
