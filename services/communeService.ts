import { supabase } from './supabase';
import { Commune, ElectionResult, PoliticalNuance, StabilityLevel } from '../types';

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
