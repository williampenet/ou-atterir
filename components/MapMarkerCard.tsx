import React from 'react';
import { X, MapPin, ChevronRight } from 'lucide-react';
import { MapMarker } from '../types';
import { scoreMapColor, scoreBgColor } from '../constants';

interface Props {
  marker: MapMarker;
  onClose: () => void;
  onOpenDrawer: (insee: string) => void;
}

function exposureLabel(score: number): string {
  if (score < 33) return 'Faible';
  if (score < 66) return 'Modérée';
  return 'Forte';
}

const MapMarkerCard: React.FC<Props> = ({ marker, onClose, onOpenDrawer }) => {
  const hasScore = marker.climateScore != null;
  const score = marker.climateScore ?? 50;
  const dotColor = scoreMapColor(score);
  const badgeClass = scoreBgColor(score);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden pointer-events-auto">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-800 truncate mb-1">{marker.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  {marker.zipcode}
                </span>
                {hasScore && (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold border ${badgeClass}`}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                    Exposition {exposureLabel(score)} · {Math.round(score)}/100
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
