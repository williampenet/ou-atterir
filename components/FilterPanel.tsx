import React, { useState, useEffect } from 'react';
import { PoliticalBloc, SearchFilters, MatchLevel, EquipmentDomain, PopulationSize } from '../types';
import { BLOC_COLORS, EQUIPMENT_DOMAINS, POPULATION_SIZES } from '../constants';
import { getDepartments } from '../services/communeService';
import { SlidersHorizontal, Shield, TrendingUp, Building2, ShoppingBag, GraduationCap, Heart, Train, Dumbbell, Palmtree, Users } from 'lucide-react';

interface Props {
  onFiltersChange: (filters: SearchFilters) => void;
}

const BLOC_OPTIONS = [
  { value: PoliticalBloc.EXTRÊME_GAUCHE, label: 'Extrême-gauche' },
  { value: PoliticalBloc.GAUCHE, label: 'Gauche' },
  { value: PoliticalBloc.CENTRE, label: 'Centre' },
  { value: PoliticalBloc.DROITE, label: 'Droite' },
  { value: PoliticalBloc.EXTREME_DROITE, label: 'Extrême-droite' },
  { value: PoliticalBloc.DIVERS, label: 'Divers' },
];

const FilterPanel: React.FC<Props> = ({ onFiltersChange }) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [department, setDepartment] = useState<string>('');
  const [bloc, setBloc] = useState<PoliticalBloc | ''>('');
  const [matchLevel, setMatchLevel] = useState<MatchLevel | ''>('');
  const [selectedDomains, setSelectedDomains] = useState<EquipmentDomain[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<PopulationSize[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    const filters: SearchFilters = {};
    if (department) filters.department = department;
    if (bloc) filters.bloc = bloc as PoliticalBloc;
    if (matchLevel) filters.matchLevel = matchLevel as MatchLevel;
    if (selectedDomains.length > 0) filters.equipmentDomains = selectedDomains;
    if (selectedSizes.length > 0) filters.populationSizes = selectedSizes;
    onFiltersChange(filters);
  }, [department, bloc, matchLevel, selectedDomains, selectedSizes]);

  const activeCount = [department, bloc, matchLevel].filter(Boolean).length + selectedDomains.length + selectedSizes.length;

  const toggleDomain = (domain: EquipmentDomain) => {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  const toggleSize = (size: PopulationSize) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleReset = () => {
    setDepartment('');
    setBloc('');
    setMatchLevel('');
    setSelectedDomains([]);
    setSelectedSizes([]);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">Filtres</h2>
          {activeCount > 0 && (
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Tout effacer
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Department filter */}
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Département</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="">Tous</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Political bloc filter */}
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tendance politique</label>
          <select
            value={bloc}
            onChange={(e) => setBloc(e.target.value as PoliticalBloc | '')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            style={bloc ? { color: BLOC_COLORS[bloc as PoliticalBloc] } : {}}
          >
            <option value="">Toutes</option>
            {BLOC_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Stability filter */}
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Stabilité</label>
          <div className="flex gap-1.5">
            <button
              onClick={() => setMatchLevel(matchLevel === 'forteresse' ? '' : 'forteresse')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                matchLevel === 'forteresse'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <Shield className="w-3 h-3" /> Forteresse
            </button>
            <button
              onClick={() => setMatchLevel(matchLevel === 'tendance' ? '' : 'tendance')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                matchLevel === 'tendance'
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <TrendingUp className="w-3 h-3" /> Tendance
            </button>
          </div>
        </div>
      </div>

      {/* Equipment domains filter */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Équipements & services</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(EQUIPMENT_DOMAINS) as [EquipmentDomain, { label: string; icon: string }][]).map(([code, { label }]) => {
            const active = selectedDomains.includes(code);
            const Icon = DOMAIN_ICONS[code];
            return (
              <button
                key={code}
                onClick={() => toggleDomain(code)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Population size filter */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Taille de commune</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(POPULATION_SIZES) as [PopulationSize, { label: string; min: number; max: number }][]).map(([key, { label, max }]) => {
            const active = selectedSizes.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleSize(key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-violet-50 border-violet-300 text-violet-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Users className="w-3 h-3" />
                {label}
                <span className="text-[10px] font-normal opacity-70">
                  {max === Infinity ? '200k+' : max >= 1000 ? `<${max / 1000}k` : `<${max}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DOMAIN_ICONS: Record<EquipmentDomain, React.FC<{ className?: string }>> = {
  A: Building2,
  B: ShoppingBag,
  C: GraduationCap,
  D: Heart,
  E: Train,
  F: Dumbbell,
  G: Palmtree,
};

export default FilterPanel;
