import React, { useState, useEffect } from 'react';
import { List, Map, SlidersHorizontal } from 'lucide-react';
import { PoliticalBloc, SearchFilters } from '../types';
import { BLOC_COLORS } from '../constants';
import { getDepartments } from '../services/communeService';

const BLOC_OPTIONS = [
  { value: PoliticalBloc.EXTRÊME_GAUCHE, label: 'Extrême-gauche' },
  { value: PoliticalBloc.GAUCHE, label: 'Gauche' },
  { value: PoliticalBloc.CENTRE, label: 'Centre' },
  { value: PoliticalBloc.CENTRE_DROIT, label: 'Centre-droit' },
  { value: PoliticalBloc.DROITE, label: 'Droite' },
  { value: PoliticalBloc.EXTREME_DROITE, label: 'Extrême-droite' },
  { value: PoliticalBloc.DIVERS, label: 'Divers' },
];

interface Props {
  viewMode: 'liste' | 'carte';
  onViewModeChange: (mode: 'liste' | 'carte') => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

const FilterBar: React.FC<Props> = ({
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  activeFilterCount,
  onOpenFilters,
}) => {
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  const dept = filters.department ?? '';
  const bloc = (filters.bloc as string) ?? '';

  const update = (patch: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="sticky top-[53px] z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center gap-2">

        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
          <button
            onClick={() => onViewModeChange('liste')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
              viewMode === 'liste'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Liste</span>
          </button>
          <button
            onClick={() => onViewModeChange('carte')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
              viewMode === 'carte'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Carte</span>
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 flex-shrink-0 hidden sm:block" />

        {/* Department dropdown — hidden on mobile */}
        <select
          value={dept}
          onChange={(e) => update({ department: e.target.value || undefined })}
          className="hidden sm:block px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-w-0 max-w-[160px]"
        >
          <option value="">Département</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Bloc dropdown — hidden on mobile */}
        <select
          value={bloc}
          onChange={(e) => update({ bloc: (e.target.value as PoliticalBloc) || undefined })}
          className="hidden sm:block px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-w-0 max-w-[160px]"
          style={bloc ? { color: BLOC_COLORS[bloc] } : {}}
        >
          <option value="">Tendance politique</option>
          {BLOC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="flex-1" />

        {/* Filtres button */}
        <button
          onClick={onOpenFilters}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex-shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
