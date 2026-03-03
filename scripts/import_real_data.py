#!/usr/bin/env python3
"""
Import real French municipal election data from data.gouv.fr.

Sources:
  - candidats_results.parquet  (~158 MB)
  - general_results.parquet    (~68 MB)
  - geo.api.gouv.fr            (commune coordinates + postal codes)

Output: supabase/seed_real_data.sql

Usage:
    pip install duckdb requests
    python3 scripts/import_real_data.py
"""

import duckdb
import requests
import uuid
import os
import sys
import time

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CANDIDATS_URL = "https://object.files.data.gouv.fr/data-pipeline-open/elections/candidats_results.parquet"
GENERAL_URL = "https://object.files.data.gouv.fr/data-pipeline-open/elections/general_results.parquet"
GEO_API_URL = "https://geo.api.gouv.fr/communes"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "supabase", "seed_real_data.sql")

# PLM cities: election data is aggregated at city level but votes are per-sector.
# We split them into individual arrondissements using code_bv prefix.
PLM_CITIES = {
    "75056": {"name": "Paris", "dept_code": "75", "dept_name": "Paris", "arr_offset": 75100},
    "69123": {"name": "Lyon", "dept_code": "69", "dept_name": "Rhône", "arr_offset": 69380},
    "13055": {"name": "Marseille", "dept_code": "13", "dept_name": "Bouches-du-Rhône", "arr_offset": 13200},
}

# Nuance → Bloc mapping (same as baseline migration)
NUANCE_BLOC = {
    "EXG": "Extrême-gauche", "LEXG": "Extrême-gauche", "DXG": "Extrême-gauche",
    "PG": "Extrême-gauche", "LPG": "Extrême-gauche", "FG": "Extrême-gauche",
    "LFG": "Extrême-gauche", "FI": "Extrême-gauche", "LFI": "Extrême-gauche",
    "COM": "Gauche", "LCOM": "Gauche", "LCOP": "Gauche", "NUP": "Gauche",
    "SOC": "Gauche", "LSOC": "Gauche", "RDG": "Gauche", "LRDG": "Gauche",
    "DVG": "Gauche", "LDVG": "Gauche", "VEC": "Gauche", "LVEC": "Gauche",
    "ECO": "Gauche", "LECO": "Gauche", "LUG": "Gauche", "LUGE": "Gauche",
    "LVEG": "Gauche",
    "MODM": "Centre", "MDM": "Centre", "LMDM": "Centre",
    "DVC": "Centre", "LDVC": "Centre",
    "CEN": "Centre", "LCEN": "Centre", "NCE": "Centre", "UDI": "Centre",
    "LUDI": "Centre", "ALLI": "Centre", "LUC": "Centre", "LMC": "Centre",
    "LUCG": "Centre", "LUCD": "Centre", "LGC": "Centre", "PRV": "Centre",
    "REM": "Centre-droit", "LREM": "Centre-droit", "ENS": "Centre-droit",
    "MAJ": "Centre-droit", "LMAJ": "Centre-droit", "LMP": "Centre-droit",
    "LMMD": "Centre-droit", "M": "Centre-droit", "M-NC": "Centre-droit",
    "UMP": "Droite", "LUMP": "Droite", "LR": "Droite", "LLR": "Droite",
    "DVD": "Droite", "LDVD": "Droite", "LUD": "Droite", "UDFD": "Droite",
    "MPF": "Droite",
    "FN": "Extrême-droite", "LFN": "Extrême-droite", "RN": "Extrême-droite",
    "LRN": "Extrême-droite", "EXD": "Extrême-droite", "LEXD": "Extrême-droite",
    "DXD": "Extrême-droite", "DSV": "Extrême-droite", "LDSV": "Extrême-droite",
    "DLF": "Extrême-droite", "LDLF": "Extrême-droite", "DLR": "Extrême-droite",
    "LDLR": "Extrême-droite", "REC": "Extrême-droite", "LUXD": "Extrême-droite",
    "DIV": "Divers", "LDIV": "Divers", "REG": "Divers", "LREG": "Divers",
    "AUT": "Divers", "LAUT": "Divers", "CPNT": "Divers", "LGJ": "Divers",
    "LNC": "Divers",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_uuid(insee):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"ouatterir-commune-{insee}"))


