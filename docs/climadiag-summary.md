# Climadiag Commune - API Investigation Summary

**Date:** March 9, 2026  
**Investigated by:** AI Agent  
**Target:** https://climadiag-commune.meteofrance.com

## Quick Summary

✅ **Data Source Found:** Static file distribution (not REST API)  
✅ **Data Format:** JSONL (JSON Lines) + Parquet index  
✅ **Coverage:** All French communes with complete climate projections  
✅ **Indicators:** 20 climate indicators across 5 categories  
✅ **Time Horizons:** 2030, 2050, 2100  

## Data Access

```bash
# Main data file (all communes)
https://climadiag-commune.meteofrance.com/entities.jsonl

# Index file (for efficient lookup)
https://climadiag-commune.meteofrance.com/entities-index.parquet
```

## Key Indicators for Ou Atterir

| ID | Name | Category | Priority | Notes |
|----|------|----------|----------|-------|
| **S3** | Jours en vague de chaleur | Santé | 🔴 HIGH | Direct health impact, clear climate signal |
| **ICU** | Îlot de chaleur urbain | Metadata | 🔴 HIGH | Urban heat island (1-6 scale) |
| **S1** | Jours très chauds (≥35°C) | Santé | 🟡 MEDIUM | Extreme heat days |
| **R5** | Jours avec sol sec | Risques | 🟡 MEDIUM | Drought indicator |
| **R4** | Risque de feu de végétation | Risques | 🟢 LOW | Wildfire risk |

## Implementation Plan

1. **Download** `entities.jsonl` (periodic updates)
2. **Parse** JSONL and extract priority indicators
3. **Import** into Supabase with proper schema
4. **Index** by `code_insee` for fast lookups
5. **Add filters** to RPC functions (`search_communes`, `count_communes`)

## Example Data Structure

```json
{
  "identifiant_insee": "75056",
  "nom": "Paris",
  "icu": 6,
  "indicateurs": [
    {
      "id": "S3",
      "data": [
        [{"type_ind": "annuel", "ref": 1.87, "mean": 13.15, "max": 19.62}], // 2030
        [{"type_ind": "annuel", "ref": 1.87, "mean": 25.95, "max": 35.43}], // 2050
        [{"type_ind": "annuel", "ref": 1.87, "mean": 42.5, "max": 58.0}]    // 2100
      ]
    }
  ]
}
```

## Files Created

1. **docs/climadiag-api-investigation.md** - Full technical documentation
2. **scripts/parse_climadiag.py** - Python parser/example script
3. **docs/climadiag-summary.md** - This file

## Next Steps

- [ ] Verify Météo-France data reuse license
- [ ] Create Supabase schema for climate data
- [ ] Write import script (Python/TypeScript)
- [ ] Test data import with sample communes
- [ ] Add climate filters to UI
- [ ] Add climate indicator tooltips/documentation
