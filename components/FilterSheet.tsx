import React, { useState, useEffect } from 'react';
import { PoliticalBloc, SearchFilters, MatchLevel, EquipmentFilterKey, PopulationSize, RiskLevel, GeoTag, AirQuality } from '../types';
import { BLOC_COLORS, EQUIPMENT_CATEGORIES, POPULATION_SIZES, RISK_LEVELS, GEO_TAGS, PRIX_M2_RANGES, AIR_QUALITY_LEVELS } from '../constants';
import { getDepartments } from '../services/communeService';
import {
  X, SlidersHorizontal, Shield, Activity,
  ShoppingBag, GraduationCap, Heart, Train, Dumbbell,
  Users, AlertTriangle, ChevronDown, Check,
  Waves, Mountain, TreePine, Euro, Wind,
} from 'lucide-react';

interface Props {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  open: boolean;
  onClose: () => void;
  resultCount?: number;
}

const BLOC_OPTIONS = [
  { value: PoliticalBloc.EXTRÊME_GAUCHE, label: 'Extrême-gauche' },
  { value: PoliticalBloc.GAUCHE, label: 'Gauche' },
  { value: PoliticalBloc.CENTRE, label: 'Centre' },
  { value: PoliticalBloc.CENTRE_DROIT, label: 'Centre-droit' },
  { value: PoliticalBloc.DROITE, label: 'Droite' },
  { value: PoliticalBloc.EXTREME_DROITE, label: 'Extrême-droite' },
  { value: PoliticalBloc.DIVERS, label: 'Divers' },
];

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  ShoppingBag, GraduationCap, Heart, Train, Dumbbell,
};

const GEO_TAG_ICONS: Record<GeoTag, React.ReactNode> = {
  littoral: <Waves className="w-3.5 h-3.5" />,
  montagne: <Mountain className="w-3.5 h-3.5" />,
  campagne: <TreePine className="w-3.5 h-3.5" />,
};

