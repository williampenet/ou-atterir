#!/usr/bin/env python3
"""
Pipeline de données — Tendances Municipales
=============================================
Télécharge les données électorales, les enrichit avec les données géographiques,
calcule les tendances politiques par commune, et génère le JSON statique final.

Usage:
    python build_data.py

Le script génère data/output/communes_tendances.json
"""

import json
import os
import sys
from pathlib import Path

import pandas as pd
import requests

# --- Configuration -----------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent
RAW_DIR = DATA_DIR / "raw"
OUTPUT_DIR = DATA_DIR / "output"

# URLs des fichiers à télécharger (data.gouv.fr)
URLS = {
    # Résultats par candidats (Parquet) — dataset élections agrégées
    "candidats": "https://www.data.gouv.fr/fr/datasets/r/4d3b35f6-0b22-4415-a24c-419a676312e2",
    # Résultats généraux (Parquet) — même dataset
    "general": "https://www.data.gouv.fr/fr/datasets/r/ff16d511-10c0-405e-9b35-511723948fce",
    # Base officielle des codes postaux (CSV)
    "codes_postaux": "https://www.data.gouv.fr/fr/datasets/r/008a2dda-2c60-4b63-b910-998f6f818089",
}

# Fichier local des communes avec GPS (ville.xls)
VILLE_XLS = DATA_DIR / "raw" / "ville.xls"

# Élections municipales à extraire
MUNICIPAL_ELECTIONS = [
    "2008_muni_t1", "2008_muni_t2",
    "2014_muni_t1", "2014_muni_t2",
    "2020_muni_t1", "2020_muni_t2",
]

# Familles politiques (identifiants internes)
FAMILLES = [
    "extreme_gauche",
    "gauche",
    "ecologiste",
    "centre",
    "droite",
    "extreme_droite",
    "divers",
]

FAMILLE_LABELS = {
    "extreme_gauche": "Extrême gauche",
    "gauche": "Gauche",
    "ecologiste": "Écologiste",
    "centre": "Centre",
    "droite": "Droite",
    "extreme_droite": "Extrême droite",
    "divers": "Divers",
}

FAMILLE_COLORS = {
    "extreme_gauche": "#8B0000",
    "gauche": "#E4003B",
    "ecologiste": "#00A550",
    "centre": "#FF9900",
    "droite": "#0066CC",
    "extreme_droite": "#0D0D54",
    "divers": "#999999",
}


# --- Helpers -----------------------------------------------------------------

def download_file(url: str, dest: Path, label: str) -> Path:
    """Télécharge un fichier si non présent en cache local."""
    if dest.exists():
        print(f"  [cache] {label} → {dest.name}")
        return dest

    print(f"  [download] {label} …")
    resp = requests.get(url, stream=True, timeout=120)
    resp.raise_for_status()
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1 << 20):
            f.write(chunk)
    size_mb = dest.stat().st_size / (1 << 20)
    print(f"           → {dest.name} ({size_mb:.1f} Mo)")
    return dest


def load_nuances_mapping() -> dict[str, dict]:
    """Charge le mapping nuance → famille depuis nuances.csv."""
    csv_path = DATA_DIR / "nuances.csv"
    df = pd.read_csv(csv_path)
    mapping = {}
    for _, row in df.iterrows():
        famille_key = (
            row["famille"]
            .lower()
            .replace("é", "e")
            .replace("ê", "e")
            .replace(" ", "_")
        )
        mapping[row["code_nuance"]] = {
            "famille": famille_key,
            "famille_label": row["famille"],
            "couleur": row["couleur_hex"],
        }
    return mapping


def build_code_insee(row) -> str:
    """Construit le code INSEE 5 caractères à partir de département + commune."""
    dep = str(row["Code du département"]).strip()
    com = str(row["Code de la commune"]).strip().zfill(3)
    return dep + com


# --- Étape 1 : Téléchargement -----------------------------------------------

def step_download() -> dict[str, Path]:
    print("\n=== Étape 1 : Téléchargement des données ===")
    files = {}
    files["candidats"] = download_file(
        URLS["candidats"], RAW_DIR / "candidats-results.parquet", "Candidats (élections)"
    )
    files["general"] = download_file(
        URLS["general"], RAW_DIR / "general-results.parquet", "Résultats généraux"
    )
    files["codes_postaux"] = download_file(
        URLS["codes_postaux"], RAW_DIR / "codes_postaux.csv", "Codes postaux"
    )

    # Vérifier que ville.xls est présent localement
    if not VILLE_XLS.exists():
        print(f"\n  ⚠️  Fichier manquant : {VILLE_XLS}")
        print(f"  Copiez ville.xls dans {RAW_DIR}/")
        sys.exit(1)
    else:
        print(f"  [local] ville.xls → {VILLE_XLS.name}")

    return files


