#!/usr/bin/env python3
"""
Test the political scoring methodology on 8 real communes.

Downloads and parses election data from data.gouv.fr:
  - Présidentielles 2022 T1
  - Législatives 2024 T1
  - Européennes 2024
  - Municipales (from existing parquet)

Then applies the bloc scoring method and outputs results.
"""

import csv
import os
import sys
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")

# Postal code → expected commune name (for verification)
TEST_COMMUNES_BY_POSTAL = {
    "59130": "Lambersart",
    "69100": "Villeurbanne",
    "69006": "Lyon 6e",
    "75019": "Paris 19e",
    "56260": "Larmor-Plage",
    "42520": "Saint-Pierre-de-Bœuf",
    "59000": "Lille",
    "62520": "Le Touquet-Paris-Plage",
    "59110": "La Madeleine",
}

NUANCE_BLOC = {
    "EXG": "Extrême-gauche", "LEXG": "Extrême-gauche", "DXG": "Extrême-gauche",
    "PG": "Extrême-gauche", "LPG": "Extrême-gauche", "FG": "Extrême-gauche",
    "LFG": "Extrême-gauche", "FI": "Extrême-gauche", "LFI": "Extrême-gauche",
    "COM": "Gauche", "LCOM": "Gauche", "LCOP": "Gauche", "NUP": "Gauche",
    "SOC": "Gauche", "LSOC": "Gauche", "RDG": "Gauche", "LRDG": "Gauche",
    "DVG": "Gauche", "LDVG": "Gauche", "VEC": "Gauche", "LVEC": "Gauche",
    "ECO": "Gauche", "LECO": "Gauche", "LUG": "Gauche", "LUGE": "Gauche",
    "LVEG": "Gauche",
    "UG": "Gauche",
    "MODM": "Centre", "MDM": "Centre", "LMDM": "Centre",
    "DVC": "Centre", "LDVC": "Centre",
    "CEN": "Centre", "LCEN": "Centre", "NCE": "Centre", "UDI": "Centre",
    "LUDI": "Centre", "ALLI": "Centre", "LUC": "Centre", "LMC": "Centre",
    "LUCG": "Centre", "LUCD": "Centre", "LGC": "Centre", "PRV": "Centre",
    "REM": "Centre-droit", "LREM": "Centre-droit", "ENS": "Centre-droit",
    "LENS": "Centre-droit", "HOR": "Centre-droit",
    "MAJ": "Centre-droit", "LMAJ": "Centre-droit", "LMP": "Centre-droit",
    "LMMD": "Centre-droit", "M": "Centre-droit", "M-NC": "Centre-droit",
    "UMP": "Droite", "LUMP": "Droite", "LR": "Droite", "LLR": "Droite",
    "DVD": "Droite", "LDVD": "Droite", "LUD": "Droite", "UDFD": "Droite",
    "MPF": "Droite", "UD": "Droite",
    "FN": "Extrême-droite", "LFN": "Extrême-droite", "RN": "Extrême-droite",
    "LRN": "Extrême-droite", "EXD": "Extrême-droite", "LEXD": "Extrême-droite",
    "DXD": "Extrême-droite", "DSV": "Extrême-droite", "LDSV": "Extrême-droite",
    "DLF": "Extrême-droite", "LDLF": "Extrême-droite", "DLR": "Extrême-droite",
    "LDLR": "Extrême-droite", "REC": "Extrême-droite", "LREC": "Extrême-droite",
    "LUXD": "Extrême-droite", "UXD": "Extrême-droite",
    "DIV": "Divers", "LDIV": "Divers", "REG": "Divers", "LREG": "Divers",
    "AUT": "Divers", "LAUT": "Divers", "CPNT": "Divers", "LGJ": "Divers",
    "LNC": "Divers",
}

PRES_2022_CANDIDATES = {
    "ARTHAUD":       "EXG",
    "ROUSSEL":       "COM",
    "MACRON":        "ENS",  # Centre-droit
    "LASSALLE":      "DIV",
    "LE PEN":        "RN",
    "ZEMMOUR":       "REC",
    "MÉLENCHON":     "LFI",  # Extrême-gauche
    "HIDALGO":       "SOC",
    "JADOT":         "ECO",
    "PÉCRESSE":      "LR",
    "POUTOU":        "EXG",
    "DUPONT-AIGNAN": "DLF",
}

