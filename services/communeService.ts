import { supabase } from './supabase';
import { Commune, ElectionResult, PoliticalNuance, PoliticalBloc, StabilityLevel, IdealResult, PaginatedResults, BLOC_NUANCES, MatchLevel } from '../types';

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

interface IdealCommuneRow {
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

function rpcRowToIdealResult(row: IdealCommuneRow): IdealResult {
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
    matchLevel: row.match_level as MatchLevel,
    latestNuance: mapNuance(row.latest_nuance),
    latestWinner: row.latest_winner,
    latestYear: row.latest_year,
    latestScore: row.latest_score,
  };
}

// Converts a PoliticalBloc to the DB-level nuance keys (e.g. ['G', 'CG'])
function blocToNuanceKeys(bloc: PoliticalBloc): string[] {
  const nuances = BLOC_NUANCES[bloc];
  return nuances.map(n => NUANCE_KEY_MAP[n]).filter(Boolean);
}

// --------------------------------------------------
// API: Zipcode search
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
// API: Nearby communes (generic load)
// --------------------------------------------------

export const getNearbyCommunes = async (): Promise<Commune[]> => {
  const { data, error } = await supabase
    .from('communes')
    .select('*, election_results(*)')
    .limit(50);

  if (error || !data) return [];
  return (data as CommuneRow[]).map(toCommune);
};

// --------------------------------------------------
// API: Departments list (server-side DISTINCT)
// --------------------------------------------------

export const getDepartments = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_distinct_departments');

  if (error || !data) {
    // Fallback: client-side dedup if RPC not yet deployed
    const { data: fallback, error: fbErr } = await supabase
      .from('communes')
      .select('department');
    if (fbErr || !fallback) return [];
    return [...new Set(fallback.map((r: { department: string }) => r.department))].sort();
  }

  return (data as { department: string }[]).map(r => r.department);
};

// --------------------------------------------------
// API: Ideal commune search (server-side filtering)
// --------------------------------------------------

const DEFAULT_PAGE_SIZE = 30;

export const searchIdealCommunes = async (
  bloc: PoliticalBloc,
  department: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResults<IdealResult>> => {
  const nuanceKeys = blocToNuanceKeys(bloc);
  const offset = (page - 1) * pageSize;

  // Parallel: fetch results + count
  const [resultsRes, countRes] = await Promise.all([
    supabase.rpc('search_ideal_communes', {
      target_nuances: nuanceKeys,
      target_department: department,
      page_limit: pageSize,
      page_offset: offset,
    }),
    supabase.rpc('count_ideal_communes', {
      target_nuances: nuanceKeys,
      target_department: department,
    }),
  ]);

  if (resultsRes.error) {
    // Fallback: use legacy client-side filtering if RPC not available
    return searchIdealCommunesFallback(bloc, department, page, pageSize);
  }

  const rows = (resultsRes.data || []) as IdealCommuneRow[];
  const total = (countRes.data as number) || 0;

  return {
    data: rows.map(rpcRowToIdealResult),
    total,
    page,
    pageSize,
    hasMore: offset + rows.length < total,
  };
};

// --------------------------------------------------
// Fallback: client-side filtering (pre-migration)
// --------------------------------------------------

async function searchIdealCommunesFallback(
  bloc: PoliticalBloc,
  department: string,
  page: number,
  pageSize: number
): Promise<PaginatedResults<IdealResult>> {
  const nuances = BLOC_NUANCES[bloc];
  const nuanceKeys = nuances.map(n => NUANCE_KEY_MAP[n]).filter(Boolean);

  const { data, error } = await supabase
    .from('communes')
    .select('*, election_results(*)')
    .eq('department', department);

  if (error || !data) return { data: [], total: 0, page, pageSize, hasMore: false };

  const allResults: IdealResult[] = [];

  for (const row of data as CommuneRow[]) {
    const commune = toCommune(row);
    if (commune.history.length === 0) continue;

    const sorted = [...commune.history].sort((a, b) => b.year - a.year);
    const allMatch = sorted.every(e => nuanceKeys.includes(NUANCE_KEY_MAP[e.winnerNuance]));
    const latestMatch = nuanceKeys.includes(NUANCE_KEY_MAP[sorted[0].winnerNuance]);

    if (allMatch && sorted.length >= 2) {
      allResults.push({
        commune,
        matchLevel: 'forteresse',
        latestNuance: sorted[0].winnerNuance,
        latestWinner: sorted[0].winnerName,
        latestYear: sorted[0].year,
        latestScore: sorted[0].score,
      });
    } else if (latestMatch) {
      allResults.push({
        commune,
        matchLevel: 'tendance',
        latestNuance: sorted[0].winnerNuance,
        latestWinner: sorted[0].winnerName,
        latestYear: sorted[0].year,
        latestScore: sorted[0].score,
      });
    }
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
