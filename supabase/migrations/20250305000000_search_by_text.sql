-- ==========================================================
-- Ou Atterir — Text search for communes (name or postal code)
-- ==========================================================

BEGIN;

CREATE OR REPLACE FUNCTION search_communes_by_text(
  search_text text,
  result_limit int DEFAULT 10
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
  population integer,
  match_level text,
  latest_nuance text,
  latest_nuance_label text,
  latest_bloc text,
  latest_winner text,
  latest_year int,
  latest_score double precision
) AS $$
DECLARE
  cleaned text := TRIM(search_text);
  is_postal boolean := cleaned ~ '^\d';
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT c.*
    FROM communes c
    WHERE CASE
      WHEN is_postal THEN c.zipcode LIKE cleaned || '%'
      ELSE LOWER(c.name) LIKE '%' || LOWER(cleaned) || '%'
    END
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
    JOIN matched m ON m.id = er.commune_id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    ORDER BY er.commune_id, er.year DESC
  )
  SELECT
    m.id AS commune_id,
    m.insee,
    m.zipcode,
    m.name,
    m.department,
    m.lat,
    m.lng,
    m.stability,
    m.current_mayor,
    m.population,
    'all'::text AS match_level,
    l.winner_nuance AS latest_nuance,
    l.nuance_label AS latest_nuance_label,
    l.bloc AS latest_bloc,
    l.winner_name AS latest_winner,
    l.year AS latest_year,
    l.score AS latest_score
  FROM matched m
  LEFT JOIN latest l ON l.commune_id = m.id
  ORDER BY
    CASE WHEN LOWER(m.name) = LOWER(cleaned) THEN 0 ELSE 1 END,
    m.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
