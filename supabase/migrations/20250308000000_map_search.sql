-- ==========================================================
-- Ou Atterir — Lightweight map search RPC
-- Returns minimal columns for map markers within a bounding box
-- ==========================================================

BEGIN;

CREATE OR REPLACE FUNCTION search_communes_map(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_equipment_filters text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL,
  target_risk_level text DEFAULT NULL,
  target_geo_tags text[] DEFAULT NULL,
  target_prix_m2_max integer DEFAULT NULL,
  target_air_quality text DEFAULT NULL,
  lat_min double precision DEFAULT NULL,
  lat_max double precision DEFAULT NULL,
  lng_min double precision DEFAULT NULL,
  lng_max double precision DEFAULT NULL,
  result_limit int DEFAULT 300
)
RETURNS TABLE (
  insee text,
  name text,
  zipcode text,
  lat double precision,
  lng double precision,
  latest_bloc text,
  match_level text
) AS $$
BEGIN
  RETURN QUERY
  WITH commune_stats AS (
    SELECT
      c.id,
      c.insee,
      c.zipcode,
      c.name,
      c.lat,
      c.lng,
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
      AND (lat_min IS NULL OR c.lat >= lat_min)
      AND (lat_max IS NULL OR c.lat <= lat_max)
      AND (lng_min IS NULL OR c.lng >= lng_min)
      AND (lng_max IS NULL OR c.lng <= lng_max)
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
      cs.insee,
      cs.name,
      cs.zipcode,
      cs.lat,
      cs.lng,
      l.bloc AS latest_bloc,
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
    classified.insee,
    classified.name,
    classified.zipcode,
    classified.lat,
    classified.lng,
    classified.latest_bloc,
    classified.match_level
  FROM classified
  WHERE classified.match_level IS NOT NULL
    AND (target_match_level IS NULL OR classified.match_level = target_match_level)
  ORDER BY classified.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
