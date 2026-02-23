#!/usr/bin/env python3
"""
Push BPE equipment data to Supabase via REST API.
Reads the aggregated data from the import script and inserts in batches.
"""

import duckdb
import requests
import os
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(PROJECT_DIR, ".env"))
    SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "")
    SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set")
    sys.exit(1)

REST_URL = f"{SUPABASE_URL}/rest/v1/commune_equipments"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

BATCH_SIZE = 1000


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PROJECT_DIR, "data", "bpe_export.csv")

    if not os.path.exists(csv_path):
        print(f"Error: CSV not found: {csv_path}")
        sys.exit(1)

    print(f"Reading and aggregating {csv_path}...")
    con = duckdb.connect()
    desc = con.execute(
        "SELECT * FROM read_csv_auto(?, sample_size=100) LIMIT 0", [csv_path]
    ).description
    col_names = {c[0].lower() for c in desc}

    if 'depcom' in col_names:
        commune_col, type_col = 'DEPCOM', 'TYPEQU'
    elif 'com_arm_code' in col_names:
        commune_col, type_col = 'com_arm_code', 'equipment_code'
    else:
        print(f"Error: unknown columns: {col_names}")
        sys.exit(1)

    rows = con.execute(f"""
        SELECT "{commune_col}" AS insee, "{type_col}" AS typequ, COUNT(*)::int AS nb
        FROM read_csv_auto(?, sample_size=50000, ignore_errors=true)
        WHERE "{commune_col}" IS NOT NULL AND "{type_col}" IS NOT NULL
        GROUP BY "{commune_col}", "{type_col}"
        ORDER BY "{commune_col}", "{type_col}"
    """, [csv_path]).fetchall()
    con.close()

    print(f"  {len(rows)} rows to insert")

    session = requests.Session()
    session.headers.update(HEADERS)

    inserted = 0
    errors = 0
    t0 = time.time()

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        payload = [{"insee": r[0], "typequ": r[1], "nb": r[2]} for r in batch]

        try:
            resp = session.post(REST_URL, json=payload, timeout=30)
            if resp.status_code in (200, 201):
                inserted += len(batch)
            else:
                errors += len(batch)
                if errors <= 5:
                    print(f"  Error {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            errors += len(batch)
            if errors <= 5:
                print(f"  Request error: {e}")

        if (inserted + errors) % 10000 == 0 or i + BATCH_SIZE >= len(rows):
            elapsed = time.time() - t0
            pct = (i + BATCH_SIZE) * 100 // len(rows)
            rate = inserted / elapsed if elapsed > 0 else 0
            print(f"  {min(pct, 100)}% | {inserted} inserted, {errors} errors | {rate:.0f} rows/s")

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.1f}s")
    print(f"  Inserted: {inserted}")
    print(f"  Errors:   {errors}")


if __name__ == "__main__":
    main()
