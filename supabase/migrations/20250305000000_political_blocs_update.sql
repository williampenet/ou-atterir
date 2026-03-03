-- ==========================================================
-- Add Centre-droit bloc, reclassify ENS/LREM/REM → Centre-droit
-- LFI/FI already Extrême-gauche in baseline (fix import script separately)
-- ==========================================================

-- 1. Drop and recreate CHECK constraint to add Centre-droit
ALTER TABLE nuances DROP CONSTRAINT IF EXISTS nuances_bloc_check;
ALTER TABLE nuances ADD CONSTRAINT nuances_bloc_check CHECK (bloc IN (
  'Extrême-gauche', 'Gauche', 'Centre', 'Centre-droit', 'Droite', 'Extrême-droite', 'Divers'
));

-- 2. Move Macron coalition nuances from Centre to Centre-droit
UPDATE nuances SET bloc = 'Centre-droit' WHERE code IN (
  'ENS',   -- Ensemble ! (Majorité présidentielle)
  'REM',   -- La République en marche
  'LREM',  -- La République en marche (liste)
  'MAJ',   -- Majorité présidentielle
  'LMAJ',  -- Liste de la majorité
  'LMP',   -- Majorité présidentielle
  'LMMD',  -- Liste Majorité-MoDem
  'M',     -- Autres candidats majorité présidentielle
  'M-NC'   -- Majorité présidentielle
);

-- 3. Add missing nuances used in recent elections
INSERT INTO nuances (code, label, bloc) VALUES
  ('LENS', 'Liste Ensemble', 'Centre-droit'),
  ('HOR', 'Horizons', 'Centre-droit'),
  ('UG', 'Union de la Gauche', 'Gauche'),
  ('UD', 'Union de la Droite', 'Droite'),
  ('LREC', 'Liste Reconquête', 'Extrême-droite'),
  ('UXD', 'Union d''extrême-droite', 'Extrême-droite')
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, bloc = EXCLUDED.bloc;
