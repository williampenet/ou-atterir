import React from 'react';
import { Commune } from '../types';
import { BLOC_COLORS } from '../constants';
import StabilityBadge from './StabilityBadge';
import { MapPin, Users } from 'lucide-react';

interface Props {
  commune: Commune;
  loading?: boolean;
}

const CommuneCard: React.FC<Props> = ({ commune, loading }) => {
  const sorted = [...commune.history].sort((a, b) => b.year - a.year);
  const recent = sorted.length > 0 ? sorted[0] : null;

  const getBlocColor = (bloc: string) => BLOC_COLORS[bloc] || '#94a3b8';

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="pb-5 border-b border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-3 text-slate-400 text-sm mb-1">
              <span className="inline-flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {commune.zipcode} — {commune.department}
              </span>
              {commune.population != null && (
                <span className="inline-flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {commune.population.toLocaleString('fr-FR')} hab.
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{commune.name}</h2>
          </div>
          <StabilityBadge level={commune.stability} />
        </div>

        {recent && (
          <div className="flex items-center mt-3">
            <div className="flex -space-x-2 mr-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white ring-1 ring-slate-100"
                style={{ backgroundColor: getBlocColor(recent.winnerBloc) }}
              >
                {recent.winnerNuance.substring(0, 2)}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Maire actuel</p>
              <p className="text-sm font-semibold text-slate-800">
                {commune.currentMayor} <span className="text-slate-400 font-normal">({recent.winnerNuanceLabel})</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="pt-5">
        {loading ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-400 text-xs">Chargement de l'historique...</p>
          </div>
        ) : sorted.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Historique electoral</h4>
            {sorted.map((election) => (
              <div key={election.year} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-slate-700 w-12">{election.year}</span>
                  <div className="h-3 w-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: getBlocColor(election.winnerBloc) }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">{election.winnerName} <span className="text-slate-400 font-normal">({election.winnerNuanceLabel})</span></span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-slate-900">{election.score}%</span>
                  <span className="block text-[10px] text-slate-400">Part. {election.turnout}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-6">Aucun historique electoral disponible.</p>
        )}
      </div>
    </div>
  );
};

export default CommuneCard;