# --- Étape 2 : Chargement et filtrage ----------------------------------------

def step_load_and_filter(files: dict[str, Path]) -> tuple[pd.DataFrame, pd.DataFrame]:
    print("\n=== Étape 2 : Chargement et filtrage municipales ===")

    # Candidats
    print("  Lecture candidats-results.parquet …")
    df_cand = pd.read_parquet(files["candidats"])
    print(f"  → {len(df_cand):,} lignes totales")

    df_cand = df_cand[df_cand["id_election"].isin(MUNICIPAL_ELECTIONS)].copy()
    print(f"  → {len(df_cand):,} lignes municipales")

    # General results
    print("  Lecture general-results.parquet …")
    df_gen = pd.read_parquet(files["general"])
    df_gen = df_gen[df_gen["id_election"].isin(MUNICIPAL_ELECTIONS)].copy()
    print(f"  → {len(df_gen):,} lignes municipales")

    return df_cand, df_gen


# --- Étape 3 : Agrégation par commune et élection ----------------------------

def step_aggregate(df_cand: pd.DataFrame, nuances: dict) -> pd.DataFrame:
    print("\n=== Étape 3 : Agrégation par commune ===")

    # Construire le code INSEE
    df_cand["code_insee"] = df_cand.apply(build_code_insee, axis=1)

    # Mapper les nuances vers les familles
    df_cand["famille"] = df_cand["Nuance"].map(lambda n: nuances.get(n, {}).get("famille", "divers"))

    # Pour chaque (code_insee, id_election), on prend seulement le T2 si disponible, sinon T1
    # Logique : s'il y a un T2, c'est le résultat final
    df_cand["annee"] = df_cand["id_election"].str[:4]
    df_cand["tour"] = df_cand["id_election"].str[-2:]  # t1 ou t2

    # Identifier les communes qui ont un T2
    communes_with_t2 = (
        df_cand[df_cand["tour"] == "t2"]
        .groupby(["code_insee", "annee"])
        .size()
        .reset_index()
        .rename(columns={0: "count"})
    )
    communes_with_t2["has_t2"] = True
    communes_with_t2 = communes_with_t2[["code_insee", "annee", "has_t2"]]

    df_cand = df_cand.merge(communes_with_t2, on=["code_insee", "annee"], how="left")
    df_cand["has_t2"] = df_cand["has_t2"].fillna(False)

    # Garder T2 si dispo, sinon T1
    df_filtered = df_cand[
        ((df_cand["has_t2"]) & (df_cand["tour"] == "t2")) |
        (~df_cand["has_t2"])
    ].copy()

    print(f"  → {len(df_filtered):,} lignes après sélection T1/T2")

    # Agrégation : sommer les voix par (code_insee, annee, famille)
    agg = (
        df_filtered
        .groupby(["code_insee", "annee", "famille"])
        .agg(voix=("Voix", "sum"))
        .reset_index()
    )

    # Calcul du total des voix par (code_insee, annee) pour les pourcentages
    totaux = agg.groupby(["code_insee", "annee"])["voix"].sum().reset_index()
    totaux = totaux.rename(columns={"voix": "total_voix"})

    agg = agg.merge(totaux, on=["code_insee", "annee"])
    agg["pct"] = (agg["voix"] / agg["total_voix"] * 100).round(1)

    # Aussi récupérer le gagnant (liste/candidat avec le plus de voix par commune/année)
    idx_gagnants = (
        df_filtered
        .groupby(["code_insee", "annee"])["Voix"]
        .idxmax()
    )
    gagnants = df_filtered.loc[idx_gagnants, [
        "code_insee", "annee", "Nuance", "famille",
        "Libellé Abrégé Liste", "Libellé Etendu Liste",
        "Nom Tête de Liste", "Nom", "Prénom", "% Voix/Exp"
    ]].copy()
    gagnants = gagnants.rename(columns={
        "Nuance": "nuance_gagnant",
        "famille": "famille_gagnant",
        "Libellé Abrégé Liste": "liste_abregee",
        "Libellé Etendu Liste": "liste_etendue",
        "Nom Tête de Liste": "tete_de_liste",
        "% Voix/Exp": "pct_gagnant",
    })

    print(f"  → {len(agg['code_insee'].unique()):,} communes identifiées")

    return agg, gagnants


