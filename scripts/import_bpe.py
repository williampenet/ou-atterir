#!/usr/bin/env python3
"""
Import BPE (Base Permanente des Équipements) data from INSEE.

Downloads the BPE ensemble CSV, aggregates equipment counts per commune,
and generates a SQL seed file for Supabase.

Download source:
  https://www.insee.fr/fr/statistiques/3568638
  Choose "Télécharger" → "Ensemble" → CSV

Usage:
    pip install duckdb requests
    python3 scripts/import_bpe.py [path/to/bpe_ensemble.csv]

    If no path is given, the script will attempt to download from INSEE.
"""

import duckdb
import requests
import os
import sys
import time
import zipfile
import io

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "supabase", "seed_commune_equipments.sql")

BPE_ZIP_URL = "https://www.insee.fr/fr/statistiques/fichier/3568638/bpe24_ensemble_csv.zip"
BPE_LOCAL_ZIP = os.path.join(DATA_DIR, "bpe24_ensemble_csv.zip")
BPE_LOCAL_CSV = os.path.join(DATA_DIR, "bpe24_ensemble.csv")


def download_bpe():
    """Download BPE ZIP from INSEE and extract CSV."""
    os.makedirs(DATA_DIR, exist_ok=True)

    if os.path.exists(BPE_LOCAL_CSV):
        size_mb = os.path.getsize(BPE_LOCAL_CSV) / (1024 * 1024)
        print(f"  Cached: {os.path.basename(BPE_LOCAL_CSV)} ({size_mb:.0f} MB)")
        return BPE_LOCAL_CSV

    if not os.path.exists(BPE_LOCAL_ZIP):
        print(f"  Downloading BPE from INSEE...")
        headers = {"User-Agent": "Mozilla/5.0 (compatible; OuAtterir/1.0)"}
        try:
            r = requests.get(BPE_ZIP_URL, stream=True, headers=headers, timeout=120)
            r.raise_for_status()
            total = int(r.headers.get("content-length", 0))
            downloaded = 0
            with open(BPE_LOCAL_ZIP, "wb") as f:
                for chunk in r.iter_content(chunk_size=65536):
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        print(f"\r  {downloaded * 100 // total}% ({downloaded >> 20}/{total >> 20} MB)", end="")
            print()
        except Exception as e:
            if os.path.exists(BPE_LOCAL_ZIP):
                os.remove(BPE_LOCAL_ZIP)
            print(f"\n  Download failed: {e}")
            print(f"\n  Please download the BPE CSV manually from:")
            print(f"    https://www.insee.fr/fr/statistiques/3568638")
            print(f"  Place the CSV in: {BPE_LOCAL_CSV}")
            print(f"  Or run: python3 {sys.argv[0]} /path/to/bpe_ensemble.csv")
            sys.exit(1)

    print(f"  Extracting ZIP...")
    with zipfile.ZipFile(BPE_LOCAL_ZIP, "r") as zf:
        csv_names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not csv_names:
            print("  Error: no CSV found in ZIP")
            sys.exit(1)
        csv_name = csv_names[0]
        print(f"  Found: {csv_name}")
        zf.extract(csv_name, DATA_DIR)
        extracted = os.path.join(DATA_DIR, csv_name)
        if extracted != BPE_LOCAL_CSV:
            os.rename(extracted, BPE_LOCAL_CSV)

    return BPE_LOCAL_CSV


def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else None

    # Step 1: Get the CSV file
    print("=== Step 1/3: Getting BPE CSV ===")
    if csv_path:
        if not os.path.exists(csv_path):
            print(f"  Error: file not found: {csv_path}")
            sys.exit(1)
        print(f"  Using: {csv_path}")
    else:
        csv_path = download_bpe()

    # Step 2: Aggregate with DuckDB
    print("\n=== Step 2/3: Aggregating equipment data ===")
    con = duckdb.connect()

    t0 = time.time()
    print("  Reading CSV and aggregating...")
    desc = con.execute(
        "SELECT * FROM read_csv_auto(?, sample_size=100) LIMIT 0",
        [csv_path],
    ).description
    col_names = {c[0].lower() for c in desc}

    if 'depcom' in col_names:
        commune_col, type_col = 'DEPCOM', 'TYPEQU'
    elif 'com_arm_code' in col_names:
        commune_col, type_col = 'com_arm_code', 'equipment_code'
    else:
        print(f"  Error: could not find commune/type columns. Found: {col_names}")
        sys.exit(1)

    rows = con.execute(f"""
        SELECT
            "{commune_col}" AS insee,
            "{type_col}" AS typequ,
            COUNT(*) AS nb
        FROM read_csv_auto(?, sample_size=50000, ignore_errors=true)
        WHERE "{commune_col}" IS NOT NULL AND "{type_col}" IS NOT NULL
        GROUP BY "{commune_col}", "{type_col}"
        ORDER BY "{commune_col}", "{type_col}"
    """, [csv_path]).fetchall()
    elapsed = time.time() - t0
    print(f"  → {len(rows)} (commune, type) pairs ({elapsed:.1f}s)")

    unique_communes = len(set(r[0] for r in rows))
    unique_types = len(set(r[1] for r in rows))
    print(f"  → {unique_communes} communes, {unique_types} equipment types")

    con.close()

    # Step 3: Generate SQL
    print(f"\n=== Step 3/3: Generating SQL ===")
    BATCH = 2000

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- Ou Atterir - BPE equipment data\n")
        f.write("-- Source: INSEE BPE 2024\n")
        f.write("-- Generated by scripts/import_bpe.py\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("DELETE FROM commune_equipments;\n\n")

        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            f.write("INSERT INTO commune_equipments (insee, typequ, nb) VALUES\n")
            vals = []
            for insee, typequ, nb in batch:
                vals.append(f"({escape_sql(insee)},{escape_sql(typequ)},{nb})")
            f.write(",\n".join(vals))
            f.write("\nON CONFLICT (insee, typequ) DO UPDATE SET nb = EXCLUDED.nb;\n\n")

            if (i + BATCH) % 50000 == 0 or i + BATCH >= len(rows):
                pct = min(100, (i + BATCH) * 100 // len(rows))
                print(f"  Writing... {pct}%")

        f.write("COMMIT;\n")

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n{'='*50}")
    print(f"Done!")
    print(f"  Output:     {OUTPUT_PATH}")
    print(f"  File size:  {size_mb:.1f} MB")
    print(f"  Rows:       {len(rows)}")
    print(f"  Communes:   {unique_communes}")
    print(f"  Eq. types:  {unique_types}")
    print(f"\nTo import into Supabase:")
    print(f"  1. First run migration_v6_equipments.sql (creates tables)")
    print(f"  2. Then run this seed file:")
    print(f"     psql '<CONNECTION_STRING>' -f supabase/seed_commune_equipments.sql")


if __name__ == "__main__":
    main()
