import { supabase } from './supabase';
import { Commune, ElectionResult, StabilityLevel, IdealResult, PaginatedResults, SearchFilters, MatchLevel, EquipmentSummary, EquipmentDomain, RiskDetail, DvfData, DvfYearStat, MarketTension } from '../types';

// --------------------------------------------------
// Row types (database shape)
// --------------------------------------------------

interface CommuneRow {
  id: string;
  insee: string;
  zipcode: string;
  name: string;
  department: string;
  lat: number;
  lng: number;
  stability: string;
  current_mayor: string;
  population: number | null;
  election_results: ElectionRow[];
}

interface ElectionRow {
  year: number;
  winner_nuance: string;
  winner_name: string;
  score: number;
  turnout: number;
}

interface RpcResultRow {
  commune_id: string;
  insee: string;
  zipcode: string;
  name: string;
  department: string;
  lat: number;
  lng: number;
  stability: string;
  current_mayor: string;
  match_level: string;
  total_elections: number;
  matching_elections: number;
  latest_nuance: string;
  latest_nuance_label: string;
  latest_bloc: string;
  latest_winner: string;
  latest_year: number;
  latest_score: number;
}

// --------------------------------------------------
// Nuances cache (fetched once from DB)
// --------------------------------------------------

type NuanceInfo = { label: string; bloc: string };
let nuancesCache: Record<string, NuanceInfo> | null = null;

async function getNuancesMap(): Promise<Record<string, NuanceInfo>> {
  if (nuancesCache) return nuancesCache;
  const { data, error } = await supabase.from('nuances').select('code, label, bloc');
  if (error || !data) return {};
  nuancesCache = {};
  for (const row of data as { code: string; label: string; bloc: string }[]) {
    nuancesCache[row.code] = { label: row.label, bloc: row.bloc };
  }
  return nuancesCache;
}

// --------------------------------------------------
// Mappers
// --------------------------------------------------

function mapStability(value: string): StabilityLevel {
  const map: Record<string, StabilityLevel> = {
    'FORTRESS': StabilityLevel.FORTRESS,
    'STABLE': StabilityLevel.STABLE,
    'SWING': StabilityLevel.SWING,
    'UNSTABLE': StabilityLevel.UNSTABLE,
  };
  return map[value] ?? StabilityLevel.UNSTABLE;
}

function toCommune(row: CommuneRow, nuances: Record<string, NuanceInfo>): Commune {
  return {
    insee: row.insee,
    zipcode: row.zipcode,
    name: row.name,
    department: row.department,
    coordinates: [row.lat, row.lng],
    stability: mapStability(row.stability),
    currentMayor: row.current_mayor,
    population: row.population ?? undefined,
    history: (row.election_results || []).map((e): ElectionResult => {
      const n = nuances[e.winner_nuance];
      return {
        year: e.year,
        winnerNuance: e.winner_nuance,
        winnerNuanceLabel: n?.label || e.winner_nuance,
        winnerBloc: n?.bloc || '',
        winnerName: e.winner_name,
        score: e.score,
        turnout: e.turnout,
      };
    }),
  };
}

function rpcRowToResult(row: RpcResultRow): IdealResult {
  return {
    commune: {
      insee: row.insee,
      zipcode: row.zipcode,
      name: row.name,
      department: row.department,
      coordinates: [row.lat, row.lng],
      stability: mapStability(row.stability),
      currentMayor: row.current_mayor,
      history: [],
    },
    matchLevel: (row.match_level === 'all' ? 'tendance' : row.match_level) as MatchLevel,
    latestNuance: row.latest_nuance,
    latestNuanceLabel: row.latest_nuance_label || row.latest_nuance,
    latestBloc: row.latest_bloc || '',
    latestWinner: row.latest_winner,
    latestYear: row.latest_year,
    latestScore: row.latest_score,
  };
}

// --------------------------------------------------
// API: Single commune by zipcode
// --------------------------------------------------

export const searchCommune = async (zipcode: string): Promise<Commune | undefined> => {
  const [{ data, error }, nuances] = await Promise.all([
    supabase.from('communes').select('*, election_results(*)').eq('zipcode', zipcode).limit(1).single(),
    getNuancesMap(),
  ]);

  if (error || !data) return undefined;
  return toCommune(data as CommuneRow, nuances);
};

// --------------------------------------------------
// API: Full commune details by INSEE (with history)
// --------------------------------------------------

export const getCommuneByInsee = async (insee: string): Promise<Commune | undefined> => {
  const [{ data, error }, nuances] = await Promise.all([
    supabase.from('communes').select('*, election_results(*)').eq('insee', insee).limit(1).single(),
    getNuancesMap(),
  ]);

  if (error || !data) return undefined;
  return toCommune(data as CommuneRow, nuances);
};

// --------------------------------------------------
// API: Departments list (server-side DISTINCT)
// --------------------------------------------------

export const getDepartments = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_distinct_departments');

  if (error || !data) {
    const { data: fallback, error: fbErr } = await supabase
      .from('communes')
      .select('department');
    if (fbErr || !fallback) return [];
    return [...new Set(fallback.map((r: { department: string }) => r.department))].sort();
  }

  return (data as { department: string }[]).map(r => r.department);
};

// --------------------------------------------------
// API: Unified search with optional filters
// --------------------------------------------------

const DEFAULT_PAGE_SIZE = 30;