SCORING_WEIGHTS = {
    "municipales":        {"winner_bonus": 10, "share_multiplier": 3},
    "presidentielles_t1": {"winner_bonus": 5,  "share_multiplier": 2},
    "legislatives_t1":    {"winner_bonus": 7,  "share_multiplier": 2},
    "europeennes":        {"winner_bonus": 2,  "share_multiplier": 1.5},
}

BLOCS_ORDER = ["Extrême-gauche", "Gauche", "Centre", "Centre-droit", "Droite", "Extrême-droite", "Divers"]


def resolve_postal_to_insee():
    """Map postal codes to INSEE codes using geo.api.gouv.fr."""
    import requests
    mapping = {}
    for postal, expected_name in TEST_COMMUNES_BY_POSTAL.items():
        if postal in ("75019", "69006"):
            if postal == "75019":
                mapping[postal] = {"insee": "75119", "name": "Paris 19e Arrondissement"}
            else:
                mapping[postal] = {"insee": "69386", "name": "Lyon 6e Arrondissement"}
            continue
        r = requests.get(
            "https://geo.api.gouv.fr/communes",
            params={"codePostal": postal, "fields": "nom,code,codesPostaux,population"},
            timeout=10,
        )
        if r.status_code == 200:
            communes = r.json()
            if len(communes) == 1:
                c = communes[0]
                mapping[postal] = {"insee": c["code"], "name": c["nom"]}
            else:
                for c in communes:
                    if expected_name.lower() in c["nom"].lower():
                        mapping[postal] = {"insee": c["code"], "name": c["nom"]}
                        break
                if postal not in mapping and communes:
                    mapping[postal] = {"insee": communes[0]["code"], "name": communes[0]["nom"]}
                    print(f"  Warning: {postal} → multiple communes, picked {communes[0]['nom']}")
    return mapping


def parse_pres_2022(target_insees):
    """Parse présidentielles 2022 T1 xlsx and return per-commune candidate results."""
    import pandas as pd
    filepath = os.path.join(DATA_DIR, "pres_2022_t1_subcom.xlsx")

    df = pd.read_excel(filepath)
    cols = list(df.columns)

    results = {}
    for _, row in df.iterrows():
        dept_raw = row.iloc[0]
        comm_raw = row.iloc[2]
        if pd.isna(dept_raw) or pd.isna(comm_raw):
            continue
        dept = str(dept_raw).strip()
        if dept.isdigit():
            dept = dept.zfill(2)
        commune_code = str(comm_raw).strip()
        if commune_code.isdigit():
            commune_code = commune_code.zfill(3)
        insee = dept + commune_code
        if len(insee) < 5:
            insee = insee.zfill(5)
        if insee not in target_insees:
            continue

        commune_name = row.iloc[3]
        inscrits = int(row.iloc[5]) if pd.notna(row.iloc[5]) else 0
        votants = int(row.iloc[8]) if pd.notna(row.iloc[8]) else 0
        exprimes = int(row.iloc[16]) if pd.notna(row.iloc[16]) else 0
        turnout = round(votants * 100 / inscrits, 2) if inscrits > 0 else 0

        candidates = []
        idx = 19
        while idx + 6 < len(row):
            panneau = row.iloc[idx]
            if pd.isna(panneau):
                break
            nom = row.iloc[idx + 2]
            prenom = row.iloc[idx + 3]
            voix = int(row.iloc[idx + 4]) if pd.notna(row.iloc[idx + 4]) else 0
            pct_exp = float(row.iloc[idx + 6]) if pd.notna(row.iloc[idx + 6]) else 0

            nuance = PRES_2022_CANDIDATES.get(nom, "DIV")
            bloc = NUANCE_BLOC.get(nuance, "Divers")
            candidates.append({
                "name": f"{prenom} {nom}",
                "nuance": nuance,
                "bloc": bloc,
                "voix": voix,
                "pct": pct_exp,
            })
            idx += 7

        results[insee] = {
            "commune_name": commune_name,
            "inscrits": inscrits,
            "votants": votants,
            "exprimes": exprimes,
            "turnout": turnout,
            "candidates": candidates,
        }

    return results


