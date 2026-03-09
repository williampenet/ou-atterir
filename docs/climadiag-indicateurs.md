# Climadiag Commune — Indicateurs & Plan d'intégration

> **Fichier de travail** — à supprimer une fois l'intégration terminée.

## Source de données

Fichier statique JSONL (toutes les communes françaises) :
```
https://climadiag-commune.meteofrance.com/entities.jsonl
```
Format : une ligne JSON par commune, avec `identifiant_insee`, `icu` (1-6), et `indicateurs[]` (20 indicateurs × 3 horizons).

Horizons TRACC (réchauffement France hexagonale) :
- **2030** : +2.0 °C
- **2050** : +2.7 °C
- **2100** : +4.0 °C

Période de référence : **1976-2005**. Chaque projection contient `ref`, `min`, `mean`, `max`.

> **Important (à mentionner dans À propos)** : la valeur "Réf" n'est pas la valeur actuelle,
> c'est la moyenne historique 1976-2005 (~35 ans en arrière). Il n'y a pas de mesure "aujourd'hui"
> dans Climadiag. La projection 2030 (dans 4 ans) est paradoxalement plus représentative
> du climat actuel que la Réf. Les projections (2030/2050/2100) sont la médiane de 17 modèles
> climatiques, pas des certitudes.

## Indicateurs retenus (phase 1)

| Code | Nom | Définition | Granularité |
|------|-----|-----------|-------------|
| **S3** | Vague de chaleur | Jours faisant partie d'un épisode prolongé de chaleur jour+nuit (≥3 jours, stress thermique cumulé) | Annuel |
| **S1** | Jours très chauds | Jours où T° maximale ≥ 35 °C (seuil absolu, jour par jour) | Annuel |
| **R5** | Sol sec | Jours où la réserve en eau du sol < 40 % (SWI < 0.4) | Saisonnier (on prend été) |
| **ICU** | Îlot de chaleur urbain | Score 1-6, métadonnée directe (pas un indicateur projeté) | — |

### Différence clé : S3 vs S1

- **S1** = chaleur ponctuelle (un jour isolé à 36 °C compte)
- **S3** = chaleur persistante (le corps ne récupère plus la nuit, risque sanitaire)
→ On peut avoir 10 jours très chauds sans vague de chaleur, et vice versa.

## Indicateurs retenus

### Climat
| Code | Indicateur | Définition | Type |
|------|-----------|-----------|------|
| G4 | Jours avec précipitations | Cumul > 1 mm | Saisonnier |

### Risques naturels
| Code | Indicateur | Définition | Type |
|------|-----------|-----------|------|
| R2 | Précipitations extrêmes | Quantile 99,9 % (~1 fois / 3 ans) | Annuel |
| R3 | Niveau de la mer | Montée du niveau marin (null si pas littoral) | Annuel |
| R4 | Risque feu de végétation | Jours où IFM > 40 | Annuel |
| R5 | Sol sec | Réserve eau du sol < 40 % (SWI < 0.4) | Saisonnier |

### Santé
| Code | Indicateur | Définition | Type |
|------|-----------|-----------|------|
| S1 | Jours très chauds | T° max ≥ 35 °C | Annuel |
| S2 | Nuits chaudes | T° min > 20 °C | Annuel |
| S3 | Vague de chaleur | Épisode prolongé chaleur jour+nuit | Annuel |
| S4 | Vague de froid | Épisode prolongé de froid | Annuel |

### Exclus
- **Tourisme** (T1-T3) : supprimés.
- **Agriculture** (AG1-AG4) : masqués pour l'instant, à traiter plus tard.
- **G1** (T° moyenne), **G2** (gel), **G3** (précipitations), **R1** (fortes pluies) : supprimés.

## Plan d'intégration

### Schema SQL (table dénormalisée, 1 ligne / commune)

