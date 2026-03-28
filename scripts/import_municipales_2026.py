#!/usr/bin/env python3
"""
Import 2026 French municipal election results (both rounds) into Supabase.

Source: https://www.data.gouv.fr/datasets/elections-municipales-2026-resultats-du-premier-tour
        https://www.data.gouv.fr/datasets/elections-municipales-2026-resultats-du-second-tour

Downloads four CSV files:
  - T1 Résultats par communes (all communes — first round)
  - T2 Résultats par communes (second round only — overwrites T1)
  - T1 Résultats par secteurs (Paris/Lyon/Marseille first round)
  - T2 Résultats par secteurs (Paris/Lyon/Marseille second round — overwrites T1)

Generates: supabase/seed_municipales_2026.sql
Then optionally pushes to Supabase.

Usage:
    pip install requests psycopg2-binary
    python3 scripts/import_municipales_2026.py [--push <DB_PASSWORD>]
"""

import csv
import os
import sys
import uuid
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

T1_COMMUNES_URL = "https://www.data.gouv.fr/api/1/datasets/r/4feeef01-24f7-4d5a-914f-8aa806f31ec2"
T2_COMMUNES_URL = "https://www.data.gouv.fr/api/1/datasets/r/6ff67a28-01bf-459e-beca-dd7aa8132dc1"
T1_SECTEURS_URL = "https://www.data.gouv.fr/api/1/datasets/r/46a6a820-f9fa-42ab-9486-f536568a1350"
T2_SECTEURS_URL = "https://www.data.gouv.fr/api/1/datasets/r/966a28fb-8de6-4a6d-a32f-5595388e7a76"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "supabase", "seed_municipales_2026.sql")

YEAR = 2026
ELECTION_TYPE = "municipales"

