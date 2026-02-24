-- ==========================================================
-- Ou Atterir — Baseline migration
-- Consolidated schema (from former migration_v1 through v7)
-- ==========================================================

BEGIN;

-- ==========================================================
-- 1. Tables
-- ==========================================================

CREATE TABLE IF NOT EXISTS communes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  insee text UNIQUE NOT NULL,
  zipcode text NOT NULL,
  name text NOT NULL,
  department text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  stability text NOT NULL CHECK (stability IN ('FORTRESS', 'STABLE', 'SWING', 'UNSTABLE')),
  current_mayor text NOT NULL,
  population integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS election_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  commune_id uuid NOT NULL REFERENCES communes(id) ON DELETE CASCADE,
  year integer NOT NULL,
  winner_nuance text NOT NULL,
  winner_name text NOT NULL,
  score double precision NOT NULL,
  turnout double precision NOT NULL,
  UNIQUE(commune_id, year)
);

CREATE TABLE IF NOT EXISTS nuances (
  code text PRIMARY KEY,
  label text NOT NULL,
  bloc text NOT NULL CHECK (bloc IN (
    'Extrême-gauche', 'Gauche', 'Centre', 'Droite', 'Extrême-droite', 'Divers'
  ))
);

CREATE TABLE IF NOT EXISTS equipment_types (
  code text PRIMARY KEY,
  label text NOT NULL,
  domain char(1) NOT NULL,
  domain_label text NOT NULL,
  subdomain text NOT NULL,
  subdomain_label text NOT NULL
);

CREATE TABLE IF NOT EXISTS commune_equipments (
  insee text NOT NULL,
  typequ text NOT NULL REFERENCES equipment_types(code),
  nb integer NOT NULL DEFAULT 1,
  PRIMARY KEY (insee, typequ)
);

-- ==========================================================
-- 2. Indexes
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_communes_zipcode ON communes(zipcode);
CREATE INDEX IF NOT EXISTS idx_communes_department ON communes(department);
CREATE INDEX IF NOT EXISTS idx_communes_stability ON communes(stability);
CREATE INDEX IF NOT EXISTS idx_communes_dept_stability ON communes(department, stability);
CREATE INDEX IF NOT EXISTS idx_communes_population ON communes(population);

CREATE INDEX IF NOT EXISTS idx_election_results_commune ON election_results(commune_id);
CREATE INDEX IF NOT EXISTS idx_election_results_nuance ON election_results(winner_nuance);
CREATE INDEX IF NOT EXISTS idx_election_results_year ON election_results(year DESC);

CREATE INDEX IF NOT EXISTS idx_ce_insee ON commune_equipments(insee);
CREATE INDEX IF NOT EXISTS idx_ce_typequ ON commune_equipments(typequ);

-- ==========================================================
-- 3. Row Level Security
-- ==========================================================

ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE nuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE commune_equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on communes"
  ON communes FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read on election_results"
  ON election_results FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read on nuances"
  ON nuances FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read on equipment_types"
  ON equipment_types FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read on commune_equipments"
  ON commune_equipments FOR SELECT TO anon USING (true);

-- ==========================================================
-- 4. Reference data: nuances
-- ==========================================================

INSERT INTO nuances (code, label, bloc) VALUES
  -- Legacy simplified codes
  ('G', 'Gauche', 'Gauche'),
  ('CG', 'Centre Gauche', 'Gauche'),
  ('C', 'Centre', 'Centre'),
  ('CD', 'Centre Droit', 'Droite'),
  ('D', 'Droite', 'Droite'),

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

-- ==========================================================
-- 5. Reference data: equipment_types
-- ==========================================================

