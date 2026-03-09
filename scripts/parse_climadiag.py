#!/usr/bin/env python3
"""
Climadiag Commune Data Parser
Extract climate indicators for French communes from Météo-France's Climadiag dataset.

Usage:
    python parse_climadiag.py --insee 75056
    python parse_climadiag.py --name "Paris"
    python parse_climadiag.py --export-csv output.csv
"""

import json
import sys
import requests
from typing import Optional, Dict, Any

ENTITIES_URL = "https://climadiag-commune.meteofrance.com/entities.jsonl"

def fetch_commune_by_insee(insee_code: str) -> Optional[Dict[str, Any]]:
    """
    Fetch commune data by INSEE code.
    Note: This downloads the entire file and searches line by line.
    For production, consider downloading once and caching locally.
    """
    print(f"Fetching data for INSEE code: {insee_code}...")
    
    response = requests.get(ENTITIES_URL, stream=True)
    response.raise_for_status()
    
    for line in response.iter_lines():
        if line:
            commune = json.loads(line.decode('utf-8'))
            if commune['identifiant_insee'] == insee_code:
                return commune
    
    return None

def fetch_commune_by_name(name: str) -> Optional[Dict[str, Any]]:
    """
    Fetch commune data by name (case-insensitive search).
    """
    print(f"Searching for commune: {name}...")
    
    response = requests.get(ENTITIES_URL, stream=True)
    response.raise_for_status()
    
    name_lower = name.lower()
    matches = []
    
    for line in response.iter_lines():
        if line:
            commune = json.loads(line.decode('utf-8'))
            if name_lower in commune['nom'].lower():
                matches.append(commune)
    
    if not matches:
        return None
    
    if len(matches) == 1:
        return matches[0]
    
    # Multiple matches - ask user to choose
    print(f"\nFound {len(matches)} communes matching '{name}':")
    for i, c in enumerate(matches, 1):
        print(f"  {i}. {c['nom']} ({c['code_recherche']}) - {c['nom_departement']}")
    
    choice = int(input("\nEnter number to select: ")) - 1
    return matches[choice]

def extract_indicator(commune: Dict[str, Any], indicator_id: str, horizon: str = "2050") -> Optional[Dict[str, Any]]:
    """
    Extract specific indicator data for a given time horizon.
    
    Args:
        commune: Commune data dictionary
        indicator_id: Indicator ID (e.g., 'S3' for heat waves)
        horizon: Time horizon ('2030', '2050', or '2100')
    
    Returns:
        Dictionary with indicator data or None if not found
    """
    for indicator in commune['indicateurs']:
        if indicator['id'] == indicator_id:
            horizon_index = {'2030': 0, '2050': 1, '2100': 2}[horizon]
            return {
                'indicator_id': indicator_id,
                'horizon': horizon,
                'data': indicator['data'][horizon_index]
            }
    return None

def print_commune_summary(commune: Dict[str, Any]):
    """Print a formatted summary of commune climate data."""
    print(f"\n{'='*60}")
    print(f"COMMUNE: {commune['nom']} ({commune['code_recherche']})")
    print(f"{'='*60}")
    print(f"Département: {commune['nom_departement']}")
    print(f"Population: {commune['population']:,} habitants")
    print(f"Altitude: {commune['alt_minimum']}m - {commune['alt_maximum']}m (moy: {commune['alt_moyenne']}m)")
    
    if commune['icu']:
        print(f"Îlot de chaleur urbain (ICU): {commune['icu']}/6")
    
    if commune['risques']:
        print(f"Risques identifiés: {', '.join(commune['risques'])}")
    
    print(f"\n--- INDICATEURS CLIMATIQUES CLÉS (Horizon 2050) ---")
    
    # Heat waves (S3)
    s3 = extract_indicator(commune, 'S3', '2050')
    if s3 and s3['data']:
        data = s3['data'][0]  # Annual data
        print(f"\n🌡️  Jours en vague de chaleur:")
        print(f"   Référence (1976-2005): {data['ref']} jours/an")
        print(f"   Projection 2050 (moyenne): {data['mean']:.1f} jours/an")
        print(f"   Projection 2050 (maximum): {data['max']:.1f} jours/an")
        change = ((data['mean'] - data['ref']) / data['ref'] * 100) if data['ref'] > 0 else 0
        print(f"   Evolution: +{change:.0f}%")
    
    # Very hot days (S1)
    s1 = extract_indicator(commune, 'S1', '2050')
    if s1 and s1['data']:
        data = s1['data'][0]
        print(f"\n☀️  Jours très chauds (≥35°C):")
        print(f"   Référence: {data['ref']} jours/an")
        print(f"   Projection 2050 (moyenne): {data['mean']:.1f} jours/an")
    
    # Dry soil days - summer (R5)
    r5 = extract_indicator(commune, 'R5', '2050')
    if r5 and r5['data']:
        summer_data = next((d for d in r5['data'] if d.get('label') == 'été'), None)
        if summer_data:
            print(f"\n💧 Jours avec sol sec (été):")
            print(f"   Référence: {summer_data['ref']} jours")
            print(f"   Projection 2050 (moyenne): {summer_data['mean']:.1f} jours")
    
    # Average temperature (G1)
    g1 = extract_indicator(commune, 'G1', '2050')
    if g1 and g1['data']:
        print(f"\n🌡️  Température moyenne par saison (2050):")
        for season_data in g1['data']:
            if season_data.get('label'):
                print(f"   {season_data['label'].capitalize()}: {season_data['mean']:.1f}°C (ref: {season_data['ref']}°C)")
    
    print(f"\n{'='*60}\n")

def main():
    """Main CLI interface."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Parse Climadiag Commune data')
    parser.add_argument('--insee', help='INSEE code (e.g., 75056 for Paris)')
    parser.add_argument('--name', help='Commune name (e.g., Paris)')
    parser.add_argument('--indicator', help='Specific indicator to extract (e.g., S3)')
    parser.add_argument('--horizon', default='2050', choices=['2030', '2050', '2100'],
                       help='Time horizon (default: 2050)')
    
    args = parser.parse_args()
    
    if not args.insee and not args.name:
        parser.print_help()
        print("\nExample usage:")
        print("  python parse_climadiag.py --insee 75056")
        print("  python parse_climadiag.py --name Paris")
        sys.exit(1)
    
    # Fetch commune data
    if args.insee:
        commune = fetch_commune_by_insee(args.insee)
    else:
        commune = fetch_commune_by_name(args.name)
    
    if not commune:
        print("❌ Commune not found!")
        sys.exit(1)
    
    # Display results
    if args.indicator:
        indicator = extract_indicator(commune, args.indicator, args.horizon)
        if indicator:
            print(json.dumps(indicator, indent=2, ensure_ascii=False))
        else:
            print(f"❌ Indicator {args.indicator} not found!")
    else:
        print_commune_summary(commune)

if __name__ == '__main__':
    main()
