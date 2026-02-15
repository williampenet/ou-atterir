# Tendances Municipales — Cadrage données & architecture

## 1. Résumé du projet

Plateforme web permettant aux citoyens d'identifier la tendance politique historique de n'importe quelle commune française, à l'approche des élections municipales de mars 2026.

**Cas d'usage V1 :**

1. Sélectionner sa commune (nom / code postal)
2. Voir la synthèse des tendances électorales passées (municipales)
3. Chercher les communes les plus stables dans une orientation politique donnée (autour de soi / en France)

---

## 2. Sources de données identifiées

### 2.1 Source principale — Résultats électoraux agrégés

**URL :** https://www.data.gouv.fr/datasets/donnees-des-elections-agregees

Deux fichiers clés en format **Parquet** (recommandé) ou CSV :

#### Fichier `candidats-results` (la pièce maîtresse)

Colonnes identifiées via l'explorateur data.gouv.fr :

| Colonne | Type | Description | Usage projet |
|---|---|---|---|
| `id_election` | string | Identifiant : `2020_muni_t1`, `2014_muni_t1`… | **Filtrer** sur les municipales uniquement |
| `id_brut_miom` | string | Identifiant bureau de vote (ex : `63113_0010`) | Jointure avec general-results |
| `Code du département` | string | Code département (01, 2A…) | Regroupement géographique |
| `Code de la commune` | string | Code INSEE commune (3 caractères dans le département) | **Clé d'agrégation** principale |
| `Code du b.vote` | string | Code bureau de vote | Agrégation → commune |
| `N°Panneau` | integer | Numéro de panneau du candidat/liste | — |
| `Libellé Abrégé Liste` | string | Nom abrégé de la liste | Affichage |
| `Libellé Etendu Liste` | string | Nom complet de la liste | Affichage |
| `Nom Tête de Liste` | string | Nom du/de la tête de liste | Affichage |
| `Voix` | integer | Nombre de voix obtenues | **Calcul des %** |
| `% Voix/Ins` | float | % par rapport aux inscrits | Indicateur |
| `% Voix/Exp` | float | % par rapport aux exprimés | **Indicateur principal** |
| `Sexe` | string | Sexe du candidat (si individuel) | — |
| `Nom` | string | Nom du candidat | — |
| `Prénom` | string | Prénom du candidat | — |
| `Nuance` | string | **Code nuance politique** (ex : LSOC, LFN, LDVG…) | **CLÉ DE CLASSIFICATION** |
| `Binôme` | string | Binôme (si applicable, ex : départementales) | — |
| `Liste` | string | Appartenance à une liste | — |

> **Point critique :** La colonne `Nuance` est la clé de tout le projet. C'est elle qui permet de classifier chaque candidat/liste sur l'échiquier politique.

#### Fichier `general-results` (contexte de participation)

Schéma confirmé par le JSON fourni :

| Colonne | Type | Usage projet |
|---|---|---|
| `id_election` | string | Filtre municipales |
| `id_brut_miom` | string | Jointure |
| `code_commune` | string | Code INSEE 5 caractères |
| `libelle_commune` | string | Nom de la commune |
| `inscrits` | integer | Nombre d'inscrits |
| `votants` | integer | Nombre de votants |
| `exprimes` | integer | Votes exprimés |
| `abstentions` | integer | Abstentions |

#### Élections municipales disponibles dans le dataset

| id_election | Année | Notes |
|---|---|---|
| `2020_muni_t1` / `2020_muni_t2` | 2020 | Toutes communes ≥ 1000 hab. |
| `2014_muni_t1` / `2014_muni_t2` | 2014 | Idem |
| `2008_muni_t1` / `2008_muni_t2` | 2008 | **Uniquement communes > 3 500 hab.** |

> ⚠️ Les municipales de 2001 **ne sont pas** dans le dataset agrégé (pas de données bureau de vote).

---

### 2.2 Table des nuances politiques

Fichier `nuances.csv` fourni — **84 codes de nuance** à mapper vers des familles politiques.

**Mapping proposé vers 7 familles :**

| Famille | Couleur suggérée | Codes nuance (non exhaustif) |
|---|---|---|
| **Extrême gauche** | Rouge foncé | EXG, DXG, LEXG |
| **Gauche** | Rose / Rouge | COM, PG, SOC, RDG, DVG, FG, FI, LFI, NUP, LCOM, LSOC, LDVG, LFG, LPG, LUG, LCOP, LRDG, LFI |
| **Écologiste** | Vert | VEC, ECO, LVEC, LECO, LVEG |
| **Centre** | Orange / Jaune | MODM, MDM, UDI, CEN, ALLI, PRV, NCE, REM, ENS, DVC, LCMD, LMDM, LUC, LUDI, LREM, LDVC, LCEN, LMMD, LMP, LGCE, LUCG |
| **Droite** | Bleu | UMP, LR, DVD, MAJ, MPF, M-NC, M, CPNT, DLR, LUMP, LDVD, LUD, LMAJ, LLR, LUCD, LDLR, LMC |
| **Extrême droite** | Bleu foncé / Noir | FN, RN, EXD, DLF, DSV, REC, DXD, LFN, LEXD, LDSV, LRN, LDLF, LUXD |
| **Divers / Inclassable** | Gris | DIV, AUT, REG, LDIV, LAUT, LREG, LNC, LGJ, UDFM |

---

### 2.3 Référentiel géographique des communes

| Source | Données | URL |
|---|---|---|
| **COG INSEE** | Code INSEE, nom, population, statut | https://www.insee.fr/fr/information/2560452 |
| **Base officielle des codes postaux** | Code postal ↔ code INSEE | https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux/ |
| **Communes + coordonnées GPS** | Latitude, longitude centroïde | https://www.data.gouv.fr/datasets/communes-de-france-base-des-codes-postaux/ |

---

## 3. Modèle de données cible (pré-calculé)

L'idée est de **pré-calculer** les tendances et de servir un fichier JSON statique.

### Table `communes_tendances.json`

```json
{
  "69123": {
    "nom": "Lyon",
    "code_postal": "69001",
    "departement": "69",
    "lat": 45.764,
    "lng": 4.8357,
    "population": 522250,
    "elections": {
      "2020_muni_t1": {
        "gagnant": { "nuance": "LVEC", "famille": "Écologiste", "pct_exprimes": 28.5, "liste": "Lyon en Commun" },
        "repartition": {
          "extreme_gauche": 5.2,
          "gauche": 22.1,
          "ecologiste": 28.5,
          "centre": 16.8,
          "droite": 18.3,
          "extreme_droite": 7.1,
          "divers": 2.0
        }
      }
    },
    "tendance_actuelle": "Écologiste",
    "tendance_moyenne": "Gauche",
    "score_stabilite": 0.72,
    "nb_elections": 3
  }
}
```

---

## 4. Architecture technique proposée

### Stack "zéro budget"

- **Frontend** : React + Tailwind, hébergé sur Vercel (free)
- **Données** : JSON statique pré-calculé (~2-3 Mo gzippé, embarqué)
- **Pipeline** : Script Python exécuté une fois en local/CI

---

*Document généré le 15 février 2026 — Projet side project William / MEWI Studio*