def parse_legis_2024(target_insees):
    """Parse législatives 2024 T1 CSV."""
    filepath = os.path.join(DATA_DIR, "legis_2024_t1_communes.csv")
    results = {}

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        headers = next(reader)

        for row in reader:
            if len(row) < 18:
                continue
            dept = row[0].zfill(2)
            commune_code = row[2].zfill(5)
            if len(commune_code) == 5 and commune_code[:2] == dept:
                insee = commune_code
            else:
                insee = dept + commune_code.zfill(3)

            if insee not in target_insees:
                continue

            commune_name = row[3]
            inscrits = int(row[4]) if row[4] else 0
            votants = int(row[5]) if row[5] else 0

            def parse_pct(s):
                if not s:
                    return 0
                return float(s.replace(",", ".").replace("%", ""))

            exprimes = int(row[9]) if row[9] else 0
            turnout = parse_pct(row[6])

            candidates = []
            idx = 18
            while idx + 8 < len(row):
                panneau = row[idx]
                if not panneau:
                    break
                nuance = row[idx + 1]
                nom = row[idx + 2]
                prenom = row[idx + 3]
                voix = int(row[idx + 5]) if row[idx + 5] else 0
                pct_exp = parse_pct(row[idx + 7])
                elu = row[idx + 8] if idx + 8 < len(row) else ""

                bloc = NUANCE_BLOC.get(nuance, "Divers")
                candidates.append({
                    "name": f"{prenom} {nom}",
                    "nuance": nuance,
                    "bloc": bloc,
                    "voix": voix,
                    "pct": pct_exp,
                })
                idx += 9

            results[insee] = {
                "commune_name": commune_name,
                "inscrits": inscrits,
                "votants": votants,
                "exprimes": exprimes,
                "turnout": turnout,
                "candidates": candidates,
            }

    return results


def parse_euro_2024(target_insees):
    """Parse européennes 2024 CSV."""
    filepath = os.path.join(DATA_DIR, "euro_2024_communes.csv")
    results = {}

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        headers = next(reader)

        for row in reader:
            if len(row) < 18:
                continue
            dept = row[0].zfill(2)
            commune_code = row[2].zfill(5)
            if len(commune_code) == 5 and commune_code[:2] == dept:
                insee = commune_code
            else:
                insee = dept + commune_code.zfill(3)

            if insee not in target_insees:
                continue

            commune_name = row[3]
            inscrits = int(row[4]) if row[4] else 0
            votants = int(row[5]) if row[5] else 0

            def parse_pct(s):
                if not s:
                    return 0
                return float(s.replace(",", ".").replace("%", ""))

            exprimes = int(row[9]) if row[9] else 0
            turnout = parse_pct(row[6])

            candidates = []
            idx = 18
            while idx + 7 < len(row):
                panneau = row[idx]
                if not panneau:
                    break
                nuance = row[idx + 1]
                label_short = row[idx + 2]
                label_full = row[idx + 3]
                voix = int(row[idx + 4]) if row[idx + 4] else 0
                pct_exp = parse_pct(row[idx + 6])

                bloc = NUANCE_BLOC.get(nuance, "Divers")
                candidates.append({
                    "name": label_short,
                    "nuance": nuance,
                    "bloc": bloc,
                    "voix": voix,
                    "pct": pct_exp,
                })
                idx += 8

            results[insee] = {
                "commune_name": commune_name,
                "inscrits": inscrits,
                "votants": votants,
                "exprimes": exprimes,
                "turnout": turnout,
                "candidates": candidates,
            }

    return results


