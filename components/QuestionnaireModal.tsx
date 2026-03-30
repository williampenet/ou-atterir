import React, { useState } from 'react';
import {
  X, ChevronRight, Thermometer, Droplets, AlertTriangle, Wind,
  LayoutGrid, Waves, Mountain, TreePine,
  ShoppingBag, GraduationCap, Heart, Train, Dumbbell,
  Euro, Scale, Check, Compass,
} from 'lucide-react';
import { SearchFilters, PopulationSize, GeoTag, EquipmentFilterKey, PoliticalBloc, ClimateWeights } from '../types';
import { BLOC_COLORS, DEFAULT_CLIMATE_WEIGHTS } from '../constants';

export interface QuestionnaireResult {
  filters: SearchFilters;
  weights: ClimateWeights;
}

interface Props {
  open: boolean;
  onComplete: (result: QuestionnaireResult) => void;
  onSkip: () => void;
}

// ─── Step definitions ────────────────────────────────────────────────────────

type ClimateAnswer = 'temperatures' | 'eau' | 'risques' | 'air' | 'balanced';

const CLIMATE_OPTIONS: { key: ClimateAnswer; icon: React.ReactNode; label: string; description: string; color: string }[] = [
  {
    key: 'temperatures',
    icon: <Thermometer className="w-5 h-5" />,
    label: 'Chaleur',
    description: 'Canicules, nuits chaudes, jours > 35 °C',
    color: 'border-orange-300 bg-orange-50 text-orange-700',
  },
  {
    key: 'eau',
    icon: <Droplets className="w-5 h-5" />,
    label: 'Sécheresse',
    description: 'Stress hydrique, sols secs, manque de pluie',
    color: 'border-sky-300 bg-sky-50 text-sky-700',
  },
  {
    key: 'risques',
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Risques naturels',
    description: 'Incendies, inondations, événements extrêmes',
    color: 'border-red-300 bg-red-50 text-red-700',
  },
  {
    key: 'air',
    icon: <Wind className="w-5 h-5" />,
    label: 'Qualité de l\'air',
    description: 'Particules fines (PM2.5), pollution atmosphérique',
    color: 'border-violet-300 bg-violet-50 text-violet-700',
  },
  {
    key: 'balanced',
    icon: <LayoutGrid className="w-5 h-5" />,
    label: 'Tout équilibrer',
    description: 'Pondération égale des 4 dimensions climatiques',
    color: 'border-slate-300 bg-slate-50 text-slate-700',
  },
];

const GEO_OPTIONS: { key: GeoTag; icon: React.ReactNode; label: string; description: string }[] = [
  { key: 'littoral', icon: <Waves className="w-5 h-5" />, label: 'Littoral', description: 'Proche de la mer ou de l\'océan' },
  { key: 'montagne', icon: <Mountain className="w-5 h-5" />, label: 'Montagne', description: 'Relief montagneux, altitude' },
  { key: 'campagne', icon: <TreePine className="w-5 h-5" />, label: 'Campagne', description: 'Rural, espaces naturels' },
];

const SIZE_OPTIONS: { keys: PopulationSize[]; label: string; description: string }[] = [
  { keys: ['hameau', 'village'], label: 'Village', description: 'Moins de 500 habitants' },
  { keys: ['bourg'], label: 'Bourg', description: '500 – 2 000 habitants' },
  { keys: ['petite_ville'], label: 'Petite ville', description: '2 000 – 10 000 habitants' },
  { keys: ['ville_moyenne'], label: 'Ville moyenne', description: '10 000 – 50 000 habitants' },
  { keys: ['grande_ville', 'metropole'], label: 'Grande ville', description: 'Plus de 50 000 habitants' },
];

const SERVICES_OPTIONS: { key: EquipmentFilterKey; icon: React.ReactNode; label: string }[] = [
  { key: 'commerces', icon: <ShoppingBag className="w-4 h-4" />, label: 'Commerces' },
  { key: 'ecole', icon: <GraduationCap className="w-4 h-4" />, label: 'École primaire' },
  { key: 'college', icon: <GraduationCap className="w-4 h-4" />, label: 'Collège' },
  { key: 'lycee', icon: <GraduationCap className="w-4 h-4" />, label: 'Lycée' },
  { key: 'etab_sante', icon: <Heart className="w-4 h-4" />, label: 'Santé' },
  { key: 'transports', icon: <Train className="w-4 h-4" />, label: 'Transports' },
  { key: 'sport', icon: <Dumbbell className="w-4 h-4" />, label: 'Sport / loisirs' },
];

const BUDGET_OPTIONS: { key: number | null; label: string; description: string }[] = [
  { key: 1500, label: '< 1 500 €/m²', description: 'Marché très accessible' },
  { key: 2500, label: '< 2 500 €/m²', description: 'Marché accessible' },
  { key: 3500, label: '< 3 500 €/m²', description: 'Marché modéré' },
  { key: 5000, label: '< 5 000 €/m²', description: 'Marché tendu' },
  { key: null, label: 'Pas de contrainte', description: 'Je ne filtre pas par prix' },
];

