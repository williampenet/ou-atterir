#!/usr/bin/env python3
"""
Analyze Géorisques data distribution across a sample of French communes.

Fetches risk data from the Géorisques API (v1, no auth required) for a
representative sample of communes, then outputs distribution statistics
to guide UX decisions.

Usage:
    pip install requests
    python3 scripts/analyze_georisques.py
"""

import requests
import time
import random
import json
import os
from collections import Counter, defaultdict

GEO_API = "https://geo.api.gouv.fr/communes"
GEORISQUES_API = "https://www.georisques.gouv.fr/api/v1/gaspar/risques"

SAMPLE_SIZE = 500
REQUESTS_PER_SECOND = 15

RISK_CATEGORIES = {
    "11": ("Inondation", "climatique"),
    "12": ("Mouvement de terrain", "geologique"),
    "13": ("Séisme", "geologique"),
    "14": ("Avalanche", "geologique"),
    "15": ("Eruption volcanique", "geologique"),
    "16": ("Feu de forêt", "climatique"),
    "17": ("Cyclone/ouragan", "climatique"),
    "18": ("Radon", "geologique"),
    "21": ("Risque industriel", "technologique"),
    "24": ("Transport dangereux", "technologique"),
    "25": ("Engins de guerre", "technologique"),
    "31": ("Affaissement minier", "minier"),
}

POP_BUCKETS = [
    ("< 200 (hameau)", 0, 200),
    ("200-500 (village)", 200, 500),
    ("500-2k (bourg)", 500, 2000),
    ("2k-10k (petite ville)", 2000, 10000),
    ("10k-50k (ville moyenne)", 10000, 50000),
    ("50k+ (grande ville)", 50000, float("inf")),
]


def get_all_communes():
    """Fetch all communes from geo.api.gouv.fr."""
    print("Fetching commune list from geo.api.gouv.fr...")
    r = requests.get(
        GEO_API,
        params={"fields": "code,nom,population,codeDepartement", "limit": 50000},
        headers={"User-Agent": "OuAtterir/1.0"},
        timeout=30,
    )
    r.raise_for_status()
    communes = r.json()
    communes = [c for c in communes if c.get("population") is not None]
    print(f"  → {len(communes)} communes with population data")
    return communes


def sample_communes(communes, n=SAMPLE_SIZE):
    """Stratified sample: proportional to population bucket distribution."""
    by_bucket = defaultdict(list)
    for c in communes:
        pop = c.get("population", 0)
        for label, lo, hi in POP_BUCKETS:
            if lo <= pop < hi:
                by_bucket[label].append(c)
                break

    total = len(communes)
    sampled = []
    for label, lo, hi in POP_BUCKETS:
        bucket = by_bucket[label]
        proportion = len(bucket) / total
        bucket_n = max(10, int(n * proportion))
        picked = random.sample(bucket, min(bucket_n, len(bucket)))
        sampled.extend(picked)
        print(f"  {label}: {len(bucket)} communes → sampled {len(picked)}")

    random.shuffle(sampled)
    return sampled