def parse_municipales(target_insees):
    """Parse municipales from existing parquet files (full candidate data)."""
    try:
        import duckdb
    except ImportError:
        print("  duckdb not installed, skipping municipales full data")
        return {}

    candidats_path = os.path.join(DATA_DIR, "candidats_results.parquet")
    general_path = os.path.join(DATA_DIR, "general_results.parquet")

    if not os.path.exists(candidats_path):
        print("  Downloading candidats_results.parquet...")
        import requests
        r = requests.get(
            "https://object.files.data.gouv.fr/data-pipeline-open/elections/candidats_results.parquet",
            stream=True,
        )
        with open(candidats_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=65536):
                f.write(chunk)

    if not os.path.exists(general_path):
        print("  Downloading general_results.parquet...")
        import requests
        r = requests.get(
            "https://object.files.data.gouv.fr/data-pipeline-open/elections/general_results.parquet",
            stream=True,
        )
        with open(general_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=65536):
                f.write(chunk)

    PLM_MAP = {"75056": "75", "69123": "69", "13055": "13"}
    plm_arr_to_city = {}
    for insee in target_insees:
        if insee.startswith("75") and len(insee) == 5 and insee != "75056":
            plm_arr_to_city[insee] = ("75056", insee[3:].lstrip("0").zfill(2))
        elif insee.startswith("69") and len(insee) == 5 and int(insee) >= 69381:
            arr_num = int(insee) - 69380
            plm_arr_to_city[insee] = ("69123", str(arr_num).zfill(2))
        elif insee.startswith("13") and len(insee) == 5 and int(insee) >= 13201:
            arr_num = int(insee) - 13200
            plm_arr_to_city[insee] = ("13055", str(arr_num).zfill(2))

    con = duckdb.connect()
    results = {}

    non_plm = [i for i in target_insees if i not in plm_arr_to_city]
    if non_plm:
        placeholders = ",".join(f"'{i}'" for i in non_plm)
        query = f"""
            WITH mun AS (
                SELECT
                    code_commune,
                    CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                    CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                    "Nuance" AS nuance,
                    COALESCE(NULLIF(nom_tete_liste, ''), nom || ' ' || prenom) AS candidate_name,
                    SUM(voix) AS total_voix
                FROM read_parquet('{candidats_path}')
                WHERE id_election LIKE '%muni%'
                  AND code_commune IN ({placeholders})
                GROUP BY code_commune, year, tour, nuance, candidate_name
            ),
            latest_year AS (
                SELECT code_commune, MAX(year) AS year FROM mun GROUP BY code_commune
            ),
            decisive AS (
                SELECT m.code_commune, m.year, MAX(m.tour) AS tour
                FROM mun m JOIN latest_year ly ON m.code_commune = ly.code_commune AND m.year = ly.year
                GROUP BY m.code_commune, m.year
            )
            SELECT m.code_commune, m.year, m.nuance, m.candidate_name, m.total_voix
            FROM mun m
            JOIN decisive d ON m.code_commune = d.code_commune AND m.year = d.year AND m.tour = d.tour
            ORDER BY m.code_commune, m.total_voix DESC
        """
        rows = con.execute(query).fetchall()

        gen_query = f"""
            WITH mun AS (
                SELECT
                    code_commune, libelle_commune,
                    CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                    CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                    SUM(inscrits) AS inscrits, SUM(votants) AS votants, SUM(exprimes) AS exprimes
                FROM read_parquet('{general_path}')
                WHERE id_election LIKE '%muni%'
                  AND code_commune IN ({placeholders})
                GROUP BY code_commune, libelle_commune, year, tour
            ),
            latest_year AS (
                SELECT code_commune, MAX(year) AS year FROM mun GROUP BY code_commune
            ),
            decisive AS (
                SELECT m.code_commune, m.year, MAX(m.tour) AS tour
                FROM mun m JOIN latest_year ly ON m.code_commune = ly.code_commune AND m.year = ly.year
                GROUP BY m.code_commune, m.year
            )
            SELECT m.code_commune, m.libelle_commune, m.year, m.inscrits, m.votants, m.exprimes
            FROM mun m
            JOIN decisive d ON m.code_commune = d.code_commune AND m.year = d.year AND m.tour = d.tour
        """
        gen_rows = con.execute(gen_query).fetchall()

        gen_map = {}
        for r in gen_rows:
            gen_map[r[0]] = {
                "commune_name": r[1], "year": r[2],
                "inscrits": r[3] or 0, "votants": r[4] or 0, "exprimes": r[5] or 0,
            }

        commune_candidates = {}
        for r in rows:
            code, year, nuance, name, voix = r
            commune_candidates.setdefault(code, []).append({
                "year": year, "nuance": nuance or "DIV", "name": name or "Inconnu", "voix": voix or 0,
            })

        for code, cands in commune_candidates.items():
            gen = gen_map.get(code, {})
            exprimes = gen.get("exprimes", 0)
            total_voix = sum(c["voix"] for c in cands)
            base = exprimes if exprimes > 0 else total_voix
            candidates = []
            for c in cands:
                bloc = NUANCE_BLOC.get(c["nuance"], "Divers")
                pct = round(c["voix"] * 100 / base, 2) if base > 0 else 0
                candidates.append({
                    "name": c["name"], "nuance": c["nuance"], "bloc": bloc,
                    "voix": c["voix"], "pct": pct,
                })
            turnout = round(gen.get("votants", 0) * 100 / gen.get("inscrits", 1), 2) if gen.get("inscrits", 0) > 0 else 0
            results[code] = {
                "commune_name": gen.get("commune_name", code),
                "year": gen.get("year", 2020),
                "inscrits": gen.get("inscrits", 0),
                "votants": gen.get("votants", 0),
                "exprimes": exprimes,
                "turnout": turnout,
                "candidates": candidates,
            }

    for arr_insee, (city_code, arr_num) in plm_arr_to_city.items():
        query = f"""
            WITH mun AS (
                SELECT
                    code_commune,
                    LEFT(code_bv, 2) AS arr,
                    CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                    CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                    "Nuance" AS nuance,
                    COALESCE(NULLIF(nom_tete_liste, ''), nom || ' ' || prenom) AS candidate_name,
                    SUM(voix) AS total_voix
                FROM read_parquet('{candidats_path}')
                WHERE id_election LIKE '%muni%'
                  AND code_commune = '{city_code}'
                  AND LEFT(code_bv, 2) = '{arr_num}'
                GROUP BY code_commune, arr, year, tour, nuance, candidate_name
            ),
            latest_year AS (
                SELECT MAX(year) AS year FROM mun
            ),
            decisive AS (
                SELECT m.year, MAX(m.tour) AS tour
                FROM mun m JOIN latest_year ly ON m.year = ly.year
                GROUP BY m.year
            )
            SELECT m.year, m.nuance, m.candidate_name, m.total_voix
            FROM mun m
            JOIN decisive d ON m.year = d.year AND m.tour = d.tour
            ORDER BY m.total_voix DESC
        """
        rows = con.execute(query).fetchall()
        if not rows:
            continue

        gen_query = f"""
            WITH mun AS (
                SELECT
                    code_commune, LEFT(code_bv, 2) AS arr,
                    CAST(LEFT(id_election, 4) AS INTEGER) AS year,
                    CASE WHEN id_election LIKE '%_t2' THEN 2 ELSE 1 END AS tour,
                    SUM(inscrits) AS inscrits, SUM(votants) AS votants, SUM(exprimes) AS exprimes
                FROM read_parquet('{general_path}')
                WHERE id_election LIKE '%muni%'
                  AND code_commune = '{city_code}'
                  AND LEFT(code_bv, 2) = '{arr_num}'
                GROUP BY code_commune, arr, year, tour
            ),
            latest_year AS (SELECT MAX(year) AS year FROM mun),
            decisive AS (
                SELECT m.year, MAX(m.tour) AS tour FROM mun m JOIN latest_year ly ON m.year = ly.year GROUP BY m.year
            )
            SELECT m.year, m.inscrits, m.votants, m.exprimes
            FROM mun m JOIN decisive d ON m.year = d.year AND m.tour = d.tour
        """
        gen_rows = con.execute(gen_query).fetchall()
        gen = gen_rows[0] if gen_rows else (2020, 0, 0, 0)

        year = rows[0][0]
        exprimes = gen[3] or 0
        total_voix = sum(r[3] for r in rows)
        base = exprimes if exprimes > 0 else total_voix

        candidates = []
        for r in rows:
            nuance = r[1] or "DIV"
            bloc = NUANCE_BLOC.get(nuance, "Divers")
            pct = round(r[3] * 100 / base, 2) if base > 0 else 0
            candidates.append({
                "name": r[2], "nuance": nuance, "bloc": bloc,
                "voix": r[3], "pct": pct,
            })

        turnout = round(gen[2] * 100 / gen[1], 2) if gen[1] > 0 else 0
        results[arr_insee] = {
            "commune_name": f"Arrondissement {arr_num}",
            "year": year,
            "inscrits": gen[1] or 0,
            "votants": gen[2] or 0,
            "exprimes": exprimes,
            "turnout": turnout,
            "candidates": candidates,
        }

    con.close()
    return results