```sql
CREATE TABLE commune_climat (
  code_insee text PRIMARY KEY,
  icu smallint,
  chaleur_ref numeric,          chaleur_2030 numeric,
  chaleur_2050 numeric,         chaleur_2100 numeric,
  secheresse_ete_ref numeric,   secheresse_ete_2030 numeric,
  secheresse_ete_2050 numeric,  secheresse_ete_2100 numeric,
  jours_chauds_ref numeric,     jours_chauds_2030 numeric,
  jours_chauds_2050 numeric,    jours_chauds_2100 numeric
);
```

Vue matérialisée pour le filtre (seuils à affiner après analyse distribution) :
```sql
CREATE MATERIALIZED VIEW commune_climat_summary AS
SELECT code_insee, icu,
  CASE
    WHEN chaleur_2050 < 5 THEN 'faible'
    WHEN chaleur_2050 < 15 THEN 'modere'
    WHEN chaleur_2050 < 30 THEN 'eleve'
    ELSE 'tres_eleve'
  END AS heat_wave_level
FROM commune_climat;
```

### Fichiers à créer
- `scripts/import_climadiag.py` → `supabase/seed_climadiag.sql`
- `supabase/migrations/20250312000000_climadiag.sql`

### Fichiers à modifier
- `types.ts` : `HeatWaveLevel`, `ClimatData`, champ `heatWave` dans `SearchFilters`
- `constants.ts` : `HEAT_WAVE_LEVELS`
- `services/communeService.ts` : `getCommuneClimat()` + `buildRpcParams`
- `components/FilterSheet.tsx` : section "Vagues de chaleur (2050)" dans Environnement
- `components/CommuneDrawer.tsx` : section projections climatiques

### UX Drawer (maquette)

```
┌──────────────────────────────────────────────────┐
│  Projections climatiques         Climadiag, MF   │
│                                                  │
│  Îlot de chaleur urbain                 ██ 6/6   │
│                                                  │
│  Vagues de chaleur (jours/an)                    │
│  ┌───────────┬──────┬──────┬──────┬──────┐       │
│  │           │  Réf │ 2030 │ 2050 │ 2100 │       │
│  ├───────────┼──────┼──────┼──────┼──────┤       │
│  │ Moyenne   │  1.9 │  7.2 │ 13.2 │ 42.5 │       │
│  └───────────┴──────┴──────┴──────┴──────┘       │
│                                   ▲ x7 vs ref    │
│                                                  │
│  Jours très chauds ≥35°C (jours/an)              │
│  ┌───────────┬──────┬──────┬──────┬──────┐       │
│  │           │  Réf │ 2030 │ 2050 │ 2100 │       │
│  ├───────────┼──────┼──────┼──────┼──────┤       │
│  │ Moyenne   │  1.4 │  4.8 │  9.3 │ 28.1 │       │
│  └───────────┴──────┴──────┴──────┴──────┘       │
│                                                  │
│  Sol sec en été (jours)                          │
│  ┌───────────┬──────┬──────┬──────┬──────┐       │
│  │           │  Réf │ 2030 │ 2050 │ 2100 │       │
│  ├───────────┼──────┼──────┼──────┼──────┤       │
│  │ Moyenne   │ 42.0 │ 48.5 │ 55.2 │ 68.0 │       │
│  └───────────┴──────┴──────┴──────┴──────┘       │
│                                                  │
│  Source : Climadiag Commune, Météo-France        │
│  Scénario TRACC · Réf. 1976-2005                 │
└──────────────────────────────────────────────────┘
```

Filtre (FilterSheet) : uniquement sur `chaleur_2050 mean`, 4 chips :
- Faible (< 5 j/an) · Modéré (5-15) · Élevé (15-30) · Très élevé (> 30)

### UX : code couleur progressif

Vert → jaune → orange → rouge sur les cellules du tableau pour rendre l'évolution visuelle. Multiplicateur ("x7 vs ref") pour l'ampleur du changement.
