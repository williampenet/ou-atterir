#!/usr/bin/env python3
"""
Import DVF (Demandes de Valeurs Foncières) statistics per commune.

Downloads raw DVF CSV files from data.gouv.fr, computes yearly
median price per m² for maisons and appartements per commune,
and generates a SQL seed file for Supabase.

Usage:
    pip install pandas requests
    python3 scripts/import_dvf.py

Output: supabase/seed_dvf.sql
"""

import gzip
import os
import sys
import time

import pandas as pd
import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data", "dvf")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "supabase", "seed_dvf.sql")
INSEE_CODES_PATH = os.path.join(PROJECT_DIR, "data", "insee_codes.txt")

DVF_BASE_URL = "https://files.data.gouv.fr/geo-dvf/latest/csv"
YEARS = list(range(2019, 2025))

USECOLS = [
    "code_commune",
    "nature_mutation",
    "type_local",
    "valeur_fonciere",
    "surface_reelle_bati",
]

MAX_PRIX_M2 = 100_000


def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def get_known_insee_codes():
    """Load the set of INSEE codes already in the database."""
    if not os.path.exists(INSEE_CODES_PATH):
        return None
    with open(INSEE_CODES_PATH, "r") as f:
        return set(line.strip() for line in f if line.strip())


def download_year(year):
    """Download DVF CSV for a given year, return local path."""
    os.makedirs(DATA_DIR, exist_ok=True)
    local_gz = os.path.join(DATA_DIR, f"full_{year}.csv.gz")
    local_csv = os.path.join(DATA_DIR, f"full_{year}.csv")

    if os.path.exists(local_csv):
        print(f"  [cached] {local_csv}")
        return local_csv

    url = f"{DVF_BASE_URL}/{year}/full.csv.gz"
    print(f"  Downloading {url} ...")
    t0 = time.time()
    r = requests.get(url, stream=True, timeout=300)
    r.raise_for_status()
    with open(local_gz, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            f.write(chunk)
    elapsed = time.time() - t0
    size_mb = os.path.getsize(local_gz) / (1024 * 1024)
    print(f"  Downloaded {size_mb:.1f} MB in {elapsed:.0f}s")

    print(f"  Decompressing ...")
    with gzip.open(local_gz, "rb") as gz_in:
        with open(local_csv, "wb") as csv_out:
            while True:
                block = gz_in.read(1024 * 1024)
                if not block:
                    break
                csv_out.write(block)
    os.remove(local_gz)
    return local_csv


def process_year(csv_path, year, known_insee):
    """Process a single year CSV, return aggregated stats DataFrame."""
    print(f"  Reading CSV ...")
    df = pd.read_csv(
        csv_path,
        usecols=USECOLS,
        dtype={"code_commune": str},
        low_memory=False,
    )
    print(f"  {len(df):,} rows total")

    df = df[df["nature_mutation"].isin(["Vente", "Vente en l'état futur d'achèvement"])]
    df = df[df["type_local"].isin(["Maison", "Appartement"])]
    df = df.dropna(subset=["valeur_fonciere", "surface_reelle_bati"])
    df = df[df["surface_reelle_bati"] > 0]

    df["prix_m2"] = df["valeur_fonciere"] / df["surface_reelle_bati"]
    df = df[(df["prix_m2"] > 0) & (df["prix_m2"] < MAX_PRIX_M2)]

    if known_insee is not None:
        df = df[df["code_commune"].isin(known_insee)]

    df["type_local"] = df["type_local"].str.lower()

    stats = (
        df.groupby(["code_commune", "type_local"])["prix_m2"]
        .agg(["median", "count"])
        .reset_index()
    )
    stats.columns = ["code_insee", "type_local", "prix_m2_median", "nb_mutations"]
    stats["year"] = year
    stats["prix_m2_median"] = stats["prix_m2_median"].round(0)

    print(f"  {len(stats):,} (commune, type) pairs after aggregation")
    return stats


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    known_insee = get_known_insee_codes()
    if known_insee:
        print(f"Filtering to {len(known_insee):,} known communes")

    all_stats = []

    for year in YEARS:
        print(f"\n=== {year} ===")
        try:
            csv_path = download_year(year)
            stats = process_year(csv_path, year, known_insee)
            all_stats.append(stats)
        except Exception as e:
            print(f"  ERROR for {year}: {e}")
            continue

    if not all_stats:
        print("No data collected. Exiting.")
        sys.exit(1)

    combined = pd.concat(all_stats, ignore_index=True)
    print(f"\n=== Statistics ===")
    print(f"  Total rows: {len(combined):,}")
    print(f"  Communes: {combined['code_insee'].nunique():,}")
    print(f"  Years: {sorted(combined['year'].unique())}")
    print(f"\n  By type:")
    for t in ["maison", "appartement"]:
        sub = combined[combined["type_local"] == t]
        print(f"    {t}: {len(sub):,} rows, median prix_m2 = {sub['prix_m2_median'].median():.0f} €/m²")

    # Generate SQL
    print(f"\n=== Generating SQL ===")
    BATCH = 2000

    rows = []
    for _, r in combined.iterrows():
        rows.append((
            r["code_insee"],
            int(r["year"]),
            r["type_local"],
            int(r["nb_mutations"]),
            round(r["prix_m2_median"]),
        ))

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- Ou Atterir - DVF real estate price data\n")
        f.write("-- Source: DVF Etalab (files.data.gouv.fr)\n")
        f.write("-- Generated by scripts/import_dvf.py\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("DELETE FROM commune_dvf_stats;\n\n")

        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            f.write("INSERT INTO commune_dvf_stats (code_insee, year, type_local, nb_mutations, prix_m2_median) VALUES\n")
            vals = []
            for code_insee, year, type_local, nb, prix in batch:
                vals.append(
                    f"({escape_sql(code_insee)},{year},{escape_sql(type_local)},{nb},{prix})"
                )
            f.write(",\n".join(vals))
            f.write("\nON CONFLICT (code_insee, year, type_local) DO UPDATE SET\n")
            f.write("  nb_mutations = EXCLUDED.nb_mutations,\n")
            f.write("  prix_m2_median = EXCLUDED.prix_m2_median;\n\n")

            if (i + BATCH) % 20000 == 0 or i + BATCH >= len(rows):
                pct = min(100, (i + BATCH) * 100 // len(rows))
                print(f"  Writing... {pct}%")

        f.write("-- Refresh materialized view\n")
        f.write("REFRESH MATERIALIZED VIEW commune_market_tension;\n\n")
        f.write("COMMIT;\n")

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n{'='*50}")
    print(f"Done!")
    print(f"  Output:     {OUTPUT_PATH}")
    print(f"  File size:  {size_mb:.1f} MB")
    print(f"  Rows:       {len(rows)}")
    print(f"  Communes:   {combined['code_insee'].nunique()}")
    print(f"\nTo import into Supabase:")
    print(f"  1. Apply migration: supabase db push")
    print(f"  2. Then run this seed file:")
    print(f"     psql '<CONNECTION_STRING>' -f supabase/seed_dvf.sql")


if __name__ == "__main__":
    main()
