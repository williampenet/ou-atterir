import { PoliticalBloc, StabilityLevel, EquipmentDomain, EquipmentCategory, PopulationSize, RiskLevel, GeoTag, MarketTension, AirQuality, TransportMode } from './types';

export const BLOC_COLORS: Record<string, string> = {
  [PoliticalBloc.EXTRÊME_GAUCHE]: '#b91c1c',
  [PoliticalBloc.GAUCHE]: '#ec4899',
  [PoliticalBloc.CENTRE]: '#f59e0b',
  [PoliticalBloc.CENTRE_DROIT]: '#7c3aed',
  [PoliticalBloc.DROITE]: '#2563eb',
  [PoliticalBloc.EXTREME_DROITE]: '#1e1b4b',
  [PoliticalBloc.DIVERS]: '#94a3b8',
};

export const EQUIPMENT_DOMAINS: Record<EquipmentDomain, { label: string; icon: string }> = {
  B: { label: 'Commerces', icon: 'ShoppingBag' },
  C: { label: 'Enseignement', icon: 'GraduationCap' },
  D: { label: 'Santé', icon: 'Heart' },
  E: { label: 'Transports', icon: 'Train' },
  F: { label: 'Sports & Culture', icon: 'Dumbbell' },
};

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  { id: 'B', label: 'Commerces', icon: 'ShoppingBag', filterKey: 'commerces' },
  {
    id: 'C', label: 'Enseignement', icon: 'GraduationCap',
    children: [
      { id: 'creche', label: 'Crèche' },
      { id: 'ecole', label: 'École (maternelle, primaire, élémentaire)' },
      { id: 'college', label: 'Collège' },
      { id: 'lycee', label: 'Lycée' },
      { id: 'sup', label: 'Enseignement supérieur' },
    ],
  },
  {
    id: 'D', label: 'Santé', icon: 'Heart',
    children: [
      { id: 'etab_sante', label: 'Établissements de santé' },
      { id: 'prof_med', label: 'Professions médicales libérales' },
    ],
  },
  { id: 'E', label: 'Transports', icon: 'Train', filterKey: 'transports' },
  {
    id: 'F', label: 'Sports, loisirs & culture', icon: 'Dumbbell',
    children: [
      { id: 'sport', label: 'Équipements sportifs' },
      { id: 'culture', label: 'Équipements culturels' },
    ],
  },
];

export const POPULATION_SIZES: Record<PopulationSize, { label: string; min: number; max: number }> = {
  hameau: { label: 'Hameau', min: 0, max: 200 },
  village: { label: 'Village', min: 200, max: 500 },
  bourg: { label: 'Bourg', min: 500, max: 2000 },
  petite_ville: { label: 'Petite ville', min: 2000, max: 10000 },
  ville_moyenne: { label: 'Ville moyenne', min: 10000, max: 50000 },
  grande_ville: { label: 'Grande ville', min: 50000, max: 200000 },
  metropole: { label: 'Métropole', min: 200000, max: Infinity },
};

export const STABILITY_COLORS: Record<StabilityLevel, string> = {
  [StabilityLevel.FORTERESSE]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [StabilityLevel.EN_BALLOTTAGE]: 'bg-orange-100 text-orange-800 border-orange-200',
};

