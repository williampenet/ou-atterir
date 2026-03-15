import React, { useEffect, useState } from 'react';
import { Commune, ElectionType, EquipmentDetail, EquipmentDomain, RiskDetail, RiskLevel, DvfData, AirQuality, ClimatData, ClimatProjection } from '../types';
import { getCommuneByInsee, getEquipmentDetails, getCommuneRisks, getDvfStats, getCommuneAirQuality, AirQualityData, getCommuneClimat } from '../services/communeService';
import { BLOC_COLORS, EQUIPMENT_DOMAINS, RISK_LEVELS, AIR_QUALITY_LEVELS, CLIMAT_INDICATORS, HEAT_WAVE_LEVELS } from '../constants';
import StabilityBadge from './StabilityBadge';
import DvfChart from './DvfChart';
import {
  X, ShoppingBag, GraduationCap, Heart, Train, Dumbbell,
  AlertTriangle, Wind, Store, Scale, Euro, Thermometer, Flame,
  MapPin, Users, Droplets, Sprout,
} from 'lucide-react';

interface Props {
  commune: Commune;
  onClose: () => void;
}

// --------------------------------------------------
// Tab types
// --------------------------------------------------

type DrawerTab = 'climat' | 'services' | 'immobilier' | 'politique';

const TABS: { key: DrawerTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'climat', label: 'Climat', icon: Thermometer },
  { key: 'services', label: 'Services', icon: Store },
  { key: 'immobilier', label: 'Immobilier', icon: Euro },
  { key: 'politique', label: 'Politique', icon: Scale },
];

// --------------------------------------------------
// Shared helpers
// --------------------------------------------------

const DOMAIN_ICONS: Record<EquipmentDomain, React.FC<{ className?: string }>> = {
  B: ShoppingBag, C: GraduationCap, D: Heart,
  E: Train, F: Dumbbell,
};

const ELECTION_TYPE_LABELS: Record<ElectionType, string> = {
  municipales: 'Municipales',
  presidentielles: 'Présidentielles',
  legislatives: 'Législatives',
  europeennes: 'Européennes',
};

const ELECTION_TYPE_ORDER: ElectionType[] = ['municipales', 'presidentielles', 'legislatives', 'europeennes'];

const STOP_WORDS = new Set(['de', 'du', 'des', "d'", 'en', 'à', 'au', 'aux', 'et', 'pour', 'par', 'sans', 'sur', 'et/ou']);

const addPlural = (word: string): string => {
  const last = word[word.length - 1];
  if (last === 's' || last === 'x' || last === 'z') return word;
  return word + 's';
};

const pluralizeLabel = (label: string, count: number): string => {
  if (count <= 1) return label;
  const words = label.split(' ');
  words[0] = addPlural(words[0]);
  for (let i = 1; i < words.length; i++) {
    if (STOP_WORDS.has(words[i].toLowerCase())) break;
    words[i] = addPlural(words[i]);
  }
  return words.join(' ');
};

const DETAIL_THRESHOLD = 10;
const ALWAYS_DETAIL_DOMAINS: EquipmentDomain[] = ['C', 'F'];

const COLLAPSED_LABELS: Partial<Record<EquipmentDomain, string>> = {
  D: 'établissements ou services',
  F: 'équipements',
};

// --------------------------------------------------
// Climate card wrapper
// --------------------------------------------------