INSERT INTO equipment_types (code, label, domain, domain_label, subdomain, subdomain_label) VALUES
  ('A101', 'Police', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A104', 'Gendarmerie', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A105', 'Cour d''appel', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A108', 'Conseil de prud''hommes', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A109', 'Tribunal de commerce', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A120', 'DRFiP', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A121', 'DDFiP', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A122', 'Pôle emploi', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A124', 'Maison de justice et du droit', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A125', 'Antenne de justice', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A126', 'CDAD', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A128', 'France Services', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A129', 'Mairie', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A130', 'Bureau d''aide juridictionnelle', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A131', 'Tribunal judiciaire', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A132', 'Tribunal de proximité', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A133', 'Déchèterie', 'A', 'Services pour les particuliers', 'A1', 'Services publics'),
  ('A203', 'Banque, caisse d''épargne', 'A', 'Services pour les particuliers', 'A2', 'Services généraux'),
  ('A205', 'Services funéraires', 'A', 'Services pour les particuliers', 'A2', 'Services généraux'),
  ('A206', 'Bureau de poste', 'A', 'Services pour les particuliers', 'A2', 'Services généraux'),
  ('A207', 'Relais poste', 'A', 'Services pour les particuliers', 'A2', 'Services généraux'),
  ('A208', 'Agence postale', 'A', 'Services pour les particuliers', 'A2', 'Services généraux'),
  ('A301', 'Réparation automobile', 'A', 'Services pour les particuliers', 'A3', 'Services automobiles'),
  ('A302', 'Contrôle technique automobile', 'A', 'Services pour les particuliers', 'A3', 'Services automobiles'),
  ('A303', 'Location auto-utilitaires', 'A', 'Services pour les particuliers', 'A3', 'Services automobiles'),
  ('A304', 'École de conduite', 'A', 'Services pour les particuliers', 'A3', 'Services automobiles'),
  ('A401', 'Maçon', 'A', 'Services pour les particuliers', 'A4', 'Artisanat du bâtiment'),
  ('A402', 'Plâtrier peintre', 'A', 'Services pour les particuliers', 'A4', 'Artisanat du bâtiment'),
  ('A403', 'Menuisier charpentier serrurier', 'A', 'Services pour les particuliers', 'A4', 'Artisanat du bâtiment'),
  ('A404', 'Plombier couvreur chauffagiste', 'A', 'Services pour les particuliers', 'A4', 'Artisanat du bâtiment'),
  ('A405', 'Électricien', 'A', 'Services pour les particuliers', 'A4', 'Artisanat du bâtiment'),
  ('A406', 'Entreprise générale du bâtiment', 'A', 'Services pour les particuliers', 'A4', 'Artisanat du bâtiment'),
  ('A501', 'Coiffure', 'A', 'Services pour les particuliers', 'A5', 'Autres services'),
  ('A502', 'Vétérinaire', 'A', 'Services pour les particuliers', 'A5', 'Autres services'),
  ('A503', 'Agence de travail temporaire', 'A', 'Services pour les particuliers', 'A5', 'Autres services'),
  ('A504', 'Restaurant', 'A', 'Services pour les particuliers', 'A5', 'Autres services'),
  ('A505', 'Agence immobilière', 'A', 'Services pour les particuliers', 'A5', 'Autres services'),
  ('A506', 'Pressing, laverie', 'A', 'Services pour les particuliers', 'A5', 'Autres services'),
  ('A507', 'Institut de beauté', 'A', 'Services pour les particuliers', 'A5', 'Autres services'),
  ('B103', 'Grande surface de bricolage', 'B', 'Commerces', 'B1', 'Grandes surfaces'),
  ('B104', 'Hypermarché', 'B', 'Commerces', 'B1', 'Grandes surfaces'),
  ('B105', 'Supermarché', 'B', 'Commerces', 'B1', 'Grandes surfaces'),
  ('B201', 'Supérette', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B202', 'Épicerie', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B204', 'Boucherie charcuterie', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B205', 'Produits surgelés', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B206', 'Poissonnerie', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B207', 'Boulangerie-pâtisserie', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B208', 'Fruits et légumes', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B209', 'Commerce de boissons', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B210', 'Autres commerces alimentaires', 'B', 'Commerces', 'B2', 'Commerces alimentaires'),
  ('B302', 'Magasin de vêtements', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B303', 'Équipements du foyer', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B304', 'Magasin de chaussures', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B306', 'Magasin de meubles', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B307', 'Articles de sports et loisirs', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B308', 'Revêtements murs et sols', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B309', 'Droguerie quincaillerie', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B310', 'Parfumerie-cosmétique', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B311', 'Horlogerie-bijouterie', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B312', 'Fleuriste-jardinerie', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B313', 'Magasin d''optique', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B315', 'Matériel médical et orthopédique', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B316', 'Station-service', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B317', 'Tissus et mercerie', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B318', 'Jeux et jouets', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B319', 'Maroquinerie', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B320', 'Combustibles domestiques', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B321', 'Électroménager, audio-vidéo, informatique', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B322', 'Matériels de télécommunication', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B323', 'Biens d''occasion', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B324', 'Librairie', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('B325', 'Papeterie et presse', 'B', 'Commerces', 'B3', 'Commerces spécialisés non-alimentaires'),
  ('C107', 'École maternelle', 'C', 'Enseignement', 'C1', 'Enseignement du premier degré'),
  ('C108', 'École primaire', 'C', 'Enseignement', 'C1', 'Enseignement du premier degré'),
  ('C109', 'École élémentaire', 'C', 'Enseignement', 'C1', 'Enseignement du premier degré'),
  ('C201', 'Collège', 'C', 'Enseignement', 'C2', 'Second degré - premier cycle'),
  ('C301', 'Lycée général et/ou technologique', 'C', 'Enseignement', 'C3', 'Second degré - second cycle'),
  ('C302', 'Lycée professionnel', 'C', 'Enseignement', 'C3', 'Second degré - second cycle'),
  ('C303', 'Lycée agricole', 'C', 'Enseignement', 'C3', 'Second degré - second cycle'),
  ('C304', 'Section enseignement général et technologique', 'C', 'Enseignement', 'C3', 'Second degré - second cycle'),
  ('C305', 'Section enseignement professionnel', 'C', 'Enseignement', 'C3', 'Second degré - second cycle'),
  ('C401', 'STS / CPGE', 'C', 'Enseignement', 'C4', 'Supérieur non-universitaire'),
  ('C402', 'Formation santé', 'C', 'Enseignement', 'C4', 'Supérieur non-universitaire'),
  ('C403', 'Formation commerce', 'C', 'Enseignement', 'C4', 'Supérieur non-universitaire'),
  ('C409', 'Autre formation post-bac', 'C', 'Enseignement', 'C4', 'Supérieur non-universitaire'),
  ('C501', 'UFR', 'C', 'Enseignement', 'C5', 'Supérieur universitaire'),
  ('C502', 'Institut universitaire', 'C', 'Enseignement', 'C5', 'Supérieur universitaire'),
  ('C503', 'École d''ingénieurs', 'C', 'Enseignement', 'C5', 'Supérieur universitaire'),
  ('C504', 'Enseignement supérieur privé', 'C', 'Enseignement', 'C5', 'Supérieur universitaire'),
  ('C505', 'École supérieure agricole', 'C', 'Enseignement', 'C5', 'Supérieur universitaire'),
  ('C509', 'Autre enseignement supérieur', 'C', 'Enseignement', 'C5', 'Supérieur universitaire'),
  ('C601', 'CFA hors agriculture', 'C', 'Enseignement', 'C6', 'Formation continue'),
  ('C602', 'GRETA', 'C', 'Enseignement', 'C6', 'Formation continue'),
  ('C603', 'Formation continue agricole', 'C', 'Enseignement', 'C6', 'Formation continue'),
  ('C604', 'Formation aux métiers du sport', 'C', 'Enseignement', 'C6', 'Formation continue'),
  ('C605', 'Apprentissage agricole', 'C', 'Enseignement', 'C6', 'Formation continue'),
  ('C609', 'Autre formation continue', 'C', 'Enseignement', 'C6', 'Formation continue'),
  ('C701', 'Résidence universitaire', 'C', 'Enseignement', 'C7', 'Autres services éducation'),
  ('C702', 'Restaurant universitaire', 'C', 'Enseignement', 'C7', 'Autres services éducation'),
  ('D101', 'Établissement santé court séjour', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D102', 'Établissement santé moyen séjour', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D103', 'Établissement santé long séjour', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D104', 'Établissement psychiatrique', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D105', 'Centre lutte cancer', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D106', 'Urgences', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D107', 'Maternité', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D108', 'Centre de santé', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D109', 'Structure psychiatrique ambulatoire', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D110', 'Centre médecine préventive', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D111', 'Dialyse', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D112', 'Hospitalisation à domicile', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D113', 'Maison de santé pluridisciplinaire', 'D', 'Santé et action sociale', 'D1', 'Établissements de santé'),
  ('D201', 'Médecin généraliste', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D202', 'Cardiologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D203', 'Dermatologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D206', 'Gastro-entérologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D207', 'Psychiatre', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D208', 'Ophtalmologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D209', 'ORL', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D210', 'Pédiatre', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D211', 'Pneumologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D212', 'Radiologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D213', 'Stomatologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D214', 'Gynécologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D221', 'Chirurgien-dentiste', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D231', 'Sage-femme', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D233', 'Masseur kinésithérapeute', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D235', 'Orthophoniste', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D236', 'Orthoptiste', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D237', 'Pédicure-podologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D238', 'Audio-prothésiste', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D239', 'Ergothérapeute', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D240', 'Psychomotricien', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D242', 'Diététicien', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D243', 'Psychologue', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D244', 'Infirmier', 'D', 'Santé et action sociale', 'D2', 'Professions médicales libérales'),
  ('D302', 'Laboratoire d''analyses', 'D', 'Santé et action sociale', 'D3', 'Autres établissements sanitaires'),
  ('D303', 'Ambulance', 'D', 'Santé et action sociale', 'D3', 'Autres établissements sanitaires'),
  ('D304', 'Transfusion sanguine', 'D', 'Santé et action sociale', 'D3', 'Autres établissements sanitaires'),
  ('D305', 'Établissement thermal', 'D', 'Santé et action sociale', 'D3', 'Autres établissements sanitaires'),
  ('D307', 'Pharmacie', 'D', 'Santé et action sociale', 'D3', 'Autres établissements sanitaires'),
  ('D401', 'Hébergement personnes âgées', 'D', 'Santé et action sociale', 'D4', 'Action sociale personnes âgées'),
  ('D402', 'Soins à domicile personnes âgées', 'D', 'Santé et action sociale', 'D4', 'Action sociale personnes âgées'),
  ('D403', 'Services d''aide personnes âgées', 'D', 'Santé et action sociale', 'D4', 'Action sociale personnes âgées'),
  ('D502', 'Accueil du jeune enfant (EAJE)', 'D', 'Santé et action sociale', 'D5', 'Action sociale enfants'),
  ('D503', 'Lieu d''accueil enfant-parent', 'D', 'Santé et action sociale', 'D5', 'Action sociale enfants'),
  ('D504', 'Relais petite enfance', 'D', 'Santé et action sociale', 'D5', 'Action sociale enfants'),
  ('D505', 'Accueil de loisir sans hébergement', 'D', 'Santé et action sociale', 'D5', 'Action sociale enfants'),
  ('D506', 'Centre social', 'D', 'Santé et action sociale', 'D5', 'Action sociale enfants'),
  ('D507', 'Médiation familiale', 'D', 'Santé et action sociale', 'D5', 'Action sociale enfants'),
  ('D601', 'Hébergement enfants handicapés', 'D', 'Santé et action sociale', 'D6', 'Action sociale handicapés'),
  ('D602', 'Services enfants handicapés', 'D', 'Santé et action sociale', 'D6', 'Action sociale handicapés'),
  ('D603', 'Hébergement adultes handicapés', 'D', 'Santé et action sociale', 'D6', 'Action sociale handicapés'),
  ('D604', 'Services d''aide adultes handicapés', 'D', 'Santé et action sociale', 'D6', 'Action sociale handicapés'),
  ('D605', 'Travail protégé', 'D', 'Santé et action sociale', 'D6', 'Action sociale handicapés'),
  ('D606', 'Soins à domicile adultes handicapés', 'D', 'Santé et action sociale', 'D6', 'Action sociale handicapés'),
  ('D701', 'Protection de l''enfance - hébergement', 'D', 'Santé et action sociale', 'D7', 'Autres action sociale'),
  ('D702', 'Protection de l''enfance - action éducative', 'D', 'Santé et action sociale', 'D7', 'Autres action sociale'),
  ('D703', 'CHRS', 'D', 'Santé et action sociale', 'D7', 'Autres action sociale'),
  ('D704', 'Centre provisoire d''hébergement', 'D', 'Santé et action sociale', 'D7', 'Autres action sociale'),
  ('D705', 'Centre accueil demandeur d''asile', 'D', 'Santé et action sociale', 'D7', 'Autres action sociale'),
  ('D709', 'Autres établissements action sociale', 'D', 'Santé et action sociale', 'D7', 'Autres action sociale'),
  ('E101', 'Taxi-VTC', 'E', 'Transports et déplacements', 'E1', 'Infrastructures de transports'),
  ('E102', 'Aéroport', 'E', 'Transports et déplacements', 'E1', 'Infrastructures de transports'),
  ('E107', 'Gare d''intérêt national', 'E', 'Transports et déplacements', 'E1', 'Infrastructures de transports'),
  ('E108', 'Gare d''intérêt régional', 'E', 'Transports et déplacements', 'E1', 'Infrastructures de transports'),
  ('E109', 'Gare d''intérêt local', 'E', 'Transports et déplacements', 'E1', 'Infrastructures de transports'),
  ('F101', 'Bassin de natation', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F102', 'Boulodrome', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F103', 'Tennis', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F104', 'Équipement de cyclisme', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F105', 'Domaine skiable', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F106', 'Centre équestre', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F107', 'Athlétisme', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F108', 'Terrain de golf', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F109', 'Parcours sportif/santé', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F110', 'Sports de glace', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F111', 'Terrains de jeux extérieurs', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F112', 'Salles spécialisées', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F113', 'Terrains de grands jeux', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F114', 'Salles de combat', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F116', 'Salles non spécialisées', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F117', 'Roller-skate-BMX', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F118', 'Sports nautiques', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F119', 'Bowling', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F120', 'Salles de remise en forme', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F121', 'Gymnases', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F122', 'Sports mécaniques', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F123', 'Mur et fronton', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F124', 'Pas de tir', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F125', 'Activités aériennes', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F126', 'Modélisme', 'F', 'Sports, loisirs et culture', 'F1', 'Équipements sportifs'),
  ('F201', 'Baignade aménagée', 'F', 'Sports, loisirs et culture', 'F2', 'Équipements de loisirs'),
  ('F202', 'Port de plaisance', 'F', 'Sports, loisirs et culture', 'F2', 'Équipements de loisirs'),
  ('F203', 'Randonnée', 'F', 'Sports, loisirs et culture', 'F2', 'Équipements de loisirs'),
  ('F204', 'Sports de nature', 'F', 'Sports, loisirs et culture', 'F2', 'Équipements de loisirs'),
  ('F303', 'Cinéma', 'F', 'Sports, loisirs et culture', 'F3', 'Équipements culturels'),
  ('F305', 'Conservatoire', 'F', 'Sports, loisirs et culture', 'F3', 'Équipements culturels'),
  ('F307', 'Bibliothèque', 'F', 'Sports, loisirs et culture', 'F3', 'Équipements culturels'),
  ('F312', 'Exposition et médiation culturelle', 'F', 'Sports, loisirs et culture', 'F3', 'Équipements culturels'),
  ('F313', 'Espace remarquable et patrimoine', 'F', 'Sports, loisirs et culture', 'F3', 'Équipements culturels'),
  ('F314', 'Archives', 'F', 'Sports, loisirs et culture', 'F3', 'Équipements culturels'),
  ('F315', 'Arts du spectacle', 'F', 'Sports, loisirs et culture', 'F3', 'Équipements culturels'),
  ('G101', 'Agence de voyage', 'G', 'Tourisme', 'G1', 'Tourisme'),
  ('G102', 'Hôtel', 'G', 'Tourisme', 'G1', 'Tourisme'),
  ('G103', 'Camping', 'G', 'Tourisme', 'G1', 'Tourisme'),
  ('G104', 'Information touristique', 'G', 'Tourisme', 'G1', 'Tourisme'),
  ('G105', 'Autres hébergements collectifs touristiques', 'G', 'Tourisme', 'G1', 'Tourisme')
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  domain = EXCLUDED.domain,
  domain_label = EXCLUDED.domain_label,
  subdomain = EXCLUDED.subdomain,
  subdomain_label = EXCLUDED.subdomain_label;

-- ==========================================================
-- 6. RPC Functions
-- ==========================================================

CREATE OR REPLACE FUNCTION get_distinct_departments()
RETURNS TABLE (department text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.department FROM communes c ORDER BY c.department;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION search_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_domains text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL,
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

CREATE OR REPLACE FUNCTION count_communes(
  target_department text DEFAULT NULL,
  target_bloc text DEFAULT NULL,
  target_match_level text DEFAULT NULL,
  target_domains text[] DEFAULT NULL,
  target_pop_ranges text[] DEFAULT NULL
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

CREATE OR REPLACE FUNCTION get_commune_equipments(target_insee text)
RETURNS TABLE (
  domain char(1),
  domain_label text,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.domain,
    et.domain_label,
    SUM(ce.nb)::bigint AS total_count
  FROM commune_equipments ce
  JOIN equipment_types et ON et.code = ce.typequ
  WHERE ce.insee = target_insee
  GROUP BY et.domain, et.domain_label
  ORDER BY et.domain;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
