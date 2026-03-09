import React from 'react';
import { Commune } from '../types';
import { BLOC_COLORS } from '../constants';
import StabilityBadge from './StabilityBadge';
import { MapPin, Users } from 'lucide-react';

interface Props {
  commune: Commune;
}

const CommuneCard: React.FC<Props> = ({ commune }) => {
  const muniHistory = commune.history.filter(e => e.electionType === 'municipales');
  const recentMuni = muniHistory.length > 0
    ? muniHistory.sort((a, b) => b.year - a.year)[0]
    : null;

  const getBlocColor = (bloc: string) => BLOC_COLORS[bloc] || '#94a3b8';

  return (
    <div className="flex flex-col w-full">
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
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{commune.name}</h2>
        <StabilityBadge level={commune.stability} compact />
      </div>

      {recentMuni && (
        <div className="flex items-center">
          <div className="flex -space-x-2 mr-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white ring-1 ring-slate-100"
              style={{ backgroundColor: getBlocColor(recentMuni.winnerBloc) }}
            >
              {recentMuni.winnerNuance.substring(0, 2)}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Maire actuel</p>
            <p className="text-sm font-semibold text-slate-800">
              {commune.currentMayor} <span className="text-slate-400 font-normal">({recentMuni.winnerNuanceLabel})</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommuneCard;
