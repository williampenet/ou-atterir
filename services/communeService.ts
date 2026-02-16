import { supabase } from './supabase';
import { Commune, ElectionResult, PoliticalNuance, PoliticalBloc, StabilityLevel, IdealResult, BLOC_NUANCES, MatchLevel } from '../types';

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

function mapNuance(value: string): PoliticalNuance {
  const map: Record<string, PoliticalNuance> = {
    'EXG': PoliticalNuance.EXG,
    'G': PoliticalNuance.G,
    'CG': PoliticalNuance.CG,
    'C': PoliticalNuance.C,
    'CD': PoliticalNuance.CD,
    'D': PoliticalNuance.D,
    'EXD': PoliticalNuance.EXD,
    'DIV': PoliticalNuance.DIV,
  };
  return map[value] ?? PoliticalNuance.DIV;
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

export const getNearbyCommunes = async (): Promise<Commune[]> => {
  const { data, error } = await supabase
    .from('communes')
    .select('*, election_results(*)')
    .limit(50);

  if (error || !data) return [];
  return (data as CommuneRow[]).map(toCommune);
};

export const getDepartments = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('communes')
    .select('department');

  if (error || !data) return [];
  const unique = [...new Set(data.map((r: { department: string }) => r.department))];
  return unique.sort();
};

export const searchIdealCommunes = async (bloc: PoliticalBloc, department: string): Promise<IdealResult[]> => {
  const nuances = BLOC_NUANCES[bloc];
  const nuanceKeys = Object.entries({
    'EXG': PoliticalNuance.EXG, 'G': PoliticalNuance.G, 'CG': PoliticalNuance.CG,
    'C': PoliticalNuance.C, 'CD': PoliticalNuance.CD, 'D': PoliticalNuance.D,
    'EXD': PoliticalNuance.EXD, 'DIV': PoliticalNuance.DIV,
  }).filter(([, v]) => nuances.includes(v)).map(([k]) => k);

  const { data, error } = await supabase
    .from('communes')
    .select('*, election_results(*)')
    .eq('department', department);

  if (error || !data) return [];

  const results: IdealResult[] = [];

  for (const row of data as CommuneRow[]) {
    const commune = toCommune(row);
    if (commune.history.length === 0) continue;

    const sorted = [...commune.history].sort((a, b) => b.year - a.year);
    const allMatch = sorted.every(e => nuanceKeys.includes(getNuanceKey(e.winnerNuance)));
    const latestMatch = nuanceKeys.includes(getNuanceKey(sorted[0].winnerNuance));

    if (allMatch && sorted.length >= 2) {
      results.push({ commune, matchLevel: 'forteresse' });
    } else if (latestMatch) {
      results.push({ commune, matchLevel: 'tendance' });
    }
  }

  // Forteresses first, then tendances
  return results.sort((a, b) => {
    if (a.matchLevel === b.matchLevel) return 0;
    return a.matchLevel === 'forteresse' ? -1 : 1;
  });
};

function getNuanceKey(nuance: PoliticalNuance): string {
  const reverseMap: Record<PoliticalNuance, string> = {
    [PoliticalNuance.EXG]: 'EXG', [PoliticalNuance.G]: 'G', [PoliticalNuance.CG]: 'CG',
    [PoliticalNuance.C]: 'C', [PoliticalNuance.CD]: 'CD', [PoliticalNuance.D]: 'D',
    [PoliticalNuance.EXD]: 'EXD', [PoliticalNuance.DIV]: 'DIV',
  };
  return reverseMap[nuance];
}