const ClimateCard: React.FC<{
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ title, icon: Icon, children, disabled }) => (
  <div className={`rounded-xl border p-4 mb-4 ${disabled ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

// --------------------------------------------------
// Section title (used for Services/Immo/Politique)
// --------------------------------------------------

const SectionBlock: React.FC<{
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
    <div className="space-y-4">{children}</div>
  </div>
);

// --------------------------------------------------
// Climate projection row
// --------------------------------------------------

function heatColor(ref: number | null, val: number | null): string {
  if (ref == null || val == null || ref === 0) return 'text-slate-800';
  const ratio = val / ref;
  if (ratio <= 1.2) return 'text-slate-800';
  if (ratio <= 2) return 'text-amber-600';
  if (ratio <= 5) return 'text-orange-600';
  return 'text-red-600';
}

const ClimatRow: React.FC<{ label: string; unit: string; proj: ClimatProjection }> = ({ label, unit, proj }) => {
  const hasData = proj.ref != null || proj.y2030 != null;
  if (!hasData) return null;
  const multiplier = proj.ref && proj.ref > 0 && proj.y2050
    ? Math.round((proj.y2050 / proj.ref) * 10) / 10
    : null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        {multiplier != null && multiplier > 1 && (
          <span className="text-[10px] font-bold text-orange-500">x{multiplier} en 2050</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        <div className="bg-slate-100 rounded-lg py-1.5 px-1">
          <div className="text-[10px] text-slate-400 mb-0.5">Réf.</div>
          <div className="text-sm font-bold text-slate-600">{proj.ref != null ? proj.ref.toFixed(1) : '–'}</div>
        </div>
        <div className="bg-slate-50 rounded-lg py-1.5 px-1">
          <div className="text-[10px] text-slate-400 mb-0.5">2030</div>
          <div className={`text-sm font-bold ${heatColor(proj.ref, proj.y2030)}`}>{proj.y2030 != null ? proj.y2030.toFixed(1) : '–'}</div>
        </div>
        <div className="bg-amber-50 rounded-lg py-1.5 px-1 border border-amber-100">
          <div className="text-[10px] text-amber-500 mb-0.5">2050</div>
          <div className={`text-sm font-bold ${heatColor(proj.ref, proj.y2050)}`}>{proj.y2050 != null ? proj.y2050.toFixed(1) : '–'}</div>
        </div>
        <div className="bg-red-50 rounded-lg py-1.5 px-1 border border-red-100">
          <div className="text-[10px] text-red-400 mb-0.5">2100</div>
          <div className={`text-sm font-bold ${heatColor(proj.ref, proj.y2100)}`}>{proj.y2100 != null ? proj.y2100.toFixed(1) : '–'}</div>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5 text-right">{unit}</div>
    </div>
  );
};

// --------------------------------------------------
// 5 Climate sub-sections
// --------------------------------------------------

const EMPTY_PROJ: ClimatProjection = { ref: null, y2030: null, y2050: null, y2100: null };

const TemperaturesSection: React.FC<{ data: ClimatData }> = ({ data }) => {
  const hwLevel = data.s3.y2050 != null
    ? data.s3.y2050 < 5 ? 'faible' : data.s3.y2050 < 15 ? 'modere' : data.s3.y2050 < 30 ? 'eleve' : 'tres_eleve'
    : null;
  const hwConfig = hwLevel ? HEAT_WAVE_LEVELS[hwLevel as keyof typeof HEAT_WAVE_LEVELS] : null;

  const projMap: Record<string, ClimatProjection> = {
    s1: data.s1, s2: data.s2, s4: data.s4,
  };

  return (
    <ClimateCard title="Températures extrêmes" icon={Thermometer}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Canicule (2050)</span>
        {hwConfig && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${hwConfig.color}`}>
            <Flame className="w-2.5 h-2.5" />
            {hwConfig.label}
          </span>
        )}
      </div>

      {data.icu != null && (
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <span className="text-xs text-slate-600">Îlot de chaleur urbain</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-sm ${i < data.icu! ? 'bg-orange-400' : 'bg-slate-200'}`}
              />
            ))}
            <span className="text-xs font-bold text-slate-700 ml-1">{data.icu}/6</span>
          </div>
        </div>
      )}

      {CLIMAT_INDICATORS.filter(i => i.family === 'temperatures').map(({ key, label, unit }) => (
        <ClimatRow key={key} label={label} unit={unit} proj={projMap[key] ?? EMPTY_PROJ} />
      ))}
    </ClimateCard>
  );
};

const EauSection: React.FC<{ data: ClimatData }> = ({ data }) => {
  const projMap: Record<string, ClimatProjection> = {
    s3: data.s3, r5Ete: data.r5Ete, g4Ete: data.g4Ete,
  };

  return (
    <ClimateCard title="Eau / stress hydrique" icon={Droplets}>
      {CLIMAT_INDICATORS.filter(i => i.family === 'eau').map(({ key, label, unit }) => (
        <ClimatRow key={key} label={label} unit={unit} proj={projMap[key] ?? EMPTY_PROJ} />
      ))}
    </ClimateCard>
  );
};

const RisquesSection: React.FC<{ data?: ClimatData | null; risks: RiskDetail[]; riskLevel: RiskLevel }> = ({ data, risks, riskLevel }) => {
  const riskConfig = RISK_LEVELS[riskLevel];
  const projMap: Record<string, ClimatProjection> = data
    ? { r4: data.r4, r2: data.r2 }
    : {};

  return (
    <ClimateCard title="Risques naturels et technologiques" icon={AlertTriangle}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risques répertoriés</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskConfig.color}`}>
            <AlertTriangle className="w-2.5 h-2.5" />
            {riskConfig.label}
          </span>
        </div>
        {risks.length === 0 ? (
          <p className="text-xs text-slate-400">Aucun risque répertorié pour cette commune.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {risks.map(r => (
              <span
                key={r.numRisque}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600"
              >
                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                {r.libelleRisque}
              </span>
            ))}
          </div>
        )}
      </div>

      {CLIMAT_INDICATORS.filter(i => i.family === 'risques').map(({ key, label, unit }) => (
        <ClimatRow key={key} label={label} unit={unit} proj={projMap[key] ?? EMPTY_PROJ} />
      ))}
    </ClimateCard>
  );
};

