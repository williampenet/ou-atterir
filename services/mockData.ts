import { Commune, StabilityLevel, ElectionType } from '../types';

export const MOCK_COMMUNES: Commune[] = [
  {
    insee: '69123',
    zipcode: '69001',
    name: 'Lyon 1er Arrondissement',
    department: 'Rhône',
    coordinates: [45.7705, 4.8305],
    currentMayor: 'Yasmine Bouagga',
    stability: StabilityLevel.EN_BALLOTTAGE,
    history: [
      { year: 2020, electionType: 'municipales' as ElectionType, winnerNuance: 'EXG', winnerNuanceLabel: 'Extrême gauche', winnerBloc: 'Extrême-gauche', winnerName: 'Union Gauche/Écologistes', score: 58.6, turnout: 42.5 },
      { year: 2014, electionType: 'municipales' as ElectionType, winnerNuance: 'DVG', winnerNuanceLabel: 'Divers gauche', winnerBloc: 'Gauche', winnerName: 'Nathalie Perrin-Gilbert', score: 51.2, turnout: 56.1 },
    ],
  },
  {
    insee: '33063',
    zipcode: '33000',
    name: 'Bordeaux',
    department: 'Gironde',
    coordinates: [44.8378, -0.5792],
    currentMayor: 'Pierre Hurmic',
    stability: StabilityLevel.EN_BALLOTTAGE,
    history: [
      { year: 2020, electionType: 'municipales' as ElectionType, winnerNuance: 'ECO', winnerNuanceLabel: 'Écologiste', winnerBloc: 'Gauche', winnerName: 'Pierre Hurmic (EELV)', score: 46.5, turnout: 37.8 },
      { year: 2014, electionType: 'municipales' as ElectionType, winnerNuance: 'LR', winnerNuanceLabel: 'Les Républicains', winnerBloc: 'Droite', winnerName: 'Alain Juppé', score: 60.9, turnout: 56.2 },
    ],
  },
];

export const searchCommune = async (zipcode: string): Promise<Commune | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_COMMUNES.find(c => c.zipcode === zipcode);
};

export const getNearbyCommunes = async (): Promise<Commune[]> => {
  return MOCK_COMMUNES;
};
