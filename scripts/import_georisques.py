#!/usr/bin/env python3
"""
Import risk data from Géorisques API (v1) for all communes.

Fetches /api/v1/gaspar/risques for every commune INSEE code,
extracts parent-level risks (2-digit codes), and generates a
SQL seed file for Supabase.

Usage:
    pip install requests
    python3 scripts/import_georisques.py

Output: supabase/seed_georisques.sql
"""

import requests
import os
import sys
import time
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "supabase", "seed_georisques.sql")
CACHE_PATH = os.path.join(DATA_DIR, "georisques_all.json")
INSEE_CODES_PATH = os.path.join(DATA_DIR, "insee_codes.txt")

GEORISQUES_API = "https://www.georisques.gouv.fr/api/v1/gaspar/risques"

REQUESTS_PER_SECOND = 14
PARENT_RISK_CODES = {
    "11", "12", "13", "14", "15", "16", "17", "18",
    "21", "24", "25", "31",
}


def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def get_all_insee_codes():
    """Read commune INSEE codes from pre-generated file."""
    if not os.path.exists(INSEE_CODES_PATH):
        print(f"  Error: {INSEE_CODES_PATH} not found.")
        print(f"  Generate it by extracting INSEE codes from Supabase.")
        sys.exit(1)

    with open(INSEE_CODES_PATH, "r") as f:
        codes = [line.strip() for line in f if line.strip()]

    print(f"  → {len(codes)} communes from {INSEE_CODES_PATH}")
    return sorted(codes)


def fetch_risks(code_insee):
    """Fetch risks for a single commune."""
    try:
        r = requests.get(
            GEORISQUES_API,
            params={"code_insee": code_insee},
            headers={"User-Agent": "OuAtterir/1.0"},
            timeout=10,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        if data.get("data"):
            return data["data"][0].get("risques_detail", [])
        return []
    except Exception:
        return None


def extract_parent_risks(risques_detail):
    """Keep only parent risk codes (2-digit codes)."""
    results = []
    seen = set()
    for r in risques_detail:
        code = r.get("num_risque", "")
        label = r.get("libelle_risque_long", "")
        if code in PARENT_RISK_CODES and code not in seen:
            seen.add(code)
            results.append((code, label))
    return results


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # Step 1: Load cache or fetch from API
    if os.path.exists(CACHE_PATH):
        print("=== Step 1/3: Loading cached data ===")
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            all_risks = json.load(f)
        print(f"  → {len(all_risks)} communes loaded from cache")
        print(f"  (Delete {CACHE_PATH} to re-fetch from API)")
    else:
        print("=== Step 1/3: Fetching risks from Géorisques API ===")
        insee_codes = get_all_insee_codes()
        delay = 1.0 / REQUESTS_PER_SECOND

        all_risks = {}
        errors = 0
        t0 = time.time()

        for i, code in enumerate(insee_codes):
            risks_raw = fetch_risks(code)

            if risks_raw is None:
                errors += 1
                if errors <= 5:
                    print(f"  Warning: failed to fetch {code}")
            else:
                parent = extract_parent_risks(risks_raw)
                if parent:
                    all_risks[code] = [{"code": c, "label": l} for c, l in parent]

            if (i + 1) % 500 == 0 or i + 1 == len(insee_codes):
                elapsed = time.time() - t0
                rate = (i + 1) / elapsed if elapsed > 0 else 0
                eta = (len(insee_codes) - i - 1) / rate if rate > 0 else 0
                print(f"  {i+1}/{len(insee_codes)} ({errors} errors, {rate:.0f} req/s, ETA {eta/60:.0f}min)")

            time.sleep(delay)

        print(f"\n  Caching results to {CACHE_PATH}...")
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(all_risks, f, ensure_ascii=False)
        print(f"  → {len(all_risks)} communes with risks ({errors} errors)")

    # Step 2: Stats
    print(f"\n=== Step 2/3: Statistics ===")
    total_rows = sum(len(v) for v in all_risks.values())
    print(f"  Communes with at least 1 risk: {len(all_risks)}")
    print(f"  Total (commune, risk) pairs: {total_rows}")

    from collections import Counter
    risk_freq = Counter()
    for risks in all_risks.values():
        for r in risks:
            risk_freq[r["code"]] += 1
    print(f"\n  Risk frequency:")
    for code, count in risk_freq.most_common():
        label = next((r["label"] for risks in all_risks.values() for r in risks if r["code"] == code), code)
        print(f"    {label:30s}: {count:6d} communes")

    # Step 3: Generate SQL
    print(f"\n=== Step 3/3: Generating SQL ===")
    BATCH = 2000

    rows = []
    for code_insee, risks in sorted(all_risks.items()):
        for r in risks:
            rows.append((code_insee, r["code"], r["label"]))

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- Ou Atterir - Géorisques data\n")
        f.write("-- Source: API Géorisques v1 (georisques.gouv.fr)\n")
        f.write("-- Generated by scripts/import_georisques.py\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("DELETE FROM commune_risques;\n\n")

        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            f.write("INSERT INTO commune_risques (code_insee, num_risque, libelle_risque) VALUES\n")
            vals = []
            for code_insee, num_risque, libelle in batch:
                vals.append(f"({escape_sql(code_insee)},{escape_sql(num_risque)},{escape_sql(libelle)})")
            f.write(",\n".join(vals))
            f.write("\nON CONFLICT (code_insee, num_risque) DO UPDATE SET libelle_risque = EXCLUDED.libelle_risque;\n\n")

            if (i + BATCH) % 20000 == 0 or i + BATCH >= len(rows):
                pct = min(100, (i + BATCH) * 100 // len(rows))
                print(f"  Writing... {pct}%")

        f.write("-- Refresh materialized view\n")
        f.write("REFRESH MATERIALIZED VIEW commune_risk_summary;\n\n")
        f.write("COMMIT;\n")

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n{'='*50}")
    print(f"Done!")
    print(f"  Output:     {OUTPUT_PATH}")
    print(f"  File size:  {size_mb:.1f} MB")
    print(f"  Rows:       {len(rows)}")
    print(f"  Communes:   {len(all_risks)}")
    print(f"\nTo import into Supabase:")
    print(f"  1. Apply migration: supabase db push")
    print(f"  2. Then run this seed file:")
    print(f"     psql '<CONNECTION_STRING>' -f supabase/seed_georisques.sql")


if __name__ == "__main__":
    main()
