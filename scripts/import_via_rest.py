#!/usr/bin/env python3
"""
Import real election data from seed_real_data.sql to Supabase via REST API.
Parses SQL INSERT statements and sends data as JSON via PostgREST.
"""
import re
import json
import sys
import time
import requests

SUPABASE_URL = "https://fxdtixmjjnfyicvshvxa.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZHRpeG1qam5meWljdnNodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDUzNTMsImV4cCI6MjA4NjgyMTM1M30.liHNdNh3aqi_Zt1gmXktyICgxJZdHB8644qF54eTxrQ"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

BATCH_SIZE = 500

COMMUNE_COLS = ["id", "insee", "zipcode", "name", "department", "lat", "lng", "stability", "current_mayor"]
ELECTION_COLS = ["commune_id", "year", "winner_nuance", "winner_name", "score", "turnout"]


def parse_sql_value(val: str):
    """Parse a single SQL value (string, number, or NULL)."""
    val = val.strip()
    if val == "NULL":
        return None
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1].replace("''", "'")
    if "." in val:
        return float(val)
    return int(val)


def parse_row(line: str) -> list:
    """Parse a single VALUES row like ('a','b',1.5,'c')."""
    line = line.strip().rstrip(",")
    if not line.startswith("(") or not line.endswith(")"):
        return None
    inner = line[1:-1]

    values = []
    current = ""
    in_quote = False
    i = 0
    while i < len(inner):
        ch = inner[i]
        if in_quote:
            if ch == "'" and i + 1 < len(inner) and inner[i + 1] == "'":
                current += "''"
                i += 2
                continue
            elif ch == "'":
                current += "'"
                in_quote = False
            else:
                current += ch
        else:
            if ch == "'":
                current += "'"
                in_quote = True
            elif ch == ",":
                values.append(parse_sql_value(current))
                current = ""
            else:
                current += ch
        i += 1
    if current:
        values.append(parse_sql_value(current))
    return values


def parse_sql_file(filepath: str):
    """Parse the SQL file and return communes and election results."""
    communes = []
    elections = []

    with open(filepath, "r") as f:
        current_table = None
        for line in f:
            line = line.rstrip("\n")
            if line.startswith("INSERT INTO communes"):
                current_table = "communes"
                continue
            elif line.startswith("INSERT INTO election_results"):
                current_table = "elections"
                continue

            if current_table and line.strip().startswith("("):
                row = parse_row(line)
                if row:
                    if current_table == "communes" and len(row) == len(COMMUNE_COLS):
                        communes.append(dict(zip(COMMUNE_COLS, row)))
                    elif current_table == "elections" and len(row) == len(ELECTION_COLS):
                        elections.append(dict(zip(ELECTION_COLS, row)))

    return communes, elections


def upsert_batch(table: str, batch: list) -> bool:
    """Send a batch of rows to the PostgREST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=HEADERS, json=batch)
    if resp.status_code not in (200, 201):
        print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
        return False
    return True


def fetch_commune_ids() -> set:
    """Fetch all commune IDs currently in the database."""
    ids = set()
    url = f"{SUPABASE_URL}/rest/v1/communes?select=id"
    offset = 0
    while True:
        resp = requests.get(url, headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Range": f"{offset}-{offset + 999}",
        })
        rows = resp.json()
        if not rows:
            break
        for r in rows:
            ids.add(r["id"])
        offset += len(rows)
        if len(rows) < 1000:
            break
    return ids


def main():
    sql_path = "supabase/seed_real_data.sql"
    print(f"Parsing {sql_path}...")
    communes, elections = parse_sql_file(sql_path)
    print(f"  Parsed {len(communes)} communes, {len(elections)} election results")

    if not communes:
        print("No data found. Aborting.")
        sys.exit(1)

    # Check if communes already loaded
    existing_ids = fetch_commune_ids()
    if len(existing_ids) >= len(communes) - 10:
        print(f"\n{len(existing_ids)} communes already in DB, skipping commune insert.")
    else:
        print(f"\nInserting {len(communes)} communes...")
        ok = 0
        for i in range(0, len(communes), BATCH_SIZE):
            batch = communes[i : i + BATCH_SIZE]
            if upsert_batch("communes", batch):
                ok += len(batch)
            else:
                print(f"  Failed at batch starting at index {i}")
                break
            pct = (i + len(batch)) / len(communes) * 100
            print(f"  {ok}/{len(communes)} ({pct:.0f}%)")
            time.sleep(0.1)
        print(f"  Done: {ok} communes inserted.")
        existing_ids = fetch_commune_ids()

    # Filter elections to only those with valid commune_ids
    valid_elections = [e for e in elections if e["commune_id"] in existing_ids]
    skipped = len(elections) - len(valid_elections)
    if skipped > 0:
        print(f"\n  Skipping {skipped} election results with missing commune references")

    print(f"\nInserting {len(valid_elections)} election results...")
    ok = 0
    failed = 0
    for i in range(0, len(valid_elections), BATCH_SIZE):
        batch = valid_elections[i : i + BATCH_SIZE]
        if upsert_batch("election_results", batch):
            ok += len(batch)
        else:
            failed += 1
            if failed > 3:
                print("  Too many failures, aborting.")
                break
            continue
        pct = (i + len(batch)) / len(valid_elections) * 100
        print(f"  {ok}/{len(valid_elections)} ({pct:.0f}%)")
        time.sleep(0.1)
    print(f"  Done: {ok} election results inserted.")


if __name__ == "__main__":
    main()
