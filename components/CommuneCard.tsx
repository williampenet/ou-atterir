import React, { useState } from 'react';
import { Commune, PoliticalNuance } from '../types';
import { NUANCE_COLORS } from '../constants';
import StabilityBadge from './StabilityBadge';
import TrendChart from './TrendChart';
import { MapPin, Info, Sparkles } from 'lucide-react';
import { analyzePoliticalContext } from '../services/geminiService';

interface Props {
  commune: Commune;
}

const CommuneCard: React.FC<Props> = ({ commune }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Get most recent election
  const recent = commune.history.reduce((prev, current) => (prev.year > current.year) ? prev : current);
  
  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzePoliticalContext(commune);
    setAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col w-full animate-fade-in-up">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-100">
        <div className="flex justify-between items-start mb-2">
           <div>
             <div className="flex items-center text-slate-400 text-sm mb-1">
                <MapPin className="w-3 h-3 mr-1" />
                {commune.zipcode} - {commune.department}
             </div>
             <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{commune.name}</h2>
           </div>
           <StabilityBadge level={commune.stability} />
        </div>
        
        <div className="flex items-center mt-3">
             <div className="flex -space-x-2 mr-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white ring-1 ring-slate-100`} 
                     style={{ backgroundColor: NUANCE_COLORS[recent.winnerNuance] }}>
                     {recent.winnerNuance.substring(0, 2)}
                </div>
             </div>
             <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Maire Actuel</p>
                <p className="text-sm font-semibold text-slate-800">{commune.currentMayor} <span className="text-slate-400 font-normal">({recent.winnerNuance})</span></p>
             </div>
        </div>
      </div>

      {/* Analytics Body */}
      <div className="p-6 bg-slate-50/50 flex-grow">
        
        {/* Trend Chart */}
        <TrendChart history={commune.history} />

        {/* Historical List */}
        <div className="mt-6 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Historique Électoral</h4>
            {commune.history.sort((a,b) => b.year - a.year).map((election) => (
                <div key={election.year} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <span className="text-sm font-bold text-slate-700 w-12">{election.year}</span>
                        <div className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: NUANCE_COLORS[election.winnerNuance]}}></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800">{election.winnerName}</span>
                            <span className="text-[10px] text-slate-500">{election.winnerNuance}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-sm font-bold text-slate-900">{election.score}%</span>
                        <span className="block text-[10px] text-slate-400">Part. {election.turnout}%</span>
                    </div>
                </div>
            ))}
        </div>

        {/* AI Insight Section */}
        <div className="mt-6">
            {!analysis ? (
                 <button 
                    onClick={handleAiAnalysis}
                    disabled={loadingAi}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-md transition-all flex items-center justify-center group"
                 >
                    {loadingAi ? (
                        <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Analyse en cours...</span>
                    ) : (
                        <span className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-indigo-200 group-hover:text-white transition-colors" /> Demander l'analyse de l'IA</span>
                    )}
                 </button>
            ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 animate-fade-in relative">
                    <div className="absolute top-4 right-4">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h5 className="text-indigo-900 font-bold text-sm mb-1">Analyse du profil</h5>
                    <p className="text-indigo-800 text-sm leading-relaxed">{analysis}</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default CommuneCard;
