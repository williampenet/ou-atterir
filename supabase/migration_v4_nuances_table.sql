-- ============================================
-- Ou Atterir - Migration V4
-- Real nuance codes from data.gouv.fr
-- + mapping to political blocs
-- Run this in the Supabase SQL Editor
-- ============================================

-- =====================
-- 1. Create nuances reference table
-- =====================
CREATE TABLE IF NOT EXISTS nuances (
  code text PRIMARY KEY,
  label text NOT NULL,
  bloc text NOT NULL CHECK (bloc IN ('Extrême-gauche', 'Gauche', 'Centre', 'Droite', 'Extrême-droite', 'Divers'))
);

-- Enable RLS + public read
ALTER TABLE nuances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on nuances"
  ON nuances FOR SELECT TO anon USING (true);

-- =====================
-- 2. Populate nuances
-- =====================
INSERT INTO nuances (code, label, bloc) VALUES
  -- Extrême-gauche
  ('EXG', 'Extrême gauche', 'Extrême-gauche'),
  ('LEXG', 'Liste d''extrême-gauche', 'Extrême-gauche'),
  ('DXG', 'Divers extrême gauche', 'Extrême-gauche'),
  ('PG', 'Parti de Gauche', 'Extrême-gauche'),
  ('LPG', 'Liste du Parti de Gauche', 'Extrême-gauche'),
  ('FG', 'Front de gauche', 'Extrême-gauche'),
  ('LFG', 'Liste Front de Gauche', 'Extrême-gauche'),
  ('FI', 'La France insoumise', 'Extrême-gauche'),
  ('LFI', 'La France insoumise', 'Extrême-gauche'),

  -- Gauche
  ('COM', 'Communiste', 'Gauche'),
  ('LCOM', 'Liste du Parti communiste français', 'Gauche'),
  ('LCOP', 'Liste du PCF et du Parti de gauche', 'Gauche'),
  ('NUP', 'Nouvelle union populaire écologique et sociale', 'Gauche'),
  ('SOC', 'Socialiste', 'Gauche'),
  ('LSOC', 'Liste du Parti socialiste', 'Gauche'),
  ('RDG', 'Radical de Gauche', 'Gauche'),
  ('LRDG', 'Parti radical de gauche', 'Gauche'),
  ('DVG', 'Divers gauche', 'Gauche'),
  ('LDVG', 'Liste divers gauche', 'Gauche'),
  ('VEC', 'Europe Ecologie / Les Verts', 'Gauche'),
  ('LVEC', 'Liste des Verts', 'Gauche'),
  ('ECO', 'Ecologiste', 'Gauche'),
  ('LECO', 'Ecologiste', 'Gauche'),
  ('LUG', 'Liste Union de la Gauche', 'Gauche'),
  ('LUGE', 'Liste d''union à gauche avec des écologiste', 'Gauche'),
  ('LVEG', 'Liste EELV et gauche', 'Gauche'),

  -- Centre
  ('MODM', 'MODEM', 'Centre'),
  ('MDM', 'Modem', 'Centre'),
  ('LMDM', 'Liste Modem', 'Centre'),
  ('REM', 'La République en marche', 'Centre'),
  ('LREM', 'La République en marche', 'Centre'),
  ('ENS', 'Ensemble ! (Majorité présidentielle)', 'Centre'),
  ('DVC', 'Divers centre', 'Centre'),
  ('LDVC', 'Divers centre', 'Centre'),
  ('CEN', 'Le Centre pour la France', 'Centre'),
  ('LCEN', 'Liste d''union du centre', 'Centre'),
  ('NCE', 'Nouveau Centre', 'Centre'),
  ('UDI', 'Union des Démocrates et Indépendants', 'Centre'),
  ('LUDI', 'Liste Union Démocrates et Indépendants', 'Centre'),
  ('ALLI', 'Alliance centriste', 'Centre'),
  ('LUC', 'Liste Union du Centre', 'Centre'),
  ('LMC', 'Liste majorité-centristes', 'Centre'),
  ('LUCG', 'Liste d''union au centre et à gauche', 'Centre'),
  ('LUCD', 'Liste d''union au centre et à droite', 'Centre'),
  ('LGC', 'Liste gauche-centristes', 'Centre'),
  ('PRV', 'Parti radical', 'Centre'),
  ('MAJ', 'Majorité présidentielle', 'Centre'),
  ('LMAJ', 'Liste de la majorité', 'Centre'),
  ('LMP', 'Majorité présidentielle', 'Centre'),
  ('LMMD', 'Liste Majorité-MoDem', 'Centre'),
  ('M', 'Autres candidats majorité présidentielle', 'Centre'),
  ('M-NC', 'Majorité présidentielle', 'Centre'),

  -- Droite
  ('UMP', 'Union pour un Mouvement Populaire', 'Droite'),
  ('LUMP', 'Liste Union pour un Mouvement Populaire', 'Droite'),
  ('LR', 'Les Républicains', 'Droite'),
  ('LLR', 'Les Républicains', 'Droite'),
  ('DVD', 'Divers droite', 'Droite'),
  ('LDVD', 'Liste divers droite', 'Droite'),
  ('LUD', 'Liste Union de la Droite', 'Droite'),
  ('UDFD', 'UDF-Mouvement Démocrate', 'Droite'),
  ('MPF', 'Mouvement pour la France', 'Droite'),

  -- Extrême-droite
  ('FN', 'Front National', 'Extrême-droite'),
  ('LFN', 'Liste du Front national', 'Extrême-droite'),
  ('RN', 'Rassemblement National', 'Extrême-droite'),
  ('LRN', 'Rassemblement National', 'Extrême-droite'),
  ('EXD', 'Extrême droite', 'Extrême-droite'),
  ('LEXD', 'Liste d''extrême-droite', 'Extrême-droite'),
  ('DXD', 'Divers extrême droite', 'Extrême-droite'),
  ('DSV', 'Droite souverainiste', 'Extrême-droite'),
  ('LDSV', 'Liste souverainiste de droite', 'Extrême-droite'),
  ('DLF', 'Debout la France', 'Extrême-droite'),
  ('LDLF', 'Debout la France', 'Extrême-droite'),
  ('DLR', 'Debout la République', 'Extrême-droite'),
  ('LDLR', 'Liste Debout la République', 'Extrême-droite'),
  ('REC', 'Reconquête !', 'Extrême-droite'),
  ('LUXD', 'Liste d''union à l''extrême-droite', 'Extrême-droite'),

  -- Divers
  ('DIV', 'Divers', 'Divers'),
  ('LDIV', 'Liste Divers', 'Divers'),
  ('REG', 'Régionaliste', 'Divers'),
  ('LREG', 'Liste régionaliste', 'Divers'),
  ('AUT', 'Autres', 'Divers'),
  ('LAUT', 'Autre liste', 'Divers'),
  ('CPNT', 'Chasse Pêche Nature Traditions', 'Divers'),
  ('LGJ', 'Gilets jaunes', 'Divers'),
  ('LNC', 'Non Communiqué', 'Divers')
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, bloc = EXCLUDED.bloc;

-- =====================
-- 3. Remove CHECK constraint on winner_nuance
-- =====================
ALTER TABLE election_results DROP CONSTRAINT IF EXISTS election_results_winner_nuance_check;

-- =====================
-- 4. Update search RPC to use nuances table
-- =====================
CREATE OR REPLACE FUNCTION search_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
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

-- =====================
-- 5. Update count RPC
-- =====================
CREATE OR REPLACE FUNCTION count_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
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
        WHEN target_bloc IS NOT NULL THEN
          COUNT(*) FILTER (WHERE n.bloc = target_bloc)
        ELSE COUNT(*)
      END AS matching_el
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE (target_department IS NULL OR c.department = target_department)
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
