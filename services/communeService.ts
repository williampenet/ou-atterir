import { supabase } from './supabase';
import { Commune, ElectionResult, PoliticalNuance, PoliticalBloc, StabilityLevel, IdealResult, PaginatedResults, SearchFilters, BLOC_NUANCES, MatchLevel } from '../types';

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
  latest_winner: string;
  latest_year: number;
  latest_score: number;
}

// --------------------------------------------------
// Mappers
// --------------------------------------------------

const NUANCE_MAP: Record<string, PoliticalNuance> = {
  'EXG': PoliticalNuance.EXG,
  'G': PoliticalNuance.G,
  'CG': PoliticalNuance.CG,
  'C': PoliticalNuance.C,
  'CD': PoliticalNuance.CD,
  'D': PoliticalNuance.D,
  'EXD': PoliticalNuance.EXD,
  'DIV': PoliticalNuance.DIV,
};

const NUANCE_KEY_MAP: Record<PoliticalNuance, string> = Object.fromEntries(
  Object.entries(NUANCE_MAP).map(([k, v]) => [v, k])
) as Record<PoliticalNuance, string>;

function mapNuance(value: string): PoliticalNuance {
  return NUANCE_MAP[value] ?? PoliticalNuance.DIV;
}

function mapStability(value: string): StabilityLevel {
  const map: Record<string, StabilityLevel> = {
    'FORTRESS': StabilityLevel.FORTRESS,
    'STABLE': StabilityLevel.STABLE,
    'SWING': StabilityLevel.SWING,
    'UNSTABLE': StabilityLevel.UNSTABLE,
  };
  return map[value] ?? StabilityLevel.UNSTABLE;
}

function toCommune(row: CommuneRow): Commune {
  return {
    insee: row.insee,
    zipcode: row.zipcode,
    name: row.name,
    department: row.department,
    coordinates: [row.lat, row.lng],
    stability: mapStability(row.stability),
    currentMayor: row.current_mayor,
    history: (row.election_results || []).map((e): ElectionResult => ({
      year: e.year,
      winnerNuance: mapNuance(e.winner_nuance),
      winnerName: e.winner_name,
      score: e.score,
      turnout: e.turnout,
    })),
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
    latestNuance: mapNuance(row.latest_nuance),
    latestWinner: row.latest_winner,
    latestYear: row.latest_year,
    latestScore: row.latest_score,
  };
}

function blocToNuanceKeys(bloc: PoliticalBloc): string[] {
  const nuances = BLOC_NUANCES[bloc];
  return nuances.map(n => NUANCE_KEY_MAP[n]).filter(Boolean);
}

// --------------------------------------------------
// API: Single commune by zipcode
// --------------------------------------------------

export const searchCommune = async (zipcode: string): Promise<Commune | undefined> => {
  const { data, error } = await supabase
    .from('communes')
    .select('*, election_results(*)')
    .eq('zipcode', zipcode)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toCommune(data as CommuneRow);
};

// --------------------------------------------------
// API: Full commune details by INSEE (with history)
// --------------------------------------------------

export const getCommuneByInsee = async (insee: string): Promise<Commune | undefined> => {
  const { data, error } = await supabase
    .from('communes')
    .select('*, election_results(*)')
    .eq('insee', insee)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toCommune(data as CommuneRow);
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
  const nuanceKeys = filters.bloc ? blocToNuanceKeys(filters.bloc) : null;
  const offset = (page - 1) * pageSize;

  const rpcParams: Record<string, unknown> = {
    page_limit: pageSize,
    page_offset: offset,
  };

  if (filters.department) rpcParams.target_department = filters.department;
  if (nuanceKeys) rpcParams.target_nuances = nuanceKeys;
  if (filters.matchLevel) rpcParams.target_match_level = filters.matchLevel;

  const [resultsRes, countRes] = await Promise.all([
    supabase.rpc('search_communes', rpcParams),
    supabase.rpc('count_communes', {
      ...(filters.department ? { target_department: filters.department } : {}),
      ...(nuanceKeys ? { target_nuances: nuanceKeys } : {}),
      ...(filters.matchLevel ? { target_match_level: filters.matchLevel } : {}),
    }),
  ]);

  if (resultsRes.error) {
    return searchCommunesFallback(filters, page, pageSize);
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
// Fallback: client-side filtering (pre-migration v3)
// --------------------------------------------------

async function searchCommunesFallback(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<PaginatedResults<IdealResult>> {
  let query = supabase.from('communes').select('*, election_results(*)');

  if (filters.department) {
    query = query.eq('department', filters.department);
  }

  const { data, error } = await query;

  if (error || !data) return { data: [], total: 0, page, pageSize, hasMore: false };

  const nuanceKeys = filters.bloc ? blocToNuanceKeys(filters.bloc) : null;
  const allResults: IdealResult[] = [];

  for (const row of data as CommuneRow[]) {
    const commune = toCommune(row);
    if (commune.history.length === 0) continue;

    const sorted = [...commune.history].sort((a, b) => b.year - a.year);

    let matchLevel: MatchLevel | null = null;

    if (nuanceKeys) {
      const allMatch = sorted.every(e => nuanceKeys.includes(NUANCE_KEY_MAP[e.winnerNuance]));
      const latestMatch = nuanceKeys.includes(NUANCE_KEY_MAP[sorted[0].winnerNuance]);

      if (allMatch && sorted.length >= 2) {
        matchLevel = 'forteresse';
      } else if (latestMatch) {
        matchLevel = 'tendance';
      }
    } else {
      matchLevel = 'tendance';
    }

    if (!matchLevel) continue;
    if (filters.matchLevel && matchLevel !== filters.matchLevel) continue;

    allResults.push({
      commune,
      matchLevel,
      latestNuance: sorted[0].winnerNuance,
      latestWinner: sorted[0].winnerName,
      latestYear: sorted[0].year,
      latestScore: sorted[0].score,
    });
  }

  allResults.sort((a, b) => {
    if (a.matchLevel === b.matchLevel) return 0;
    return a.matchLevel === 'forteresse' ? -1 : 1;
  });

  const offset = (page - 1) * pageSize;
  const paged = allResults.slice(offset, offset + pageSize);

  return {
    data: paged,
    total: allResults.length,
    page,
    pageSize,
    hasMore: offset + paged.length < allResults.length,
  };
}
