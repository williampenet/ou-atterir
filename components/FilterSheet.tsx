import React, { useState, useEffect } from 'react';
import { PoliticalBloc, SearchFilters, MatchLevel, EquipmentFilterKey, PopulationSize, RiskLevel, GeoTag, AirQuality, TransportMode } from '../types';
import { BLOC_COLORS, EQUIPMENT_CATEGORIES, POPULATION_SIZES, RISK_LEVELS, GEO_TAGS, PRIX_M2_RANGES, AIR_QUALITY_LEVELS, TRANSPORT_MODES, TRAVEL_DURATIONS } from '../constants';
import { getDepartments } from '../services/communeService';
import { computeIsochroneInsees } from '../services/isochroneService';
import { GeocodingResult } from '../services/geocodingService';
import AddressAutocomplete from './AddressAutocomplete';
import {
  X, SlidersHorizontal, Shield, Activity,
  ShoppingBag, GraduationCap, Heart, Train, Dumbbell,
  Users, AlertTriangle, ChevronDown, Check,
  Waves, Mountain, TreePine, Euro, Wind,
  Navigation, Bike, Car, Clock, Loader2, TrainFront, Info,
  MapPin, Leaf, Store, Scale,
} from 'lucide-react';

/** Order and labels for filter categories (M3-style grouped filters) */
const FILTER_CATEGORIES = [
  { id: 'localisation', label: 'Localisation', icon: MapPin },
  { id: 'environnement', label: 'Environnement et risques', icon: Leaf },
  { id: 'services', label: 'Services et équipements', icon: Store },
  { id: 'politique', label: 'Politique', icon: Scale },
  { id: 'accessibilite', label: 'Accessibilité', icon: Navigation },
  { id: 'immobilier', label: 'Immobilier', icon: Euro },
] as const;

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

const TRANSPORT_ICONS: Record<string, React.FC<{ className?: string }>> = { TrainFront, Bike, Car };

const CategoryBlock: React.FC<{
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  isLast?: boolean;
}> = ({ title, icon: Icon, children, isLast }) => (
  <div className={isLast ? '' : 'border-b border-slate-200 pb-6 mb-6'}>
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
    </div>
    <div className="space-y-5">{children}</div>
  </div>
);

