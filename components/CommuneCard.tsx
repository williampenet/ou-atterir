import React from 'react';
import { Commune } from '../types';
import { MapPin, Users } from 'lucide-react';

interface Props {
  commune: Commune;
}

const CommuneCard: React.FC<Props> = ({ commune }) => {
  return (
    <div className="flex flex-col w-full">
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{commune.name}</h2>
      <div className="flex items-center gap-3 text-slate-400 text-sm">
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
    </div>
  );
};

export default CommuneCard;
