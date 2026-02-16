import { Commune } from '../types';

export const analyzePoliticalContext = async (commune: Commune): Promise<string> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communeName: commune.name,
        zipcode: commune.zipcode,
        currentMayor: commune.currentMayor,
        stability: commune.stability,
        history: commune.history.map(h => ({
          year: h.year,
          winnerName: h.winnerName,
          winnerNuance: h.winnerNuance,
          score: h.score,
        })),
      }),
    });

    if (!response.ok) {
      return "Une erreur est survenue lors de l'analyse IA.";
    }

    const data = await response.json();
    return data.analysis || "Analyse indisponible pour le moment.";
  } catch (error) {
    console.error('AI analysis failed', error);
    return "Une erreur est survenue lors de l'analyse IA.";
  }
};
