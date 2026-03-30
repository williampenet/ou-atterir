import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, Thermometer, Droplets, AlertTriangle, Wind,
  LayoutGrid, Waves, Mountain, TreePine, Building2, Home, MapPin,
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
  onComplete: (result: QuestionnaireResult) => void;
  onSkip: () => void;
}

// ─── Options ──────────────────────────────────────────────────────────────────

// Step 0 — Environment (geo + size merged)
type EnvOption =
  | { type: 'geo'; key: GeoTag; icon: React.ReactNode; label: string; description: string }
  | { type: 'size'; keys: PopulationSize[]; icon: React.ReactNode; label: string; description: string };

const ENV_OPTIONS: EnvOption[] = [
  { type: 'geo', key: 'littoral', icon: <Waves className="w-5 h-5" />, label: 'Littoral', description: 'Proche de la mer ou de l\'océan' },
  { type: 'geo', key: 'montagne', icon: <Mountain className="w-5 h-5" />, label: 'Montagne', description: 'Relief montagneux, altitude' },
  { type: 'geo', key: 'campagne', icon: <TreePine className="w-5 h-5" />, label: 'Campagne', description: 'Rural, espaces naturels' },
  { type: 'size', keys: ['hameau', 'village', 'bourg'], icon: <Home className="w-5 h-5" />, label: 'Village / Bourg', description: 'Moins de 2 000 habitants' },
  { type: 'size', keys: ['petite_ville'], icon: <MapPin className="w-5 h-5" />, label: 'Petite ville', description: '2 000 – 10 000 habitants' },
  { type: 'size', keys: ['ville_moyenne', 'grande_ville', 'metropole'], icon: <Building2 className="w-5 h-5" />, label: 'Ville', description: 'Plus de 10 000 habitants' },
];

// Step 1 — Services
const SERVICES_OPTIONS: { key: EquipmentFilterKey; icon: React.ReactNode; label: string }[] = [
  { key: 'commerces', icon: <ShoppingBag className="w-4 h-4" />, label: 'Commerces' },
  { key: 'ecole', icon: <GraduationCap className="w-4 h-4" />, label: 'École primaire' },
  { key: 'college', icon: <GraduationCap className="w-4 h-4" />, label: 'Collège' },
  { key: 'lycee', icon: <GraduationCap className="w-4 h-4" />, label: 'Lycée' },
  { key: 'etab_sante', icon: <Heart className="w-4 h-4" />, label: 'Santé' },
  { key: 'transports', icon: <Train className="w-4 h-4" />, label: 'Transports' },
  { key: 'sport', icon: <Dumbbell className="w-4 h-4" />, label: 'Sport / loisirs' },
];

// Step 2 — Budget
const BUDGET_OPTIONS: { key: number | null; label: string; description: string }[] = [
  { key: 1500, label: '< 1 500 €/m²', description: 'Marché très accessible' },
  { key: 2500, label: '< 2 500 €/m²', description: 'Marché accessible' },
  { key: 3500, label: '< 3 500 €/m²', description: 'Marché modéré' },
  { key: 5000, label: '< 5 000 €/m²', description: 'Marché tendu' },
  { key: null, label: 'Pas de contrainte', description: 'Je ne filtre pas par prix' },
];

// Step 3 — Political bloc
const BLOC_OPTIONS: { value: PoliticalBloc; label: string }[] = [
  { value: PoliticalBloc.EXTRÊME_GAUCHE, label: 'Extrême-gauche' },
  { value: PoliticalBloc.GAUCHE, label: 'Gauche' },
  { value: PoliticalBloc.CENTRE, label: 'Centre' },
  { value: PoliticalBloc.CENTRE_DROIT, label: 'Centre-droit' },
  { value: PoliticalBloc.DROITE, label: 'Droite' },
  { value: PoliticalBloc.EXTREME_DROITE, label: 'Extrême-droite' },
];

// Step 4 — Climate (LAST)
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

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Quel cadre de vie ?', subtitle: 'Plusieurs choix possibles — ou aucun si vous êtes flexible.' },
  { title: 'Services indispensables ?', subtitle: 'Sélectionnez tout ce qui est non-négociable pour vous.' },
  { title: 'Budget immobilier ?', subtitle: 'Prix médian au m² pour les maisons.' },
  { title: 'Tendance politique ?', subtitle: 'Optionnel — vous pouvez ignorer cette étape.' },
  { title: 'À quel risque climatique êtes-vous particulièrement sensible ?', subtitle: 'Les communes les moins exposées à ce risque seront privilégiées dans le classement.', required: true },
];

const TOTAL_STEPS = STEPS.length;

// ─── Answers & result ─────────────────────────────────────────────────────────

interface Answers {
  geoTags: GeoTag[];
  populationSizes: PopulationSize[];
  services: EquipmentFilterKey[];
  budget: number | null | undefined;
  bloc: PoliticalBloc | null;
  climatePriority: ClimateAnswer | null;
}

function buildResult(answers: Answers): QuestionnaireResult {
  let weights: ClimateWeights = { ...DEFAULT_CLIMATE_WEIGHTS };
  if (answers.climatePriority && answers.climatePriority !== 'balanced') {
    weights = { temperatures: 20, eau: 20, risques: 20, air: 20, sols: 50, [answers.climatePriority]: 100 };
  }

  const filters: SearchFilters = {};
  if (answers.geoTags.length > 0) filters.geoTags = answers.geoTags;
  if (answers.populationSizes.length > 0) filters.populationSizes = answers.populationSizes;
  if (answers.services.length > 0) filters.equipmentFilters = answers.services;
  if (answers.budget != null) filters.prixM2Max = answers.budget;
  if (answers.bloc) filters.bloc = answers.bloc;

  return { filters, weights };
}

