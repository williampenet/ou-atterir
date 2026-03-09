import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PoliticalBloc } from '../types';

let supabase: SupabaseClient;

const PARIS_1ER_INSEE = '75101';
const LIBOURNE_INSEE = '33243'; // has equipment + DVF data
const KNOWN_DEPARTMENT = 'Paris';

beforeAll(() => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  expect(url).toBeTruthy();
  expect(key).toBeTruthy();
  supabase = createClient(url, key);
});

// ============================================================
// 1. BUILD / COMPILE — already validated by vite build
// ============================================================

describe('Platform stability', () => {
  it('Supabase client initializes without error', () => {
    expect(supabase).toBeDefined();
  });
});

// ============================================================
// 2. BASIC DATA ACCESS
// ============================================================

describe('Basic data access', () => {
  it('communes table is accessible and non-empty', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('insee, name')
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('nuances table is accessible and non-empty', async () => {
    const { data, error } = await supabase
      .from('nuances')
      .select('code, label, bloc')
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('known commune (Paris 1er) exists and has valid data', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('*')
      .eq('insee', PARIS_1ER_INSEE)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.name).toContain('Paris');
    expect(data!.lat).toBeGreaterThan(48);
    expect(data!.lng).toBeGreaterThan(2);
  });

  it('known commune (Libourne) exists with population', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('*')
      .eq('insee', LIBOURNE_INSEE)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.name).toBe('Libourne');
    expect(data!.population).toBeGreaterThan(0);
  });
});

// ============================================================
// 3. RPC FUNCTIONS — no filters
// ============================================================

describe('RPC: search_communes (no filters)', () => {
  it('returns results with no filters', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    const row = data![0];
    expect(row.insee).toBeTruthy();
    expect(row.name).toBeTruthy();
    expect(row.lat).toBeDefined();
    expect(row.lng).toBeDefined();
  });

  it('count_communes returns a positive number with no filters', async () => {
    const { data, error } = await supabase.rpc('count_communes', {
      target_risk_level: null,
    });

    expect(error).toBeNull();
    expect(typeof data).toBe('number');
    expect(data).toBeGreaterThan(0);
  });

  it('pagination works (offset skips results)', async () => {
    const [res1, res2] = await Promise.all([
      supabase.rpc('search_communes', { page_limit: 5, page_offset: 0, target_risk_level: null }),
      supabase.rpc('search_communes', { page_limit: 5, page_offset: 5, target_risk_level: null }),
    ]);

    expect(res1.error).toBeNull();
    expect(res2.error).toBeNull();
    expect(res1.data!.length).toBe(5);
    expect(res2.data!.length).toBe(5);

    const insees1 = new Set(res1.data!.map((r: { insee: string }) => r.insee));
    const insees2 = new Set(res2.data!.map((r: { insee: string }) => r.insee));
    const overlap = [...insees1].filter(i => insees2.has(i));
    expect(overlap.length).toBe(0);
  });
});

// ============================================================
// 4. DEPARTMENT FILTER
// ============================================================

describe('RPC: department filter', () => {
  it('filters by known department', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
      target_department: KNOWN_DEPARTMENT,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
    for (const row of data!) {
      expect(row.department).toBe(KNOWN_DEPARTMENT);
    }
  });

  it('get_distinct_departments returns list of departments', async () => {
    const { data, error } = await supabase.rpc('get_distinct_departments');
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(50);
  });

  it('filtering by non-existent department returns 0 results', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
      target_department: 'DépartementInexistant999',
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBe(0);
  });
});

// ============================================================
// 5. POLITICAL BLOC FILTER
// ============================================================

