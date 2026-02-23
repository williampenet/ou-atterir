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

export type EquipmentDomain = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export type PopulationSize = 'hameau' | 'village' | 'bourg' | 'petite_ville' | 'ville_moyenne' | 'grande_ville' | 'metropole';

export interface SearchFilters {
  department?: string;
  bloc?: PoliticalBloc;
  matchLevel?: MatchLevel;
  equipmentDomains?: EquipmentDomain[];
  populationSizes?: PopulationSize[];
}

export interface EquipmentSummary {
  domain: EquipmentDomain;
  domainLabel: string;
  totalCount: number;
}
