#!/usr/bin/env python3
"""
Import climate projection data from Météo-France Climadiag Commune.

Downloads the static entities.jsonl file containing climate indicators
for all French communes, extracts the retained indicators (S1, S2, S3,
S4, R2, R4, R5, G4 + ICU), and generates a SQL seed file.

Source: Météo-France Climadiag Commune
  https://climadiag-commune.meteofrance.com/
  Methodology: TRACC projections (2030/2050/2100), ref period 1976-2005

Usage:
    pip install requests
    python3 scripts/import_climadiag.py

Output: supabase/seed_climadiag.sql
"""

import json
import os
import sys

import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data", "climadiag")
JSONL_PATH = os.path.join(DATA_DIR, "entities.jsonl")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "supabase", "seed_climadiag.sql")

ENTITIES_URL = "https://climadiag-commune.meteofrance.com/entities.jsonl"

ANNUAL_INDICATORS = ["S1", "S2", "S3", "S4", "R2", "R4"]
SEASONAL_INDICATORS = {"R5": "été", "G4": "été"}

HORIZONS = [0, 1, 2]  # index 0=2030, 1=2050, 2=2100

COLUMNS = [
    "code_insee", "icu",
    "s3_ref", "s3_2030", "s3_2050", "s3_2100",
    "s1_ref", "s1_2030", "s1_2050", "s1_2100",
    "s2_ref", "s2_2030", "s2_2050", "s2_2100",
    "s4_ref", "s4_2030", "s4_2050", "s4_2100",
    "r2_ref", "r2_2030", "r2_2050", "r2_2100",
    "r4_ref", "r4_2030", "r4_2050", "r4_2100",
    "r5_ete_ref", "r5_ete_2030", "r5_ete_2050", "r5_ete_2100",
    "g4_ete_ref", "g4_ete_2030", "g4_ete_2050", "g4_ete_2100",
]


def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def fmt(v):
    if v is None:
        return "NULL"
    return str(round(v, 2))


def download_jsonl():
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(JSONL_PATH):
        size_mb = os.path.getsize(JSONL_PATH) / (1024 * 1024)
        print(f"  [cached] {JSONL_PATH} ({size_mb:.1f} MB)")
        return
    print(f"  Downloading {ENTITIES_URL}...")
    r = requests.get(ENTITIES_URL, timeout=300, stream=True)
    r.raise_for_status()
    with open(JSONL_PATH, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            f.write(chunk)
    size_mb = os.path.getsize(JSONL_PATH) / (1024 * 1024)
    print(f"  → {size_mb:.1f} MB downloaded")


def extract_annual(indicators, ind_id):
    for ind in indicators:
        if ind["id"] != ind_id:
            continue
        data = ind.get("data", [])
        if not data:
            return None, None, None, None
        first_horizon = data[0]
        annual = next((d for d in first_horizon if d.get("type_ind") == "annuel"), None)
        ref = annual["ref"] if annual else None

        means = []
        for h_idx in HORIZONS:
            if h_idx < len(data):
                h_data = data[h_idx]
                entry = next((d for d in h_data if d.get("type_ind") == "annuel"), None)
                means.append(entry["mean"] if entry else None)
            else:
                means.append(None)
        return ref, means[0], means[1], means[2]
    return None, None, None, None


def extract_seasonal(indicators, ind_id, season_label):
    for ind in indicators:
        if ind["id"] != ind_id:
            continue
        data = ind.get("data", [])
        if not data:
            return None, None, None, None
        first_horizon = data[0]
        seasonal = next(
            (d for d in first_horizon if d.get("type_ind") == "saisonnier" and d.get("label") == season_label),
            None,
        )
        ref = seasonal["ref"] if seasonal else None

        means = []
        for h_idx in HORIZONS:
            if h_idx < len(data):
                h_data = data[h_idx]
                entry = next(
                    (d for d in h_data if d.get("type_ind") == "saisonnier" and d.get("label") == season_label),
                    None,
                )
                means.append(entry["mean"] if entry else None)
            else:
                means.append(None)
        return ref, means[0], means[1], means[2]
    return None, None, None, None


def parse_communes():
    print(f"\n=== Parsing communes ===")
    rows = []
    skipped = 0

    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                commune = json.loads(line)
            except json.JSONDecodeError:
                skipped += 1
                continue

            if commune.get("type") != "commune":
                continue

            code_insee = commune.get("identifiant_insee")
            if not code_insee:
                skipped += 1
                continue

            icu = commune.get("icu")
            indicators = commune.get("indicateurs", [])

            s3 = extract_annual(indicators, "S3")
            s1 = extract_annual(indicators, "S1")
            s2 = extract_annual(indicators, "S2")
            s4 = extract_annual(indicators, "S4")
            r2 = extract_annual(indicators, "R2")
            r4 = extract_annual(indicators, "R4")
            r5 = extract_seasonal(indicators, "R5", "été")
            g4 = extract_seasonal(indicators, "G4", "été")

            rows.append((
                code_insee, icu,
                *s3, *s1, *s2, *s4, *r2, *r4, *r5, *g4,
            ))

            if line_num % 10000 == 0:
                print(f"  Parsed {line_num:,} lines...")

    print(f"  Total communes: {len(rows):,}")
    print(f"  Skipped: {skipped}")

    has_s3 = sum(1 for r in rows if r[2] is not None)
    has_icu = sum(1 for r in rows if r[1] is not None)
    print(f"  With S3 data: {has_s3:,}")
    print(f"  With ICU data: {has_icu:,}")

    return rows


def generate_sql(rows):
    print(f"\n=== Generating SQL ===")
    BATCH = 2000

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- Ou Atterir – Climadiag climate projections\n")
        f.write("-- Source: Météo-France Climadiag Commune\n")
        f.write("-- Generated by scripts/import_climadiag.py\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("DELETE FROM commune_climat;\n\n")

        col_list = ", ".join(COLUMNS)

        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            f.write(f"INSERT INTO commune_climat ({col_list}) VALUES\n")
            vals = []
            for row in batch:
                code_insee = row[0]
                icu = row[1]
                parts = [escape_sql(code_insee)]
                parts.append(str(icu) if icu is not None else "NULL")
                for v in row[2:]:
                    parts.append(fmt(v))
                vals.append(f"({','.join(parts)})")
            f.write(",\n".join(vals))
            f.write(
                f"\nON CONFLICT (code_insee) DO UPDATE SET\n"
                + ",\n".join(f"  {c} = EXCLUDED.{c}" for c in COLUMNS[1:])
                + ";\n\n"
            )

            pct = min(100, (i + BATCH) * 100 // len(rows))
            if pct % 25 == 0 or i + BATCH >= len(rows):
                print(f"  Writing... {pct}%")

        f.write("REFRESH MATERIALIZED VIEW CONCURRENTLY commune_climat_summary;\n\n")
        f.write("COMMIT;\n")

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n{'='*50}")
    print(f"Done!")
    print(f"  Output:     {OUTPUT_PATH}")
    print(f"  File size:  {size_mb:.1f} MB")
    print(f"  Communes:   {len(rows):,}")
    print(f"\nTo import into Supabase:")
    print(f"  1. Apply migration: supabase db push")
    print(f"  2. Then run this seed file:")
    print(f"     psql '<CONNECTION_STRING>' -f supabase/seed_climadiag.sql")


def main():
    print("=== Step 1/3: Download Climadiag JSONL ===")
    download_jsonl()

    print("\n=== Step 2/3: Parse indicators ===")
    rows = parse_communes()

    print("\n=== Step 3/3: Generate SQL ===")
    generate_sql(rows)


if __name__ == "__main__":
    main()