describe('RPC: political bloc filter', () => {
  const blocs = Object.values(PoliticalBloc);

  for (const bloc of blocs) {
    it(`filters by bloc="${bloc}" without error`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_bloc: bloc,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  }

  it('count matches between search and count for bloc=Gauche', async () => {
    const bloc = PoliticalBloc.GAUCHE;
    const [searchRes, countRes] = await Promise.all([
      supabase.rpc('search_communes', {
        page_limit: 500,
        page_offset: 0,
        target_risk_level: null,
        target_bloc: bloc,
      }),
      supabase.rpc('count_communes', {
        target_risk_level: null,
        target_bloc: bloc,
      }),
    ]);

    expect(searchRes.error).toBeNull();
    expect(countRes.error).toBeNull();
    const count = countRes.data as number;
    expect(count).toBeGreaterThan(0);
    if (count <= 500) {
      expect(searchRes.data!.length).toBe(count);
    }
  });
});

// ============================================================
// 6. MATCH LEVEL FILTER
// ============================================================

describe('RPC: match level filter', () => {
  for (const level of ['forteresse', 'tendance'] as const) {
    it(`matchLevel="${level}" alone returns 0 results (requires bloc)`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_match_level: level,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(0);
    });

    it(`matchLevel="${level}" with bloc returns results`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_bloc: PoliticalBloc.GAUCHE,
        target_match_level: level,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });
  }

  it('bloc + matchLevel combined filter works', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 5,
      page_offset: 0,
      target_risk_level: null,
      target_bloc: PoliticalBloc.GAUCHE,
      target_match_level: 'forteresse',
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// ============================================================
// 7. EQUIPMENT FILTERS
// ============================================================

describe('RPC: equipment filters', () => {
  const equipmentKeys = [
    'commerces', 'ecole', 'college', 'lycee', 'sup',
    'etab_sante', 'prof_med', 'creche',
    'transports', 'sport', 'culture',
  ];

  for (const key of equipmentKeys) {
    it(`filters by equipment="${key}" without error`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_equipment_filters: [key],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  }

  it('multiple equipment filters combined', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 5,
      page_offset: 0,
      target_risk_level: null,
      target_equipment_filters: ['commerces', 'ecole', 'etab_sante'],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('all equipment filters at once', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 5,
      page_offset: 0,
      target_risk_level: null,
      target_equipment_filters: equipmentKeys,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// ============================================================
// 8. POPULATION SIZE FILTER
// ============================================================

describe('RPC: population size filter', () => {
  const popSizes = ['hameau', 'village', 'bourg', 'petite_ville', 'ville_moyenne', 'grande_ville', 'metropole'];

  for (const size of popSizes) {
    it(`filters by population="${size}" without error`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_pop_ranges: [size],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  }

  it('multiple population sizes filter', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
      target_pop_ranges: ['village', 'bourg'],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('metropole filter returns few results (expected behavior)', async () => {
    const { data: countData } = await supabase.rpc('count_communes', {
      target_risk_level: null,
      target_pop_ranges: ['metropole'],
    });

    expect(typeof countData).toBe('number');
    expect(countData).toBeLessThan(50);
    expect(countData).toBeGreaterThan(0);
  });
});

// ============================================================
// 9. RISK LEVEL FILTER
// ============================================================

describe('RPC: risk level filter', () => {
  for (const level of ['peu_expose', 'modere', 'tres_expose'] as const) {
    it(`filters by riskLevel="${level}" without error`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: level,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it(`count for riskLevel="${level}" is consistent`, async () => {
      const { data, error } = await supabase.rpc('count_communes', {
        target_risk_level: level,
      });

      expect(error).toBeNull();
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThan(0);
    });
  }
});

// ============================================================
// 10. GEO TAGS FILTER
// ============================================================

describe('RPC: geo tags filter', () => {
  for (const tag of ['littoral', 'montagne', 'campagne'] as const) {
    it(`filters by geoTag="${tag}" without error`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_geo_tags: [tag],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });
  }

  it('combined geo tags filter works', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 5,
      page_offset: 0,
      target_risk_level: null,
      target_geo_tags: ['littoral', 'montagne'],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// ============================================================
// 11. PRIX M2 MAX FILTER
// ============================================================

describe('RPC: prix m2 max filter', () => {
  for (const max of [1500, 2500, 3500, 5000]) {
    it(`filters by prixM2Max=${max} without error`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_prix_m2_max: max,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  }

  it('very low price returns fewer results than high price', async () => {
    const [lowRes, highRes] = await Promise.all([
      supabase.rpc('count_communes', { target_risk_level: null, target_prix_m2_max: 1500 }),
      supabase.rpc('count_communes', { target_risk_level: null, target_prix_m2_max: 5000 }),
    ]);

    expect(lowRes.error).toBeNull();
    expect(highRes.error).toBeNull();
    expect(lowRes.data).toBeLessThanOrEqual(highRes.data as number);
  });
});

// ============================================================
// 12. AIR QUALITY FILTER
// ============================================================

describe('RPC: air quality filter', () => {
  for (const quality of ['bonne', 'moyenne', 'degradee', 'mauvaise'] as const) {
    it(`filters by airQuality="${quality}" without error`, async () => {
      const { data, error } = await supabase.rpc('search_communes', {
        page_limit: 5,
        page_offset: 0,
        target_risk_level: null,
        target_air_quality: quality,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  }
});

// ============================================================
// 13. BOUNDS FILTER (map viewport)
// ============================================================

describe('RPC: bounds filter', () => {
  it('filters by France mainland bounds', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
      target_lat_min: 48.5,
      target_lat_max: 49.0,
      target_lng_min: 2.0,
      target_lng_max: 2.8,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    for (const row of data!) {
      expect(row.lat).toBeGreaterThanOrEqual(48.5);
      expect(row.lat).toBeLessThanOrEqual(49.0);
      expect(row.lng).toBeGreaterThanOrEqual(2.0);
      expect(row.lng).toBeLessThanOrEqual(2.8);
    }
  });

  it('narrow bounds around Paris returns Paris arrondissements', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 50,
      page_offset: 0,
      target_risk_level: null,
      target_lat_min: 48.8,
      target_lat_max: 48.9,
      target_lng_min: 2.3,
      target_lng_max: 2.4,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
    const departments = data!.map((r: { department: string }) => r.department);
    const hasParis = departments.some((d: string) => d === 'Paris') ||
      data!.some((r: { insee: string }) => r.insee.startsWith('75'));
    expect(hasParis).toBe(true);
  });

  it('bounds outside France returns 0 results', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
      target_lat_min: 60.0,
      target_lat_max: 65.0,
      target_lng_min: 20.0,
      target_lng_max: 25.0,
    });

    expect(error).toBeNull();
    expect(data!.length).toBe(0);
  });
});

// ============================================================
// 14. INSEE LIST FILTER (travel isochrone)
// ============================================================

describe('RPC: INSEE list filter (isochrone proxy)', () => {
  it('filters by specific INSEE codes', async () => {
    const targetInsees = ['75101', '92012', '93066'];
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 50,
      page_offset: 0,
      target_risk_level: null,
      target_insee_list: targetInsees,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    const resultInsees = data!.map((r: { insee: string }) => r.insee);
    for (const insee of resultInsees) {
      expect(targetInsees).toContain(insee);
    }
  });

  it('empty INSEE list filter behaves correctly', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 5,
      page_offset: 0,
      target_risk_level: null,
      target_insee_list: [],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// ============================================================
// 15. COMBINED FILTERS (stress test)
// ============================================================

describe('RPC: combined filters', () => {
  it('department + population + equipment', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
      target_department: 'Gironde',
      target_pop_ranges: ['petite_ville', 'ville_moyenne'],
      target_equipment_filters: ['commerces', 'ecole'],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('bloc + matchLevel + geoTag + riskLevel', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_bloc: PoliticalBloc.GAUCHE,
      target_match_level: 'forteresse',
      target_geo_tags: ['campagne'],
      target_risk_level: 'peu_expose',
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('all filters simultaneously', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_department: 'Gironde',
      target_bloc: PoliticalBloc.GAUCHE,
      target_match_level: 'tendance',
      target_equipment_filters: ['commerces'],
      target_pop_ranges: ['petite_ville'],
      target_risk_level: 'modere',
      target_geo_tags: ['campagne'],
      target_prix_m2_max: 3500,
      target_air_quality: 'bonne',
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('all filters + bounds simultaneously', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_department: 'Bouches-du-Rhône',
      target_bloc: PoliticalBloc.GAUCHE,
      target_match_level: 'tendance',
      target_equipment_filters: ['commerces'],
      target_pop_ranges: ['ville_moyenne'],
      target_risk_level: 'modere',
      target_air_quality: 'moyenne',
      target_lat_min: 43.0,
      target_lat_max: 44.0,
      target_lng_min: 5.0,
      target_lng_max: 6.0,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('contradictory filters return 0 results without error', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 0,
      target_risk_level: null,
      target_department: 'Paris',
      target_geo_tags: ['montagne'],
      target_pop_ranges: ['hameau'],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBe(0);
  });

  it('count_communes with combined filters matches search', async () => {
    const params = {
      target_risk_level: 'peu_expose' as const,
      target_pop_ranges: ['petite_ville', 'bourg'],
      target_equipment_filters: ['commerces'],
    };

    const [searchRes, countRes] = await Promise.all([
      supabase.rpc('search_communes', { ...params, page_limit: 500, page_offset: 0 }),
      supabase.rpc('count_communes', params),
    ]);

    expect(searchRes.error).toBeNull();
    expect(countRes.error).toBeNull();

    const count = countRes.data as number;
    if (count <= 500) {
      expect(searchRes.data!.length).toBe(count);
    } else {
      expect(searchRes.data!.length).toBe(500);
    }
  });
});

// ============================================================
// 16. COMMUNE DETAIL RPCs
// ============================================================

describe('RPC: commune detail functions', () => {
  it('get_commune_equipments returns data for Paris 1er', async () => {
    const { data, error } = await supabase.rpc('get_commune_equipments', {
      target_insee: PARIS_1ER_INSEE,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    for (const row of data!) {
      expect(row.domain).toBeTruthy();
      expect(row.domain_label).toBeTruthy();
      expect(row.total_count).toBeGreaterThanOrEqual(0);
    }
  });

  it('get_commune_equipments for non-existent commune returns empty', async () => {
    const { data, error } = await supabase.rpc('get_commune_equipments', {
      target_insee: '99999',
    });

    expect(error).toBeNull();
    expect(data!.length).toBe(0);
  });

  it('get_commune_risques returns data for Paris 1er', async () => {
    const { data, error } = await supabase.rpc('get_commune_risques', {
      target_insee: PARIS_1ER_INSEE,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('get_commune_air_quality returns data for Paris 1er', async () => {
    const { data, error } = await supabase.rpc('get_commune_air_quality', {
      target_insee: PARIS_1ER_INSEE,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data && (data as unknown[]).length > 0) {
      const row = (data as { pm25_concentration: number; air_quality_level: string }[])[0];
      expect(row.pm25_concentration).toBeDefined();
      expect(typeof row.pm25_concentration).toBe('number');
      expect(row.air_quality_level).toBeTruthy();
    }
  });

  it('get_commune_dvf returns data for Libourne', async () => {
    const { data, error } = await supabase.rpc('get_commune_dvf', {
      target_insee: LIBOURNE_INSEE,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    const row = (data as { year: number; type_local: string; nb_mutations: number; prix_m2_median: number }[])[0];
    expect(row.year).toBeGreaterThan(2000);
    expect(['maison', 'appartement']).toContain(row.type_local);
  });

  it('get_commune_tension returns data for Libourne', async () => {
    const { data, error } = await supabase.rpc('get_commune_tension', {
      target_insee: LIBOURNE_INSEE,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// ============================================================
// 17. TEXT SEARCH (via direct table query, mirroring service logic)
// ============================================================

describe('Text search (communes table)', () => {
  it('search by postal code prefix', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('insee, name, zipcode')
      .like('zipcode', '75%')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
    for (const row of data!) {
      expect(row.zipcode).toMatch(/^75/);
    }
  });

  it('search by name (ilike)', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('insee, name')
      .ilike('name', '%lyon%')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('search with non-matching query returns empty', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('insee, name')
      .ilike('name', '%xyznonexistent999%')
      .limit(10);

    expect(error).toBeNull();
    expect(data!.length).toBe(0);
  });

  it('search with accented characters', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('insee, name')
      .ilike('name', '%béziers%')
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('search with single character returns results (edge case)', async () => {
    const { data, error } = await supabase
      .from('communes')
      .select('insee, name')
      .ilike('name', '%a%')
      .limit(5);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 18. SERVICE LAYER (imported functions)
// ============================================================

describe('Service layer: communeService', () => {
  let communeService: typeof import('../services/communeService');

  beforeAll(async () => {
    communeService = await import('../services/communeService');
  });

  it('searchCommunesInBounds with no filters returns results', async () => {
    const result = await communeService.searchCommunesInBounds({}, null, 10);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);

    const first = result.results[0];
    expect(first.commune.insee).toBeTruthy();
    expect(first.commune.name).toBeTruthy();
    expect(first.commune.coordinates).toHaveLength(2);
  });

  it('searchCommunesInBounds with department filter', async () => {
    const result = await communeService.searchCommunesInBounds(
      { department: 'Gironde' }, null, 10
    );
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.commune.department).toBe('Gironde');
    }
  });

  it('searchCommunesInBounds with bounds', async () => {
    const bounds = { latMin: 48.8, latMax: 48.9, lngMin: 2.3, lngMax: 2.4 };
    const result = await communeService.searchCommunesInBounds({}, bounds, 50);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('getCommuneByInsee returns full commune for Paris 1er', async () => {
    const commune = await communeService.getCommuneByInsee(PARIS_1ER_INSEE);
    expect(commune).toBeDefined();
    expect(commune!.name).toContain('Paris');
    expect(commune!.coordinates).toHaveLength(2);
  });

  it('getCommuneByInsee returns full commune for Libourne with history', async () => {
    const commune = await communeService.getCommuneByInsee(LIBOURNE_INSEE);
    expect(commune).toBeDefined();
    expect(commune!.name).toBe('Libourne');
    expect(commune!.history.length).toBeGreaterThan(0);
    expect(commune!.coordinates).toHaveLength(2);
  });

  it('getCommuneByInsee returns undefined for invalid INSEE', async () => {
    const commune = await communeService.getCommuneByInsee('99999');
    expect(commune).toBeUndefined();
  });

  it('getDepartments returns sorted list', async () => {
    const departments = await communeService.getDepartments();
    expect(departments.length).toBeGreaterThan(50);
    expect(departments).toContain(KNOWN_DEPARTMENT);
  });

  it('getEquipmentSummary returns data for Paris 1er', async () => {
    const summary = await communeService.getEquipmentSummary(PARIS_1ER_INSEE);
    expect(summary.length).toBeGreaterThan(0);
    for (const s of summary) {
      expect(s.domain).toBeTruthy();
      expect(s.domainLabel).toBeTruthy();
    }
  });

  it('getCommuneRisks returns data for Paris 1er', async () => {
    const risks = await communeService.getCommuneRisks(PARIS_1ER_INSEE);
    expect(risks).toBeDefined();
  });

  it('getCommuneAirQuality returns data for Libourne', async () => {
    const aq = await communeService.getCommuneAirQuality(LIBOURNE_INSEE);
    if (aq) {
      expect(typeof aq.pm25Concentration).toBe('number');
      expect(aq.airQualityLevel).toBeTruthy();
    }
  });

  it('getDvfStats returns data for Libourne', async () => {
    const dvf = await communeService.getDvfStats(LIBOURNE_INSEE);
    expect(dvf).toBeDefined();
    expect(dvf.stats.length).toBeGreaterThan(0);
  });

  it('searchCommunesByText returns results for "Lyon"', async () => {
    const results = await communeService.searchCommunesByText('Lyon');
    expect(results.length).toBeGreaterThan(0);
    const lyonFound = results.some(r =>
      r.commune.name.toLowerCase().includes('lyon')
    );
    expect(lyonFound).toBe(true);
  });

  it('searchCommunesByText returns results for postal code "33000"', async () => {
    const results = await communeService.searchCommunesByText('33000');
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.commune.zipcode).toMatch(/^330/);
    }
  });

  it('searchCommunesByText with too-short query returns empty', async () => {
    const results = await communeService.searchCommunesByText('L');
    expect(results.length).toBe(0);
  });

  it('resultToMapMarker produces valid marker', async () => {
    const searchResult = await communeService.searchCommunesInBounds({}, null, 1);
    const result = searchResult.results[0];
    const marker = communeService.resultToMapMarker(result);

    expect(marker.insee).toBe(result.commune.insee);
    expect(marker.name).toBe(result.commune.name);
    expect(typeof marker.lat).toBe('number');
    expect(typeof marker.lng).toBe('number');
  });
});

// ============================================================
// 19. EDGE CASES & ROBUSTNESS
// ============================================================

describe('Edge cases & robustness', () => {
  it('very large page_offset returns empty results', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 10,
      page_offset: 999999,
      target_risk_level: null,
    });

    expect(error).toBeNull();
    expect(data!.length).toBe(0);
  });

  it('page_limit=0 returns 0 results', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 0,
      page_offset: 0,
      target_risk_level: null,
    });

    expect(error).toBeNull();
    expect(data!.length).toBe(0);
  });

  it('large page_limit does not crash', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 1000,
      page_offset: 0,
      target_risk_level: null,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('all result rows have required fields', async () => {
    const { data, error } = await supabase.rpc('search_communes', {
      page_limit: 50,
      page_offset: 0,
      target_risk_level: null,
    });

    expect(error).toBeNull();
    for (const row of data!) {
      expect(row.insee).toBeTruthy();
      expect(row.name).toBeTruthy();
      expect(typeof row.lat).toBe('number');
      expect(typeof row.lng).toBe('number');
      expect(row.department).toBeTruthy();
      expect(row.match_level).toBeTruthy();
    }
  });

  it('concurrent searches do not crash', async () => {
    const searches = Array.from({ length: 5 }, (_, i) =>
      supabase.rpc('search_communes', {
        page_limit: 10,
        page_offset: i * 10,
        target_risk_level: null,
      })
    );

    const results = await Promise.all(searches);
    for (const res of results) {
      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
    }
  });
});
