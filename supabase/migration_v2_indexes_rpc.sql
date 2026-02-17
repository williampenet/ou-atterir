-- ============================================
-- Ou Atterir - Migration V2
-- Indexes + Server-side filtering via RPC
-- Run this in the Supabase SQL Editor
-- ============================================

-- =====================
-- 1. Missing Indexes
-- =====================
CREATE INDEX IF NOT EXISTS idx_communes_department ON communes(department);
CREATE INDEX IF NOT EXISTS idx_communes_stability ON communes(stability);
CREATE INDEX IF NOT EXISTS idx_election_results_nuance ON election_results(winner_nuance);
CREATE INDEX IF NOT EXISTS idx_election_results_year ON election_results(year DESC);
CREATE INDEX IF NOT EXISTS idx_communes_dept_stability ON communes(department, stability);

-- =====================
-- 2. RPC: get_distinct_departments
-- =====================
CREATE OR REPLACE FUNCTION get_distinct_departments()
RETURNS TABLE (department text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.department FROM communes c ORDER BY c.department;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================
-- 3. RPC: search_ideal_communes
--    Server-side filtering: forteresse / tendance
--    Replaces client-side JS filtering
-- =====================
CREATE OR REPLACE FUNCTION search_ideal_communes(
  target_nuances text[],
  target_department text,
  page_limit int DEFAULT 50,
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
      COUNT(*) FILTER (WHERE er.winner_nuance = ANY(target_nuances)) AS matching_el
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id
    WHERE c.department = target_department
    GROUP BY c.id
  ),
  latest AS (
    SELECT DISTINCT ON (er.commune_id)
      er.commune_id,
      er.winner_nuance,
      er.winner_name,
      er.year,
      er.score
    FROM election_results er
    JOIN commune_stats cs ON cs.id = er.commune_id
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
      l.winner_name AS latest_winner,
      l.year AS latest_year,
      l.score AS latest_score,
      CASE
        WHEN cs.matching_el = cs.total_el AND cs.total_el >= 2 THEN 'forteresse'
        WHEN l.winner_nuance = ANY(target_nuances) THEN 'tendance'
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
    classified.latest_winner,
    classified.latest_year,
    classified.latest_score
  FROM classified
  WHERE classified.match_level IS NOT NULL
  ORDER BY
    CASE classified.match_level WHEN 'forteresse' THEN 0 ELSE 1 END,
    classified.name
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================
-- 4. RPC: count_ideal_communes
--    Returns total count for pagination
-- =====================
CREATE OR REPLACE FUNCTION count_ideal_communes(
  target_nuances text[],
  target_department text
)
RETURNS bigint AS $$
DECLARE
  result bigint;
BEGIN
  WITH commune_stats AS (
    SELECT
      c.id,
      COUNT(*) AS total_el,
      COUNT(*) FILTER (WHERE er.winner_nuance = ANY(target_nuances)) AS matching_el
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id
    WHERE c.department = target_department
    GROUP BY c.id
  ),
  latest AS (
    SELECT DISTINCT ON (er.commune_id)
      er.commune_id,
      er.winner_nuance
    FROM election_results er
    JOIN commune_stats cs ON cs.id = er.commune_id
    ORDER BY er.commune_id, er.year DESC
  ),
  classified AS (
    SELECT
      cs.id,
      CASE
        WHEN cs.matching_el = cs.total_el AND cs.total_el >= 2 THEN 'forteresse'
        WHEN l.winner_nuance = ANY(target_nuances) THEN 'tendance'
        ELSE NULL
      END AS match_level
    FROM commune_stats cs
    JOIN latest l ON l.commune_id = cs.id
  )
  SELECT COUNT(*) INTO result
  FROM classified
  WHERE classified.match_level IS NOT NULL;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
