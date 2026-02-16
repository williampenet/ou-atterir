import { PoliticalNuance, PoliticalBloc, StabilityLevel } from './types';

export const NUANCE_COLORS: Record<PoliticalNuance, string> = {
  [PoliticalNuance.EXG]: '#b91c1c', // Red 700
  [PoliticalNuance.G]: '#ec4899',   // Pink 500
  [PoliticalNuance.CG]: '#f472b6',  // Pink 400 (often mixed with greens)
  [PoliticalNuance.C]: '#f59e0b',   // Amber 500
  [PoliticalNuance.CD]: '#60a5fa',  // Blue 400
  [PoliticalNuance.D]: '#2563eb',   // Blue 600
  [PoliticalNuance.EXD]: '#1e1b4b', // Indigo 950
  [PoliticalNuance.DIV]: '#94a3b8', // Slate 400
};

export const STABILITY_COLORS: Record<StabilityLevel, string> = {
  [StabilityLevel.FORTRESS]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [StabilityLevel.STABLE]: 'bg-blue-100 text-blue-800 border-blue-200',
  [StabilityLevel.SWING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [StabilityLevel.UNSTABLE]: 'bg-red-100 text-red-800 border-red-200',
};

export const BLOC_COLORS: Record<PoliticalBloc, string> = {
  [PoliticalBloc.GAUCHE]: '#ec4899',
  [PoliticalBloc.CENTRE]: '#f59e0b',
  [PoliticalBloc.DROITE]: '#2563eb',
  [PoliticalBloc.EXTREME_DROITE]: '#1e1b4b',
};

// Map nuance to a numeric value for charting (1 = Far Left, 7 = Far Right)
export const SPECTRUM_VALUE: Record<PoliticalNuance, number> = {
  [PoliticalNuance.EXG]: 1,
  [PoliticalNuance.G]: 2,
  [PoliticalNuance.CG]: 3,
  [PoliticalNuance.C]: 4,
  [PoliticalNuance.CD]: 5,
  [PoliticalNuance.D]: 6,
  [PoliticalNuance.EXD]: 7,
  [PoliticalNuance.DIV]: 4, // Neutral
};
