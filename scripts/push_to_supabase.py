#!/usr/bin/env python3
"""
Push the generated SQL seed file directly to Supabase via PostgreSQL.
Requires: pip install psycopg2-binary

Usage:
    python3 scripts/push_to_supabase.py <DATABASE_PASSWORD>

Get the password from: Supabase Dashboard → Settings → Database → Database password
"""

import sys
import os
import psycopg2

PROJECT_REF = "fxdtixmjjnfyicvshvxa"
SQL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "supabase", "seed_real_data.sql")

# Supabase direct connection (session mode pooler on port 5432)
CONN_TEMPLATE = "postgresql://postgres.{ref}:{password}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/push_to_supabase.py <DATABASE_PASSWORD>")
        print("\nGet the password from: Supabase Dashboard → Settings → Database")
        sys.exit(1)

    password = sys.argv[1]
    conn_str = CONN_TEMPLATE.format(ref=PROJECT_REF, password=password)

    if not os.path.exists(SQL_FILE):
        print(f"Error: SQL file not found: {SQL_FILE}")
        print("Run scripts/import_real_data.py first.")
        sys.exit(1)

    print(f"Reading SQL file ({os.path.getsize(SQL_FILE) / 1024 / 1024:.1f} MB)...")
    with open(SQL_FILE, "r", encoding="utf-8") as f:
        sql = f.read()

    print(f"Connecting to Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(conn_str, connect_timeout=15)
        conn.autocommit = False
        cur = conn.cursor()

        print("Executing SQL (this may take a minute)...")
        cur.execute(sql)
        conn.commit()

        cur.execute("SELECT COUNT(*) FROM communes")
        communes_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM election_results")
        elections_count = cur.fetchone()[0]

        print(f"\nDone!")
        print(f"  Communes:         {communes_count}")
        print(f"  Election results: {elections_count}")

        cur.close()
        conn.close()

    except psycopg2.OperationalError as e:
        print(f"\nConnection error: {e}")
        print("\nTips:")
        print("  - Check your database password")
        print("  - The region might differ (try eu-central-1, us-east-1, etc.)")
        print("  - Make sure the password is URL-safe (no special chars)")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
