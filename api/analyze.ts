import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { communeName, zipcode, currentMayor, stability, history } = req.body;

  if (!communeName || !history) {
    return res.status(400).json({ error: 'Missing commune data' });
  }

  const historyText = (history as Array<{ year: number; winnerName: string; winnerNuance: string; score: number }>)
    .map(h => `- ${h.year}: Gagnant ${h.winnerName} (${h.winnerNuance}) avec ${h.score}% des voix.`)
    .join('\n');

  const prompt = `
    Tu es un expert en sociologie politique française. Analyse brièvement le profil politique de la commune suivante pour un citoyen qui cherche à s'y installer.
    
    Commune: ${communeName} (${zipcode})
    Maire actuel: ${currentMayor}
    Stabilité calculée: ${stability}
    
    Historique des élections municipales:
    ${historyText}
    
    Donne une réponse de 2 ou 3 phrases maximum, en français, décrivant l'ambiance politique (ancrage à gauche/droite, évolution récente, ou stabilité forte). Sois neutre et factuel.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return res.status(200).json({ analysis: response.text || "Analyse indisponible pour le moment." });
  } catch (error) {
    console.error('Gemini analysis failed', error);
    return res.status(500).json({ error: "Une erreur est survenue lors de l'analyse IA." });
  }
}
