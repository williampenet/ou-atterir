import React from 'react';
import { Commune, IdealResult, PaginatedResults } from '../types';
import { BLOC_COLORS } from '../constants';
import { MapPin, Search, ChevronLeft, ChevronRight, Scale } from 'lucide-react';

interface Props {
  results: PaginatedResults<IdealResult>;
  onSelectCommune: (commune: IdealResult['commune']) => void;
  selectedInsee?: string;
  onPageChange: (page: number) => void;
  compareList: Commune[];
  onToggleCompare: (commune: Commune) => void;
}

const ResultsList: React.FC<Props> = ({ results, onSelectCommune, selectedInsee, onPageChange, compareList, onToggleCompare }) => {
  if (results.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Search className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">Aucune commune ne correspond à vos critères.</p>
        <p className="text-slate-300 text-xs mt-1">Essayez de modifier ou retirer des filtres.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(results.total / results.pageSize);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-medium">
          {results.total} commune{results.total > 1 ? 's' : ''}
          {totalPages > 1 && <span className="text-slate-400"> — page {results.page}/{totalPages}</span>}
        </p>
      </div>

      <div className="grid gap-2">
        {results.data.map(r => {
          const inCompare = compareList.some(c => c.insee === r.commune.insee);
          const compareFull = compareList.length >= 2 && !inCompare;
          return (
            <ResultCard
              key={r.commune.insee}
              result={r}
              isSelected={r.commune.insee === selectedInsee}
              onClick={() => onSelectCommune(r.commune)}
              inCompare={inCompare}
              compareDisabled={compareFull}
              onToggleCompare={() => onToggleCompare(r.commune)}
            />
          );
        })}
      </div>

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

interface ResultCardProps {
  result: IdealResult;
  isSelected: boolean;
  onClick: () => void;
  inCompare: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, isSelected, onClick, inCompare, compareDisabled, onToggleCompare }) => {
  const { commune, matchLevel, latestNuanceLabel, latestBloc, latestWinner, latestYear, latestScore } = result;

  const blocColor = latestBloc ? (BLOC_COLORS[latestBloc] || '#94a3b8') : '#94a3b8';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border shadow-sm hover:shadow-md transition-all group ${
        isSelected
          ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
          : 'bg-white border-slate-200 hover:border-indigo-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center text-slate-400 text-xs mb-0.5">
            <MapPin className="w-3 h-3 mr-1" />
            {commune.zipcode} — {commune.department}
          </div>
          <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{commune.name} <span className="font-medium text-slate-400">({commune.zipcode})</span></h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div
            role="checkbox"
            aria-checked={inCompare}
            aria-label="Ajouter à la comparaison"
            onClick={(e) => { e.stopPropagation(); if (!compareDisabled || inCompare) onToggleCompare(); }}
            className={`p-1.5 rounded-lg border transition-all ${
              inCompare
                ? 'bg-purple-100 border-purple-300 text-purple-600'
                : compareDisabled
                  ? 'border-slate-100 text-slate-200 cursor-not-allowed'
                  : 'border-slate-200 text-slate-300 hover:border-purple-200 hover:text-purple-400 cursor-pointer'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
      {latestWinner && latestYear != null && latestScore != null && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: blocColor }} />
          <span>
            {latestWinner}{latestNuanceLabel ? ` (${latestNuanceLabel})` : ''} — {latestYear} — {latestScore}%
          </span>
        </div>
      )}
    </button>
  );
};

export default ResultsList;