const FilterSheet: React.FC<Props> = ({ filters, onFiltersChange, open, onClose, resultCount }) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const department = filters.department ?? '';
  const bloc = (filters.bloc as string) ?? '';
  const matchLevel = (filters.matchLevel as string) ?? '';
  const selectedEquipment = filters.equipmentFilters ?? [];
  const selectedSizes = filters.populationSizes ?? [];
  const riskLevel = (filters.riskLevel as string) ?? '';
  const selectedGeoTags = filters.geoTags ?? [];
  const prixM2Max = filters.prixM2Max;
  const airQuality = (filters.airQuality as string) ?? '';

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const update = (patch: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const toggleEquipment = (key: EquipmentFilterKey) => {
    const next = selectedEquipment.includes(key)
      ? selectedEquipment.filter(k => k !== key)
      : [...selectedEquipment, key];
    update({ equipmentFilters: next.length ? next : undefined });
  };

  const toggleGeoTag = (tag: GeoTag) => {
    const next = selectedGeoTags.includes(tag)
      ? selectedGeoTags.filter(t => t !== tag)
      : [...selectedGeoTags, tag];
    update({ geoTags: next.length ? next : undefined });
  };

  const toggleSize = (size: PopulationSize) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    update({ populationSizes: next.length ? next : undefined });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeCount =
    [department, bloc, matchLevel, riskLevel, prixM2Max, airQuality].filter(Boolean).length +
    selectedEquipment.length +
    selectedSizes.length +
    selectedGeoTags.length;

  const handleReset = () => {
    onFiltersChange({});
    setExpandedCategories(new Set());
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet: full screen on mobile, side panel on desktop */}
      <div className="fixed inset-0 sm:inset-y-0 sm:left-0 sm:right-auto sm:w-[380px] z-[70] bg-white shadow-2xl flex flex-col animate-filter-sheet">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Filtres</h2>
            {activeCount > 0 && (
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button onClick={handleReset} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Réinitialiser
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-grow overflow-y-auto px-5 py-4 space-y-5">

          {/* Department */}
          <Section label="Département">
            <select
              value={department}
              onChange={(e) => update({ department: e.target.value || undefined })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">Tous</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Section>

          {/* Political bloc */}
          <Section label="Tendance politique">
            <select
              value={bloc}
              onChange={(e) => update({ bloc: (e.target.value as PoliticalBloc) || undefined })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              style={bloc ? { color: BLOC_COLORS[bloc] } : {}}
            >
              <option value="">Toutes</option>
              {BLOC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Section>

          {/* Stability */}
          <Section label="Stabilité">
            <div className="flex gap-2">
              <ToggleButton
                active={matchLevel === 'forteresse'}
                onClick={() => update({ matchLevel: matchLevel === 'forteresse' ? undefined : 'forteresse' })}
                activeClass="bg-emerald-50 border-emerald-300 text-emerald-700"
              >
                <Shield className="w-3.5 h-3.5" /> Forteresse
              </ToggleButton>
              <ToggleButton
                active={matchLevel === 'tendance'}
                onClick={() => update({ matchLevel: matchLevel === 'tendance' ? undefined : 'tendance' })}
                activeClass="bg-amber-50 border-amber-300 text-amber-700"
              >
                <Activity className="w-3.5 h-3.5" /> En ballottage
              </ToggleButton>
            </div>
          </Section>

          {/* Equipment categories */}
          <Section label="Équipements">
            <div className="space-y-1">
              {EQUIPMENT_CATEGORIES.map(cat => {
                const Icon = CATEGORY_ICONS[cat.icon];
                const isExpanded = expandedCategories.has(cat.id);

                if (cat.filterKey) {
                  const active = selectedEquipment.includes(cat.filterKey);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleEquipment(cat.filterKey!)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        active
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                      <span className="flex-grow text-left">{cat.label}</span>
                      {active && <Check className="w-4 h-4 text-indigo-500" />}
                    </button>
                  );
                }

                const childKeys = cat.children!.map(c => c.id);
                const selectedChildren = childKeys.filter(k => selectedEquipment.includes(k));

                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        selectedChildren.length > 0
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                      <span className="flex-grow text-left">{cat.label}</span>
                      {selectedChildren.length > 0 && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                          {selectedChildren.length}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                        {cat.children!.map(child => {
                          const active = selectedEquipment.includes(child.id);
                          return (
                            <button
                              key={child.id}
                              onClick={() => toggleEquipment(child.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                active
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              <span className="flex-grow text-left">{child.label}</span>
                              {active && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Risk level */}
          <Section label="Exposition aux risques">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(RISK_LEVELS) as [RiskLevel, { label: string; description: string; color: string }][]).map(([key, { label, description, color }]) => (
                <ToggleButton
                  key={key}
                  active={riskLevel === key}
                  onClick={() => update({ riskLevel: riskLevel === key ? undefined : key as RiskLevel })}
                  activeClass={color}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {label}
                  <span className="text-[10px] font-normal opacity-70">{description}</span>
                </ToggleButton>
              ))}
            </div>
          </Section>

          {/* Air quality */}
          <Section label="Qualité de l'air">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(AIR_QUALITY_LEVELS) as [AirQuality, { label: string; description: string; color: string }][]).map(([key, { label, description, color }]) => (
                <ToggleButton
                  key={key}
                  active={airQuality === key}
                  onClick={() => update({ airQuality: airQuality === key ? undefined : key as AirQuality })}
                  activeClass={color}
                >
                  <Wind className="w-3.5 h-3.5" />
                  {label}
                  <span className="text-[10px] font-normal opacity-70">{description}</span>
                </ToggleButton>
              ))}
            </div>
          </Section>

          {/* Geographical tags */}
          <Section label="Cadre géographique">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(GEO_TAGS) as [GeoTag, { label: string; description: string; color: string }][]).map(([key, { label, description, color }]) => (
                <ToggleButton
                  key={key}
                  active={selectedGeoTags.includes(key)}
                  onClick={() => toggleGeoTag(key)}
                  activeClass={color}
                >
                  {GEO_TAG_ICONS[key]}
                  {label}
                  <span className="text-[10px] font-normal opacity-70">{description}</span>
                </ToggleButton>
              ))}
            </div>
          </Section>

          {/* Prix au m² */}
          <Section label="Prix au m²">
            <div className="flex flex-wrap gap-2">
              {PRIX_M2_RANGES.map(({ key, label }) => (
                <ToggleButton
                  key={key}
                  active={prixM2Max === key}
                  onClick={() => update({ prixM2Max: prixM2Max === key ? undefined : key })}
                  activeClass="bg-amber-50 border-amber-300 text-amber-700"
                >
                  <Euro className="w-3.5 h-3.5" />
                  {label}
                </ToggleButton>
              ))}
            </div>
          </Section>

          {/* Population size */}
          <Section label="Taille de commune">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(POPULATION_SIZES) as [PopulationSize, { label: string; min: number; max: number }][]).map(([key, { label, max }]) => (
                <ToggleButton
                  key={key}
                  active={selectedSizes.includes(key)}
                  onClick={() => toggleSize(key)}
                  activeClass="bg-violet-50 border-violet-300 text-violet-700"
                >
                  <Users className="w-3.5 h-3.5" />
                  {label}
                  <span className="text-[10px] font-normal opacity-70">
                    {max === Infinity ? '200k+' : max >= 1000 ? `<${max / 1000}k` : `<${max}`}
                  </span>
                </ToggleButton>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer CTA */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {resultCount != null
              ? `Voir ${resultCount} résultat${resultCount > 1 ? 's' : ''}`
              : 'Appliquer les filtres'}
          </button>
        </div>
      </div>
    </>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
      {label}
    </label>
    {children}
  </div>
);

const ToggleButton: React.FC<{
  active: boolean;
  onClick: () => void;
  activeClass: string;
  children: React.ReactNode;
}> = ({ active, onClick, activeClass, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
      active ? activeClass : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
    }`}
  >
    {children}
  </button>
);

export default FilterSheet;
