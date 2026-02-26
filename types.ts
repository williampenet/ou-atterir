export enum StabilityLevel {
  FORTRESS = 'Forteresse',
  STABLE = 'Stable',
  SWING = 'En bascule',
  UNSTABLE = 'Instable'
}

export interface ElectionResult {
  year: number;
  winnerNuance: string;
  winnerNuanceLabel: string;
  winnerBloc: string;
  winnerName: string;
  score: number;
  turnout: number;
}

export interface Commune {
  insee: string;
  zipcode: string;
  name: string;
  department: string;
  coordinates: [number, number];
  history: ElectionResult[];
  stability: StabilityLevel;
  currentMayor: string;
  population?: number;
}

export enum PoliticalBloc {
  EXTRÊME_GAUCHE = 'Extrême-gauche',
  GAUCHE = 'Gauche',
  CENTRE = 'Centre',
  DROITE = 'Droite',
  EXTREME_DROITE = 'Extrême-droite',
  DIVERS = 'Divers',
}

export type MatchLevel = 'forteresse' | 'tendance';

export interface IdealResult {
  commune: Commune;
  matchLevel: MatchLevel;
  latestNuance?: string;
  latestNuanceLabel?: string;
  latestBloc?: string;
  latestWinner?: string;
  latestYear?: number;
  latestScore?: number;
}

export interface PaginatedResults<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type EquipmentDomain = 'B' | 'C' | 'D' | 'E' | 'F';

export type EquipmentFilterKey =
  | 'commerces'
  | 'ecole' | 'college' | 'lycee' | 'sup'
  | 'etab_sante' | 'prof_med' | 'creche'
  | 'transports'
  | 'sport' | 'culture';

export interface EquipmentCategory {
  id: string;
  label: string;
  icon: string;
  filterKey?: EquipmentFilterKey;
  children?: { id: EquipmentFilterKey; label: string }[];
}

export type PopulationSize = 'hameau' | 'village' | 'bourg' | 'petite_ville' | 'ville_moyenne' | 'grande_ville' | 'metropole';

export type RiskLevel = 'peu_expose' | 'modere' | 'tres_expose';

export interface RiskDetail {
  numRisque: string;
  libelleRisque: string;
}

export interface SearchFilters {
  department?: string;
  bloc?: PoliticalBloc;
  matchLevel?: MatchLevel;
  equipmentFilters?: EquipmentFilterKey[];
  populationSizes?: PopulationSize[];
  riskLevel?: RiskLevel;
}

export interface EquipmentSummary {
  domain: EquipmentDomain;
  domainLabel: string;
  totalCount: number;
}
