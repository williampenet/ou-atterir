import React from 'react';
import { IdealResult, PaginatedResults } from '../types';
import { NUANCE_COLORS } from '../constants';
import { MapPin, Shield, Activity, Compass, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  results: PaginatedResults<IdealResult>;
  onSelectCommune: (commune: IdealResult['commune']) => void;
  onPageChange: (page: number) => void;
}

const IdealResultsList: React.FC<Props> = ({ results, onSelectCommune, onPageChange }) => {
  if (results.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60">
        <Compass className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">Aucune commune ne correspond à vos critères dans ce département.</p>
      </div>
    );
  }

  const forteresses = results.data.filter(r => r.matchLevel === 'forteresse');
  const tendances = results.data.filter(r => r.matchLevel === 'tendance');
  const totalPages = Math.ceil(results.total / results.pageSize);

  return (
    <div className="space-y-3 animate-fade-in-up">
      <p className="text-xs text-slate-500 font-medium">
        {results.total} commune{results.total > 1 ? 's' : ''} trouvée{results.total > 1 ? 's' : ''}
        {totalPages > 1 && <span> — page {results.page}/{totalPages}</span>}
      </p>

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
            <Activity className="w-3.5 h-3.5" /> En ballottage
          </div>
          {tendances.map(r => <ResultCard key={r.commune.insee} result={r} onClick={() => onSelectCommune(r.commune)} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => onPageChange(results.page - 1)}
            disabled={results.page <= 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 font-medium px-3">
            {results.page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(results.page + 1)}
            disabled={!results.hasMore}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const ResultCard: React.FC<{ result: IdealResult; onClick: () => void }> = ({ result, onClick }) => {
  const { commune, matchLevel, latestNuance, latestWinner, latestYear, latestScore } = result;

  // Use RPC-provided latest data, or fall back to history
  const displayNuance = latestNuance ?? (commune.history.length > 0
    ? commune.history.reduce((prev, cur) => (cur.year > prev.year ? cur : prev)).winnerNuance
    : null);
  const displayWinner = latestWinner ?? (commune.history.length > 0
    ? commune.history.reduce((prev, cur) => (cur.year > prev.year ? cur : prev)).winnerName
    : null);
  const displayYear = latestYear ?? (commune.history.length > 0
    ? commune.history.reduce((prev, cur) => (cur.year > prev.year ? cur : prev)).year
    : null);
  const displayScore = latestScore ?? (commune.history.length > 0
    ? commune.history.reduce((prev, cur) => (cur.year > prev.year ? cur : prev)).score
    : null);

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
          {matchLevel === 'forteresse' ? 'Forteresse' : 'En ballottage'}
        </span>
      </div>
      {displayNuance && displayWinner && displayYear && displayScore && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NUANCE_COLORS[displayNuance] }} />
          <span>{displayWinner} ({displayYear}) — {displayScore}%</span>
        </div>
      )}
    </button>
  );
};

export default IdealResultsList;
