# Tendances Municipales — Note de contexte projet

## Identifiants

- **Repo GitHub** : `williampenet/ou-atterir`
- **Branche de dev** : `claude/sync-local-repo-pZUm9`
- **Branche principale** : `main`
- **Session Claude Code** : `session_01T7FTP3Q94bdHba4ysP8spb`

---

## Résumé du projet

Plateforme web statique permettant aux citoyens français de visualiser la **tendance politique historique** de n'importe quelle commune, à l'approche des **élections municipales de mars 2026**.

**Cas d'usage V1 :**
1. Chercher une commune (nom ou code postal)
2. Voir la synthèse des tendances électorales passées (municipales 2008, 2014, 2020)
3. Explorer les communes les plus stables dans une orientation politique

**Stack prévue :** React + Tailwind (Vercel free) / données JSON statique pré-calculé / pipeline Python one-shot.

---

## Structure du repo

```
ou-atterir/
├── BRIEF.md                         # Cadrage données & architecture (spec détaillée)
├── CLAUDE.md                        # Cette note de contexte
├── README.md                        # (minimal)
├── .gitignore                       # Exclut data/raw/, data/output/, .venv, node_modules…
└── data/
    ├── nuances.csv                  # 86 codes nuance → 7 familles politiques + couleurs hex
    ├── codespostaux.csv             # Code postal ↔ code INSEE (1.5 Mo, data.gouv.fr)
    ├── ville.xls                    # 36k+ communes avec coordonnées GPS (5.2 Mo, fichier local)
    ├── raw/                         # Fichiers téléchargés par le pipeline (gitignored)
    │   ├── candidats-results.parquet  # ~téléchargé depuis data.gouv.fr
    │   └── general-results.parquet    # ~téléchargé depuis data.gouv.fr
    ├── output/                      # Sortie du pipeline (gitignored)
    │   ├── communes_tendances.json  # JSON principal (~2-3 Mo)
    │   ├── communes_index.json      # Index léger pour la recherche
    │   └── familles_meta.json       # Labels + couleurs des 7 familles
    └── scripts/
        ├── build_data.py            # Pipeline complet (500 lignes) — point d'entrée principal
        └── requirements.txt         # pandas, pyarrow, requests, openpyxl, xlrd
```

---

## Pipeline de données (`data/scripts/build_data.py`)

Le script s'exécute en 6 étapes séquentielles :

| Étape | Description | Entrée | Sortie |
|-------|-------------|--------|--------|
| 1. Download | Télécharge parquets + CSV depuis data.gouv.fr | URLs hardcodées | `data/raw/*.parquet`, `data/raw/codes_postaux.csv` |
| 2. Load & Filter | Charge les parquets, filtre sur les municipales (2008/2014/2020, T1+T2) | parquets | DataFrames filtrés |
| 3. Aggregate | Agrège les voix par commune/année/famille politique. Prend T2 si dispo, sinon T1. Identifie le gagnant. | DataFrames | `agg` + `gagnants` |
| 4. Enrich Geo | Charge `ville.xls` pour les coordonnées GPS + noms de communes | `ville.xls` | `df_geo` |
| 5. Commune Names | Extrait les noms de communes depuis general-results | DataFrame | `df_names` |
| 6. Build JSON | Assemble le JSON final avec tendances, répartition, score de stabilité | tout | `communes_tendances.json` |

**Sources de données :**
- Résultats candidats (parquet) : `https://www.data.gouv.fr/fr/datasets/r/4d3b35f6-0b22-4415-a24c-419a676312e2`
- Résultats généraux (parquet) : `https://www.data.gouv.fr/fr/datasets/r/ff16d511-10c0-405e-9b35-511723948fce`
- Codes postaux (CSV) : `https://www.data.gouv.fr/fr/datasets/r/008a2dda-2c60-4b63-b910-998f6f818089`
- Communes + GPS : `ville.xls` (fichier local, non téléchargeable)

**Classification politique :** 86 codes nuance (ex: LSOC, LFN, LDVG…) mappés dans `nuances.csv` vers 7 familles : Extrême gauche, Gauche, Écologiste, Centre, Droite, Extrême droite, Divers.

---

## État actuel (15 février 2026)

### Ce qui est fait
- [x] Rédaction du BRIEF (spec données + architecture)
- [x] Script `build_data.py` complet (pipeline de bout en bout)
- [x] Fichier `nuances.csv` (mapping nuance → famille)
- [x] `requirements.txt`
- [x] Fichiers de données uploadés : `codespostaux.csv`, `ville.xls`
- [x] Dépendances Python installées dans l'environnement de dev

### Ce qui reste à faire
- [ ] **Exécuter le pipeline** (`python data/scripts/build_data.py`) — jamais lancé avec succès pour l'instant
- [ ] **Déboguer** les éventuels problèmes de colonnes (les noms de colonnes dans les parquets sont en snake_case minuscule, le script a été corrigé pour ça mais pas encore testé end-to-end)
- [ ] **Valider la qualité des données** du JSON de sortie
- [ ] **Développer le frontend** React + Tailwind
- [ ] **Déployer** sur Vercel

### Problèmes connus / points d'attention
1. `ville.xls` est dans `data/` (racine data) mais le script le cherche dans `data/raw/ville.xls` — à corriger ou déplacer
2. `codespostaux.csv` est dans `data/` mais le script le télécharge dans `data/raw/codes_postaux.csv` (nom différent) — le script utilise sa propre version téléchargée
3. Les noms de colonnes dans les parquets sont en **snake_case minuscule** (ex: `code_departement`, `nuance`, `voix`, `ratio_voix_exprimes`), ce qui a été corrigé dans le commit `c35d167` mais pas encore validé en exécution
4. Le `.gitignore` exclut `data/raw/` et `data/output/` — les fichiers parquets ne sont pas versionnés, ils sont re-téléchargés à chaque exécution du pipeline

---

## Historique Git

```
e8f0b68 (claude/sync-local-repo-pZUm9) chore: sync ville.xls from main branch
038b7d2 chore: sync codespostaux.csv from main branch
c35d167 fix: align column names with actual parquet schema (lowercase snake_case)
6e002fc fix: use local ville.xls for commune GPS data instead of broken URL
2326c18 fix: update data download URLs with correct data.gouv.fr resource IDs
3bdfa25 feat: add data pipeline and project brief
641088c Initial commit
```

---

## Pour reprendre le travail

```bash
# 1. Cloner et se placer sur la branche de dev
git clone https://github.com/williampenet/ou-atterir.git
cd ou-atterir
git checkout claude/sync-local-repo-pZUm9

# 2. Installer les dépendances
pip install -r data/scripts/requirements.txt

# 3. S'assurer que ville.xls est dans data/raw/ (le déplacer si nécessaire)
cp data/ville.xls data/raw/ville.xls  # si le fichier est à la racine de data/

# 4. Lancer le pipeline
python data/scripts/build_data.py

# 5. Vérifier la sortie
ls -lh data/output/
```

Le pipeline télécharge automatiquement les parquets depuis data.gouv.fr. Seul `ville.xls` doit être fourni manuellement.
