-- ============================================
-- Ou Atterir - Migration V3
-- Unified search RPC with optional filters
-- Run this in the Supabase SQL Editor
-- ============================================

-- =====================
-- 1. RPC: search_communes (unified)
--    All filters are optional and combinable
-- =====================
CREATE OR REPLACE FUNCTION search_communes(
  target_department text DEFAULT NULL,
  target_nuances text[] DEFAULT NULL,
  target_match_level text DEFAULT NULL,
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
        WHEN target_nuances IS NOT NULL THEN
          COUNT(*) FILTER (WHERE er.winner_nuance = ANY(target_nuances))
        ELSE COUNT(*)
      END AS matching_el
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id
    WHERE (target_department IS NULL OR c.department = target_department)
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
        WHEN target_nuances IS NULL THEN 'all'
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
    AND (target_match_level IS NULL OR classified.match_level = target_match_level)
  ORDER BY
    CASE classified.match_level WHEN 'forteresse' THEN 0 WHEN 'tendance' THEN 1 ELSE 2 END,
    classified.name
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================
-- 2. RPC: count_communes (unified)
-- =====================
CREATE OR REPLACE FUNCTION count_communes(
  target_department text DEFAULT NULL,
  target_nuances text[] DEFAULT NULL,
  target_match_level text DEFAULT NULL
)
RETURNS bigint AS $$
DECLARE
  result bigint;
BEGIN
  WITH commune_stats AS (
    SELECT
      c.id,
      COUNT(*) AS total_el,
      CASE
        WHEN target_nuances IS NOT NULL THEN
          COUNT(*) FILTER (WHERE er.winner_nuance = ANY(target_nuances))
        ELSE COUNT(*)
      END AS matching_el
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id
    WHERE (target_department IS NULL OR c.department = target_department)
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
        WHEN target_nuances IS NULL THEN 'all'
        WHEN cs.matching_el = cs.total_el AND cs.total_el >= 2 THEN 'forteresse'
        WHEN l.winner_nuance = ANY(target_nuances) THEN 'tendance'
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