const FilterSheet: React.FC<Props> = ({ filters, onFiltersChange, open, onClose, resultCount }) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isochroneLoading, setIsochroneLoading] = useState(false);

  const department = filters.department ?? '';
  const bloc = (filters.bloc as string) ?? '';
  const matchLevel = (filters.matchLevel as string) ?? '';
  const selectedEquipment = filters.equipmentFilters ?? [];
  const selectedSizes = filters.populationSizes ?? [];
  const riskLevel = (filters.riskLevel as string) ?? '';
  const selectedGeoTags = filters.geoTags ?? [];
  const prixM2Max = filters.prixM2Max;
  const airQuality = (filters.airQuality as string) ?? '';
  const travelFilter = filters.travelFilter;

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

  const travelKey = travelFilter
    ? `${travelFilter.lat}-${travelFilter.lng}-${travelFilter.mode}-${travelFilter.duration}`
    : '';

  useEffect(() => {
    if (!travelFilter?.lat || !travelFilter?.mode || !travelFilter?.duration) return;
    if (travelFilter.insees) return;

    let cancelled = false;
    setIsochroneLoading(true);

    computeIsochroneInsees(travelFilter.lat, travelFilter.lng, travelFilter.mode, travelFilter.duration)
      .then(insees => {
        if (!cancelled) {
          onFiltersChange({
            ...filters,
            travelFilter: { ...travelFilter, insees },
          });
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setIsochroneLoading(false); });

    return () => { cancelled = true; };
  }, [travelKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const handleAddressSelect = (result: GeocodingResult) => {
    const base = { address: result.label, lat: result.lat, lng: result.lng };
    if (travelFilter?.mode && travelFilter?.duration) {
      update({ travelFilter: { ...base, mode: travelFilter.mode, duration: travelFilter.duration } });
    } else {
      update({ travelFilter: { ...base, mode: travelFilter?.mode ?? 'train', duration: travelFilter?.duration ?? 30 } });
    }
  };

  const handleAddressClear = () => {
    update({ travelFilter: undefined });
  };

  const handleTransportMode = (mode: TransportMode) => {
    if (!travelFilter?.lat) return;
    update({ travelFilter: { ...travelFilter, mode, insees: undefined } });
  };

  const handleTravelDuration = (duration: number) => {
    if (!travelFilter?.lat) return;
    update({ travelFilter: { ...travelFilter, duration, insees: undefined } });
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
    selectedGeoTags.length +
    (travelFilter?.insees ? 1 : 0);

  const handleReset = () => {
    onFiltersChange({});
    setExpandedCategories(new Set());
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal: full screen on mobile, centered large on desktop */}
      <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center sm:p-6">
        <div className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-5xl bg-white sm:rounded-2xl shadow-2xl flex flex-col animate-filter-sheet">

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Filtres</h2>
                {activeCount > 0 && (
                  <p className="text-xs text-slate-400">{activeCount} filtre{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeCount > 0 && (
                <button onClick={handleReset} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                  Réinitialiser
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable content — single column by category (desktop & mobile) */}
          <div className="flex-grow overflow-y-auto px-5 sm:px-8 py-6">
            <div className="max-w-2xl">

              {/* 1. Localisation */}
              <CategoryBlock title={FILTER_CATEGORIES[0].label} icon={FILTER_CATEGORIES[0].icon} isLast={false}>
                <Section label="Département">
                  <select
                    value={department}
                    onChange={(e) => update({ department: e.target.value || undefined })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">Tous les départements</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Section>
                <Section label="Cadre géographique">
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(GEO_TAGS) as [GeoTag, { label: string; description: string; color: string }][]).map(([key, { label, description, color }]) => (
                      <Chip
                        key={key}
                        active={selectedGeoTags.includes(key)}
                        onClick={() => toggleGeoTag(key)}
                        activeClass={color}
                      >
                        {GEO_TAG_ICONS[key]}
                        <span>{label}</span>
                        <span className="text-[10px] font-normal opacity-70">{description}</span>
                      </Chip>
                    ))}
                  </div>
                </Section>
                <Section label="Taille de commune" icon={<Users className="w-3.5 h-3.5" />}>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(POPULATION_SIZES) as [PopulationSize, { label: string; min: number; max: number }][]).map(([key, { label, max }]) => (
                      <Chip
                        key={key}
                        active={selectedSizes.includes(key)}
                        onClick={() => toggleSize(key)}
                        activeClass="bg-violet-50 border-violet-300 text-violet-700"
                      >
                        {label}
                        <span className="text-[10px] font-normal opacity-70">
                          {max === Infinity ? '200k+' : max >= 1000 ? `<${max / 1000}k` : `<${max}`}
                        </span>
                      </Chip>
                    ))}
                  </div>
                </Section>
              </CategoryBlock>

              {/* 2. Environnement et risques */}
              <CategoryBlock title={FILTER_CATEGORIES[1].label} icon={FILTER_CATEGORIES[1].icon} isLast={false}>
                <Section label="Exposition aux risques" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(RISK_LEVELS) as [RiskLevel, { label: string; description: string; color: string }][]).map(([key, { label, description, color }]) => (
                      <Chip
                        key={key}
                        active={riskLevel === key}
                        onClick={() => update({ riskLevel: riskLevel === key ? undefined : key as RiskLevel })}
                        activeClass={color}
                      >
                        {label}
                        <span className="text-[10px] font-normal opacity-70">{description}</span>
                      </Chip>
                    ))}
                  </div>
                </Section>
                <Section label="Qualité de l'air" icon={<Wind className="w-3.5 h-3.5" />}>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(AIR_QUALITY_LEVELS) as [AirQuality, { label: string; description: string; color: string }][]).map(([key, { label, description, color }]) => (
                      <Chip
                        key={key}
                        active={airQuality === key}
                        onClick={() => update({ airQuality: airQuality === key ? undefined : key as AirQuality })}
                        activeClass={color}
                      >
                        {label}
                        <span className="text-[10px] font-normal opacity-70">{description}</span>
                      </Chip>
                    ))}
                  </div>
                </Section>
              </CategoryBlock>

              {/* 3. Services et équipements */}
              <CategoryBlock title={FILTER_CATEGORIES[2].label} icon={FILTER_CATEGORIES[2].icon} isLast={false}>
                <Section label="Équipements">
                  <div className="space-y-1.5">
                    {EQUIPMENT_CATEGORIES.map(cat => {
                      const Icon = CATEGORY_ICONS[cat.icon];
                      const isExpanded = expandedCategories.has(cat.id);

                      if (cat.filterKey) {
                        const active = selectedEquipment.includes(cat.filterKey);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleEquipment(cat.filterKey!)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium border transition-all ${
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
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium border transition-all ${
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
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
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
              </CategoryBlock>

              {/* 4. Politique */}
              <CategoryBlock title={FILTER_CATEGORIES[3].label} icon={FILTER_CATEGORIES[3].icon} isLast={false}>
                <Section label="Tendance politique">
                  <div className="flex flex-wrap gap-2">
                    {BLOC_OPTIONS.map(o => (
                      <Chip
                        key={o.value}
                        active={bloc === o.value}
                        onClick={() => update({ bloc: bloc === o.value ? undefined : o.value as PoliticalBloc })}
                        activeClass="border-indigo-300 text-indigo-700"
                        style={bloc === o.value ? { backgroundColor: `${BLOC_COLORS[o.value]}15`, borderColor: BLOC_COLORS[o.value], color: BLOC_COLORS[o.value] } : {}}
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: BLOC_COLORS[o.value] }} />
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                </Section>
                <Section label="Stabilité politique">
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      active={matchLevel === 'forteresse'}
                      onClick={() => update({ matchLevel: matchLevel === 'forteresse' ? undefined : 'forteresse' })}
                      activeClass="bg-emerald-50 border-emerald-300 text-emerald-700"
                    >
                      <Shield className="w-3.5 h-3.5" /> Forteresse
                    </Chip>
                    <Chip
                      active={matchLevel === 'tendance'}
                      onClick={() => update({ matchLevel: matchLevel === 'tendance' ? undefined : 'tendance' })}
                      activeClass="bg-amber-50 border-amber-300 text-amber-700"
                    >
                      <Activity className="w-3.5 h-3.5" /> En ballottage
                    </Chip>
                  </div>
                </Section>
              </CategoryBlock>

              {/* 5. Accessibilité */}
              <CategoryBlock title={FILTER_CATEGORIES[4].label} icon={FILTER_CATEGORIES[4].icon} isLast={false}>
                <Section label="Temps de trajet">
                  <div className="space-y-3">
                    <AddressAutocomplete
                      value={travelFilter?.address ?? ''}
                      onSelect={handleAddressSelect}
                      onClear={handleAddressClear}
                    />

                    {travelFilter?.lat && (
                      <>
                        <div>
                          <span className="block text-[11px] text-slate-400 mb-1.5">Mode de transport</span>
                          <div className="flex flex-wrap gap-2">
                            {TRANSPORT_MODES.map(({ key, label, icon }) => {
                              const Icon = TRANSPORT_ICONS[icon];
                              return (
                                <Chip
                                  key={key}
                                  active={travelFilter.mode === key}
                                  onClick={() => handleTransportMode(key)}
                                  activeClass={key === 'train'
                                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                                    : key === 'cycling'
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                      : 'bg-slate-100 border-slate-300 text-slate-600'}
                                >
                                  {Icon && <Icon className="w-3.5 h-3.5" />}
                                  {label}
                                </Chip>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[11px] text-slate-400 mb-1.5">Durée maximale</span>
                          <div className="flex flex-wrap gap-2">
                            {TRAVEL_DURATIONS.map(d => (
                              <Chip
                                key={d}
                                active={travelFilter.duration === d}
                                onClick={() => handleTravelDuration(d)}
                                activeClass="bg-indigo-50 border-indigo-300 text-indigo-700"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {d} min
                              </Chip>
                            ))}
                          </div>
                        </div>

                        {travelFilter.mode === 'train' && (
                          <div className="flex items-start gap-2 text-[11px] text-sky-600 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>Basé sur les horaires SNCF (TGV, TER, Intercités). Calculé pour un trajet en semaine à 8h.</span>
                          </div>
                        )}

                        {isochroneLoading && (
                          <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Calcul de la zone accessible...
                          </div>
                        )}

                        {travelFilter.insees && !isochroneLoading && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 py-1">
                            <Navigation className="w-3.5 h-3.5" />
                            {travelFilter.insees.length} commune{travelFilter.insees.length > 1 ? 's' : ''} accessible{travelFilter.insees.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Section>
              </CategoryBlock>

              {/* 6. Immobilier */}
              <CategoryBlock title={FILTER_CATEGORIES[5].label} icon={FILTER_CATEGORIES[5].icon} isLast={true}>
                <Section label="Prix au m²">
                  <div className="flex flex-wrap gap-2">
                    {PRIX_M2_RANGES.map(({ key, label }) => (
                      <Chip
                        key={key}
                        active={prixM2Max === key}
                        onClick={() => update({ prixM2Max: prixM2Max === key ? undefined : key })}
                        activeClass="bg-amber-50 border-amber-300 text-amber-700"
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </Section>
              </CategoryBlock>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex-shrink-0 px-5 sm:px-8 py-4 border-t border-slate-200 bg-white sm:rounded-b-2xl">
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
      </div>
    </>
  );
};

const Section: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="pb-5 border-b border-slate-100 last:border-b-0">
    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
      {icon && <span className="text-slate-400">{icon}</span>}
      {label}
    </label>
    {children}
  </div>
);

/** M3-style filter chip: pill shape, selected = fill + checkmark */
const Chip: React.FC<{
  active: boolean;
  onClick: () => void;
  activeClass: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ active, onClick, activeClass, children, className = '', style }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
      active ? activeClass : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
    } ${className}`}
    style={active ? style : undefined}
  >
    {children}
    {active && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-0.5" />}
  </button>
);

export default FilterSheet;