// ─── Component ────────────────────────────────────────────────────────────────

const QuestionnairePage: React.FC<Props> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    geoTags: [],
    populationSizes: [],
    services: [],
    budget: undefined,
    bloc: null,
    climatePriority: null,
  });

  const isLast = step === TOTAL_STEPS - 1;
  const canProceed = isLast ? answers.climatePriority !== null : true;

  const handleNext = () => {
    if (!isLast) setStep(s => s + 1);
    else onComplete(buildResult(answers));
  };

  // Env step helpers
  const toggleEnvOption = (opt: EnvOption) => {
    if (opt.type === 'geo') {
      setAnswers(a => ({
        ...a,
        geoTags: a.geoTags.includes(opt.key) ? a.geoTags.filter(t => t !== opt.key) : [...a.geoTags, opt.key],
      }));
    } else {
      const allSelected = opt.keys.every(k => answers.populationSizes.includes(k));
      setAnswers(a => ({
        ...a,
        populationSizes: allSelected
          ? a.populationSizes.filter(s => !opt.keys.includes(s))
          : [...a.populationSizes.filter(s => !opt.keys.includes(s)), ...opt.keys],
      }));
    }
  };

  const isEnvOptionSelected = (opt: EnvOption) =>
    opt.type === 'geo' ? answers.geoTags.includes(opt.key) : opt.keys.every(k => answers.populationSizes.includes(k));

  const toggleService = (key: EquipmentFilterKey) =>
    setAnswers(a => ({ ...a, services: a.services.includes(key) ? a.services.filter(k => k !== key) : [...a.services, key] }));

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ─── Top bar ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800">Où Atterrir</span>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          Explorer sans critères
        </button>
      </div>

      {/* ─── Progress ─── */}
      <div className="px-6 pt-4 pb-0 flex-shrink-0">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Étape {step + 1} / {TOTAL_STEPS}
            </span>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-indigo-600 w-6' : i === step ? 'bg-indigo-600 w-8' : 'bg-slate-200 w-4'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Scrollable content ─── */}
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
            {STEPS[step].title}
          </h1>
          <p className="text-sm text-slate-500 mb-8">{STEPS[step].subtitle}</p>

          {/* Step 0 — Environment */}
          {step === 0 && (
            <div className="space-y-3">
              {ENV_OPTIONS.map((opt, i) => {
                const active = isEnvOptionSelected(opt);
                return (
                  <button
                    key={i}
                    onClick={() => toggleEnvOption(opt)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                      active ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 p-2.5 rounded-xl ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      {opt.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                    </div>
                    {active && <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 1 — Services */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {SERVICES_OPTIONS.map(opt => {
                const active = answers.services.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleService(opt.key)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                      active ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 p-2 rounded-xl ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      {opt.icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 leading-tight flex-grow">{opt.label}</span>
                    {active && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2 — Budget */}
          {step === 2 && (
            <div className="space-y-3">
              {BUDGET_OPTIONS.map(opt => {
                const active = answers.budget === opt.key;
                return (
                  <button
                    key={String(opt.key)}
                    onClick={() => setAnswers(a => ({ ...a, budget: opt.key }))}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                      active ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                    </div>
                    {active && <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3 — Political */}
          {step === 3 && (
            <div className="space-y-3">
              {BLOC_OPTIONS.map(opt => {
                const active = answers.bloc === opt.value;
                const color = BLOC_COLORS[opt.value];
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers(a => ({ ...a, bloc: active ? null : opt.value }))}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                      !active ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50' : ''
                    }`}
                    style={active ? { borderColor: color, backgroundColor: `${color}12` } : undefined}
                  >
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="flex-grow text-sm font-semibold text-slate-800">{opt.label}</span>
                    {active && <Check className="w-5 h-5 flex-shrink-0" style={{ color }} />}
                  </button>
                );
              })}
              {answers.bloc && (
                <button
                  onClick={() => setAnswers(a => ({ ...a, bloc: null }))}
                  className="w-full px-5 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
                >
                  Effacer la sélection
                </button>
              )}
            </div>
          )}

          {/* Step 4 — Climate (LAST) */}
          {step === 4 && (
            <div className="space-y-3">
              {CLIMATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setAnswers(a => ({ ...a, climatePriority: opt.key }))}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                    answers.climatePriority === opt.key ? opt.color : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex-shrink-0 p-2.5 rounded-xl ${answers.climatePriority === opt.key ? '' : 'bg-slate-100 text-slate-500'}`}>
                    {opt.icon}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                  </div>
                  {answers.climatePriority === opt.key && <Check className="w-5 h-5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ─── Sticky navigation ─── */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onSkip()}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Passer' : 'Retour'}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
          >
            {isLast ? 'Voir mes résultats' : 'Suivant'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Skip step link for optional steps */}
        {!isLast && step > 0 && (
          <div className="max-w-xl mx-auto mt-2 text-center">
            <button
              onClick={handleNext}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Ignorer cette étape
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default QuestionnairePage;
