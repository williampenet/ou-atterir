import React from 'react';
import { IdealResult } from '../types';
import { NUANCE_COLORS } from '../constants';
import { MapPin, Shield, TrendingUp } from 'lucide-react';

interface Props {
  results: IdealResult[];
  onSelectCommune: (commune: IdealResult['commune']) => void;
}

const IdealResultsList: React.FC<Props> = ({ results, onSelectCommune }) => {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60">
        <Compass className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">Aucune commune ne correspond à vos critères dans ce département.</p>
      </div>
    );
  }

  const forteresses = results.filter(r => r.matchLevel === 'forteresse');
  const tendances = results.filter(r => r.matchLevel === 'tendance');

  return (
    <div className="space-y-3 animate-fade-in-up">
      <p className="text-xs text-slate-500 font-medium">{results.length} commune{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}</p>

      {forteresses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Forteresses
          </div>
          {forteresses.map(r => <ResultCard key={r.commune.insee} result={r} onClick={() => onSelectCommune(r.commune)} />)}
        </div>
      )}

      {tendances.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> Tendance récente
          </div>
          {tendances.map(r => <ResultCard key={r.commune.insee} result={r} onClick={() => onSelectCommune(r.commune)} />)}
        </div>
      )}
    </div>
  );
};

const ResultCard: React.FC<{ result: IdealResult; onClick: () => void }> = ({ result, onClick }) => {
  const { commune, matchLevel } = result;
  const recent = commune.history.length > 0
    ? commune.history.reduce((prev, cur) => (cur.year > prev.year ? cur : prev))
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center text-slate-400 text-xs mb-0.5">
            <MapPin className="w-3 h-3 mr-1" />
            {commune.zipcode}
          </div>
          <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{commune.name}</h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          matchLevel === 'forteresse'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {matchLevel === 'forteresse' ? 'Forteresse' : 'Tendance'}
        </span>
      </div>
      {recent && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NUANCE_COLORS[recent.winnerNuance] }} />
          <span>{recent.winnerName} ({recent.year}) — {recent.score}%</span>
        </div>
      )}
    </button>
  );
};

// Needed for the empty state
import { Compass } from 'lucide-react';

export default IdealResultsList;