# --- Étape 4 : Enrichissement géographique -----------------------------------

def step_enrich_geo() -> pd.DataFrame:
    print("\n=== Étape 4 : Enrichissement géographique ===")

    # Lecture de ville.xls (fichier local)
    print("  Lecture ville.xls …")
    df_ville = pd.read_excel(VILLE_XLS)

    # Nettoyer les noms de colonnes (espaces en trop)
    df_ville.columns = df_ville.columns.str.strip()

    print(f"  → {len(df_ville):,} villes chargées")
    print(f"  Colonnes : {df_ville.columns.tolist()}")

    # Renommer les colonnes
    df_geo = df_ville.rename(columns={
        "Code INSEE": "code_insee",
        "Nom Ville": "nom_commune",
        "Code Postal": "code_postal",
        "Latitude": "lat",
        "Longitude": "lng",
    })

    # Nettoyer les valeurs
    df_geo["code_insee"] = df_geo["code_insee"].astype(str).str.strip()
    df_geo["code_postal"] = df_geo["code_postal"].astype(str).str.strip().str.zfill(5)
    df_geo["nom_commune"] = df_geo["nom_commune"].astype(str).str.strip()
    df_geo["lat"] = pd.to_numeric(df_geo["lat"], errors="coerce")
    df_geo["lng"] = pd.to_numeric(df_geo["lng"], errors="coerce")

    # Garder uniquement les colonnes utiles, dédupliquer par code_insee
    df_geo = df_geo[["code_insee", "nom_commune", "code_postal", "lat", "lng"]]
    df_geo = df_geo.drop_duplicates(subset=["code_insee"])

    print(f"  → {len(df_geo):,} communes géoréférencées")

    return df_geo


# --- Étape 5 : Noms de communes depuis general-results -----------------------

def step_commune_names(df_gen: pd.DataFrame) -> pd.DataFrame:
    """Extrait les noms de communes depuis general-results."""
    print("\n=== Étape 5 : Noms de communes ===")

    # Le general-results contient code_commune et libelle_commune
    cols = df_gen.columns.tolist()
    print(f"  General results — colonnes : {cols}")

    col_code = None
    col_nom = None
    for c in cols:
        cl = c.lower().strip()
        if cl in ("code_commune", "code commune"):
            col_code = c
        if cl in ("libelle_commune", "libellé_commune", "libelle commune"):
            col_nom = c

    if col_code and col_nom:
        df_names = df_gen[[col_code, col_nom]].drop_duplicates(subset=[col_code])
        df_names = df_names.rename(columns={col_code: "code_insee", col_nom: "nom_commune_gen"})
        print(f"  → {len(df_names):,} noms de communes")
        return df_names
    else:
        print(f"  ⚠️  Colonnes nom/code non trouvées dans general-results")
        return pd.DataFrame(columns=["code_insee", "nom_commune_gen"])


# --- Étape 6 : Construction du JSON final ------------------------------------