const AirSection: React.FC<{ airQuality: AirQualityData | null }> = ({ airQuality }) => {
  const aqLevel = airQuality?.airQualityLevel as AirQuality | undefined;
  const aqConfig = aqLevel ? AIR_QUALITY_LEVELS[aqLevel] : null;

  return (
    <ClimateCard title="Qualité de l'air" icon={Wind}>
      {airQuality && aqConfig ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Niveau</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${aqConfig.color}`}>
              <Wind className="w-2.5 h-2.5" />
              {aqConfig.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{airQuality.pm25Concentration.toFixed(1)}</span>
            <span className="text-xs text-slate-400">µg/m³ PM2.5 (moyenne annuelle)</span>
          </div>
          <p className="text-[10px] text-slate-400">Source : Agence européenne pour l'environnement (2024)</p>
        </>
      ) : (
        <p className="text-xs text-slate-400">Données de qualité de l'air indisponibles pour cette commune.</p>
      )}
    </ClimateCard>
  );
};

const SolsSection: React.FC = () => (
  <ClimateCard title="Sols" icon={Sprout} disabled>
    <p className="text-xs text-slate-400 italic">Données en cours d'intégration (pollution des sols, retrait-gonflement des argiles).</p>
  </ClimateCard>
);

// --------------------------------------------------
// Equipment details list
// --------------------------------------------------

const EquipmentDetailsList: React.FC<{ details: EquipmentDetail[] }> = ({ details }) => {
  const domains = (['B', 'C', 'D', 'E', 'F'] as EquipmentDomain[]).filter(d =>
    details.some(item => item.domain === d)
  );

  return (
    <div className="space-y-4">
      {domains.map(domain => {
        const items = details.filter(d => d.domain === domain);
        const Icon = DOMAIN_ICONS[domain];
        const domainLabel = EQUIPMENT_DOMAINS[domain]?.label ?? items[0]?.domainLabel ?? domain;
        const totalCount = items.reduce((sum, i) => sum + i.count, 0);
        const showDetail = ALWAYS_DETAIL_DOMAINS.includes(domain) || items.length <= DETAIL_THRESHOLD;

        return (
          <div key={domain}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700">{domainLabel}</span>
            </div>
            {showDetail ? (
              <div className="grid grid-cols-2 gap-1 pl-5.5">
                {items.map(item => (
                  <div key={item.label} className="flex items-baseline gap-1.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 tabular-nums">{item.count}</span>
                    <span className="truncate">{pluralizeLabel(item.label, item.count)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 pl-5.5">
                <span className="font-semibold text-slate-800">{totalCount}</span> {COLLAPSED_LABELS[domain] ?? domainLabel.toLowerCase()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --------------------------------------------------
// Main CommuneDrawer
// --------------------------------------------------

const CommuneDrawer: React.FC<Props> = ({ commune, onClose }) => {
  const [fullCommune, setFullCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(true);
  const [eqDetails, setEqDetails] = useState<EquipmentDetail[]>([]);
  const [risks, setRisks] = useState<RiskDetail[]>([]);
  const [dvfData, setDvfData] = useState<DvfData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [climatData, setClimatData] = useState<ClimatData | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>('climat');

  useEffect(() => {
    setLoading(true);
    setFullCommune(null);
    setEqDetails([]);
    setRisks([]);
    setDvfData(null);
    setAirQuality(null);
    setClimatData(null);
    setActiveTab('climat');
    Promise.all([
      getCommuneByInsee(commune.insee),
      getEquipmentDetails(commune.insee),
      getCommuneRisks(commune.insee),
      getDvfStats(commune.insee),
      getCommuneAirQuality(commune.insee),
      getCommuneClimat(commune.insee),
    ]).then(([data, eqs, rks, dvf, aq, clim]) => {
      setFullCommune(data ?? commune);
      setEqDetails(eqs);
      setRisks(rks);
      setDvfData(dvf);
      setAirQuality(aq);
      setClimatData(clim);
      setLoading(false);
    });
  }, [commune.insee]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const displayCommune = fullCommune ?? commune;
  const getBlocColor = (bloc: string) => BLOC_COLORS[bloc] || '#94a3b8';
  const riskLevel: RiskLevel = risks.length >= 5 ? 'tres_expose' : risks.length >= 2 ? 'modere' : 'peu_expose';

  const groupedByType = ELECTION_TYPE_ORDER
    .map(type => ({
      type,
      label: ELECTION_TYPE_LABELS[type],
      elections: displayCommune.history
        .filter(e => e.electionType === type)
        .sort((a, b) => b.year - a.year),
    }))
    .filter(g => g.elections.length > 0);

  // ─── Shared content blocks ───

  const climatContent = (
    <>
      {climatData && (
        <>
          <TemperaturesSection data={climatData} />
          <EauSection data={climatData} />
          <RisquesSection data={climatData} risks={risks} riskLevel={riskLevel} />
        </>
      )}
      {!climatData && (
        <RisquesSection risks={risks} riskLevel={riskLevel} />
      )}
      <AirSection airQuality={airQuality} />
      <SolsSection />
      <p className="text-[10px] text-slate-400 mt-1 mb-4">
        Source projections : Climadiag Commune, Météo-France · Scénario TRACC · Réf. 1976-2005
      </p>
    </>
  );

  const servicesContent = (
    <>
      {eqDetails.length > 0 ? (
        <EquipmentDetailsList details={eqDetails} />
      ) : (
        <p className="text-xs text-slate-400">Aucun équipement répertorié pour cette commune.</p>
      )}
    </>
  );

  const immobilierContent = (
    <>
      {dvfData ? (
        <DvfChart dvfData={dvfData} inline />
      ) : (
        <p className="text-xs text-slate-400">Données immobilières indisponibles pour cette commune.</p>
      )}
    </>
  );

  const politiqueContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stabilité politique</span>
        <StabilityBadge level={displayCommune.stability} compact />
      </div>

      {groupedByType.length > 0 ? (
        <div className="space-y-5">
          {groupedByType.map(({ type, label, elections }) => (
            <div key={type}>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</h4>
              <div className="space-y-2">
                {elections.map((election) => (
                  <div key={`${type}-${election.year}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-slate-700 w-12">{election.year}</span>
                      <div className="h-3 w-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: getBlocColor(election.winnerBloc) }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">
                          {election.winnerName} <span className="text-slate-400 font-normal">({election.winnerNuanceLabel})</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-slate-900">{election.score}%</span>
                      <span className="block text-[10px] text-slate-400">Part. {election.turnout}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Aucun historique électoral disponible.</p>
      )}
    </>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[540px] md:w-[720px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header bar */}
        <div className="flex items-center px-6 md:px-10 py-3 border-b border-slate-100 flex-shrink-0 gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">{displayCommune.name}</h2>
            <div className="flex items-center gap-3 text-slate-400 text-xs flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {displayCommune.zipcode} — {displayCommune.department}
              </span>
              {displayCommune.population != null && (
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  {displayCommune.population.toLocaleString('fr-FR')} hab.
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 self-start mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop: Tab bar */}
        <div className="hidden md:flex border-b border-slate-200 px-10 flex-shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 flex-1">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Chargement des données...</p>
          </div>
        ) : (
          <>
            {/* Desktop: Tab content */}
            <div className="hidden md:flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-10 py-5">
                <div className="max-w-2xl mx-auto">
                  {activeTab === 'climat' && climatContent}
                  {activeTab === 'services' && (
                    <SectionBlock title="Services et équipements" icon={Store} isLast>
                      {servicesContent}
                    </SectionBlock>
                  )}
                  {activeTab === 'immobilier' && (
                    <SectionBlock title="Immobilier" icon={Euro} isLast>
                      {immobilierContent}
                    </SectionBlock>
                  )}
                  {activeTab === 'politique' && (
                    <SectionBlock title="Politique" icon={Scale} isLast>
                      {politiqueContent}
                    </SectionBlock>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: Everything stacked */}
            <div className="md:hidden flex-1 overflow-y-auto px-6 py-5">
              {/* Climat sections */}
              {climatContent}

              {/* Services */}
              <SectionBlock title="Services et équipements" icon={Store}>
                {servicesContent}
              </SectionBlock>

              {/* Immobilier */}
              <SectionBlock title="Immobilier" icon={Euro}>
                {immobilierContent}
              </SectionBlock>

              {/* Politique */}
              <SectionBlock title="Politique" icon={Scale} isLast>
                {politiqueContent}
              </SectionBlock>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CommuneDrawer;