export const GEO_TAGS: Record<GeoTag, { label: string; color: string }> = {
  littoral: { label: 'Littoral', color: 'bg-sky-50 border-sky-300 text-sky-700' },
  montagne: { label: 'Montagne', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  campagne: { label: 'Campagne', color: 'bg-lime-50 border-lime-300 text-lime-700' },
};

export const RISK_LEVELS: Record<RiskLevel, { label: string; description: string; color: string }> = {
  peu_expose: { label: 'Peu exposé', description: '0-1 risques', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  modere: { label: 'Modéré', description: '2-4 risques', color: 'bg-amber-50 border-amber-300 text-amber-700' },
  tres_expose: { label: 'Très exposé', description: '5+ risques', color: 'bg-red-50 border-red-300 text-red-700' },
};

export const MARKET_TENSION_LEVELS: Record<MarketTension, { label: string; color: string }> = {
  calme: { label: 'Calme', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  actif: { label: 'Actif', color: 'bg-amber-50 border-amber-300 text-amber-700' },
  tendu: { label: 'Tendu', color: 'bg-red-50 border-red-300 text-red-700' },
};

export const AIR_QUALITY_LEVELS: Record<AirQuality, { label: string; description: string; color: string }> = {
  bonne: { label: 'Bonne', description: 'PM2.5 < 5 µg/m³', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  moyenne: { label: 'Moyenne', description: 'PM2.5 5–7 µg/m³', color: 'bg-sky-50 border-sky-300 text-sky-700' },
  degradee: { label: 'Dégradée', description: 'PM2.5 7–9 µg/m³', color: 'bg-amber-50 border-amber-300 text-amber-700' },
  mauvaise: { label: 'Mauvaise', description: 'PM2.5 > 9 µg/m³', color: 'bg-red-50 border-red-300 text-red-700' },
};

export const DEPARTMENT_CODES: Record<string, string> = {
  'Ain': '01', 'Aisne': '02', 'Allier': '03', 'Alpes-de-Haute-Provence': '04',
  'Hautes-Alpes': '05', 'Alpes-Maritimes': '06', 'Ardèche': '07', 'Ardennes': '08',
  'Ariège': '09', 'Aube': '10', 'Aude': '11', 'Aveyron': '12',
  'Bouches-du-Rhône': '13', 'Calvados': '14', 'Cantal': '15', 'Charente': '16',
  'Charente-Maritime': '17', 'Cher': '18', 'Corrèze': '19',
  'Corse-du-Sud': '2A', 'Haute-Corse': '2B',
  "Côte-d'Or": '21', "Côtes-d'Armor": '22', 'Creuse': '23', 'Dordogne': '24',
  'Doubs': '25', 'Drôme': '26', 'Eure': '27', 'Eure-et-Loir': '28',
  'Finistère': '29', 'Gard': '30', 'Haute-Garonne': '31', 'Gers': '32',
  'Gironde': '33', 'Hérault': '34', 'Ille-et-Vilaine': '35', 'Indre': '36',
  'Indre-et-Loire': '37', 'Isère': '38', 'Jura': '39', 'Landes': '40',
  'Loir-et-Cher': '41', 'Loire': '42', 'Haute-Loire': '43', 'Loire-Atlantique': '44',
  'Loiret': '45', 'Lot': '46', 'Lot-et-Garonne': '47', 'Lozère': '48',
  'Maine-et-Loire': '49', 'Manche': '50', 'Marne': '51', 'Haute-Marne': '52',
  'Mayenne': '53', 'Meurthe-et-Moselle': '54', 'Meuse': '55', 'Morbihan': '56',
  'Moselle': '57', 'Nièvre': '58', 'Nord': '59', 'Oise': '60',
  'Orne': '61', 'Pas-de-Calais': '62', 'Puy-de-Dôme': '63',
  'Pyrénées-Atlantiques': '64', 'Hautes-Pyrénées': '65', 'Pyrénées-Orientales': '66',
  'Bas-Rhin': '67', 'Haut-Rhin': '68', 'Rhône': '69', 'Haute-Saône': '70',
  'Saône-et-Loire': '71', 'Sarthe': '72', 'Savoie': '73', 'Haute-Savoie': '74',
  'Paris': '75', 'Seine-Maritime': '76', 'Seine-et-Marne': '77', 'Yvelines': '78',
  'Deux-Sèvres': '79', 'Somme': '80', 'Tarn': '81', 'Tarn-et-Garonne': '82',
  'Var': '83', 'Vaucluse': '84', 'Vendée': '85', 'Vienne': '86',
  'Haute-Vienne': '87', 'Vosges': '88', 'Yonne': '89',
  'Territoire de Belfort': '90', 'Essonne': '91', 'Hauts-de-Seine': '92',
  'Seine-Saint-Denis': '93', 'Val-de-Marne': '94', "Val-d'Oise": '95',
  'Guadeloupe': '971', 'Martinique': '972', 'Guyane': '973',
  'La Réunion': '974', 'Mayotte': '976',
};

export interface Department {
  code: string;
  name: string;
}

export function formatDepartments(names: string[]): Department[] {
  return names
    .map(name => ({ code: DEPARTMENT_CODES[name] ?? '99', name }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

export const TRANSPORT_MODES: { key: TransportMode; label: string; icon: string }[] = [
  { key: 'train', label: 'Train / TER', icon: 'TrainFront' },
  { key: 'cycling', label: 'Vélo', icon: 'Bike' },
  { key: 'driving', label: 'Voiture', icon: 'Car' },
];

export const TRAVEL_DURATIONS = [15, 30, 45, 60];

export const PRIX_M2_RANGES = [
  { key: 1500, label: '< 1 500 €/m²' },
  { key: 2500, label: '< 2 500 €/m²' },
  { key: 3500, label: '< 3 500 €/m²' },
  { key: 5000, label: '< 5 000 €/m²' },
  { key: 99999, label: '> 5 000 €/m²' },
];