def aggregate_by_bloc(candidates):
    """Sum percentages by bloc."""
    bloc_pct = {}
    for c in candidates:
        bloc_pct[c["bloc"]] = bloc_pct.get(c["bloc"], 0) + c["pct"]
    return bloc_pct


def find_winner(candidates):
    """Find the candidate/list with the most votes."""
    if not candidates:
        return None
    return max(candidates, key=lambda c: c["voix"])


def compute_political_score(commune_elections):
    """
    Compute political scoring for a commune.
    commune_elections: dict of election_type → {candidates, turnout, ...}
    Returns: {bloc → score}, winner per election, etc.
    """
    bloc_scores = {b: 0 for b in BLOCS_ORDER}
    details = []

    for election_type, data in commune_elections.items():
        if not data or not data.get("candidates"):
            continue

        weights = SCORING_WEIGHTS[election_type]
        winner_bonus = weights["winner_bonus"]
        share_mult = weights["share_multiplier"]

        winner = find_winner(data["candidates"])
        bloc_pcts = aggregate_by_bloc(data["candidates"])

        for bloc, pct in bloc_pcts.items():
            if bloc in bloc_scores:
                share_contribution = (pct / 100) * share_mult
                bloc_scores[bloc] += share_contribution

        if winner:
            winner_bloc = winner["bloc"]
            if winner_bloc in bloc_scores:
                bloc_scores[winner_bloc] += winner_bonus

        details.append({
            "election": election_type,
            "winner": winner,
            "bloc_pcts": bloc_pcts,
            "turnout": data.get("turnout", 0),
        })

    total = sum(bloc_scores.values())
    bloc_pcts_final = {}
    if total > 0:
        bloc_pcts_final = {b: round(s / total * 100, 1) for b, s in bloc_scores.items() if s > 0}

    sorted_blocs = sorted(bloc_scores.items(), key=lambda x: -x[1])
    dominant = sorted_blocs[0] if sorted_blocs else ("Divers", 0)
    second = sorted_blocs[1] if len(sorted_blocs) > 1 else ("", 0)

    dominant_pct = dominant[1] / total * 100 if total > 0 else 0
    if dominant_pct > 60:
        classification = f"Ancré {dominant[0]}"
    elif dominant_pct > 40:
        classification = f"Tendance {dominant[0]}"
    else:
        classification = f"Partagé ({dominant[0]} / {second[0]})"

    return {
        "bloc_scores": bloc_scores,
        "bloc_pcts": bloc_pcts_final,
        "dominant_bloc": dominant[0],
        "dominant_pct": round(dominant_pct, 1),
        "classification": classification,
        "details": details,
        "total_score": total,
    }