def step_build_json(
    agg: pd.DataFrame,
    gagnants: pd.DataFrame,
    df_geo: pd.DataFrame,
    df_names: pd.DataFrame,
) -> dict:
    print("\n=== Étape 6 : Construction du JSON final ===")

    # Index geo par code_insee
    geo_index = df_geo.set_index("code_insee").to_dict("index")
    names_index = df_names.set_index("code_insee")["nom_commune_gen"].to_dict() if "nom_commune_gen" in df_names.columns else {}

    # Toutes les communes
    all_communes = set(agg["code_insee"].unique())
    print(f"  → {len(all_communes):,} communes à traiter")

    result = {}

    for code_insee in sorted(all_communes):
        commune_agg = agg[agg["code_insee"] == code_insee]
        commune_gagnants = gagnants[gagnants["code_insee"] == code_insee]
        annees = sorted(commune_agg["annee"].unique())

        # Geo
        geo = geo_index.get(code_insee, {})
        nom = geo.get("nom_commune", names_index.get(code_insee, ""))
        if not nom:
            nom = names_index.get(code_insee, "")

        entry = {
            "nom": nom,
            "code_postal": geo.get("code_postal", ""),
            "departement": code_insee[:2] if not code_insee.startswith("97") else code_insee[:3],
            "lat": geo.get("lat"),
            "lng": geo.get("lng"),
            "population": geo.get("population", 0),
            "elections": {},
        }

        tendance_history = []

        for annee in annees:
            year_data = commune_agg[commune_agg["annee"] == annee]

            # Répartition par famille
            repartition = {}
            for _, row in year_data.iterrows():
                repartition[row["famille"]] = row["pct"]

            # Gagnant
            year_gagnant = commune_gagnants[commune_gagnants["annee"] == annee]
            gagnant_info = {}
            if len(year_gagnant) > 0:
                g = year_gagnant.iloc[0]
                gagnant_info = {
                    "nuance": g.get("nuance_gagnant", ""),
                    "famille": FAMILLE_LABELS.get(g.get("famille_gagnant", "divers"), "Divers"),
                    "pct_exprimes": round(float(g.get("pct_gagnant", 0)), 1) if pd.notna(g.get("pct_gagnant")) else 0,
                    "liste": g.get("liste_etendue", "") or g.get("liste_abregee", ""),
                    "tete_de_liste": g.get("tete_de_liste", "") or f"{g.get('Prénom', '')} {g.get('Nom', '')}".strip(),
                }
                tendance_history.append(g.get("famille_gagnant", "divers"))

            election_key = f"{annee}_muni"
            entry["elections"][election_key] = {
                "gagnant": gagnant_info,
                "repartition": repartition,
            }

        # Tendance actuelle = dernière élection
        if tendance_history:
            entry["tendance_actuelle"] = FAMILLE_LABELS.get(tendance_history[-1], "Divers")
        else:
            entry["tendance_actuelle"] = "Données insuffisantes"

        # Tendance moyenne = famille la plus fréquente
        if tendance_history:
            from collections import Counter
            most_common = Counter(tendance_history).most_common(1)[0][0]
            entry["tendance_moyenne"] = FAMILLE_LABELS.get(most_common, "Divers")
        else:
            entry["tendance_moyenne"] = "Données insuffisantes"

        # Score de stabilité
        if len(tendance_history) >= 2:
            from collections import Counter
            most_common_count = Counter(tendance_history).most_common(1)[0][1]
            entry["score_stabilite"] = round(most_common_count / len(tendance_history), 2)
        else:
            entry["score_stabilite"] = None

        entry["nb_elections"] = len(annees)

        result[code_insee] = entry

    return result


# --- Main --------------------------------------------------------------------

def main():
    print("🗳️  Pipeline Tendances Municipales")
    print("=" * 50)

    # Chargement du mapping des nuances
    nuances = load_nuances_mapping()
    print(f"\n✓ {len(nuances)} nuances politiques chargées")

    # Étape 1 : Téléchargement
    files = step_download()

    # Étape 2 : Chargement et filtrage
    df_cand, df_gen = step_load_and_filter(files)

    # Étape 3 : Agrégation
    agg, gagnants = step_aggregate(df_cand, nuances)

    # Étape 4 : Enrichissement géographique
    df_geo = step_enrich_geo()

    # Étape 5 : Noms de communes
    df_names = step_commune_names(df_gen)

    # Étape 6 : Construction du JSON
    result = step_build_json(agg, gagnants, df_geo, df_names)

    # Écriture du fichier JSON
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "communes_tendances.json"

    print(f"\n=== Écriture du JSON ===")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=None, separators=(",", ":"))

    size_mb = output_path.stat().st_size / (1 << 20)
    print(f"  → {output_path} ({size_mb:.1f} Mo)")
    print(f"  → {len(result):,} communes")

    # Aussi générer un fichier d'index léger pour la recherche
    index_path = OUTPUT_DIR / "communes_index.json"
    index_data = []
    for code_insee, data in sorted(result.items()):
        index_data.append({
            "c": code_insee,
            "n": data["nom"],
            "cp": data["code_postal"],
            "d": data["departement"],
        })

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=None, separators=(",", ":"))

    index_size = index_path.stat().st_size / (1 << 20)
    print(f"  → {index_path} ({index_size:.1f} Mo)")

    # Générer le fichier des métadonnées de familles
    meta_path = OUTPUT_DIR / "familles_meta.json"
    meta = {}
    for key in FAMILLES:
        meta[key] = {
            "label": FAMILLE_LABELS[key],
            "color": FAMILLE_COLORS[key],
        }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"  → {meta_path}")
    print(f"\n✅ Pipeline terminé avec succès !")


if __name__ == "__main__":
    main()
