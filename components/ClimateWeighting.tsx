import React from 'react';
import { X, Thermometer, Droplets, AlertTriangle, Wind, Sprout } from 'lucide-react';
import { ClimateWeights, ClimateFamilyKey } from '../types';
import { CLIMATE_FAMILIES } from '../constants';

interface ClimateWeightingProps {
  open: boolean;
  onClose: () => void;
  weights: ClimateWeights;
  onWeightsChange: (w: ClimateWeights) => void;
}

const ICONS: Record<string, React.ElementType> = {
  Thermometer,
  Droplets,
  AlertTriangle,
  Wind,
  Sprout,
};

const ClimateWeighting: React.FC<ClimateWeightingProps> = ({ open, onClose, weights, onWeightsChange }) => {
  if (!open) return null;

  const activeCount = CLIMATE_FAMILIES
    .filter(f => f.available)
    .filter(f => weights[f.key] > 0)
    .length;

  const handleChange = (key: ClimateFamilyKey, value: number) => {
    // Check: cannot set all available families to 0
    if (value === 0) {
      const otherActive = CLIMATE_FAMILIES
        .filter(f => f.available && f.key !== key)
        .some(f => weights[f.key] > 0);
      if (!otherActive) return; // Would zero everything — block
    }
    onWeightsChange({ ...weights, [key]: value });
  };

  const allZeroBlocked = activeCount <= 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up z-10 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Pondération climatique</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pondérez l'importance de chaque dimension climatique pour le tri de vos résultats.
          </p>
        </div>

        {/* Sliders */}
        <div className="px-6 py-4 space-y-5">
          {CLIMATE_FAMILIES.map(family => {
            const Icon = ICONS[family.icon];
            const isDisabled = !family.available;
            const value = weights[family.key];
            const isLastActive = family.available && value > 0 && allZeroBlocked;

            return (
              <div key={family.key} className={isDisabled ? 'opacity-40' : ''}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-slate-500" />}
                    <span className="text-sm font-semibold text-slate-700">{family.shortLabel}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 tabular-nums w-8 text-right">
                    {isDisabled ? '—' : value}
                  </span>
                </div>

                {isDisabled ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-400 italic">Données à venir</span>
                  </div>
                ) : (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={value}
                    onChange={e => handleChange(family.key, Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    disabled={isDisabled}
                  />
                )}

                {isLastActive && value <= 10 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">
                    Au moins une famille doit rester active.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer message */}
        {allZeroBlocked && (
          <div className="px-6 pb-4">
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[11px] text-amber-700 font-medium">
                Chaque commune française est concernée par au moins une dimension du dérèglement climatique.
              </p>
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClimateWeighting;
