import { PoliticalBloc, StabilityLevel } from './types';

export const BLOC_COLORS: Record<string, string> = {
  [PoliticalBloc.EXTRÊME_GAUCHE]: '#b91c1c',
  [PoliticalBloc.GAUCHE]: '#ec4899',
  [PoliticalBloc.CENTRE]: '#f59e0b',
  [PoliticalBloc.DROITE]: '#2563eb',
  [PoliticalBloc.EXTREME_DROITE]: '#1e1b4b',
  [PoliticalBloc.DIVERS]: '#94a3b8',
};

export const STABILITY_COLORS: Record<StabilityLevel, string> = {
  [StabilityLevel.FORTRESS]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [StabilityLevel.STABLE]: 'bg-blue-100 text-blue-800 border-blue-200',
  [StabilityLevel.SWING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [StabilityLevel.UNSTABLE]: 'bg-red-100 text-red-800 border-red-200',
};
