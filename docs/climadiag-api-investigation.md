# Climadiag Commune API Investigation

**Investigation date:** 2026-03-09  
**Target URL:** https://climadiag-commune.meteofrance.com/entity/75056/ (Paris)

## Summary

Climadiag Commune by Météo-France does **NOT** use a traditional REST API. Instead, the entire dataset is distributed as **static files** that the frontend downloads and processes client-side.

## Data Sources

### 1. Main Data File: `entities.jsonl`
**URL:** `https://climadiag-commune.meteofrance.com/entities.jsonl`

- **Format:** JSON Lines (.jsonl) - one JSON object per line, one line per commune
- **Content:** Complete climate data for all French communes
- **Size:** Large file (~several MB), uses HTTP 206 Partial Content for range requests
- **Update frequency:** Unknown (check Last-Modified header)

### 2. Index File: `entities-index.parquet`
**URL:** `https://climadiag-commune.meteofrance.com/entities-index.parquet`

- **Format:** Apache Parquet (columnar binary format)
- **Size:** ~838 KB (838,866 bytes)
- **Last Modified:** 2026-01-27 17:39:37 GMT
- **Purpose:** Likely an index for efficient lookup/search of communes

## Data Structure

### Commune Record Structure

Each line in `entities.jsonl` contains a complete commune record with this structure:

```json
{
  "identifiant_insee": "75056",
  "code_recherche": "75000",
  "nom": "Paris",
  "type": "commune",
  "population": 2113705,
  "alt_minimum": 22,
  "alt_moyenne": 76,
  "alt_maximum": 130,
  "nom_departement": "Paris",
  "opp_ref_index": null,
  "tranche_alt_max": null,
  "tranche_alt_min": null,
  "port_rattachement": null,
  "massif_rattachement": null,
  "commune_littorale": false,
  "nombre_communes": 130,
  "identifiant_epci_parent": "200054781",
  "nom_epci_parent": "Métropole du Grand Paris",
  "grand_paris": "Oui",
  "risques": [
    "inondation",
    "remonteeNappe",
    "mouvementTerrain",
    "retraitGonflementArgile",
    "icu"
  ],
  "icu": 6,
  "indicateurs": [
    {
      "id": "G1",
      "data": [
        [
          {
            "type_ind": "saisonnier",
            "label": "hiver",
            "ref": 5.26,
            "min": 6.04,
            "mean": 6.35,
            "max": 6.8
          },
          {
            "type_ind": "saisonnier",
            "label": "printemps",
            "ref": 11.84,
            "min": 12.29,
            "mean": 12.73,
            "max": 13.27
          },
          // ... etc for été, automne
        ],
        // ... 2nd array for medium-term projection (2050)
        // ... 3rd array for long-term projection (2100)
      ]
    }
    // ... other indicators
  ]
}
```

### Climate Indicators Available

The dataset includes **20 climate indicators** organized into 5 categories:

#### Category: Climat (G1-G4)
- **G1**: Température moyenne (°C) - Average temperature by season
- **G2**: Nombre de jours de gel - Number of frost days per year
- **G3**: Cumul de précipitations (mm) - Precipitation totals by season
- **G4**: Nombre de jours avec précipitations - Number of days with precipitation by season

#### Category: Risques naturels (R1-R5)
- **R1**: Nombre de jours avec fortes précipitations - Days with heavy precipitation by season
- **R2**: Précipitations quotidiennes remarquables (mm) - Exceptional daily rainfall per year
- **R3**: Niveau de la mer (NIVMER) - Sea level (null for non-coastal communes)
- **R4**: Nombre de jours avec risque de feu de végétation - Fire risk days per year
- **R5**: Nombre de jours avec sol sec - Dry soil days by season

#### Category: Santé (S1-S4)
- **S1**: Nombre de jours très chauds (≥35°C) - Very hot days per year
- **S2**: Nombre de nuits chaudes - Warm nights per year
- **S3**: Nombre de jours en vague de chaleur - Heat wave days per year
- **S4**: Nombre de jours en vague de froid - Cold wave days per year

#### Category: Agriculture (AG1-AG4)
- **AG1**: Nombre de jours de stress hydrique pour les cultures - Agricultural water stress days by season
- **AG2**: Nombre de jours favorables aux cultures - Days favorable for crops per year
- **AG3**: Degrés-jours de croissance - Growing degree days per year
- **AG4**: Nombre de jours avec risque de gel tardif - Late frost risk days per year

#### Category: Tourisme (T1-T3)
- **T1**: Nombre de jours favorables au tourisme - Tourism-favorable days per year
- **T2**: Indice touristique estival - Summer tourism index (often null)
- **T3**: Indice touristique hivernal - Winter tourism index (often null)

### Temporal Projections

