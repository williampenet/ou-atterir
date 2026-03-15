export enum StabilityLevel {
  FORTERESSE = 'Forteresse',
  EN_BALLOTTAGE = 'En ballottage',
}

export type ElectionType = 'municipales' | 'presidentielles' | 'legislatives' | 'europeennes';

export interface ElectionResult {
  year: number;
  electionType: ElectionType;
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
  CENTRE_DROIT = 'Centre-droit',
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
  climateScores?: ClimateScores;
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

export type AirQuality = 'bonne' | 'moyenne' | 'degradee' | 'mauvaise';

export type HeatWaveLevel = 'faible' | 'modere' | 'eleve' | 'tres_eleve';

export interface ClimatProjection {
  ref: number | null;
  y2030: number | null;
  y2050: number | null;
  y2100: number | null;
}

export interface ClimatData {
  icu: number | null;
  s3: ClimatProjection;
  s1: ClimatProjection;
  s2: ClimatProjection;
  s4: ClimatProjection;
  r2: ClimatProjection;
  r4: ClimatProjection;
  r5Ete: ClimatProjection;
  g4Ete: ClimatProjection;
}

export type GeoTag = 'littoral' | 'montagne' | 'campagne';

export interface RiskDetail {
  numRisque: string;
  libelleRisque: string;
}

export type MarketTension = 'calme' | 'actif' | 'tendu';

export interface DvfYearStat {
  year: number;
  typeLocal: 'maison' | 'appartement';
  nbMutations: number;
  prixM2Median: number | null;
}

export interface DvfData {
  stats: DvfYearStat[];
  tension: MarketTension | null;
  transactionsDerniereAnnee: number;
}

export type TransportMode = 'train' | 'cycling' | 'driving';

export interface TravelFilter {
  address: string;
  lat: number;
  lng: number;
  mode: TransportMode;
  duration: number;
  insees?: string[];
}

export interface SearchFilters {
  department?: string;
  bloc?: PoliticalBloc;
  matchLevel?: MatchLevel;
  equipmentFilters?: EquipmentFilterKey[];
  populationSizes?: PopulationSize[];
  riskLevel?: RiskLevel;
  geoTags?: GeoTag[];
  prixM2Max?: number;
  airQuality?: AirQuality;
  heatWave?: HeatWaveLevel;
  travelFilter?: TravelFilter;
}

export interface EquipmentSummary {
  domain: EquipmentDomain;
  domainLabel: string;
  totalCount: number;
}

export interface EquipmentDetail {
  domain: EquipmentDomain;
  domainLabel: string;
  label: string;
  count: number;
}

export interface ClimateScores {
  chaleur: number;      // 0-100, higher = more exposed
  eau: number;           // 0-100
  risques: number;       // 0-100
  air: number;           // 0-100
  sols: number | null;   // null until data available
  global: number;        // 0-100
}

export interface ClimateWeights {
  chaleur: number;   // 0-100
  eau: number;
  risques: number;
  air: number;
  sols: number;
}

export type ClimateFamilyKey = 'chaleur' | 'eau' | 'risques' | 'air' | 'sols';

export interface MapMarker {
  insee: string;
  name: string;
  zipcode: string;
  lat: number;
  lng: number;
  latestBloc: string | null;
  matchLevel: MatchLevel | 'all';
  climateScore?: number;
}

export interface MapBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}
