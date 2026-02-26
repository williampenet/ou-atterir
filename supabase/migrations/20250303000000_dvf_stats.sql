-- ==========================================================
-- Ou Atterir — DVF real estate price statistics
-- Adds median price per m² data per commune from DVF Etalab
-- ==========================================================

BEGIN;

-- ==========================================================
-- 1. Table: commune_dvf_stats
-- ==========================================================

CREATE TABLE IF NOT EXISTS commune_dvf_stats (
  code_insee text NOT NULL,
  year integer NOT NULL,
  type_local text NOT NULL,
  nb_mutations integer NOT NULL DEFAULT 0,
  prix_m2_median numeric,
  PRIMARY KEY (code_insee, year, type_local)
);

CREATE INDEX IF NOT EXISTS idx_dvf_stats_insee ON commune_dvf_stats(code_insee);

-- ==========================================================
-- 2. Materialized view: market tension per commune
-- ==========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS commune_market_tension AS
SELECT
  code_insee,
  COALESCE(SUM(nb_mutations) FILTER (
    WHERE year = (SELECT MAX(year) FROM commune_dvf_stats)
  ), 0) AS transactions_derniere_annee,
  CASE
    WHEN COALESCE(SUM(nb_mutations) FILTER (
      WHERE year = (SELECT MAX(year) FROM commune_dvf_stats)
    ), 0) <= 5 THEN 'calme'
    WHEN COALESCE(SUM(nb_mutations) FILTER (
      WHERE year = (SELECT MAX(year) FROM commune_dvf_stats)
    ), 0) <= 30 THEN 'actif'
    ELSE 'tendu'
  END AS tension_level
FROM commune_dvf_stats
GROUP BY code_insee;

CREATE UNIQUE INDEX IF NOT EXISTS idx_market_tension_insee ON commune_market_tension(code_insee);
CREATE INDEX IF NOT EXISTS idx_market_tension_level ON commune_market_tension(tension_level);

-- ==========================================================
-- 3. RLS
-- ==========================================================

ALTER TABLE commune_dvf_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on commune_dvf_stats"
  ON commune_dvf_stats FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on commune_dvf_stats"
  ON commune_dvf_stats FOR INSERT TO anon WITH CHECK (true);

-- ==========================================================
-- 4. RPC: get DVF stats for a single commune
-- ==========================================================

CREATE OR REPLACE FUNCTION get_commune_dvf(target_insee text)
RETURNS TABLE (
  year integer,
  type_local text,
  nb_mutations integer,
  prix_m2_median numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.year, d.type_local, d.nb_mutations, d.prix_m2_median
  FROM commune_dvf_stats d
  WHERE d.code_insee = target_insee
  ORDER BY d.year, d.type_local;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================================
-- 5. RPC: get market tension for a single commune
-- ==========================================================

CREATE OR REPLACE FUNCTION get_commune_tension(target_insee text)
RETURNS TABLE (
  transactions_derniere_annee bigint,
  tension_level text
) AS $$
BEGIN
  RETURN QUERY
  SELECT mt.transactions_derniere_annee, mt.tension_level
  FROM commune_market_tension mt
  WHERE mt.code_insee = target_insee;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