export const searchCommunes = async (
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResults<IdealResult>> => {
  const offset = (page - 1) * pageSize;

  const rpcParams: Record<string, unknown> = {
    page_limit: pageSize,
    page_offset: offset,
    target_risk_level: filters.riskLevel ?? null,
  };

  if (filters.department) rpcParams.target_department = filters.department;
  if (filters.bloc) rpcParams.target_bloc = filters.bloc;
  if (filters.matchLevel) rpcParams.target_match_level = filters.matchLevel;
  if (filters.equipmentFilters?.length) rpcParams.target_equipment_filters = filters.equipmentFilters;
  if (filters.populationSizes?.length) rpcParams.target_pop_ranges = filters.populationSizes;
  if (filters.geoTags?.length) rpcParams.target_geo_tags = filters.geoTags;
  if (filters.prixM2Max) rpcParams.target_prix_m2_max = filters.prixM2Max;

  const countParams: Record<string, unknown> = {
    target_risk_level: filters.riskLevel ?? null,
  };
  if (filters.department) countParams.target_department = filters.department;
  if (filters.bloc) countParams.target_bloc = filters.bloc;
  if (filters.matchLevel) countParams.target_match_level = filters.matchLevel;
  if (filters.equipmentFilters?.length) countParams.target_equipment_filters = filters.equipmentFilters;
  if (filters.populationSizes?.length) countParams.target_pop_ranges = filters.populationSizes;
  if (filters.geoTags?.length) countParams.target_geo_tags = filters.geoTags;
  if (filters.prixM2Max) countParams.target_prix_m2_max = filters.prixM2Max;

  const [resultsRes, countRes] = await Promise.all([
    supabase.rpc('search_communes', rpcParams),
    supabase.rpc('count_communes', countParams),
  ]);

  if (resultsRes.error) {
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }

  const rows = (resultsRes.data || []) as RpcResultRow[];
  const total = (countRes.data as number) || 0;

  return {
    data: rows.map(rpcRowToResult),
    total,
    page,
    pageSize,
    hasMore: offset + rows.length < total,
  };
};

// --------------------------------------------------
// API: Text search (autocomplete by name or postal code)
// --------------------------------------------------

export const searchCommunesByText = async (query: string): Promise<IdealResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const isPostal = /^\d/.test(trimmed);

  let q = supabase
    .from('communes')
    .select('id, insee, zipcode, name, department, lat, lng, stability, current_mayor, population, election_results(year, winner_nuance, winner_name, score, turnout)')
    .limit(10);

  if (isPostal) {
    q = q.like('zipcode', `${trimmed}%`);
  } else {
    q = q.ilike('name', `%${trimmed}%`);
  }

  const [{ data, error }, nuances] = await Promise.all([q, getNuancesMap()]);

  if (error || !data) return [];

  return (data as CommuneRow[]).map((row) => {
    const latest = row.election_results
      ?.sort((a, b) => b.year - a.year)[0];
    const nuance = latest ? nuances[latest.winner_nuance] : undefined;

    return {
      commune: {
        insee: row.insee,
        zipcode: row.zipcode,
        name: row.name,
        department: row.department,
        coordinates: [row.lat, row.lng],
        stability: mapStability(row.stability),
        currentMayor: row.current_mayor,
        population: row.population ?? undefined,
        history: [],
      },
      matchLevel: 'tendance' as MatchLevel,
      latestNuance: latest?.winner_nuance || '',
      latestNuanceLabel: nuance?.label || latest?.winner_nuance || '',
      latestBloc: nuance?.bloc || '',
      latestWinner: latest?.winner_name || '',
      latestYear: latest?.year || 0,
      latestScore: latest?.score || 0,
    };
  }).sort((a, b) => {
    const aExact = a.commune.name.toLowerCase() === trimmed.toLowerCase() ? 0 : 1;
    const bExact = b.commune.name.toLowerCase() === trimmed.toLowerCase() ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.commune.name.localeCompare(b.commune.name);
  });
};

// --------------------------------------------------
// API: Equipment summary for a commune
// --------------------------------------------------

export const getEquipmentSummary = async (insee: string): Promise<EquipmentSummary[]> => {
  const { data, error } = await supabase.rpc('get_commune_equipments', {
    target_insee: insee,
  });

  if (error || !data) return [];

  return (data as { domain: string; domain_label: string; total_count: number }[]).map(row => ({
    domain: row.domain as EquipmentDomain,
    domainLabel: row.domain_label,
    totalCount: row.total_count,
  }));
};

// --------------------------------------------------
// API: Risks for a commune
// --------------------------------------------------

export const getCommuneRisks = async (insee: string): Promise<RiskDetail[]> => {
  const { data, error } = await supabase.rpc('get_commune_risques', {
    target_insee: insee,
  });

  if (error || !data) return [];

  return (data as { num_risque: string; libelle_risque: string }[]).map(row => ({
    numRisque: row.num_risque,
    libelleRisque: row.libelle_risque,
  }));
};

// --------------------------------------------------
// API: DVF stats for a commune
// --------------------------------------------------

export const getDvfStats = async (insee: string): Promise<DvfData> => {
  const [statsRes, tensionRes] = await Promise.all([
    supabase.rpc('get_commune_dvf', { target_insee: insee }),
    supabase.rpc('get_commune_tension', { target_insee: insee }),
  ]);

  const stats: DvfYearStat[] = (statsRes.data || []).map(
    (row: { year: number; type_local: string; nb_mutations: number; prix_m2_median: number | null }) => ({
      year: row.year,
      typeLocal: row.type_local as 'maison' | 'appartement',
      nbMutations: row.nb_mutations,
      prixM2Median: row.prix_m2_median ? Number(row.prix_m2_median) : null,
    })
  );

  const tensionRow = (tensionRes.data as { transactions_derniere_annee: number; tension_level: string }[] | null)?.[0];

  return {
    stats,
    tension: (tensionRow?.tension_level as MarketTension) ?? null,
    transactionsDerniereAnnee: tensionRow?.transactions_derniere_annee ?? 0,
  };
};