def fetch_risks(code_insee):
    """Fetch risks for a single commune from Géorisques API."""
    try:
        r = requests.get(
            GEORISQUES_API,
            params={"code_insee": code_insee},
            headers={"User-Agent": "OuAtterir/1.0"},
            timeout=10,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        if data.get("data"):
            return data["data"][0].get("risques_detail", [])
        return []
    except Exception:
        return None


def extract_parent_risks(risques_detail):
    """Keep only parent risk codes (2-digit codes like '11', '12')."""
    parent_codes = set()
    for r in risques_detail:
        code = r.get("num_risque", "")
        if len(code) == 2 and code in RISK_CATEGORIES:
            parent_codes.add(code)
    return parent_codes


def main():
    random.seed(42)

    communes = get_all_communes()

    print(f"\nSampling {SAMPLE_SIZE} communes (stratified by population)...")
    sample = sample_communes(communes, SAMPLE_SIZE)
    print(f"  → Total sampled: {len(sample)}")

    print(f"\nFetching risks from Géorisques API ({REQUESTS_PER_SECOND} req/s)...")
    results = []
    errors = 0
    delay = 1.0 / REQUESTS_PER_SECOND

    for i, commune in enumerate(sample):
        code = commune["code"]
        risks_raw = fetch_risks(code)

        if risks_raw is None:
            errors += 1
            continue

        parent_risks = extract_parent_risks(risks_raw)
        results.append({
            "code": code,
            "nom": commune["nom"],
            "population": commune.get("population", 0),
            "departement": commune.get("codeDepartement", "??"),
            "parent_risks": parent_risks,
            "risk_count": len(parent_risks),
        })

        if (i + 1) % 50 == 0 or i + 1 == len(sample):
            print(f"  {i+1}/{len(sample)} ({errors} errors)")

        time.sleep(delay)

    print(f"\n{'='*60}")
    print(f"RESULTS: {len(results)} communes analyzed ({errors} errors)")
    print(f"{'='*60}")

    # --- Distribution: number of parent risks per commune ---
    risk_counts = Counter(r["risk_count"] for r in results)
    print(f"\n--- Distribution: nombre de risques parents par commune ---")
    for count in sorted(risk_counts.keys()):
        n = risk_counts[count]
        pct = n * 100 / len(results)
        bar = "█" * int(pct)
        print(f"  {count:2d} risques: {n:4d} communes ({pct:5.1f}%) {bar}")

    zero_risk = sum(1 for r in results if r["risk_count"] == 0)
    print(f"\n  Communes SANS risque: {zero_risk}/{len(results)} ({zero_risk*100/len(results):.1f}%)")

    avg_risks = sum(r["risk_count"] for r in results) / len(results)
    median_risks = sorted(r["risk_count"] for r in results)[len(results) // 2]
    print(f"  Moyenne: {avg_risks:.1f} risques | Médiane: {median_risks}")

    # --- Frequency of each risk type ---
    risk_freq = Counter()
    for r in results:
        for code in r["parent_risks"]:
            risk_freq[code] += 1

    print(f"\n--- Fréquence de chaque type de risque ---")
    for code, count in risk_freq.most_common():
        label, category = RISK_CATEGORIES.get(code, (code, "?"))
        pct = count * 100 / len(results)
        bar = "█" * int(pct / 2)
        print(f"  {label:30s} [{category:14s}]: {count:4d} ({pct:5.1f}%) {bar}")

    # --- Risk count by population bucket ---
    print(f"\n--- Risques moyens par taille de commune ---")
    for label, lo, hi in POP_BUCKETS:
        bucket = [r for r in results if lo <= r["population"] < hi]
        if bucket:
            avg = sum(r["risk_count"] for r in bucket) / len(bucket)
            zero = sum(1 for r in bucket if r["risk_count"] == 0)
            print(f"  {label:30s}: moy={avg:.1f} risques, {zero}/{len(bucket)} sans risque ({len(bucket)} communes)")

    # --- Category distribution ---
    print(f"\n--- Distribution par macro-catégorie ---")
    cat_freq = Counter()
    for r in results:
        cats = set()
        for code in r["parent_risks"]:
            _, cat = RISK_CATEGORIES.get(code, ("?", "?"))
            cats.add(cat)
        for cat in cats:
            cat_freq[cat] += 1

    for cat, count in cat_freq.most_common():
        pct = count * 100 / len(results)
        print(f"  {cat:20s}: {count:4d} communes ({pct:5.1f}%)")

    communes_all_cats = sum(1 for r in results if len(set(
        RISK_CATEGORIES.get(c, ("?", "?"))[1] for c in r["parent_risks"]
    )) >= 3)
    print(f"\n  Communes avec 3+ catégories: {communes_all_cats}/{len(results)} ({communes_all_cats*100/len(results):.1f}%)")

    # --- Variance analysis ---
    print(f"\n--- Analyse de la variance (pour décision UX) ---")
    low = sum(1 for r in results if r["risk_count"] <= 1)
    mid = sum(1 for r in results if 2 <= r["risk_count"] <= 4)
    high = sum(1 for r in results if r["risk_count"] >= 5)
    print(f"  Peu exposé (0-1 risques):    {low:4d} ({low*100/len(results):.1f}%)")
    print(f"  Modéré (2-4 risques):        {mid:4d} ({mid*100/len(results):.1f}%)")
    print(f"  Très exposé (5+ risques):    {high:4d} ({high*100/len(results):.1f}%)")

    # --- Save raw data for further analysis ---
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "georisques_sample.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    export = [{
        **{k: v for k, v in r.items() if k != "parent_risks"},
        "parent_risks": list(r["parent_risks"]),
    } for r in results]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(export, f, ensure_ascii=False, indent=2)
    print(f"\nRaw data saved to: {output_path}")


if __name__ == "__main__":
    main()