const BLOC_OPTIONS: { value: PoliticalBloc; label: string }[] = [
  { value: PoliticalBloc.EXTRÊME_GAUCHE, label: 'Extrême-gauche' },
  { value: PoliticalBloc.GAUCHE, label: 'Gauche' },
  { value: PoliticalBloc.CENTRE, label: 'Centre' },
  { value: PoliticalBloc.CENTRE_DROIT, label: 'Centre-droit' },
  { value: PoliticalBloc.DROITE, label: 'Droite' },
  { value: PoliticalBloc.EXTREME_DROITE, label: 'Extrême-droite' },
];

// ─── Answers state ────────────────────────────────────────────────────────────

interface Answers {
  climatePriority: ClimateAnswer | null;
  geoTags: GeoTag[];
  populationSizes: PopulationSize[];
  services: EquipmentFilterKey[];
  budget: number | null | undefined; // undefined = not answered yet, null = no constraint
  bloc: PoliticalBloc | null;
}

function buildResult(answers: Answers): QuestionnaireResult {
  // Climate weights
  let weights: ClimateWeights = { ...DEFAULT_CLIMATE_WEIGHTS };
  if (answers.climatePriority && answers.climatePriority !== 'balanced') {
    weights = {
      temperatures: 20,
      eau: 20,
      risques: 20,
      air: 20,
      sols: 50,
      [answers.climatePriority]: 100,
    };
  }

  // Filters
  const filters: SearchFilters = {};
  if (answers.geoTags.length > 0) filters.geoTags = answers.geoTags;
  if (answers.populationSizes.length > 0) filters.populationSizes = answers.populationSizes;
  if (answers.services.length > 0) filters.equipmentFilters = answers.services;
  if (answers.budget != null) filters.prixM2Max = answers.budget;
  if (answers.bloc) filters.bloc = answers.bloc;

  return { filters, weights };
}

