-- ==========================================================
-- Ou Atterir — Climate exposure percentile scores
-- Precalculates per-indicator percentiles and per-family
-- scores for ~25k communes. Used by the "landing" UX
-- to sort and enrich results by climate exposure.
-- ==========================================================

BEGIN;

-- ==========================================================
-- 0. Helper: count of registered risks per commune
-- ==========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS commune_risk_count AS
SELECT
  cr.code_insee,
  COUNT(DISTINCT cr.num_risque)::int AS nb_risques
FROM commune_risques cr
GROUP BY cr.code_insee;

CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_count_insee
  ON commune_risk_count(code_insee);

-- ==========================================================
-- 1. Materialized view: climate percentile scores
--
-- For each commune with climate data, compute:
--   - PERCENT_RANK per indicator (0–100 scale)
--   - Average per family (4 families + sols placeholder)
--   - Global score (mean of available families)
--
-- Conventions:
--   - Higher score = MORE exposed (worse)
--   - g4Ete (summer rain) is INVERTED: fewer rainy days = drier = higher rank
--   - S4 (cold waves) included in températures family (covers heat + cold extremes)
--   - S3 (drought/VPD) attached to eau family (hydrological stress)
--   - R2 (extreme precipitation) attached to risques only (not eau)
--   - PM2.5 sourced from commune_air_quality
--   - pct_nb_risques sourced from commune_risk_count
-- ==========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS commune_climate_scores AS
WITH ranked AS (
  SELECT
    cc.code_insee,

    -- Raw percentile per indicator (2050 values)
    -- Note: PERCENT_RANK() returns double precision; cast to numeric for ROUND(x, n)
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.s3_2050  ASC NULLS FIRST))::numeric * 100, 1) AS pct_s3,
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.s1_2050  ASC NULLS FIRST))::numeric * 100, 1) AS pct_s1,
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.s2_2050  ASC NULLS FIRST))::numeric * 100, 1) AS pct_s2,
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.s4_2050  ASC NULLS FIRST))::numeric * 100, 1) AS pct_s4,
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.r2_2050  ASC NULLS FIRST))::numeric * 100, 1) AS pct_r2,
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.r4_2050  ASC NULLS FIRST))::numeric * 100, 1) AS pct_r4,
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.r5_ete_2050 ASC NULLS FIRST))::numeric * 100, 1) AS pct_r5_ete,
    -- Inverted: fewer rainy days = more drought exposure
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.g4_ete_2050 DESC NULLS FIRST))::numeric * 100, 1) AS pct_g4_ete_inv,

    -- ICU (0-6 discrete scale) as percentile
    ROUND((PERCENT_RANK() OVER (ORDER BY cc.icu ASC NULLS FIRST))::numeric * 100, 1) AS pct_icu,

    -- PM2.5 percentile (joined)
    ROUND((PERCENT_RANK() OVER (ORDER BY caq.pm25_concentration ASC NULLS FIRST))::numeric * 100, 1) AS pct_pm25,

    -- Risk count percentile (joined)
    ROUND((PERCENT_RANK() OVER (ORDER BY COALESCE(crc.nb_risques, 0) ASC))::numeric * 100, 1) AS pct_nb_risques

  FROM commune_climat cc
  LEFT JOIN commune_air_quality caq ON caq.code_insee = cc.code_insee
  LEFT JOIN commune_risk_count crc ON crc.code_insee = cc.code_insee
)
SELECT
  r.code_insee,

  -- Individual percentiles (useful for detailed views)
  r.pct_s3,
  r.pct_s1,
  r.pct_s2,
  r.pct_s4,
  r.pct_r2,
  r.pct_r4,
  r.pct_r5_ete,
  r.pct_g4_ete_inv,
  r.pct_icu,
  r.pct_pm25,
  r.pct_nb_risques,

  -- Family scores (mean of component percentiles)
  -- Note: pct_* columns are numeric, so numeric/integer stays numeric
  -- Températures: s1, s2, s4, icu (heat + cold extremes)
  ROUND((r.pct_s1 + r.pct_s2 + r.pct_s4 + r.pct_icu) / 4, 1) AS score_temperatures,

  -- Eau: r5_ete (dry soil) + g4_ete inverted (fewer rain days) + s3 (drought/VPD)
  ROUND((r.pct_r5_ete + r.pct_g4_ete_inv + r.pct_s3) / 3, 1) AS score_eau,

  -- Risques: r4 (wildfire) + r2 (extreme precip) + nb_risques
  ROUND((r.pct_r4 + r.pct_r2 + r.pct_nb_risques) / 3, 1) AS score_risques,

  -- Air: PM2.5 only
  r.pct_pm25 AS score_air,

  -- Sols: NULL (data not yet available)
  NULL::numeric AS score_sols,

  -- Global score: mean of 4 available families
  ROUND((
    (r.pct_s1 + r.pct_s2 + r.pct_s4 + r.pct_icu) / 4 +
    (r.pct_r5_ete + r.pct_g4_ete_inv + r.pct_s3) / 3 +
    (r.pct_r4 + r.pct_r2 + r.pct_nb_risques) / 3 +
    r.pct_pm25
  ) / 4, 1) AS score_global

FROM ranked r;

CREATE UNIQUE INDEX IF NOT EXISTS idx_climate_scores_insee
  ON commune_climate_scores(code_insee);

CREATE INDEX IF NOT EXISTS idx_climate_scores_global
  ON commune_climate_scores(score_global);

-- ==========================================================
-- 2. RPC: search_communes_climate
-- Same as search_communes but JOINs climate scores,
-- returns family scores, and orders by score_global ASC
-- ==========================================================

CREATE OR REPLACE FUNCTION search_communes_climate(
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
  latest_score double precision,
  score_temperatures numeric,
  score_eau numeric,
  score_risques numeric,
  score_air numeric,
  score_sols numeric,
  score_global numeric
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
    classified.latest_score,
    COALESCE(ccs.score_temperatures, 50) AS score_temperatures,
    COALESCE(ccs.score_eau, 50) AS score_eau,
    COALESCE(ccs.score_risques, 50) AS score_risques,
    COALESCE(ccs.score_air, 50) AS score_air,
    ccs.score_sols,
    COALESCE(ccs.score_global, 50) AS score_global
  FROM classified
  LEFT JOIN commune_climate_scores ccs ON ccs.code_insee = classified.insee
  WHERE classified.match_level IS NOT NULL
    AND (target_match_level IS NULL OR classified.match_level = target_match_level)
  ORDER BY COALESCE(ccs.score_global, 50) ASC, classified.name
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================================
-- 3. Refresh helper (call when data changes)
-- ==========================================================

CREATE OR REPLACE FUNCTION refresh_climate_scores()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY commune_risk_count;
  REFRESH MATERIALIZED VIEW CONCURRENTLY commune_climate_scores;
END;
$$ LANGUAGE plpgsql;

COMMIT;
