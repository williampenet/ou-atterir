#!/usr/bin/env python3
"""Print detailed candidate-level results for the 8 test communes."""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_political_scoring import (
    resolve_postal_to_insee, parse_pres_2022, parse_legis_2024,
    parse_euro_2024, parse_municipales, compute_political_score,
    BLOCS_ORDER, SCORING_WEIGHTS,
)

def print_candidates(data, election_type, top_n=None):
    """Print candidate-level results."""
    if not data or not data.get("candidates"):
        print("    (pas de données)")
        return

    turnout = data.get("turnout", 0)
    inscrits = data.get("inscrits", 0)
    exprimes = data.get("exprimes", 0)
    print(f"    Inscrits: {inscrits:,}  |  Exprimés: {exprimes:,}  |  Participation: {turnout:.1f}%")
    print(f"    {'Candidat/Liste':<45s} {'Nuance':>8s}  {'Bloc':<18s} {'%':>6s}  {'Voix':>8s}")
    print(f"    {'─'*95}")

    candidates = sorted(data["candidates"], key=lambda c: -c["voix"])
    if top_n:
        candidates = candidates[:top_n]

    for i, c in enumerate(candidates):
        name = c["name"][:44]
        marker = " ◄" if i == 0 else ""
        print(f"    {name:<45s} {c['nuance']:>8s}  {c['bloc']:<18s} {c['pct']:5.1f}%  {c['voix']:>8,}{marker}")

    if top_n and len(data["candidates"]) > top_n:
        rest = data["candidates"][top_n:]
        rest_voix = sum(c["voix"] for c in rest)
        rest_pct = sum(c["pct"] for c in rest)
        print(f"    {'... + ' + str(len(rest)) + ' autres':<45s} {'':>8s}  {'':.<18s} {rest_pct:5.1f}%  {rest_voix:>8,}")


def main():
    print("Résolution des codes postaux...")
    postal_map = resolve_postal_to_insee()
    target_insees = set(info["insee"] for info in postal_map.values())

    plm_arr_to_city = {}
    for insee in target_insees:
        if insee.startswith("75") and insee != "75056" and len(insee) == 5:
            plm_arr_to_city[insee] = "75056"
        elif insee.startswith("69") and int(insee) >= 69381 and int(insee) <= 69389:
            plm_arr_to_city[insee] = "69123"

    extended_insees = target_insees | set(plm_arr_to_city.values())

    print("Parsing données électorales...")
    pres = parse_pres_2022(extended_insees)
    for arr, city in plm_arr_to_city.items():
        if arr not in pres and city in pres:
            pres[arr] = pres[city]

    legis = parse_legis_2024(extended_insees)
    for arr, city in plm_arr_to_city.items():
        if arr not in legis and city in legis:
            legis[arr] = legis[city]

    euro = parse_euro_2024(extended_insees)
    for arr, city in plm_arr_to_city.items():
        if arr not in euro and city in euro:
            euro[arr] = euro[city]

    mun = parse_municipales(target_insees)

    for postal, info in sorted(postal_map.items()):
        insee = info["insee"]
        name = info["name"]

        print(f"\n{'━'*100}")
        print(f"  {name} ({postal} / INSEE {insee})")
        print(f"{'━'*100}")

        commune_elections = {}

        print(f"\n  ┌─ MUNICIPALES 2020 (tour décisif)")
        if insee in mun:
            commune_elections["municipales"] = mun[insee]
            print_candidates(mun[insee], "municipales")
        else:
            print("    (pas de données)")

        print(f"\n  ┌─ PRÉSIDENTIELLE 2022 — 1er TOUR")
        note = " ⚠ données Lyon ville" if insee in plm_arr_to_city and plm_arr_to_city[insee] == "69123" else ""
        note = " ⚠ données Paris ville" if insee in plm_arr_to_city and plm_arr_to_city[insee] == "75056" else note
        if note:
            print(f"    {note}")
        if insee in pres:
            commune_elections["presidentielles_t1"] = pres[insee]
            print_candidates(pres[insee], "presidentielles_t1")
        else:
            print("    (pas de données)")

        print(f"\n  ┌─ LÉGISLATIVES 2024 — 1er TOUR")
        if note:
            print(f"    {note}")
        if insee in legis:
            commune_elections["legislatives_t1"] = legis[insee]
            print_candidates(legis[insee], "legislatives_t1", top_n=10)
        else:
            print("    (pas de données)")

        print(f"\n  ┌─ EUROPÉENNES 2024")
        if note:
            print(f"    {note}")
        if insee in euro:
            commune_elections["europeennes"] = euro[insee]
            print_candidates(euro[insee], "europeennes", top_n=10)
        else:
            print("    (pas de données)")

        scoring = compute_political_score(commune_elections)

        print(f"\n  ┌─ SCORING FINAL")
        print(f"    {'Bloc':<20s} {'Points':>8s}  {'%':>6s}  {'Détail'}")
        print(f"    {'─'*70}")
        for bloc in BLOCS_ORDER:
            score = scoring["bloc_scores"].get(bloc, 0)
            if score > 0.01:
                pct = scoring["bloc_pcts"].get(bloc, 0)
                bar = "█" * int(pct / 2)
                print(f"    {bloc:<20s} {score:7.2f}   {pct:5.1f}%  {bar}")

        print(f"\n    ➜  {scoring['classification']}")
        print()


if __name__ == "__main__":
    main()
