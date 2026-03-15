import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchFilters, PoliticalBloc, PopulationSize, GeoTag, EquipmentFilterKey, MatchLevel } from '../types';
import { POPULATION_SIZES, GEO_TAGS, BLOC_COLORS, PRIX_M2_RANGES, formatDepartments, Department } from '../constants';
import { getDepartments } from '../services/communeService';
import {
  ChevronDown, Check, MapPin, Mountain, Waves, TreePine,
  Users, GraduationCap, Heart, ShoppingBag, Scale,
  Train, Dumbbell, Shield, Euro,
} from 'lucide-react';

interface QuickFiltersBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

// ─── Dropdown wrapper (generic for all quick filters) ───

interface DropdownProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  activeLabel?: string;
  children: (close: () => void) => React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ label, icon, active, activeLabel, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
          active
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        {icon}
        <span>{active && activeLabel ? activeLabel : label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] min-w-[200px] py-2 animate-fade-in-up">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

// ─── Dropdown option item ───

const DropdownItem: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}> = ({ active, onClick, children, dot }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${
      active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    {dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />}
    <span className="flex-1">{children}</span>
    {active && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
  </button>
);

// ─── Main QuickFiltersBar component ───

const QuickFiltersBar: React.FC<QuickFiltersBarProps> = ({ filters, onFiltersChange }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(11);

  useEffect(() => {
    getDepartments().then(names => setDepartments(formatDepartments(names)));
  }, []);

  // ─── ResizeObserver: hide filters that don't fit ───
  const recalcVisible = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    // Temporarily show all to measure
    children.forEach(c => {
      c.style.visibility = 'visible';
      c.style.position = 'relative';
    });

    const containerRight = container.getBoundingClientRect().right;
    let count = 0;

    for (const child of children) {
      const childRight = child.getBoundingClientRect().right;
      // Leave 8px margin before container edge
      if (childRight + 8 > containerRight) break;
      count++;
    }

    const finalCount = Math.max(1, count);
    setVisibleCount(finalCount);

    // Hide overflowing items without overflow:hidden (which clips dropdowns)
    children.forEach((c, i) => {
      if (i >= finalCount) {
        c.style.visibility = 'hidden';
        c.style.position = 'absolute';
      }
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => recalcVisible());
    observer.observe(container);
    // Also recalc on mount
    recalcVisible();

    return () => observer.disconnect();
  }, [recalcVisible]);

  // ─── Filter helpers ───
  const update = (patch: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const selectedSizes = filters.populationSizes ?? [];
  const selectedGeoTags = filters.geoTags ?? [];
  const selectedEquipment = filters.equipmentFilters ?? [];
  const department = filters.department ?? '';
  const bloc = filters.bloc;
  const matchLevel = filters.matchLevel ?? '';
  const prixM2Max = filters.prixM2Max;

  const toggleSize = (size: PopulationSize) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    update({ populationSizes: next.length ? next : undefined });
  };

  const toggleGeoTag = (tag: GeoTag) => {
    const next = selectedGeoTags.includes(tag)
      ? selectedGeoTags.filter(t => t !== tag)
      : [...selectedGeoTags, tag];
    update({ geoTags: next.length ? next : undefined });
  };

  const toggleEquipment = (key: EquipmentFilterKey) => {
    const next = selectedEquipment.includes(key)
      ? selectedEquipment.filter(k => k !== key)
      : [...selectedEquipment, key];
    update({ equipmentFilters: next.length ? next : undefined });
  };

  const GEO_TAG_ICONS: Record<GeoTag, React.ReactNode> = {
    littoral: <Waves className="w-3 h-3" />,
    montagne: <Mountain className="w-3 h-3" />,
    campagne: <TreePine className="w-3 h-3" />,
  };

  // ─── All possible quick filter definitions (ordered by priority) ───
  const BLOC_OPTIONS = [
    { value: PoliticalBloc.EXTRÊME_GAUCHE, label: 'Extrême-gauche' },
    { value: PoliticalBloc.GAUCHE, label: 'Gauche' },
    { value: PoliticalBloc.CENTRE, label: 'Centre' },
    { value: PoliticalBloc.CENTRE_DROIT, label: 'Centre-droit' },
    { value: PoliticalBloc.DROITE, label: 'Droite' },
    { value: PoliticalBloc.EXTREME_DROITE, label: 'Extrême-droite' },
    { value: PoliticalBloc.DIVERS, label: 'Divers' },
  ];

  const quickFilters = [
    // 1. Département (value = d.name, same as FilterSheet)
    <Dropdown
      key="dept"
      label="Département"
      icon={<MapPin className="w-3 h-3" />}
      active={!!department}
      activeLabel={department || undefined}
    >
      {(close) => (
        <div className="max-h-64 overflow-y-auto">
          <DropdownItem
            active={!department}
            onClick={() => { update({ department: undefined }); close(); }}
          >
            Tous les départements
          </DropdownItem>
          {departments.map(d => (
            <DropdownItem
              key={d.name}
              active={department === d.name}
              onClick={() => { update({ department: d.name }); close(); }}
            >
              {d.code} — {d.name}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>,

    // 2. Géographie
    <Dropdown
      key="geo"
      label="Géographie"
      icon={<Mountain className="w-3 h-3" />}
      active={selectedGeoTags.length > 0}
      activeLabel={selectedGeoTags.length > 0
        ? selectedGeoTags.map(t => GEO_TAGS[t].label).join(', ')
        : undefined
      }
    >
      {() => (
        <div>
          {(Object.entries(GEO_TAGS) as [GeoTag, { label: string; color: string }][]).map(([tag, config]) => (
            <DropdownItem
              key={tag}
              active={selectedGeoTags.includes(tag)}
              onClick={() => toggleGeoTag(tag)}
            >
              <span className="inline-flex items-center gap-1.5">
                {GEO_TAG_ICONS[tag]}
                {config.label}
              </span>
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>,

    // 3. Taille
    <Dropdown
      key="size"
      label="Taille"
      icon={<Users className="w-3 h-3" />}
      active={selectedSizes.length > 0}
      activeLabel={selectedSizes.length > 0
        ? selectedSizes.length === 1
          ? POPULATION_SIZES[selectedSizes[0]].label
          : `${selectedSizes.length} tailles`
        : undefined
      }
    >
      {() => (
        <div>
          {(Object.entries(POPULATION_SIZES) as [PopulationSize, { label: string; min: number; max: number }][]).map(([key, config]) => (
            <DropdownItem
              key={key}
              active={selectedSizes.includes(key)}
              onClick={() => toggleSize(key)}
            >
              {config.label}
              <span className="text-slate-400 ml-1">
                ({config.max === Infinity ? `${config.min.toLocaleString('fr-FR')}+` : `${config.min.toLocaleString('fr-FR')}–${config.max.toLocaleString('fr-FR')}`})
              </span>
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>,

    // 4. Commerces (toggle)
    <Dropdown
      key="commerces"
      label="Commerces"
      icon={<ShoppingBag className="w-3 h-3" />}
      active={selectedEquipment.includes('commerces')}
    >
      {(close) => (
        <div>
          <DropdownItem
            active={selectedEquipment.includes('commerces')}
            onClick={() => { toggleEquipment('commerces'); close(); }}
          >
            Présence de commerces
          </DropdownItem>
        </div>
      )}
    </Dropdown>,

    // 5. Enseignement
    <Dropdown
      key="enseignement"
      label="Enseignement"
      icon={<GraduationCap className="w-3 h-3" />}
      active={(['creche', 'ecole', 'college', 'lycee', 'sup'] as EquipmentFilterKey[]).some(k => selectedEquipment.includes(k))}
      activeLabel={(() => {
        const eduFilters = (['creche', 'ecole', 'college', 'lycee', 'sup'] as EquipmentFilterKey[]).filter(k => selectedEquipment.includes(k));
        return eduFilters.length > 0 ? `${eduFilters.length} sélectionné${eduFilters.length > 1 ? 's' : ''}` : undefined;
      })()}
    >
      {() => (
        <div>
          {[
            { key: 'creche' as EquipmentFilterKey, label: 'Crèche' },
            { key: 'ecole' as EquipmentFilterKey, label: 'École' },
            { key: 'college' as EquipmentFilterKey, label: 'Collège' },
            { key: 'lycee' as EquipmentFilterKey, label: 'Lycée' },
            { key: 'sup' as EquipmentFilterKey, label: 'Enseignement supérieur' },
          ].map(item => (
            <DropdownItem
              key={item.key}
              active={selectedEquipment.includes(item.key)}
              onClick={() => toggleEquipment(item.key)}
            >
              {item.label}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>,

    // 6. Santé
    <Dropdown
      key="sante"
      label="Santé"
      icon={<Heart className="w-3 h-3" />}
      active={(['etab_sante', 'prof_med'] as EquipmentFilterKey[]).some(k => selectedEquipment.includes(k))}
      activeLabel={(() => {
        const healthFilters = (['etab_sante', 'prof_med'] as EquipmentFilterKey[]).filter(k => selectedEquipment.includes(k));
        return healthFilters.length > 0 ? `${healthFilters.length} sélectionné${healthFilters.length > 1 ? 's' : ''}` : undefined;
      })()}
    >
      {() => (
        <div>
          <DropdownItem
            active={selectedEquipment.includes('etab_sante')}
            onClick={() => toggleEquipment('etab_sante')}
          >
            Établissements de santé
          </DropdownItem>
          <DropdownItem
            active={selectedEquipment.includes('prof_med')}
            onClick={() => toggleEquipment('prof_med')}
          >
            Professions médicales libérales
          </DropdownItem>
        </div>
      )}
    </Dropdown>,

    // 7. Transports (toggle)
    <Dropdown
      key="transports"
      label="Transports"
      icon={<Train className="w-3 h-3" />}
      active={selectedEquipment.includes('transports')}
    >
      {(close) => (
        <div>
          <DropdownItem
            active={selectedEquipment.includes('transports')}
            onClick={() => { toggleEquipment('transports'); close(); }}
          >
            Présence de transports
          </DropdownItem>
        </div>
      )}
    </Dropdown>,

    // 8. Sports & Culture
    <Dropdown
      key="sports-culture"
      label="Sports & Culture"
      icon={<Dumbbell className="w-3 h-3" />}
      active={(['sport', 'culture'] as EquipmentFilterKey[]).some(k => selectedEquipment.includes(k))}
      activeLabel={(() => {
        const filters = (['sport', 'culture'] as EquipmentFilterKey[]).filter(k => selectedEquipment.includes(k));
        return filters.length > 0 ? `${filters.length} sélectionné${filters.length > 1 ? 's' : ''}` : undefined;
      })()}
    >
      {() => (
        <div>
          <DropdownItem
            active={selectedEquipment.includes('sport')}
            onClick={() => toggleEquipment('sport')}
          >
            Équipements sportifs
          </DropdownItem>
          <DropdownItem
            active={selectedEquipment.includes('culture')}
            onClick={() => toggleEquipment('culture')}
          >
            Équipements culturels
          </DropdownItem>
        </div>
      )}
    </Dropdown>,

    // 9. Maire sortant (politique bloc)
    <Dropdown
      key="politique"
      label="Maire sortant"
      icon={<Scale className="w-3 h-3" />}
      active={!!bloc}
      activeLabel={bloc ? BLOC_OPTIONS.find(b => b.value === bloc)?.label : undefined}
    >
      {(close) => (
        <div>
          <DropdownItem
            active={!bloc}
            onClick={() => { update({ bloc: undefined }); close(); }}
          >
            Toutes tendances
          </DropdownItem>
          {BLOC_OPTIONS.map(b => (
            <DropdownItem
              key={b.value}
              active={bloc === b.value}
              onClick={() => { update({ bloc: b.value }); close(); }}
              dot={BLOC_COLORS[b.value]}
            >
              {b.label}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>,

    // 10. Stabilité politique
    <Dropdown
      key="stabilite"
      label="Stabilité"
      icon={<Shield className="w-3 h-3" />}
      active={!!matchLevel}
      activeLabel={matchLevel === 'forteresse' ? 'Forteresse' : matchLevel === 'tendance' ? 'En ballottage' : undefined}
    >
      {(close) => (
        <div>
          <DropdownItem
            active={!matchLevel}
            onClick={() => { update({ matchLevel: undefined }); close(); }}
          >
            Toutes stabilités
          </DropdownItem>
          <DropdownItem
            active={matchLevel === 'forteresse'}
            onClick={() => { update({ matchLevel: 'forteresse' as MatchLevel }); close(); }}
          >
            Forteresse
          </DropdownItem>
          <DropdownItem
            active={matchLevel === 'tendance'}
            onClick={() => { update({ matchLevel: 'tendance' as MatchLevel }); close(); }}
          >
            En ballottage
          </DropdownItem>
        </div>
      )}
    </Dropdown>,

    // 11. Prix m²
    <Dropdown
      key="prix"
      label="Prix m²"
      icon={<Euro className="w-3 h-3" />}
      active={!!prixM2Max}
      activeLabel={prixM2Max ? PRIX_M2_RANGES.find(r => r.key === prixM2Max)?.label : undefined}
    >
      {(close) => (
        <div>
          <DropdownItem
            active={!prixM2Max}
            onClick={() => { update({ prixM2Max: undefined }); close(); }}
          >
            Tous les prix
          </DropdownItem>
          {PRIX_M2_RANGES.map(({ key, label }) => (
            <DropdownItem
              key={key}
              active={prixM2Max === key}
              onClick={() => { update({ prixM2Max: key }); close(); }}
            >
              {label}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>,
  ];

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {/* Quick filters with ResizeObserver */}
      <div
        ref={containerRef}
        className="relative flex items-center gap-1.5 flex-1 min-w-0"
      >
        {quickFilters.map((filter, i) => (
          <div
            key={i}
            style={i >= visibleCount ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none' } : undefined}
          >
            {filter}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickFiltersBar;
