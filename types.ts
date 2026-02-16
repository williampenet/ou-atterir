export enum PoliticalNuance {
  EXG = 'Extrême-gauche',
  G = 'Gauche',
  CG = 'Centre Gauche',
  C = 'Centre',
  CD = 'Centre Droit',
  D = 'Droite',
  EXD = 'Extrême-droite',
  DIV = 'Divers'
}

export enum StabilityLevel {
  FORTRESS = 'Forteresse', // Same block 3 times
  STABLE = 'Stable',       // Same block 2 times recently
  SWING = 'En bascule',    // Changed blocks
  UNSTABLE = 'Instable'    // Chaotic
}

export interface ElectionResult {
  year: number;
  winnerNuance: PoliticalNuance;
  winnerName: string;
  score: number; // Percentage
  turnout: number; // Participation
}

export interface Commune {
  insee: string;
  zipcode: string;
  name: string;
  department: string;
  coordinates: [number, number]; // Lat, Lng
  history: ElectionResult[];
  stability: StabilityLevel;
  currentMayor: string;
}

export interface SearchFilters {
  trend?: PoliticalNuance;
  stableOnly?: boolean;
}