// ─── Component ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const QuestionnaireModal: React.FC<Props> = ({ open, onComplete, onSkip }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    climatePriority: null,
    geoTags: [],
    populationSizes: [],
    services: [],
    budget: undefined,
    bloc: null,
  });

  if (!open) return null;

  const canProceed = (): boolean => {
    if (step === 0) return answers.climatePriority !== null;
    return true; // All other steps are optional
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      onComplete(buildResult(answers));
    }
  };

  const toggleGeoTag = (tag: GeoTag) => {
    setAnswers(a => ({
      ...a,
      geoTags: a.geoTags.includes(tag) ? a.geoTags.filter(t => t !== tag) : [...a.geoTags, tag],
    }));
  };

  const toggleSizeGroup = (keys: PopulationSize[]) => {
    const allSelected = keys.every(k => answers.populationSizes.includes(k));
    setAnswers(a => ({
      ...a,
      populationSizes: allSelected
        ? a.populationSizes.filter(s => !keys.includes(s))
        : [...a.populationSizes.filter(s => !keys.includes(s)), ...keys],
    }));
  };

  const toggleService = (key: EquipmentFilterKey) => {
    setAnswers(a => ({
      ...a,
      services: a.services.includes(key) ? a.services.filter(k => k !== key) : [...a.services, key],
    }));
  };

  const isSizeGroupSelected = (keys: PopulationSize[]) => keys.every(k => answers.populationSizes.includes(k));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-fade-in" />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-6">
        <div
          className="w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl animate-filter-sheet flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Où Atterrir</p>
                <p className="text-xs text-slate-400">Étape {step + 1} sur {TOTAL_STEPS}</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
              Passer
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto px-6 pb-2">
            {step === 0 && (
              <StepClimate value={answers.climatePriority} onChange={(v) => setAnswers(a => ({ ...a, climatePriority: v }))} />
            )}
            {step === 1 && (
              <StepGeo selected={answers.geoTags} onToggle={toggleGeoTag} />
            )}
            {step === 2 && (
              <StepSize
                selected={answers.populationSizes}
                onToggle={toggleSizeGroup}
                isSelected={isSizeGroupSelected}
              />
            )}
            {step === 3 && (
              <StepServices selected={answers.services} onToggle={toggleService} />
            )}
            {step === 4 && (
              <StepBudget value={answers.budget} onChange={(v) => setAnswers(a => ({ ...a, budget: v }))} />
            )}
            {step === 5 && (
              <StepBloc value={answers.bloc} onChange={(v) => setAnswers(a => ({ ...a, bloc: v }))} />
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-5 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Retour
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {step === TOTAL_STEPS - 1 ? 'Voir mes résultats' : 'Suivant'}
                {step < TOTAL_STEPS - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <button
                onClick={handleNext}
                className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                Ignorer cette étape
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Step components ──────────────────────────────────────────────────────────

const StepClimate: React.FC<{ value: ClimateAnswer | null; onChange: (v: ClimateAnswer) => void }> = ({ value, onChange }) => (
  <div>
    <h2 className="text-xl font-extrabold text-slate-900 mb-1">Quelle est votre priorité climatique ?</h2>
    <p className="text-sm text-slate-500 mb-5">Le classement sera pondéré en conséquence.</p>
    <div className="space-y-2">
      {CLIMATE_OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
            value === opt.key
              ? opt.color + ' border-opacity-100'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className={`flex-shrink-0 p-2 rounded-lg ${value === opt.key ? '' : 'bg-slate-100 text-slate-500'}`}>
            {opt.icon}
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-bold text-slate-800">{opt.label}</p>
            <p className="text-xs text-slate-500 leading-tight">{opt.description}</p>
          </div>
          {value === opt.key && <Check className="w-4 h-4 flex-shrink-0" />}
        </button>
      ))}
    </div>
  </div>
);

const StepGeo: React.FC<{ selected: GeoTag[]; onToggle: (t: GeoTag) => void }> = ({ selected, onToggle }) => (
  <div>
    <h2 className="text-xl font-extrabold text-slate-900 mb-1">Quel cadre de vie ?</h2>
    <p className="text-sm text-slate-500 mb-5">Plusieurs choix possibles — ou aucun si vous êtes flexible.</p>
    <div className="space-y-2">
      {GEO_OPTIONS.map(opt => {
        const active = selected.includes(opt.key);
        return (
          <button
            key={opt.key}
            onClick={() => onToggle(opt.key)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
              active
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`flex-shrink-0 p-2 rounded-lg ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              {opt.icon}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.description}</p>
            </div>
            {active && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  </div>
);

const StepSize: React.FC<{ selected: PopulationSize[]; onToggle: (keys: PopulationSize[]) => void; isSelected: (keys: PopulationSize[]) => boolean }> = ({ onToggle, isSelected }) => (
  <div>
    <h2 className="text-xl font-extrabold text-slate-900 mb-1">Taille de commune ?</h2>
    <p className="text-sm text-slate-500 mb-5">Plusieurs choix possibles.</p>
    <div className="space-y-2">
      {SIZE_OPTIONS.map(opt => {
        const active = isSelected(opt.keys);
        return (
          <button
            key={opt.keys.join(',')}
            onClick={() => onToggle(opt.keys)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
              active
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.description}</p>
            </div>
            {active && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  </div>
);

const StepServices: React.FC<{ selected: EquipmentFilterKey[]; onToggle: (k: EquipmentFilterKey) => void }> = ({ selected, onToggle }) => (
  <div>
    <h2 className="text-xl font-extrabold text-slate-900 mb-1">Services indispensables ?</h2>
    <p className="text-sm text-slate-500 mb-5">Sélectionnez tout ce qui est non-négociable pour vous.</p>
    <div className="grid grid-cols-2 gap-2">
      {SERVICES_OPTIONS.map(opt => {
        const active = selected.includes(opt.key);
        return (
          <button
            key={opt.key}
            onClick={() => onToggle(opt.key)}
            className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all ${
              active
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              {opt.icon}
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">{opt.label}</span>
            {active && <Check className="w-3.5 h-3.5 text-indigo-500 ml-auto flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  </div>
);

const StepBudget: React.FC<{ value: number | null | undefined; onChange: (v: number | null) => void }> = ({ value, onChange }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <Euro className="w-5 h-5 text-amber-500" />
      <h2 className="text-xl font-extrabold text-slate-900">Budget immobilier ?</h2>
    </div>
    <p className="text-sm text-slate-500 mb-5">Prix médian au m² pour les maisons.</p>
    <div className="space-y-2">
      {BUDGET_OPTIONS.map(opt => {
        const active = value === opt.key;
        return (
          <button
            key={String(opt.key)}
            onClick={() => onChange(opt.key)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
              active
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.description}</p>
            </div>
            {active && <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  </div>
);

const StepBloc: React.FC<{ value: PoliticalBloc | null; onChange: (v: PoliticalBloc | null) => void }> = ({ value, onChange }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <Scale className="w-5 h-5 text-slate-500" />
      <h2 className="text-xl font-extrabold text-slate-900">Tendance politique ?</h2>
    </div>
    <p className="text-sm text-slate-500 mb-5">Optionnel — vous pouvez ignorer cette étape.</p>
    <div className="space-y-2">
      {BLOC_OPTIONS.map(opt => {
        const active = value === opt.value;
        const color = BLOC_COLORS[opt.value];
        return (
          <button
            key={opt.value}
            onClick={() => onChange(active ? null : opt.value)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              !active ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50' : ''
            }`}
            style={active ? { borderColor: color, backgroundColor: `${color}12` } : undefined}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="flex-grow text-sm font-semibold text-slate-800">{opt.label}</span>
            {active && <Check className="w-4 h-4 flex-shrink-0" style={{ color }} />}
          </button>
        );
      })}
      {value && (
        <button
          onClick={() => onChange(null)}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
        >
          Effacer la sélection
        </button>
      )}
    </div>
  </div>
);

export default QuestionnaireModal;
