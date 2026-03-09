#!/usr/bin/env python3
"""Execute Climadiag batch SQL files via Supabase REST API."""

import json
import re
import sys
import time
import urllib.request

SUPABASE_URL = "https://fxdtixmjjnfyicvshvxa.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZHRpeG1qam5meWljdnNodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDUzNTMsImV4cCI6MjA4NjgyMTM1M30.liHNdNh3aqi_Zt1gmXktyICgxJZdHB8644qF54eTxrQ"

COLUMNS = [
    "code_insee", "icu", "s3_ref", "s3_2030", "s3_2050", "s3_2100",
    "s1_ref", "s1_2030", "s1_2050", "s1_2100",
    "s2_ref", "s2_2030", "s2_2050", "s2_2100",
    "s4_ref", "s4_2030", "s4_2050", "s4_2100",
    "r2_ref", "r2_2030", "r2_2050", "r2_2100",
    "r4_ref", "r4_2030", "r4_2050", "r4_2100",
    "r5_ete_ref", "r5_ete_2030", "r5_ete_2050", "r5_ete_2100",
    "g4_ete_ref", "g4_ete_2030", "g4_ete_2050", "g4_ete_2100",
]


def parse_value(val: str):
    val = val.strip()
    if val == "NULL":
        return None
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1]
    try:
        if "." in val:
            return float(val)
        return int(val)
    except ValueError:
        return val


def parse_batch_file(filepath: str) -> list[dict]:
    with open(filepath) as f:
        content = f.read()

    values_start = content.index("VALUES\n") + len("VALUES\n")
    conflict_start = content.index("\nON CONFLICT")
    values_section = content[values_start:conflict_start]

    rows = []
    for match in re.finditer(r"\(([^)]+)\)", values_section):
        values_str = match.group(1)
        values = [parse_value(v) for v in values_str.split(",")]
        if len(values) != len(COLUMNS):
            continue
        row = dict(zip(COLUMNS, values))
        rows.append(row)

    return rows


def upsert_batch(rows: list[dict], batch_size: int = 500) -> int:
    total = 0
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        data = json.dumps(chunk).encode("utf-8")

        url = f"{SUPABASE_URL}/rest/v1/commune_climat?on_conflict=code_insee"
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("apikey", SUPABASE_ANON_KEY)
        req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "resolution=merge-duplicates")

        try:
            resp = urllib.request.urlopen(req)
            total += len(chunk)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  ERROR (HTTP {e.code}): {body[:200]}")
            sys.exit(1)

    return total


def main():
    import os

    base_dir = os.path.join(os.path.dirname(__file__), "..", "data", "climadiag")
    total_inserted = 0

    for batch_num in range(1, 19):
        filename = f"batch_{batch_num:02d}.sql"
        filepath = os.path.join(base_dir, filename)

        if not os.path.exists(filepath):
            print(f"Skipping {filename} (not found)")
            continue

        print(f"Processing {filename}...", end=" ", flush=True)
        start = time.time()
        rows = parse_batch_file(filepath)
        count = upsert_batch(rows)
        elapsed = time.time() - start
        total_inserted += count
        print(f"{count} rows in {elapsed:.1f}s (total: {total_inserted})")

    print(f"\nDone! Total rows upserted: {total_inserted}")


if __name__ == "__main__":
    main()
