-- ==========================================================
-- Ou Atterir — Seed data
-- Sources:
--   - communes + elections: data.gouv.fr (scripts/import_real_data.py)
--   - equipments:           INSEE BPE 2024 (scripts/import_bpe.py)
--
-- Usage:
--   Run each file in order in the Supabase SQL Editor,
--   or use: supabase db reset (applies migrations + this seed)
--
-- For large datasets, import seed_real_data.sql and
-- seed_commune_equipments.sql separately via the SQL Editor.
-- ==========================================================

\echo 'Seed: loading real commune + election data...'
\i seed_real_data.sql

\echo 'Seed: loading BPE equipment data...'
\i seed_commune_equipments.sql

\echo 'Seed complete.'
