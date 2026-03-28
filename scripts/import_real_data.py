#!/usr/bin/env python3
"""
Import French election data from data.gouv.fr aggregated parquets.

Covers all available elections:
  - Municipales (2001, 2008, 2014, 2020, 2026 via import_municipales_2026.py)
  - Présidentielles T1 (2002, 2007, 2012, 2017, 2022)
  - Législatives T1 (2002, 2007, 2012, 2017, 2022, 2024)
  - Européennes (1999, 2004, 2009, 2014, 2019, 2024)

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

PLM_CITIES = {
    "75056": {"name": "Paris", "dept_code": "75", "dept_name": "Paris", "arr_offset": 75100},
    "69123": {"name": "Lyon", "dept_code": "69", "dept_name": "Rhône", "arr_offset": 69380},
    "13055": {"name": "Marseille", "dept_code": "13", "dept_name": "Bouches-du-Rhône", "arr_offset": 13200},
}

# ---------------------------------------------------------------------------
# Nuance → Bloc mapping
# ---------------------------------------------------------------------------

NUANCE_BLOC = {
    "EXG": "Extrême-gauche", "LEXG": "Extrême-gauche", "DXG": "Extrême-gauche",
    "PG": "Extrême-gauche", "LPG": "Extrême-gauche", "FG": "Extrême-gauche",
    "LFG": "Extrême-gauche", "FI": "Extrême-gauche", "LFI": "Extrême-gauche",
    "LO": "Extrême-gauche", "LCR": "Extrême-gauche", "NPA": "Extrême-gauche",
    "COM": "Gauche", "LCOM": "Gauche", "LCOP": "Gauche", "NUP": "Gauche",
    "SOC": "Gauche", "LSOC": "Gauche", "RDG": "Gauche", "LRDG": "Gauche",
    "DVG": "Gauche", "LDVG": "Gauche", "VEC": "Gauche", "LVEC": "Gauche",
    "ECO": "Gauche", "LECO": "Gauche", "LUG": "Gauche", "LUGE": "Gauche",
    "LVEG": "Gauche", "UG": "Gauche", "PRG": "Gauche", "MDC": "Gauche",
    "EELV": "Gauche",
    "MODM": "Centre", "MDM": "Centre", "LMDM": "Centre",
    "DVC": "Centre", "LDVC": "Centre", "UDF": "Centre", "CAP21": "Centre",
    "CEN": "Centre", "LCEN": "Centre", "NCE": "Centre", "UDI": "Centre",
    "LUDI": "Centre", "ALLI": "Centre", "LUC": "Centre", "LMC": "Centre",
    "LUCG": "Centre", "LUCD": "Centre", "LGC": "Centre", "PRV": "Centre",
    "REM": "Centre-droit", "LREM": "Centre-droit", "ENS": "Centre-droit",
    "LENS": "Centre-droit", "HOR": "Centre-droit", "LHOR": "Centre-droit", "EM": "Centre-droit",
    "MAJ": "Centre-droit", "LMAJ": "Centre-droit", "LMP": "Centre-droit",
    "LMMD": "Centre-droit", "M": "Centre-droit", "M-NC": "Centre-droit",
    "UMP": "Droite", "LUMP": "Droite", "LR": "Droite", "LLR": "Droite",
    "DVD": "Droite", "LDVD": "Droite", "LUD": "Droite", "LUDR": "Droite", "UDFD": "Droite",
    "MPF": "Droite", "UD": "Droite", "RPR": "Droite", "DL": "Droite",
    "FRS": "Droite",
    "FN": "Extrême-droite", "LFN": "Extrême-droite", "RN": "Extrême-droite",
    "LRN": "Extrême-droite", "EXD": "Extrême-droite", "LEXD": "Extrême-droite",
    "DXD": "Extrême-droite", "DSV": "Extrême-droite", "LDSV": "Extrême-droite",
    "DLF": "Extrême-droite", "LDLF": "Extrême-droite", "DLR": "Extrême-droite",
    "LDLR": "Extrême-droite", "REC": "Extrême-droite", "LREC": "Extrême-droite",
    "LUXD": "Extrême-droite", "UXD": "Extrême-droite",
    "MNR": "Extrême-droite",
    "DIV": "Divers", "LDIV": "Divers", "REG": "Divers", "LREG": "Divers",
    "AUT": "Divers", "LAUT": "Divers", "CPNT": "Divers", "LGJ": "Divers",
    "LNC": "Divers", "SP": "Divers", "UPR": "Divers", "LDV": "Divers",
    "DTE": "Gauche", "GAU": "Gauche", "LCP": "Gauche", "LDG": "Gauche",
    "LEC": "Gauche", "LPC": "Gauche", "LPS": "Gauche", "LRG": "Gauche",
    "LVE": "Gauche", "LUDF": "Centre",
    "FRN": "Extrême-droite", "LXD": "Extrême-droite", "MNA": "Extrême-droite",
    "LXG": "Extrême-gauche",
    "LDD": "Droite", "PREP": "Droite", "RPF": "Droite",
}

# Presidential candidates: nuance not in parquet, mapped by last name + year
PRES_CANDIDATES = {
    2002: {
        "CHIRAC": "RPR", "JOSPIN": "SOC", "LE PEN": "FN", "BAYROU": "UDF",
        "LAGUILLER": "LO", "CHEVÈNEMENT": "MDC", "MAMÈRE": "VEC",
        "BESANCENOT": "LCR", "SAINT-JOSSE": "CPNT", "MADELIN": "DL",
        "HUE": "COM", "MÉGRET": "MNR", "TAUBIRA": "PRG",
        "LEPAGE": "CAP21", "BOUTIN": "FRS", "GLUCKSTEIN": "EXG",
    },
    2007: {
        "SARKOZY": "UMP", "ROYAL": "SOC", "BAYROU": "UDF",
        "LE PEN": "FN", "BESANCENOT": "LCR", "DE VILLIERS": "MPF",
        "BUFFET": "COM", "VOYNET": "VEC", "LAGUILLER": "LO",
        "BOVÉ": "DVG", "NIHOUS": "CPNT", "SCHIVARDI": "EXG",
    },
    2012: {
        "HOLLANDE": "SOC", "SARKOZY": "UMP", "LE PEN": "FN",
        "MÉLENCHON": "FG", "BAYROU": "MODM", "JOLY": "EELV",
        "DUPONT-AIGNAN": "DLF", "POUTOU": "NPA", "ARTHAUD": "LO",
        "CHEMINADE": "SP",
    },
    2017: {
        "MACRON": "EM", "LE PEN": "FN", "FILLON": "LR",
        "MÉLENCHON": "FI", "HAMON": "SOC",
        "DUPONT-AIGNAN": "DLF", "LASSALLE": "DIV", "POUTOU": "NPA",
        "ARTHAUD": "LO", "ASSELINEAU": "UPR", "CHEMINADE": "SP",
    },
    2022: {
        "MACRON": "ENS", "LE PEN": "RN", "MÉLENCHON": "LFI",
        "ZEMMOUR": "REC", "PÉCRESSE": "LR", "JADOT": "ECO",
        "ROUSSEL": "COM", "HIDALGO": "SOC", "LASSALLE": "DIV",
        "DUPONT-AIGNAN": "DLF", "POUTOU": "EXG", "ARTHAUD": "EXG",
    },
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
    """FORTERESSE if all blocs identical, EN BALLOTTAGE otherwise."""
    unique = set(blocs)
    if len(blocs) >= 2 and len(unique) == 1:
        return "FORTERESSE"
    return "EN BALLOTTAGE"


def parse_election_type(id_election):
    """Extract election type from id_election string (e.g. '2022_pres_t1')."""
    eid = id_election.lower()
    if "muni" in eid:
        return "municipales"
    if "pres" in eid:
        return "presidentielles"
    if "legi" in eid:
        return "legislatives"
    if "euro" in eid:
        return "europeennes"
    return None


def resolve_pres_nuance(candidate_name, year):
    """Resolve presidential candidate nuance by last name and year."""
    if year not in PRES_CANDIDATES:
        return "DIV"
    name_upper = (candidate_name or "").upper().strip()
    for key, nuance in PRES_CANDIDATES[year].items():
        if key in name_upper:
            return nuance
    return "DIV"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(upload=False):
    os.makedirs(DATA_DIR, exist_ok=True)

    # ---- Step 1: Download parquet files ----
    print("=== Step 1/5: Downloading parquet files ===")
    candidats_path = os.path.join(DATA_DIR, "candidats_results.parquet")
    general_path = os.path.join(DATA_DIR, "general_results.parquet")
    download_file(CANDIDATS_URL, candidats_path)
    download_file(GENERAL_URL, general_path)

    # ---- Step 2: Query ALL election data with DuckDB ----
    print("\n=== Step 2/5: Processing election data ===")
    con = duckdb.connect()

    # 2a. Non-PLM winners: all election types, T1 only (or decisive round for municipales)
    print("  Querying winners per commune (all elections)...")
    t0 = time.time()

    winners = con.execute("""
        WITH
        all_candidates AS (
            SELECT
                code_commune,
                id_election,
                CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                CASE
                    WHEN id_election LIKE '%muni%' THEN 'municipales'
                    WHEN id_election LIKE '%pres%' THEN 'presidentielles'
                    WHEN id_election LIKE '%legi%' THEN 'legislatives'
                    WHEN id_election LIKE '%euro%' THEN 'europeennes'
                END AS election_type,
                "Nuance" AS nuance,
                COALESCE(NULLIF(nom_tete_liste, ''), nom || ' ' || prenom) AS candidate_name,
                nom AS last_name,
                SUM(voix) AS total_voix
            FROM read_parquet(?)
            WHERE (
                id_election LIKE '%muni%'
                OR (id_election LIKE '%pres%_t1')
                OR (id_election LIKE '%legi%_t1')
                OR (id_election LIKE '%euro%' AND id_election NOT LIKE '%_t2')
            )
            GROUP BY code_commune, id_election, year, tour, election_type,
                     nuance, candidate_name, last_name
        ),
        decisive_round AS (
            SELECT code_commune, election_type, year, MAX(tour) AS tour
            FROM all_candidates
            GROUP BY code_commune, election_type, year
        ),
        ranked AS (
            SELECT
                ac.code_commune, ac.election_type, ac.year,
                ac.nuance, ac.candidate_name, ac.last_name, ac.total_voix,
                ROW_NUMBER() OVER (
                    PARTITION BY ac.code_commune, ac.election_type, ac.year
                    ORDER BY ac.total_voix DESC
                ) AS rk
            FROM all_candidates ac
            JOIN decisive_round dr
              ON ac.code_commune = dr.code_commune
             AND ac.election_type = dr.election_type
             AND ac.year = dr.year
             AND ac.tour = dr.tour
        )
        SELECT code_commune, election_type, year, nuance, candidate_name, last_name, total_voix
        FROM ranked
        WHERE rk = 1
        ORDER BY code_commune, election_type, year
    """, [candidats_path]).fetchall()
    print(f"  → {len(winners)} winner records ({time.time()-t0:.1f}s)")

    # 2b. PLM arrondissement winners (municipales only — national elections at city level)
    print("  Querying PLM arrondissement winners (municipales)...")
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

    # 2c. PLM participation (municipales)
    print("  Querying PLM arrondissement participation (municipales)...")
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

    # 2d. Participation per commune (all elections)
    print("  Querying participation per commune (all elections)...")
    t0 = time.time()
    participation = con.execute("""
        WITH
        all_general AS (
            SELECT
                code_commune,
                libelle_commune,
                code_departement,
                libelle_departement,
                CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                CASE
                    WHEN id_election LIKE '%muni%' THEN 'municipales'
                    WHEN id_election LIKE '%pres%' THEN 'presidentielles'
                    WHEN id_election LIKE '%legi%' THEN 'legislatives'
                    WHEN id_election LIKE '%euro%' THEN 'europeennes'
                END AS election_type,
                SUM(inscrits) AS inscrits,
                SUM(votants) AS votants,
                SUM(exprimes) AS exprimes
            FROM read_parquet(?)
            WHERE (
                id_election LIKE '%muni%'
                OR (id_election LIKE '%pres%_t1')
                OR (id_election LIKE '%legi%_t1')
                OR (id_election LIKE '%euro%' AND id_election NOT LIKE '%_t2')
            )
            GROUP BY code_commune, libelle_commune, code_departement,
                     libelle_departement, year, tour, election_type
        ),
        decisive AS (
            SELECT code_commune, election_type, year, MAX(tour) AS tour
            FROM all_general
            GROUP BY code_commune, election_type, year
        )
        SELECT
            ag.code_commune, ag.libelle_commune, ag.code_departement,
            ag.libelle_departement, ag.election_type, ag.year,
            ag.inscrits, ag.votants, ag.exprimes
        FROM all_general ag
        JOIN decisive d
          ON ag.code_commune = d.code_commune
         AND ag.election_type = d.election_type
         AND ag.year = d.year
         AND ag.tour = d.tour
        ORDER BY ag.code_commune, ag.election_type, ag.year
    """, [general_path]).fetchall()
    print(f"  → {len(participation)} participation records ({time.time()-t0:.1f}s)")
    con.close()

    # ---- Build lookup tables ----
    commune_info = {}
    part_map = {}  # (insee, election_type, year) → {inscrits, votants, exprimes}
    for row in participation:
        insee, name, dept_code, dept_name, etype, year, inscrits, votants, exprimes = row
        if etype is None:
            continue
        commune_info[insee] = {"name": name, "dept_code": dept_code, "dept_name": dept_name}
        part_map[(insee, etype, year)] = {
            "inscrits": inscrits or 0, "votants": votants or 0, "exprimes": exprimes or 0,
        }

    # winners_map: insee → [{year, election_type, nuance, candidate, voix}]
    winners_map = {}
    # PLM city-level results for national elections (to copy to arrondissements)
    plm_city_national = {}  # (city_code, election_type, year) → {nuance, candidate, voix}
    for row in winners:
        insee, etype, year, nuance, candidate, last_name, voix = row
        if etype is None:
            continue

        # For presidential elections, resolve nuance from candidate name
        if etype == "presidentielles":
            nuance = resolve_pres_nuance(last_name or candidate, year)
        else:
            nuance = nuance or "DIV"

        if insee in PLM_CITIES:
            if etype != "municipales":
                plm_city_national[(insee, etype, year)] = {
                    "nuance": nuance, "candidate": candidate or "Inconnu", "voix": voix or 0,
                }
            continue

        winners_map.setdefault(insee, []).append({
            "year": year, "election_type": etype,
            "nuance": nuance, "candidate": candidate or "Inconnu", "voix": voix or 0,
        })

    # Build PLM arrondissement data
    plm_part_map = {}
    for row in plm_participation:
        city_code, arr, year, inscrits, votants, exprimes = row
        arr_insee = str(PLM_CITIES[city_code]["arr_offset"] + int(arr))
        plm_part_map[(arr_insee, "municipales", year)] = {
            "inscrits": inscrits or 0, "votants": votants or 0, "exprimes": exprimes or 0,
        }
    part_map.update(plm_part_map)

    # PLM municipal arrondissement winners
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
            "year": year, "election_type": "municipales",
            "nuance": nuance or "DIV", "candidate": candidate or "Inconnu", "voix": voix or 0,
        })

    # Copy PLM city-level national election data to each arrondissement
    for (city_code, etype, year), result in plm_city_national.items():
        cfg = PLM_CITIES[city_code]
        city_part = part_map.get((city_code, etype, year), {})

        for arr_insee in list(winners_map.keys()):
            if not arr_insee.startswith(cfg["dept_code"]):
                continue
            arr_offset = cfg["arr_offset"]
            try:
                arr_num = int(arr_insee) - arr_offset
            except ValueError:
                continue
            if arr_num < 1 or arr_num > 20:
                continue

            winners_map.setdefault(arr_insee, []).append({
                "year": year, "election_type": etype,
                "nuance": result["nuance"],
                "candidate": result["candidate"],
                "voix": result["voix"],
            })
            if (arr_insee, etype, year) not in part_map and city_part:
                part_map[(arr_insee, etype, year)] = city_part

    # ---- Step 3: Fetch commune coordinates from geo API ----
    print("\n=== Step 3/5: Fetching commune coordinates ===")
    departments = sorted(set(info["dept_code"] for info in commune_info.values()))
    geo_data = {}

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

        elections.sort(key=lambda e: (e["year"], e["election_type"]))

        # Deduplicate (same commune + type + year can appear if PLM city copied)
        seen = set()
        unique_elections = []
        for e in elections:
            key = (e["election_type"], e["year"])
            if key not in seen:
                seen.add(key)
                unique_elections.append(e)
        elections = unique_elections

        # Stability: based on winner blocs across ALL elections
        blocs = [NUANCE_BLOC.get(e["nuance"], "Divers") for e in elections]
        stability = compute_stability(blocs)

        # current_mayor: latest municipal winner
        muni_elections = [e for e in elections if e["election_type"] == "municipales"]
        latest_muni = muni_elections[-1] if muni_elections else elections[-1]
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
            "current_mayor": latest_muni["candidate"],
        })

        for e in elections:
            p = part_map.get((insee, e["election_type"], e["year"]), {})
            exprimes = p.get("exprimes", 0)
            inscrits = p.get("inscrits", 0)
            score = round(e["voix"] * 100.0 / exprimes, 2) if exprimes > 0 else 0
            turnout = round(p.get("votants", 0) * 100.0 / inscrits, 2) if inscrits > 0 else 0
            elections_out.append({
                "commune_id": cid,
                "year": e["year"],
                "election_type": e["election_type"],
                "winner_nuance": e["nuance"],
                "winner_name": e["candidate"],
                "score": score,
                "turnout": turnout,
            })

    print(f"  → {len(communes_out)} communes, {len(elections_out)} election results ({skipped} skipped)")

    # Stats by election type
    type_counts = {}
    for e in elections_out:
        type_counts[e["election_type"]] = type_counts.get(e["election_type"], 0) + 1
    for etype, count in sorted(type_counts.items()):
        print(f"    {etype}: {count:,}")

    if upload:
        print("\n=== Step 5/5: Uploading to Supabase ===")
        upload_to_supabase(communes_out, elections_out)
        return

    # ---- Step 5: Generate SQL ----
    print("\n=== Step 5/5: Generating SQL ===")
    BATCH = 500

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- Ou Atterir - Election data (all types)\n")
        f.write("-- Source: data.gouv.fr aggregated parquets\n")
        f.write("-- Generated by scripts/import_real_data.py\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("DELETE FROM election_results;\n")
        f.write("DELETE FROM communes;\n\n")

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

        for i in range(0, len(elections_out), BATCH):
            batch = elections_out[i : i + BATCH]
            f.write("INSERT INTO election_results (commune_id, year, election_type, winner_nuance, winner_name, score, turnout) VALUES\n")
            vals = []
            for e in batch:
                vals.append(
                    f"({escape_sql(e['commune_id'])},{e['year']},"
                    f"{escape_sql(e['election_type'])},"
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


def upload_to_supabase(communes_out, elections_out):
    """Upload data directly to Supabase via REST API (requires temp INSERT policies)."""
    SUPABASE_URL = "https://fxdtixmjjnfyicvshvxa.supabase.co"
    SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

    env_path = os.path.join(PROJECT_DIR, ".env.local")
    if not SUPABASE_KEY and os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("VITE_SUPABASE_ANON_KEY="):
                    SUPABASE_KEY = line.split("=", 1)[1].strip()

    if not SUPABASE_KEY:
        print("Error: No Supabase key found in .env.local")
        sys.exit(1)

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal,resolution=merge-duplicates",
    }

    BATCH = 500
    MAX_RETRIES = 3

    def upload_batch(table, batch, label=""):
        for attempt in range(MAX_RETRIES):
            try:
                r = requests.post(
                    f"{SUPABASE_URL}/rest/v1/{table}",
                    headers=headers, json=batch, timeout=120,
                )
                if r.status_code in (200, 201):
                    return True
                if r.status_code == 409:
                    return True
                print(f"  HTTP {r.status_code} {label}: {r.text[:200]}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2 ** attempt)
            except requests.exceptions.RequestException as e:
                print(f"  Connection error {label} (attempt {attempt+1}): {type(e).__name__}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(5 * (attempt + 1))
        return False

    # Check existing counts to enable resume
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/communes?select=id&limit=1",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Prefer": "count=exact"},
            timeout=30,
        )
        existing_communes = int(r.headers.get("content-range", "0/0").split("/")[1])
    except Exception:
        existing_communes = 0

    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/election_results?select=id&limit=1",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Prefer": "count=exact"},
            timeout=30,
        )
        existing_elections = int(r.headers.get("content-range", "0/0").split("/")[1])
    except Exception:
        existing_elections = 0

    print(f"  Existing data: {existing_communes} communes, {existing_elections} election results")

    if existing_communes < len(communes_out):
        skip_communes = (existing_communes // BATCH) * BATCH
        print(f"\n  Uploading communes (resuming from {skip_communes})...")
        for i in range(skip_communes, len(communes_out), BATCH):
            batch = communes_out[i:i + BATCH]
            ok = upload_batch("communes", batch, f"communes[{i}]")
            if not ok:
                print(f"  FAILED at communes row {i} after {MAX_RETRIES} retries")
                sys.exit(1)
            if (i // BATCH + 1) % 10 == 0 or i + BATCH >= len(communes_out):
                print(f"    [{min(i + BATCH, len(communes_out))}/{len(communes_out)}]")
    else:
        print(f"  Communes already uploaded ({existing_communes}), skipping")

    if existing_elections < len(elections_out):
        skip_elections = (existing_elections // BATCH) * BATCH
        print(f"\n  Uploading election results (resuming from {skip_elections})...")
        for i in range(skip_elections, len(elections_out), BATCH):
            batch = elections_out[i:i + BATCH]
            ok = upload_batch("election_results", batch, f"elections[{i}]")
            if not ok:
                print(f"  FAILED at election row {i} after {MAX_RETRIES} retries")
                sys.exit(1)
            if (i // BATCH + 1) % 50 == 0 or i + BATCH >= len(elections_out):
                print(f"    [{min(i + BATCH, len(elections_out))}/{len(elections_out)}]")
    else:
        print(f"  Election results already uploaded ({existing_elections}), skipping")

    print(f"\n  Upload complete!")


if __name__ == "__main__":
    if "--upload" in sys.argv:
        # Re-run data processing and upload directly
        main(upload=True)
    else:
        main()
