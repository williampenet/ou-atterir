import React from 'react';
import { Commune, IdealResult, PaginatedResults, ClimateScores } from '../types';
import { BLOC_COLORS, CLIMATE_FAMILIES, scoreBgColor } from '../constants';
import { MapPin, Search, ChevronLeft, ChevronRight, Scale, Thermometer, Droplets, AlertTriangle, Wind, Sprout } from 'lucide-react';

interface Props {
  results: PaginatedResults<IdealResult>;
  onSelectCommune: (commune: IdealResult['commune']) => void;
  selectedInsee?: string;
  onPageChange: (page: number) => void;
  compareList: Commune[];
  onToggleCompare: (commune: Commune) => void;
}

const FAMILY_ICONS: Record<string, React.ElementType> = {
  Thermometer,
  Droplets,
  AlertTriangle,
  Wind,
  Sprout,
};

function familyScoreColor(score: number): string {
  if (score < 33) return 'bg-emerald-100 text-emerald-700';
  if (score < 66) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
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
          <span className="text-indigo-500 ml-1">· trié par exposition climat</span>
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

/* ─── Climate mini-badges ─── */

const ClimateIndicators: React.FC<{ scores: ClimateScores }> = ({ scores }) => (
  <div className="mt-2 flex items-center gap-1">
    {/* Global score badge */}
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${scoreBgColor(scores.global)}`}>
      {Math.round(scores.global)}
    </span>

    <span className="text-slate-300 text-[10px] mx-0.5">|</span>

    {/* Per-family mini icons */}
    {CLIMATE_FAMILIES.map(family => {
      const Icon = FAMILY_ICONS[family.icon];
      const score = scores[family.key];
      const isAvailable = family.available && score != null;

      return (
        <span
          key={family.key}
          className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold ${
            isAvailable
              ? familyScoreColor(score as number)
              : 'bg-slate-50 text-slate-300'
          }`}
          title={`${family.shortLabel}: ${isAvailable ? Math.round(score as number) + '/100' : 'N/A'}`}
        >
          {Icon && <Icon className="w-2.5 h-2.5" />}
          {isAvailable ? Math.round(score as number) : '—'}
        </span>
      );
    })}
  </div>
);

/* ─── Result card ─── */

interface ResultCardProps {
  result: IdealResult;
  isSelected: boolean;
  onClick: () => void;
  inCompare: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, isSelected, onClick, inCompare, compareDisabled, onToggleCompare }) => {
  const { commune, latestNuanceLabel, latestBloc, latestWinner, latestYear, latestScore, climateScores } = result;

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
          <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors mb-0.5">{commune.name}</h3>
          <div className="flex items-center text-slate-400 text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            {commune.zipcode} — {commune.department}
          </div>
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

      {/* Climate indicators */}
      {climateScores && <ClimateIndicators scores={climateScores} />}
    </button>
  );
};

export default ResultsList;