def print_results(postal, commune_name, insee, scoring, elections):
    """Pretty-print results for one commune."""
    print(f"\n{'='*80}")
    print(f"  {commune_name} ({postal} / INSEE {insee})")
    print(f"{'='*80}")

    for detail in scoring["details"]:
        election = detail["election"]
        winner = detail["winner"]
        turnout = detail["turnout"]
        print(f"\n  {election.upper().replace('_', ' ')} (participation: {turnout:.1f}%)")

        if winner:
            print(f"    Vainqueur: {winner['name']} ({winner['nuance']} → {winner['bloc']}) — {winner['pct']:.1f}%")

        bloc_pcts = detail["bloc_pcts"]
        for bloc in BLOCS_ORDER:
            if bloc in bloc_pcts and bloc_pcts[bloc] > 0:
                bar = "█" * int(bloc_pcts[bloc] / 2)
                print(f"    {bloc:20s} {bloc_pcts[bloc]:5.1f}% {bar}")

    print(f"\n  ── SCORING ──")
    print(f"  Points par bloc:")
    for bloc in BLOCS_ORDER:
        score = scoring["bloc_scores"].get(bloc, 0)
        if score > 0:
            pct = scoring["bloc_pcts"].get(bloc, 0)
            bar = "█" * int(pct / 2)
            print(f"    {bloc:20s} {score:6.2f} pts ({pct:4.1f}%) {bar}")

    print(f"\n  → ORIENTATION: {scoring['classification']}")
    print(f"    (bloc dominant: {scoring['dominant_bloc']} à {scoring['dominant_pct']:.1f}%)")