def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def download_file(url, dest):
    if os.path.exists(dest):
        size_mb = os.path.getsize(dest) / (1024 * 1024)
        print(f"  Cached: {os.path.basename(dest)} ({size_mb:.0f} MB)")
        return
    print(f"  Downloading {os.path.basename(dest)}...")
    r = requests.get(url, stream=True)
    total = int(r.headers.get("content-length", 0))
    downloaded = 0
    with open(dest, "wb") as f:
        for chunk in r.iter_content(chunk_size=65536):
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                print(f"\r  {downloaded * 100 // total}% ({downloaded >> 20}/{total >> 20} MB)", end="")
    print()


def compute_stability(blocs):
    """Compute stability from a list of blocs (ordered by year ascending)."""
    if len(blocs) == 0:
        return "STABLE"
    unique = set(blocs)
    if len(blocs) >= 2 and len(unique) == 1:
        return "FORTRESS"
    if len(blocs) >= 3 and len(unique) == 2:
        return "STABLE"
    if len(blocs) >= 2 and blocs[-1] != blocs[-2]:
        return "SWING"
    if len(blocs) >= 3 and len(unique) >= 3:
        return "UNSTABLE"
    return "STABLE"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # ---- Step 1: Download parquet files ----
    print("=== Step 1/5: Downloading parquet files ===")
    candidats_path = os.path.join(DATA_DIR, "candidats_results.parquet")
    general_path = os.path.join(DATA_DIR, "general_results.parquet")
    download_file(CANDIDATS_URL, candidats_path)
    download_file(GENERAL_URL, general_path)

    # ---- Step 2: Query municipal election data with DuckDB ----
    print("\n=== Step 2/5: Processing election data ===")
    con = duckdb.connect()

    print("  Querying winners per commune...")
    t0 = time.time()
    winners = con.execute("""
        WITH
        mun_candidates AS (
            SELECT
                code_commune,
                CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                "Nuance" AS nuance,
                COALESCE(NULLIF(nom_tete_liste, ''), nom || ' ' || prenom) AS candidate_name,
                SUM(voix) AS total_voix
            FROM read_parquet(?)
            WHERE id_election LIKE '%muni%'
            GROUP BY code_commune, year, tour, nuance, candidate_name
        ),
        decisive_round AS (
            SELECT code_commune, year, MAX(tour) AS tour
            FROM mun_candidates
            GROUP BY code_commune, year
        ),
        ranked AS (
            SELECT
                mc.code_commune, mc.year, mc.nuance, mc.candidate_name, mc.total_voix,
                ROW_NUMBER() OVER (
                    PARTITION BY mc.code_commune, mc.year
                    ORDER BY mc.total_voix DESC
                ) AS rk
            FROM mun_candidates mc
            JOIN decisive_round dr
              ON mc.code_commune = dr.code_commune
             AND mc.year = dr.year
             AND mc.tour = dr.tour
        )
        SELECT code_commune, year, nuance, candidate_name, total_voix
        FROM ranked
        WHERE rk = 1
        ORDER BY code_commune, year
    """, [candidats_path]).fetchall()
    print(f"  → {len(winners)} winner records ({time.time()-t0:.1f}s)")

    print("  Querying PLM arrondissement winners...")
    t0 = time.time()
    plm_winners = con.execute("""
        WITH
        mun_candidates AS (
            SELECT
                code_commune,
                LEFT(code_bv, 2) AS arr,
                CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                "Nuance" AS nuance,
                COALESCE(NULLIF(nom_tete_liste, ''), nom || ' ' || prenom) AS candidate_name,
                SUM(voix) AS total_voix
            FROM read_parquet(?)
            WHERE id_election LIKE '%muni%'
              AND code_commune IN ('75056', '69123', '13055')
            GROUP BY code_commune, arr, year, tour, nuance, candidate_name
        ),
        decisive_round AS (
            SELECT code_commune, arr, year, MAX(tour) AS tour
            FROM mun_candidates
            GROUP BY code_commune, arr, year
        ),
        ranked AS (
            SELECT
                mc.code_commune, mc.arr, mc.year, mc.nuance, mc.candidate_name, mc.total_voix,
                ROW_NUMBER() OVER (
                    PARTITION BY mc.code_commune, mc.arr, mc.year
                    ORDER BY mc.total_voix DESC
                ) AS rk
            FROM mun_candidates mc
            JOIN decisive_round dr
              ON mc.code_commune = dr.code_commune
             AND mc.arr = dr.arr
             AND mc.year = dr.year
             AND mc.tour = dr.tour
        )
        SELECT code_commune, arr, year, nuance, candidate_name, total_voix
        FROM ranked
        WHERE rk = 1
        ORDER BY code_commune, arr, year
    """, [candidats_path]).fetchall()
    print(f"  → {len(plm_winners)} PLM arrondissement winner records ({time.time()-t0:.1f}s)")

    print("  Querying PLM arrondissement participation...")
    t0 = time.time()
    plm_participation = con.execute("""
        WITH
        mun_general AS (
            SELECT
                code_commune,
                LEFT(code_bv, 2) AS arr,
                CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                SUM(inscrits) AS inscrits,
                SUM(votants) AS votants,
                SUM(exprimes) AS exprimes
            FROM read_parquet(?)
            WHERE id_election LIKE '%muni%'
              AND code_commune IN ('75056', '69123', '13055')
            GROUP BY code_commune, arr, year, tour
        ),
        decisive AS (
            SELECT code_commune, arr, year, MAX(tour) AS tour
            FROM mun_general
            GROUP BY code_commune, arr, year
        )
        SELECT
            mg.code_commune, mg.arr, mg.year, mg.inscrits, mg.votants, mg.exprimes
        FROM mun_general mg
        JOIN decisive d
          ON mg.code_commune = d.code_commune
         AND mg.arr = d.arr
         AND mg.year = d.year
         AND mg.tour = d.tour
        ORDER BY mg.code_commune, mg.arr, mg.year
    """, [general_path]).fetchall()
    print(f"  → {len(plm_participation)} PLM participation records ({time.time()-t0:.1f}s)")

    print("  Querying participation per commune...")
    t0 = time.time()
    participation = con.execute("""
        WITH
        mun_general AS (
            SELECT
                code_commune,
                libelle_commune,
                code_departement,
                libelle_departement,
                CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                SUM(inscrits) AS inscrits,
                SUM(votants) AS votants,
                SUM(exprimes) AS exprimes
            FROM read_parquet(?)
            WHERE id_election LIKE '%muni%'
            GROUP BY code_commune, libelle_commune, code_departement, libelle_departement, year, tour
        ),
        decisive AS (
            SELECT code_commune, year, MAX(tour) AS tour
            FROM mun_general
            GROUP BY code_commune, year
        )
        SELECT
            mg.code_commune, mg.libelle_commune, mg.code_departement, mg.libelle_departement,
            mg.year, mg.inscrits, mg.votants, mg.exprimes
        FROM mun_general mg
        JOIN decisive d
          ON mg.code_commune = d.code_commune
         AND mg.year = d.year
         AND mg.tour = d.tour
        ORDER BY mg.code_commune, mg.year
    """, [general_path]).fetchall()
    print(f"  → {len(participation)} participation records ({time.time()-t0:.1f}s)")
    con.close()

    # Build lookup tables
    commune_info = {}  # insee → {name, dept_code, dept_name}
    part_map = {}      # (insee, year) → {inscrits, votants, exprimes}
    for row in participation:
        insee, name, dept_code, dept_name, year, inscrits, votants, exprimes = row
        commune_info[insee] = {"name": name, "dept_code": dept_code, "dept_name": dept_name}
        part_map[(insee, year)] = {"inscrits": inscrits or 0, "votants": votants or 0, "exprimes": exprimes or 0}

    winners_map = {}  # insee → [{year, nuance, candidate, voix}]
    for row in winners:
        insee, year, nuance, candidate, voix = row
        if insee in PLM_CITIES:
            continue
        winners_map.setdefault(insee, []).append({
            "year": year, "nuance": nuance or "DIV",
            "candidate": candidate or "Inconnu", "voix": voix or 0,
        })

    # Build PLM arrondissement data
    plm_part_map = {}
    for row in plm_participation:
        city_code, arr, year, inscrits, votants, exprimes = row
        arr_insee = str(PLM_CITIES[city_code]["arr_offset"] + int(arr))
        plm_part_map[(arr_insee, year)] = {
            "inscrits": inscrits or 0, "votants": votants or 0, "exprimes": exprimes or 0,
        }

    part_map.update(plm_part_map)

    for row in plm_winners:
        city_code, arr, year, nuance, candidate, voix = row
        cfg = PLM_CITIES[city_code]
        arr_num = int(arr)
        arr_insee = str(cfg["arr_offset"] + arr_num)
        suffix = "er" if arr_num == 1 else "e"
        arr_name = f"{cfg['name']} {arr_num}{suffix} Arrondissement"
        commune_info[arr_insee] = {
            "name": arr_name, "dept_code": cfg["dept_code"], "dept_name": cfg["dept_name"],
        }
        winners_map.setdefault(arr_insee, []).append({
            "year": year, "nuance": nuance or "DIV",
            "candidate": candidate or "Inconnu", "voix": voix or 0,
        })

    # ---- Step 3: Fetch commune coordinates from geo API ----
    print("\n=== Step 3/5: Fetching commune coordinates ===")
    departments = sorted(set(info["dept_code"] for info in commune_info.values()))
    geo_data = {}  # insee → {zipcode, lat, lng}

    for i, dept in enumerate(departments):
        try:
            r = requests.get(
                GEO_API_URL,
                params={"codeDepartement": dept, "fields": "nom,code,codesPostaux,centre", "format": "json"},
                timeout=15,
            )
            if r.status_code == 200:
                for c in r.json():
                    cp = c.get("codesPostaux", [])
                    centre = c.get("centre", {}).get("coordinates", [0, 0])
                    geo_data[c["code"]] = {
                        "zipcode": cp[0] if cp else "00000",
                        "lat": centre[1] if len(centre) == 2 else 0,
                        "lng": centre[0] if len(centre) == 2 else 0,
                    }
        except Exception as e:
            print(f"  Warning: dept {dept} failed ({e})")
        if (i + 1) % 20 == 0 or i + 1 == len(departments):
            print(f"  Departments: {i+1}/{len(departments)}")
        time.sleep(0.05)

    # Fetch PLM arrondissements geo data
    for city_code, cfg in PLM_CITIES.items():
        try:
            r = requests.get(
                GEO_API_URL,
                params={"codeParent": city_code, "type": "arrondissement-municipal",
                        "fields": "nom,code,codesPostaux,centre,population"},
                timeout=15,
            )
            if r.status_code == 200:
                for a in r.json():
                    cp = a.get("codesPostaux", [])
                    centre = a.get("centre", {}).get("coordinates", [0, 0])
                    geo_data[a["code"]] = {
                        "zipcode": cp[0] if cp else "00000",
                        "lat": centre[1] if len(centre) == 2 else 0,
                        "lng": centre[0] if len(centre) == 2 else 0,
                        "population": a.get("population"),
                    }
                print(f"  PLM: {cfg['name']} → {len(r.json())} arrondissements")
        except Exception as e:
            print(f"  Warning: PLM {cfg['name']} failed ({e})")

    print(f"  → {len(geo_data)} communes geocoded (incl. PLM arrondissements)")

    # ---- Step 4: Build final dataset ----
    print("\n=== Step 4/5: Building dataset ===")
    communes_out = []
    elections_out = []
    skipped = 0

    for insee, elections in winners_map.items():
        info = commune_info.get(insee)
        geo = geo_data.get(insee)
        if not info or not geo:
            skipped += 1
            continue

        elections.sort(key=lambda e: e["year"])
        blocs = [NUANCE_BLOC.get(e["nuance"], "Divers") for e in elections]
        stability = compute_stability(blocs)
        latest = elections[-1]
        cid = make_uuid(insee)

        communes_out.append({
            "id": cid,
            "insee": insee,
            "zipcode": geo["zipcode"],
            "name": info["name"],
            "department": info["dept_name"],
            "lat": geo["lat"],
            "lng": geo["lng"],
            "stability": stability,
            "current_mayor": latest["candidate"],
        })

        for e in elections:
            p = part_map.get((insee, e["year"]), {})
            exprimes = p.get("exprimes", 0)
            inscrits = p.get("inscrits", 0)
            score = round(e["voix"] * 100.0 / exprimes, 2) if exprimes > 0 else 0
            turnout = round(p.get("votants", 0) * 100.0 / inscrits, 2) if inscrits > 0 else 0
            elections_out.append({
                "commune_id": cid,
                "year": e["year"],
                "winner_nuance": e["nuance"],
                "winner_name": e["candidate"],
                "score": score,
                "turnout": turnout,
            })

    print(f"  → {len(communes_out)} communes, {len(elections_out)} election results ({skipped} skipped)")

    # ---- Step 5: Generate SQL ----
    print("\n=== Step 5/5: Generating SQL ===")
    BATCH = 500

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- Ou Atterir - Real election data\n")
        f.write("-- Source: data.gouv.fr municipal elections\n")
        f.write("-- Generated by scripts/import_real_data.py\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("DELETE FROM election_results;\n")
        f.write("DELETE FROM communes;\n\n")

        # Communes
        for i in range(0, len(communes_out), BATCH):
            batch = communes_out[i : i + BATCH]
            f.write("INSERT INTO communes (id, insee, zipcode, name, department, lat, lng, stability, current_mayor) VALUES\n")
            vals = []
            for c in batch:
                vals.append(
                    f"({escape_sql(c['id'])},{escape_sql(c['insee'])},"
                    f"{escape_sql(c['zipcode'])},{escape_sql(c['name'])},"
                    f"{escape_sql(c['department'])},{c['lat']},{c['lng']},"
                    f"{escape_sql(c['stability'])},{escape_sql(c['current_mayor'])})"
                )
            f.write(",\n".join(vals))
            f.write(";\n\n")

        # Election results
        for i in range(0, len(elections_out), BATCH):
            batch = elections_out[i : i + BATCH]
            f.write("INSERT INTO election_results (commune_id, year, winner_nuance, winner_name, score, turnout) VALUES\n")
            vals = []
            for e in batch:
                vals.append(
                    f"({escape_sql(e['commune_id'])},{e['year']},"
                    f"{escape_sql(e['winner_nuance'])},{escape_sql(e['winner_name'])},"
                    f"{e['score']},{e['turnout']})"
                )
            f.write(",\n".join(vals))
            f.write(";\n\n")

        f.write("COMMIT;\n")

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n{'='*50}")
    print(f"Done!")
    print(f"  Output:           {OUTPUT_PATH}")
    print(f"  File size:        {size_mb:.1f} MB")
    print(f"  Communes:         {len(communes_out)}")
    print(f"  Election results: {len(elections_out)}")
    print(f"\nTo import into Supabase, use psql:")
    print(f"  psql 'postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres' \\")
    print(f"    -f supabase/seed_real_data.sql")
    print(f"\n(Get the connection string from Supabase Dashboard → Settings → Database)")


if __name__ == "__main__":
    main()
