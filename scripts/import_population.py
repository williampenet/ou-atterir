#!/usr/bin/env python3
"""
Fetch commune population from API Geo and generate batched SQL updates.
Output: supabase/seed_population.sql
"""

import json
import os
import sys
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_SQL = os.path.join(PROJECT_DIR, "supabase", "seed_population.sql")
API_URL = "https://geo.api.gouv.fr/communes?fields=population&format=json"
BATCH_SIZE = 500


def main():
    print("Downloading population data from API Geo...")
    with urllib.request.urlopen(API_URL) as resp:
        data = json.loads(resp.read().decode())

    pairs = [
        (c["code"], c["population"])
        for c in data
        if "population" in c and c.get("population") is not None
    ]
    print(f"  {len(pairs)} communes with population data")

    print(f"Writing SQL to {OUTPUT_SQL}...")
    with open(OUTPUT_SQL, "w") as f:
        for i in range(0, len(pairs), BATCH_SIZE):
            batch = pairs[i : i + BATCH_SIZE]
            values = ", ".join(
                f"('{insee}', {pop})" for insee, pop in batch
            )
            f.write(
                f"UPDATE communes AS c SET population = v.pop\n"
                f"FROM (VALUES {values}) AS v(insee, pop)\n"
                f"WHERE c.insee = v.insee;\n\n"
            )

    print(f"Done. {len(pairs)} communes across {(len(pairs) + BATCH_SIZE - 1) // BATCH_SIZE} batches.")
    print(f"Run each statement via Supabase MCP execute_sql or psql.")


if __name__ == "__main__":
    main()
