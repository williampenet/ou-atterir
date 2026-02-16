-- ============================================
-- Ou Atterir - Supabase Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- Table: communes
create table if not exists communes (
  id uuid default gen_random_uuid() primary key,
  insee text unique not null,
  zipcode text not null,
  name text not null,
  department text not null,
  lat double precision not null,
  lng double precision not null,
  stability text not null check (stability in ('FORTRESS', 'STABLE', 'SWING', 'UNSTABLE')),
  current_mayor text not null,
  created_at timestamptz default now()
);

-- Table: election_results
create table if not exists election_results (
  id uuid default gen_random_uuid() primary key,
  commune_id uuid not null references communes(id) on delete cascade,
  year integer not null,
  winner_nuance text not null check (winner_nuance in ('EXG', 'G', 'CG', 'C', 'CD', 'D', 'EXD', 'DIV')),
  winner_name text not null,
  score double precision not null,
  turnout double precision not null,
  unique(commune_id, year)
);

-- Indexes
create index if not exists idx_communes_zipcode on communes(zipcode);
create index if not exists idx_election_results_commune on election_results(commune_id);

-- Enable Row Level Security
alter table communes enable row level security;
alter table election_results enable row level security;

-- Allow anonymous read access
create policy "Allow public read on communes"
  on communes for select
  to anon
  using (true);

create policy "Allow public read on election_results"
  on election_results for select
  to anon
  using (true);

-- ============================================
-- Seed Data
-- ============================================

insert into communes (insee, zipcode, name, department, lat, lng, stability, current_mayor) values
  ('69123', '69001', 'Lyon 1er Arrondissement', 'Rhône', 45.7705, 4.8305, 'STABLE', 'Yasmine Bouagga'),
  ('33063', '33000', 'Bordeaux', 'Gironde', 44.8378, -0.5792, 'SWING', 'Pierre Hurmic'),
  ('62427', '62110', 'Hénin-Beaumont', 'Pas-de-Calais', 50.4214, 2.9515, 'FORTRESS', 'Steeve Briois'),
  ('92200', '92200', 'Neuilly-sur-Seine', 'Hauts-de-Seine', 48.8846, 2.2696, 'FORTRESS', 'Jean-Christophe Fromantin'),
  ('75016', '75016', 'Paris 16ème', 'Paris', 48.8637, 2.2600, 'FORTRESS', 'Francis Szpiner')
on conflict (insee) do nothing;

-- Lyon 1er
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2020, 'EXG', 'Union Gauche/Écologistes', 58.6, 42.5 from communes where insee = '69123'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2014, 'G', 'Nathalie Perrin-Gilbert', 51.2, 56.1 from communes where insee = '69123'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2008, 'G', 'Nathalie Perrin-Gilbert', 54.3, 58.4 from communes where insee = '69123'
on conflict (commune_id, year) do nothing;

-- Bordeaux
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2020, 'G', 'Pierre Hurmic (EELV)', 46.5, 37.8 from communes where insee = '33063'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2014, 'CD', 'Alain Juppé', 60.9, 56.2 from communes where insee = '33063'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2008, 'CD', 'Alain Juppé', 56.6, 59.1 from communes where insee = '33063'
on conflict (commune_id, year) do nothing;

-- Hénin-Beaumont
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2020, 'EXD', 'Steeve Briois (RN)', 74.2, 52.3 from communes where insee = '62427'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2014, 'EXD', 'Steeve Briois (FN)', 50.3, 64.8 from communes where insee = '62427'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2008, 'G', 'Gérard Dalongeville', 44.3, 66.5 from communes where insee = '62427'
on conflict (commune_id, year) do nothing;

-- Neuilly-sur-Seine
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2020, 'CD', 'J.C. Fromantin', 60.3, 39.4 from communes where insee = '92200'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2014, 'CD', 'J.C. Fromantin', 66.5, 55.7 from communes where insee = '92200'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2008, 'D', 'Jean Sarkozy / Ind.', 58.2, 57.2 from communes where insee = '92200'
on conflict (commune_id, year) do nothing;

-- Paris 16ème
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2020, 'D', 'Francis Szpiner', 76.2, 35.1 from communes where insee = '75016'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2014, 'D', 'Claude Goasguen', 63.1, 53.4 from communes where insee = '75016'
on conflict (commune_id, year) do nothing;
insert into election_results (commune_id, year, winner_nuance, winner_name, score, turnout)
select id, 2008, 'D', 'Claude Goasguen', 51.7, 56.8 from communes where insee = '75016'
on conflict (commune_id, year) do nothing;