# PLM arrondissement mapping: sector code prefix → arrondissement INSEE codes
PLM_CITIES = {
    "75056": {"name": "Paris", "arr_offset": 75100},
    "69123": {"name": "Lyon", "arr_offset": 69380},
    "13055": {"name": "Marseille", "arr_offset": 13200},
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
    "REM": "Centre-droit", "LREM": "Centre-droit", "REN": "Centre-droit",
    "LREN": "Centre-droit", "ENS": "Centre-droit",
    "LENS": "Centre-droit", "HOR": "Centre-droit", "LHOR": "Centre-droit",
    "EM": "Centre-droit",
    "MAJ": "Centre-droit", "LMAJ": "Centre-droit", "LMP": "Centre-droit",
    "LMMD": "Centre-droit", "M": "Centre-droit", "M-NC": "Centre-droit",
    "UMP": "Droite", "LUMP": "Droite", "LR": "Droite", "LLR": "Droite",
    "DVD": "Droite", "LDVD": "Droite", "LUD": "Droite", "LUDR": "Droite",
    "UDFD": "Droite", "MPF": "Droite", "UD": "Droite", "RPR": "Droite",
    "DL": "Droite", "FRS": "Droite",
    "FN": "Extrême-droite", "LFN": "Extrême-droite", "RN": "Extrême-droite",
    "LRN": "Extrême-droite", "EXD": "Extrême-droite", "LEXD": "Extrême-droite",
    "DXD": "Extrême-droite", "DSV": "Extrême-droite", "LDSV": "Extrême-droite",
    "DLF": "Extrême-droite", "LDLF": "Extrême-droite", "DLR": "Extrême-droite",
    "LDLR": "Extrême-droite", "REC": "Extrême-droite", "LREC": "Extrême-droite",
    "LUXD": "Extrême-droite", "UXD": "Extrême-droite", "MNR": "Extrême-droite",
    "DIV": "Divers", "LDIV": "Divers", "REG": "Divers", "LREG": "Divers",
    "AUT": "Divers", "LAUT": "Divers", "CPNT": "Divers", "LGJ": "Divers",
    "LNC": "Divers", "SP": "Divers", "UPR": "Divers", "LDV": "Divers",
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


def parse_pct(s):
    """Parse French percentage string like '43,65%' → 43.65"""
    if not s or not s.strip():
        return 0.0
    return float(s.strip().replace(",", ".").replace("%", "").replace('"', ''))


def download_file(url, dest):
    if os.path.exists(dest):
        size_kb = os.path.getsize(dest) / 1024
        print(f"  Cached: {os.path.basename(dest)} ({size_kb:.0f} KB)")
        return
    print(f"  Downloading {os.path.basename(dest)}...")
    r = requests.get(url, stream=True)
    r.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in r.iter_content(chunk_size=65536):
            f.write(chunk)
    print(f"  → {os.path.getsize(dest) / 1024:.0f} KB")


def extract_winner_from_row(row, header):
    """Extract the winner (highest score candidate/list) from a wide-format row.

    Column layout per candidate group (stride=13 for communes, 11 for secteurs):
      panneau, nom, prénom, sexe, nuance, libellé_abrégé, libellé,
      voix, %voix/inscrits, %voix/exprimés, élu, [sièges_CM, sièges_CC]

    In small communes (T1), candidate name may be empty — use list label instead.
    """
    best_score = -1
    best = None

    # Find all candidate groups by looking for 'Numéro de panneau N' pattern
    panneau_cols = []
    for i, h in enumerate(header):
        if h.startswith("Numéro de panneau "):
            panneau_cols.append(i)

    if not panneau_cols:
        return None

    # Determine column stride
    stride = panneau_cols[1] - panneau_cols[0] if len(panneau_cols) > 1 else 13

    for panneau_col in panneau_cols:
        # Skip if no panneau number (empty candidate slot)
        if panneau_col >= len(row) or not row[panneau_col].strip():
            continue

        name_col = panneau_col + 1      # "Nom candidat N"
        prenom_col = panneau_col + 2    # "Prénom candidat N"
        nuance_col = panneau_col + 4    # "Nuance liste N"
        label_col = panneau_col + 5     # "Libellé abrégé de liste N"
        score_col = panneau_col + 9     # "% Voix/exprimés N"

        if score_col >= len(row) or not row[score_col].strip():
            continue

        score = parse_pct(row[score_col])
        if score > best_score:
            best_score = score
            nom = row[name_col].strip() if name_col < len(row) else ""
            prenom = row[prenom_col].strip() if prenom_col < len(row) else ""
            label = row[label_col].strip() if label_col < len(row) else ""
            nuance = row[nuance_col].strip() if nuance_col < len(row) else ""

            # Use candidate name if available, otherwise list label
            if nom:
                candidate_name = f"{nom} {prenom}".strip()
            else:
                candidate_name = label or "Liste sans nom"

            best = {
                "name": candidate_name,
                "nuance": nuance or "DIV",
                "score": best_score,
            }

    return best


def parse_secteur_insee(code_secteur):
    """Convert sector code like '13055SR01' to arrondissement INSEE code."""
    for city_code, info in PLM_CITIES.items():
        if code_secteur.startswith(city_code):
            sector_num = int(code_secteur[-2:])
            return str(info["arr_offset"] + sector_num)
    return None


def parse_commune_csv(csv_path, is_secteur=False):
    """Parse a communes or secteurs CSV and return dict of {insee: result}.

    Returns dict keyed by INSEE code so T2 can overwrite T1.
    """
    results = {}

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        header = next(reader)

        # Strip quotes from header names
        header = [h.strip('"') for h in header]

        if is_secteur:
            col_code = header.index("Code secteur")
        else:
            col_code = header.index("Code commune")
        col_turnout = header.index("% Votants")

        for row in reader:
            if len(row) < 20:
                continue

            if is_secteur:
                code = row[col_code].strip().strip('"')
                insee = parse_secteur_insee(code)
                if not insee:
                    continue
            else:
                insee = row[col_code].strip().strip('"')
                # Skip PLM city-level codes (handled via secteurs)
                if insee in PLM_CITIES:
                    continue

            turnout = parse_pct(row[col_turnout])
            winner = extract_winner_from_row(row, header)
            if winner:
                results[insee] = (insee, winner["name"], winner["nuance"], winner["score"], turnout)

    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    push_mode = "--push" in sys.argv
    db_password = sys.argv[sys.argv.index("--push") + 1] if push_mode else None

    # Step 1: Download CSVs
    print("=== Step 1/5: Downloading CSV files ===")
    t1_communes_csv = os.path.join(DATA_DIR, "municipales_2026_t1_communes.csv")
    t2_communes_csv = os.path.join(DATA_DIR, "municipales_2026_t2_communes.csv")
    t1_secteurs_csv = os.path.join(DATA_DIR, "municipales_2026_t1_secteurs.csv")
    t2_secteurs_csv = os.path.join(DATA_DIR, "municipales_2026_t2_secteurs.csv")

    download_file(T1_COMMUNES_URL, t1_communes_csv)
    download_file(T2_COMMUNES_URL, t2_communes_csv)
    download_file(T1_SECTEURS_URL, t1_secteurs_csv)
    download_file(T2_SECTEURS_URL, t2_secteurs_csv)

    # Step 2: Parse T1 results (all communes)
    print("\n=== Step 2/5: Parsing T1 results (all communes) ===")
    results = parse_commune_csv(t1_communes_csv, is_secteur=False)
    print(f"  → {len(results)} T1 commune results")

    plm_t1 = parse_commune_csv(t1_secteurs_csv, is_secteur=True)
    results.update(plm_t1)
    print(f"  → {len(plm_t1)} T1 PLM arrondissement results")

    # Step 3: Parse T2 results (overwrites T1 for communes that went to second round)
    print("\n=== Step 3/5: Parsing T2 results (overwrites T1) ===")
    t2_communes = parse_commune_csv(t2_communes_csv, is_secteur=False)
    results.update(t2_communes)
    print(f"  → {len(t2_communes)} T2 commune results (overwrite T1)")

    plm_t2 = parse_commune_csv(t2_secteurs_csv, is_secteur=True)
    results.update(plm_t2)
    print(f"  → {len(plm_t2)} T2 PLM arrondissement results (overwrite T1)")

    print(f"  → {len(results)} total unique results")

    # Step 4: Generate SQL
    print(f"\n=== Step 4/5: Generating SQL → {OUTPUT_PATH} ===")

    # Collect nuances
    all_nuances = set()
    for _, _, nuance, _, _ in results.values():
        all_nuances.add(nuance)

    new_nuances = {n for n in all_nuances if n not in NUANCE_BLOC}
    if new_nuances:
        print(f"  WARNING: Unknown nuances mapped to 'Divers': {sorted(new_nuances)}")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- ==========================================================\n")
        f.write("-- Municipales 2026 — T1 + T2 results\n")
        f.write("-- Generated by scripts/import_municipales_2026.py\n")
        f.write("-- ==========================================================\n\n")
        f.write("BEGIN;\n\n")

        # Upsert nuances
        nuances_to_insert = set()
        for nuance in all_nuances:
            bloc = NUANCE_BLOC.get(nuance, "Divers")
            nuances_to_insert.add((nuance, bloc))

        f.write("-- Upsert nuances\n")
        for nuance, bloc in sorted(nuances_to_insert):
            f.write(
                f"INSERT INTO nuances (code, label, bloc) VALUES ({escape_sql(nuance)}, {escape_sql(nuance)}, {escape_sql(bloc)})\n"
                f"  ON CONFLICT (code) DO NOTHING;\n"
            )
        f.write("\n")

        # Upsert election results (only for communes that exist in DB)
        f.write("-- Upsert 2026 municipales results\n")
        f.write("-- Uses subquery to skip communes not in DB\n")
        inserted = 0
        for insee in sorted(results.keys()):
            _, winner_name, nuance, score, turnout = results[insee]
            commune_uuid = make_uuid(insee)
            f.write(
                f"INSERT INTO election_results (commune_id, year, election_type, winner_nuance, winner_name, score, turnout)\n"
                f"  SELECT {escape_sql(commune_uuid)}, {YEAR}, {escape_sql(ELECTION_TYPE)}, "
                f"{escape_sql(nuance)}, {escape_sql(winner_name)}, {score}, {turnout}\n"
                f"  WHERE EXISTS (SELECT 1 FROM communes WHERE id = {escape_sql(commune_uuid)})\n"
                f"  ON CONFLICT (commune_id, year, election_type) DO UPDATE SET\n"
                f"    winner_nuance = EXCLUDED.winner_nuance,\n"
                f"    winner_name = EXCLUDED.winner_name,\n"
                f"    score = EXCLUDED.score,\n"
                f"    turnout = EXCLUDED.turnout;\n"
            )
            inserted += 1

        f.write("\n")

        # Update stability for communes with municipal elections
        f.write("-- Update stability for communes with municipal results\n")
        f.write("""
UPDATE communes SET stability = sub.new_stability
FROM (
    SELECT
        c.id,
        CASE
            WHEN COUNT(DISTINCT n.bloc) FILTER (WHERE er.election_type = 'municipales') <= 1
                 AND COUNT(*) FILTER (WHERE er.election_type = 'municipales') >= 2
            THEN 'FORTERESSE'
            ELSE 'EN BALLOTTAGE'
        END AS new_stability
    FROM communes c
    JOIN election_results er ON er.commune_id = c.id
    LEFT JOIN nuances n ON n.code = er.winner_nuance
    WHERE er.election_type = 'municipales'
    GROUP BY c.id
) sub
WHERE communes.id = sub.id
  AND communes.stability IS DISTINCT FROM sub.new_stability;
""")

        # Update current_mayor from 2026 results
        f.write("-- Update current_mayor from 2026 results\n")
        f.write("""
UPDATE communes SET current_mayor = sub.winner_name
FROM (
    SELECT er.commune_id, er.winner_name
    FROM election_results er
    WHERE er.year = 2026 AND er.election_type = 'municipales'
) sub
WHERE communes.id = sub.commune_id;
""")

        f.write("\nCOMMIT;\n")

    print(f"  → {inserted} INSERT statements written")
    print(f"  → SQL file: {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH) / 1024:.0f} KB)")

    # Step 5: Optional push to Supabase
    if push_mode and db_password:
        print("\n=== Step 5/5: Pushing to Supabase ===")
        try:
            import psycopg2
        except ImportError:
            print("Error: pip install psycopg2-binary")
            sys.exit(1)

        PROJECT_REF = "fxdtixmjjnfyicvshvxa"
        conn_str = f"postgresql://postgres:{db_password}@db.{PROJECT_REF}.supabase.co:5432/postgres"

        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            sql = f.read()

        print(f"  Connecting to Supabase...")
        conn = psycopg2.connect(conn_str, connect_timeout=15)
        conn.autocommit = False
        cur = conn.cursor()

        print(f"  Executing SQL ({len(sql) / 1024:.0f} KB)...")
        cur.execute(sql)
        conn.commit()

        cur.execute("SELECT COUNT(*) FROM election_results WHERE year = 2026 AND election_type = 'municipales'")
        count = cur.fetchone()[0]
        print(f"  → {count} election results for municipales 2026")

        cur.execute("""
            SELECT n.bloc, COUNT(*)
            FROM election_results er
            JOIN nuances n ON n.code = er.winner_nuance
            WHERE er.year = 2026 AND er.election_type = 'municipales'
            GROUP BY n.bloc
            ORDER BY COUNT(*) DESC
        """)
        print("  Breakdown by bloc:")
        for bloc, cnt in cur.fetchall():
            print(f"    {bloc}: {cnt}")

        cur.close()
        conn.close()
        print("  Done!")
    elif not push_mode:
        print("\n  To push to Supabase, run:")
        print(f"    python3 scripts/import_municipales_2026.py --push <DB_PASSWORD>")


if __name__ == "__main__":
    main()
