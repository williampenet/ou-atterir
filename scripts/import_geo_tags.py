#!/usr/bin/env python3
"""
Classify communes with geographical tags (littoral, montagne, campagne)
and generate batched SQL updates for the geo_tags column.

Data sources:
  - Littoral: liste officielle des communes littorales (loi Littoral 1986, DGALN/SIDAUH)
    XLSX from data.gouv.fr, sheet "Perimetre", column "INSEE_COM"
  - Montagne: liste officielle des communes de montagne (loi Montagne 1985, DGALN/SIDAUH)
    XLSX from data.gouv.fr, sheet "Perimetre", column "INSEE_COM"
  - Campagne: calculated from population density via API Geo
    Threshold: < 40 hab/km² (INSEE "communes très peu denses")

Prerequisites:
  pip install openpyxl

Usage:
  1. Run: python scripts/import_geo_tags.py
     (XLSX files are auto-downloaded to scripts/data/)
  2. Apply migration: supabase/migrations/20250302000000_geo_tags.sql
  3. Apply seed: supabase/seed_geo_tags.sql

Output: supabase/seed_geo_tags.sql
"""

import json
import os
import ssl
import sys
import urllib.request

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl is required. Run: pip install openpyxl")
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
OUTPUT_SQL = os.path.join(PROJECT_DIR, "supabase", "seed_geo_tags.sql")
BATCH_SIZE = 500

CAMPAGNE_DENSITY_THRESHOLD = 40  # hab/km²

LITTORAL_URL = "https://static.data.gouv.fr/resources/communes-de-la-loi-littoral-au-code-officiel-geographique-cog-2022/20220323-102432/dgaln-icapp-sidauh-opendata-loi-littoral-1986-cog-2022.xlsx"
MONTAGNE_URL = "https://static.data.gouv.fr/resources/communes-de-la-loi-montagne-au-code-officiel-geographique-cog-2020-2022/20220323-152301/dgaln-icapp-sidauh-opendata-loi-montagne-1985-cog-2022.xlsx"
API_GEO_URL = "https://geo.api.gouv.fr/communes?fields=code,nom,population,surface&format=json"


def download_file(url, local_path):
    """Download a file if not already present locally."""
    if os.path.exists(local_path):
        print(f"  Using cached: {os.path.basename(local_path)}")
        return True
    try:
        print(f"  Downloading {os.path.basename(local_path)}...")
        ctx = ssl.create_default_context()
        req = urllib.request.Request(url, headers={"User-Agent": "OuAtterir/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(resp.read())
        print(f"  OK ({os.path.getsize(local_path)} bytes)")
        return True
    except Exception as e:
        print(f"  Download failed: {e}")
        return False


def extract_insee_from_xlsx(path, sheet_name="Perimetre", col_name="INSEE_COM"):
    """Extract INSEE codes from an XLSX file's Perimetre sheet."""
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb[sheet_name]

    codes = set()
    header_row = None
    col_idx = None

    for row in ws.iter_rows(values_only=False):
        values = [cell.value for cell in row]
        if col_name in values:
            col_idx = values.index(col_name)
            header_row = True
            continue
        if header_row and col_idx is not None:
            val = values[col_idx]
            if val and isinstance(val, (str, int)):
                code = str(val).strip().zfill(5)
                if len(code) == 5:
                    codes.add(code)

    wb.close()
    return codes


def get_campagne_codes():
    """Fetch all communes from API Geo and return those with density < threshold."""
    print("  Fetching from API Geo...")
    ctx = ssl.create_default_context()
    req = urllib.request.Request(API_GEO_URL, headers={"User-Agent": "OuAtterir/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
        data = json.loads(resp.read().decode())

    codes = set()
    for c in data:
        pop = c.get("population")
        surface = c.get("surface")  # hectares
        if pop is not None and surface and surface > 0:
            density = pop / (surface / 100)  # hab/km²
            if density < CAMPAGNE_DENSITY_THRESHOLD:
                codes.add(c["code"])

    return codes


def main():
    print("=== Import geo_tags ===\n")

    # Littoral
    print("[1/3] Communes littorales (loi Littoral 1986)")
    littoral_path = os.path.join(DATA_DIR, "littoral_cog2022.xlsx")
    littoral_codes = set()
    if download_file(LITTORAL_URL, littoral_path):
        littoral_codes = extract_insee_from_xlsx(littoral_path)
        print(f"  {len(littoral_codes)} communes littorales")
    else:
        print("  WARNING: skipped")

    # Montagne
    print("\n[2/3] Communes de montagne (loi Montagne 1985)")
    montagne_path = os.path.join(DATA_DIR, "montagne_cog2022.xlsx")
    montagne_codes = set()
    if download_file(MONTAGNE_URL, montagne_path):
        montagne_codes = extract_insee_from_xlsx(montagne_path)
        print(f"  {len(montagne_codes)} communes de montagne")
    else:
        print("  WARNING: skipped")

    # Campagne
    print("\n[3/3] Communes rurales (densité < 40 hab/km²)")
    campagne_codes = get_campagne_codes()
    print(f"  {len(campagne_codes)} communes rurales")

    # Build tags per commune
    all_codes = littoral_codes | montagne_codes | campagne_codes
    print(f"\n{len(all_codes)} communes with at least one geo tag")

    tags_by_commune = {}
    for code in all_codes:
        tags = []
        if code in littoral_codes:
            tags.append("littoral")
        if code in montagne_codes:
            tags.append("montagne")
        if code in campagne_codes:
            tags.append("campagne")
        tags_by_commune[code] = tags

    # Generate SQL
    print(f"Writing SQL to {OUTPUT_SQL}...")
    items = sorted(tags_by_commune.items())

    with open(OUTPUT_SQL, "w") as f:
        f.write("-- Auto-generated by import_geo_tags.py\n")
        f.write("-- Updates communes.geo_tags with littoral, montagne, campagne tags\n\n")

        for i in range(0, len(items), BATCH_SIZE):
            batch = items[i : i + BATCH_SIZE]
            values = ", ".join(
                f"('{insee}', ARRAY[{', '.join(repr(t) for t in tags)}]::text[])"
                for insee, tags in batch
            )
            f.write(
                f"UPDATE communes AS c SET geo_tags = v.tags\n"
                f"FROM (VALUES {values}) AS v(insee, tags)\n"
                f"WHERE c.insee = v.insee;\n\n"
            )

    batches = (len(items) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Done. {len(items)} communes across {batches} batches.\n")

    # Summary
    both_lm = littoral_codes & montagne_codes
    print(f"Summary:")
    print(f"  Littoral:            {len(littoral_codes)}")
    print(f"  Montagne:            {len(montagne_codes)}")
    print(f"  Campagne:            {len(campagne_codes)}")
    print(f"  Littoral + Montagne: {len(both_lm)}")


if __name__ == "__main__":
    main()