Each indicator contains **3 arrays** representing different time horizons:
1. **2030** (near-term projection: TRACC 2030)
2. **2050** (medium-term projection: TRACC 2050)
3. **2100** (long-term projection: TRACC 2100)

Each projection contains:
- **ref**: Reference value (1976-2005 historical baseline)
- **min**: Minimum projected value (best scenario)
- **mean**: Mean projected value (average scenario)
- **max**: Maximum projected value (worst scenario)

### Indicator Data Types

Indicators come in two types:
- **`type_ind: "saisonnier"`**: Seasonal data (hiver, printemps, été, automne)
- **`type_ind: "annuel"`**: Annual data (single value per projection period)

## Implementation Strategy for Ou Atterir

### Option 1: Download and Import into Supabase (RECOMMENDED)

**Advantages:**
- Full control over data
- Can create custom queries and aggregations
- Can combine with other data sources
- Faster queries (indexed database)
- Offline availability

**Implementation:**
1. Download `entities.jsonl` periodically (monthly?)
2. Parse JSONL and extract relevant indicators
3. Create Supabase tables:
   - `climadiag_communes` (commune metadata + ICU)
   - `climadiag_indicators` (normalized indicator values)
4. Index by `code_insee`
5. Create RPC functions for filtering/aggregation

**SQL Schema Example:**
```sql
CREATE TABLE climadiag_communes (
  code_insee VARCHAR(5) PRIMARY KEY,
  nom VARCHAR(255),
  icu INTEGER, -- Îlot de chaleur urbain (1-6 scale)
  risques TEXT[], -- Array of risk types
  population INTEGER,
  updated_at TIMESTAMP
);

CREATE TABLE climadiag_indicators (
  id SERIAL PRIMARY KEY,
  code_insee VARCHAR(5) REFERENCES climadiag_communes(code_insee),
  indicator_id VARCHAR(10), -- e.g., 'S3' for heat waves
  horizon VARCHAR(10), -- '2030', '2050', '2100'
  type_ind VARCHAR(20), -- 'annuel' or 'saisonnier'
  label VARCHAR(20), -- 'hiver', 'printemps', etc. (null for annual)
  ref_value NUMERIC,
  min_value NUMERIC,
  mean_value NUMERIC,
  max_value NUMERIC
);

CREATE INDEX idx_climadiag_indicators_commune ON climadiag_indicators(code_insee);
CREATE INDEX idx_climadiag_indicators_type ON climadiag_indicators(indicator_id, horizon);
```

### Option 2: Client-Side Fetch (Not Recommended)

The file is too large (~several MB) to fetch on every page load. Range requests could work but would be complex to implement.

## Key Indicators for Ou Atterir

Based on the roadmap priority, focus on:

1. **S3 (Vagues de chaleur)** - Heat wave days
   - Essential for livability
   - Direct health impact
   - Clear climate change signal

2. **ICU (Îlot de chaleur urbain)** - Urban heat island intensity
   - Already in commune metadata
   - Values: 1-6 or null
   - Critical for urban areas

3. **R5 (Jours avec sol sec)** - Dry soil days
   - Water availability indicator
   - Agriculture and drought risk

4. **R4 (Risque de feu de végétation)** - Wildfire risk
   - Natural hazard indicator
   - Increasingly relevant

## Data Update Strategy

1. **Initial Load:** Download full `entities.jsonl` and import to Supabase
2. **Check for Updates:** Monitor the `Last-Modified` header monthly
3. **Incremental Updates:** Re-download and update database if file changed
4. **Version Tracking:** Store `updated_at` timestamp in database

## Filter Integration

Add to existing RPC functions (`search_communes`, `count_communes`):

```sql
-- Example filter parameters
p_max_chaleur_2050 INTEGER DEFAULT NULL, -- Max heat wave days in 2050
p_min_icu INTEGER DEFAULT NULL, -- Minimum urban heat island intensity
p_max_secheresse_2050 INTEGER DEFAULT NULL -- Max dry soil days in 2050
```

## Data Quality Notes

- Some indicators are `null` for certain communes (e.g., sea level for inland areas)
- Tourism indicators (T2, T3) often null
- ICU only available for urban areas (otherwise null)
- Projections use TRACC models (Météo-France regional climate projections)

## Attribution

- **Data Source:** Météo-France Climadiag Commune
- **Website:** https://climadiag-commune.meteofrance.com
- **License:** Check Météo-France's terms of use for data reuse rights

## Next Steps

1. Verify Météo-France data reuse license/terms
2. Download full `entities.jsonl` file
3. Create import script (Python/Node.js)
4. Design Supabase schema
5. Import data and test queries
6. Add filters to frontend
7. Document climate indicators in UI (tooltips/legend)
