#!/usr/bin/env python3
"""
Import air quality data (PM2.5 annual mean) per commune.

Downloads the interpolated PM2.5 annual mean GeoTIFF from the European
Environment Agency, extracts concentrations at each commune centroid,
and generates a SQL seed file for Supabase.

Source: EEA – European air quality data (interpolated data)
  https://www.eea.europa.eu/en/datahub/datahubitem-view/82700fbd-2953-467b-be0a-78a520c3a7ef
  Licence: EEA standard re-use policy

Methodology: PM2.5 concentrations are modelled at 1 km resolution by
combining ground-based measurements with the CHIMERE/EMEP chemistry-transport
models. Values at commune centroids represent background (non-traffic,
non-industrial) annual mean exposure.

Usage:
    pip install rasterio pyproj requests
    python3 scripts/import_atmo.py

Output: supabase/seed_atmo.sql
"""

import json
import os
import sys
import zipfile

import numpy as np
import rasterio
import requests
from pyproj import Transformer

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data", "eea")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "supabase", "seed_atmo.sql")

GEOTIFF_PATH = os.path.join(DATA_DIR, "pm25_2024.tif")

EEA_DOWNLOAD_URL = "https://sdi.eea.europa.eu/datashare/s/EPTpArzSfoHwLpR/download"

GEO_API_URL = "https://geo.api.gouv.fr/communes?fields=code,nom,centre&format=json&geometry=centre"

PM25_THRESHOLDS = [
    ("bonne", 0, 5),
    ("moyenne", 5, 7),
    ("degradee", 7, 9),
    ("mauvaise", 9, 999),
]


def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def download_geotiff():
    """Download and extract the PM2.5 GeoTIFF from EEA."""
    os.makedirs(DATA_DIR, exist_ok=True)

    if os.path.exists(GEOTIFF_PATH):
        print(f"  [cached] {GEOTIFF_PATH}")
        return

    zip_path = os.path.join(DATA_DIR, "pm25_download.zip")
    print("  Downloading EEA PM2.5 GeoTIFF...")
    r = requests.get(EEA_DOWNLOAD_URL, timeout=300, stream=True)
    r.raise_for_status()
    with open(zip_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            f.write(chunk)

    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"  → {size_mb:.1f} MB downloaded")

    with zipfile.ZipFile(zip_path, "r") as zf:
        tif_files = [n for n in zf.namelist() if n.endswith(".tif")]
        if not tif_files:
            raise RuntimeError("No .tif file found in archive")
        tif_name = tif_files[0]
        print(f"  Extracting {tif_name}...")
        with zf.open(tif_name) as src, open(GEOTIFF_PATH, "wb") as dst:
            dst.write(src.read())

    os.remove(zip_path)
    print(f"  → {GEOTIFF_PATH}")


def download_commune_centroids():
    """Download commune centroids from the French geo API."""
    cache_path = os.path.join(DATA_DIR, "communes.json")
    if os.path.exists(cache_path):
        print(f"  [cached] {cache_path}")
        with open(cache_path) as f:
            return json.load(f)

    print("  Downloading commune centroids from geo.api.gouv.fr...")
    r = requests.get(GEO_API_URL, timeout=60)
    r.raise_for_status()
    communes = r.json()
    with open(cache_path, "w") as f:
        json.dump(communes, f)
    print(f"  → {len(communes):,} communes")
    return communes


def extract_pm25(communes):
    """Extract PM2.5 concentration at each commune centroid from the GeoTIFF."""
    print(f"\n=== Extracting PM2.5 values ===")

    ds = rasterio.open(GEOTIFF_PATH)
    data = ds.read(1)
    nodata = ds.nodata

    transformer = Transformer.from_crs("EPSG:4326", ds.crs, always_xy=True)

    results = []
    no_data_count = 0

    for c in communes:
        code = c["code"]
        coords = c.get("centre", {}).get("coordinates")
        if not coords:
            no_data_count += 1
            continue

        lon, lat = coords
        x, y = transformer.transform(lon, lat)
        row, col = ds.index(x, y)

        if 0 <= row < ds.height and 0 <= col < ds.width:
            val = data[row, col]
            if val != nodata and val > 0:
                results.append({"code": code, "pm25": round(float(val), 2)})
            else:
                no_data_count += 1
        else:
            no_data_count += 1

    ds.close()

    pm25_values = [r["pm25"] for r in results]
    print(f"  Communes with data: {len(results):,}")
    print(f"  Communes without data: {no_data_count}")
    print(f"  PM2.5 range: {min(pm25_values):.2f} – {max(pm25_values):.2f} µg/m³")
    print(f"  Mean: {np.mean(pm25_values):.2f}, Median: {np.median(pm25_values):.2f}")

    print(f"\n  Distribution:")
    for key, lo, hi in PM25_THRESHOLDS:
        count = sum(1 for v in pm25_values if lo <= v < hi)
        pct = count * 100 / len(pm25_values)
        hi_label = f"{hi}" if hi < 999 else "+"
        print(f"    {key:12s} ({lo}–{hi_label} µg/m³): {count:6,} communes ({pct:.1f}%)")

    return results


def generate_sql(results):
    """Generate SQL seed file."""
    print(f"\n=== Generating SQL ===")
    BATCH = 2000

    rows = [(r["code"], r["pm25"]) for r in results]

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- Ou Atterir – Air quality data (PM2.5)\n")
        f.write("-- Source: EEA interpolated PM2.5 annual mean 2024\n")
        f.write("-- Generated by scripts/import_atmo.py\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("DELETE FROM commune_air_quality;\n\n")

        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            f.write(
                "INSERT INTO commune_air_quality (code_insee, pm25_concentration) VALUES\n"
            )
            vals = []
            for code_insee, pm25 in batch:
                vals.append(f"({escape_sql(code_insee)},{pm25})")
            f.write(",\n".join(vals))
            f.write(
                "\nON CONFLICT (code_insee) DO UPDATE SET\n"
                "  pm25_concentration = EXCLUDED.pm25_concentration;\n\n"
            )

            if (i + BATCH) % 20000 == 0 or i + BATCH >= len(rows):
                pct = min(100, (i + BATCH) * 100 // len(rows))
                print(f"  Writing... {pct}%")

        f.write("REFRESH MATERIALIZED VIEW commune_air_summary;\n\n")
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
    print(f"     psql '<CONNECTION_STRING>' -f supabase/seed_atmo.sql")


def main():
    print("=== Step 1/3: Download EEA GeoTIFF ===")
    download_geotiff()

    print("\n=== Step 2/3: Download commune centroids ===")
    communes = download_commune_centroids()

    print("\n=== Step 3/3: Extract & generate SQL ===")
    results = extract_pm25(communes)
    generate_sql(results)


if __name__ == "__main__":
    main()
