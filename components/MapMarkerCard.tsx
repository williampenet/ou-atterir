import React from 'react';
import { X, Shield, TrendingUp, MapPin, ChevronRight } from 'lucide-react';
import { MapMarker } from '../types';
import { BLOC_COLORS } from '../constants';

interface Props {
  marker: MapMarker;
  onClose: () => void;
  onOpenDrawer: (insee: string) => void;
}

const MapMarkerCard: React.FC<Props> = ({ marker, onClose, onOpenDrawer }) => {
  const blocColor = marker.latestBloc ? (BLOC_COLORS[marker.latestBloc] ?? '#94a3b8') : '#94a3b8';
  const isForteresse = marker.matchLevel === 'forteresse';
  const hasBadge = marker.matchLevel !== 'all';

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[400] pointer-events-none sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden pointer-events-auto">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center text-slate-400 text-xs mb-1">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                {marker.zipcode}
              </div>
              <h3 className="text-base font-bold text-slate-800 truncate">{marker.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: blocColor }}
                />
                <span className="text-xs text-slate-500">{marker.latestBloc ?? 'Divers'}</span>
                {hasBadge && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isForteresse
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isForteresse ? <Shield className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                    {isForteresse ? 'Forteresse' : 'Tendance'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onOpenDrawer(marker.insee)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95"
          >
            Voir la fiche
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapMarkerCard;
