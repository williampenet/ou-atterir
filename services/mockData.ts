import { Commune, PoliticalNuance, StabilityLevel } from '../types';

export const MOCK_COMMUNES: Commune[] = [
  {
    insee: '69123',
    zipcode: '69001',
    name: 'Lyon 1er Arrondissement',
    department: 'Rhône',
    coordinates: [45.7705, 4.8305],
    currentMayor: 'Yasmine Bouagga',
    stability: StabilityLevel.STABLE,
    history: [
      { year: 2020, winnerNuance: PoliticalNuance.EXG, winnerName: 'Union Gauche/Écologistes', score: 58.6, turnout: 42.5 },
      { year: 2014, winnerNuance: PoliticalNuance.G, winnerName: 'Nathalie Perrin-Gilbert', score: 51.2, turnout: 56.1 },
      { year: 2008, winnerNuance: PoliticalNuance.G, winnerName: 'Nathalie Perrin-Gilbert', score: 54.3, turnout: 58.4 }
    ]
  },
  {
    insee: '33063',
    zipcode: '33000',
    name: 'Bordeaux',
    department: 'Gironde',
    coordinates: [44.8378, -0.5792],
    currentMayor: 'Pierre Hurmic',
    stability: StabilityLevel.SWING,
    history: [
      { year: 2020, winnerNuance: PoliticalNuance.G, winnerName: 'Pierre Hurmic (EELV)', score: 46.5, turnout: 37.8 },
      { year: 2014, winnerNuance: PoliticalNuance.CD, winnerName: 'Alain Juppé', score: 60.9, turnout: 56.2 },
      { year: 2008, winnerNuance: PoliticalNuance.CD, winnerName: 'Alain Juppé', score: 56.6, turnout: 59.1 }
    ]
  },
  {
    insee: '62427',
    zipcode: '62110',
    name: 'Hénin-Beaumont',
    department: 'Pas-de-Calais',
    coordinates: [50.4214, 2.9515],
    currentMayor: 'Steeve Briois',
    stability: StabilityLevel.FORTRESS,
    history: [
      { year: 2020, winnerNuance: PoliticalNuance.EXD, winnerName: 'Steeve Briois (RN)', score: 74.2, turnout: 52.3 },
      { year: 2014, winnerNuance: PoliticalNuance.EXD, winnerName: 'Steeve Briois (FN)', score: 50.3, turnout: 64.8 },
      { year: 2008, winnerNuance: PoliticalNuance.G, winnerName: 'Gérard Dalongeville', score: 44.3, turnout: 66.5 }
    ]
  },
  {
    insee: '92200',
    zipcode: '92200',
    name: 'Neuilly-sur-Seine',
    department: 'Hauts-de-Seine',
    coordinates: [48.8846, 2.2696],
    currentMayor: 'Jean-Christophe Fromantin',
    stability: StabilityLevel.FORTRESS,
    history: [
      { year: 2020, winnerNuance: PoliticalNuance.CD, winnerName: 'J.C. Fromantin', score: 60.3, turnout: 39.4 },
      { year: 2014, winnerNuance: PoliticalNuance.CD, winnerName: 'J.C. Fromantin', score: 66.5, turnout: 55.7 },
      { year: 2008, winnerNuance: PoliticalNuance.D, winnerName: 'Jean Sarkozy / Ind.', score: 58.2, turnout: 57.2 }
    ]
  },
   {
    insee: '75016',
    zipcode: '75016',
    name: 'Paris 16ème',
    department: 'Paris',
    coordinates: [48.8637, 2.2600],
    currentMayor: 'Francis Szpiner',
    stability: StabilityLevel.FORTRESS,
    history: [
      { year: 2020, winnerNuance: PoliticalNuance.D, winnerName: 'Francis Szpiner', score: 76.2, turnout: 35.1 },
      { year: 2014, winnerNuance: PoliticalNuance.D, winnerName: 'Claude Goasguen', score: 63.1, turnout: 53.4 },
      { year: 2008, winnerNuance: PoliticalNuance.D, winnerName: 'Claude Goasguen', score: 51.7, turnout: 56.8 }
    ]
  }
];

export const searchCommune = async (zipcode: string): Promise<Commune | undefined> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_COMMUNES.find(c => c.zipcode === zipcode);
};

export const getNearbyCommunes = async (): Promise<Commune[]> => {
  return MOCK_COMMUNES;
};