def main():
    print("="*80)
    print("  TEST DE SCORING POLITIQUE — 8 COMMUNES")
    print("="*80)

    print("\n1. Résolution des codes postaux → INSEE...")
    postal_map = resolve_postal_to_insee()
    for postal, info in postal_map.items():
        print(f"  {postal} → {info['insee']} ({info['name']})")

    target_insees = set(info["insee"] for info in postal_map.values())

    # For PLM arrondissements, also search city-level codes
    PLM_CITY_CODES = {"75056": "75", "69123": "69", "13055": "13"}
    plm_arr_to_city = {}
    for insee in target_insees:
        if insee.startswith("75") and insee != "75056" and len(insee) == 5:
            plm_arr_to_city[insee] = "75056"
        elif insee.startswith("69") and int(insee) >= 69381 and int(insee) <= 69389:
            plm_arr_to_city[insee] = "69123"
        elif insee.startswith("13") and int(insee) >= 13201 and int(insee) <= 13216:
            plm_arr_to_city[insee] = "13055"

    extended_insees = target_insees | set(plm_arr_to_city.values())

    print(f"\n2. Parsing présidentielles 2022 T1...")
    pres = parse_pres_2022(extended_insees)
    print(f"   → {len(pres)} communes trouvées")
    # Map city-level PLM data to arrondissements
    for arr_insee, city_insee in plm_arr_to_city.items():
        if arr_insee not in pres and city_insee in pres:
            pres[arr_insee] = pres[city_insee]
            print(f"   → {arr_insee} mapped from city-level {city_insee}")

    print(f"\n3. Parsing législatives 2024 T1...")
    legis = parse_legis_2024(extended_insees)
    print(f"   → {len(legis)} communes trouvées")
    for arr_insee, city_insee in plm_arr_to_city.items():
        if arr_insee not in legis and city_insee in legis:
            legis[arr_insee] = legis[city_insee]
            print(f"   → {arr_insee} mapped from city-level {city_insee}")

    print(f"\n4. Parsing européennes 2024...")
    euro = parse_euro_2024(extended_insees)
    print(f"   → {len(euro)} communes trouvées")
    for arr_insee, city_insee in plm_arr_to_city.items():
        if arr_insee not in euro and city_insee in euro:
            euro[arr_insee] = euro[city_insee]
            print(f"   → {arr_insee} mapped from city-level {city_insee}")

    print(f"\n5. Parsing municipales (parquet)...")
    mun = parse_municipales(target_insees)
    print(f"   → {len(mun)} communes trouvées")

    print(f"\n6. Calcul du scoring...")

    for postal, info in sorted(postal_map.items()):
        insee = info["insee"]
        commune_name = info["name"]

        commune_elections = {}
        if insee in mun:
            commune_elections["municipales"] = mun[insee]
        if insee in pres:
            commune_elections["presidentielles_t1"] = pres[insee]
        if insee in legis:
            commune_elections["legislatives_t1"] = legis[insee]
        if insee in euro:
            commune_elections["europeennes"] = euro[insee]

        if not commune_elections:
            print(f"\n  {commune_name} ({postal}): AUCUNE DONNÉE")
            continue

        scoring = compute_political_score(commune_elections)
        print_results(postal, commune_name, insee, scoring, commune_elections)


if __name__ == "__main__":
    main()
