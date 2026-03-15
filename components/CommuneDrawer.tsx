import React, { useEffect, useState } from 'react';
import { Commune, ElectionType, EquipmentDetail, EquipmentDomain, RiskDetail, RiskLevel, DvfData, AirQuality, ClimatData, ClimatProjection } from '../types';
import { getCommuneByInsee, getEquipmentDetails, getCommuneRisks, getDvfStats, getCommuneAirQuality, AirQualityData, getCommuneClimat } from '../services/communeService';
import { BLOC_COLORS, EQUIPMENT_DOMAINS, RISK_LEVELS, AIR_QUALITY_LEVELS, CLIMAT_INDICATORS, HEAT_WAVE_LEVELS } from '../constants';
import StabilityBadge from './StabilityBadge';
import DvfChart from './DvfChart';
import {
  X, ShoppingBag, GraduationCap, Heart, Train, Dumbbell,
  AlertTriangle, Wind, Leaf, Store, Scale, Euro, Thermometer, Flame,
  MapPin, Users,
} from 'lucide-react';

interface Props {
  commune: Commune;
  onClose: () => void;
  climateActive?: boolean;
}

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
    <div className="space-y-4">{children}</div>
  </div>
);

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
// Climate projections section
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

const ClimatSection: React.FC<{ data: ClimatData }> = ({ data }) => {
  const hwLevel = data.s3.y2050 != null
    ? data.s3.y2050 < 5 ? 'faible' : data.s3.y2050 < 15 ? 'modere' : data.s3.y2050 < 30 ? 'eleve' : 'tres_eleve'
    : null;
  const hwConfig = hwLevel ? HEAT_WAVE_LEVELS[hwLevel as keyof typeof HEAT_WAVE_LEVELS] : null;

  const projMap: Record<string, ClimatProjection> = {
    s3: data.s3, s1: data.s1, s2: data.s2, s4: data.s4,
    r2: data.r2, r4: data.r4, r5Ete: data.r5Ete, g4Ete: data.g4Ete,
  };

  return (
    <CategoryBlock title="Projections climatiques" icon={Thermometer}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vagues de chaleur (2050)</span>
        {hwConfig && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${hwConfig.color}`}>
            <Flame className="w-2.5 h-2.5" />
            {hwConfig.label}
          </span>
        )}
      </div>

      {data.icu != null && (
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 mb-2">
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

      <div className="space-y-4">
        {CLIMAT_INDICATORS.map(({ key, label, unit }) => (
          <ClimatRow key={key} label={label} unit={unit} proj={projMap[key]} />
        ))}
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        Source : Climadiag Commune, Météo-France · Scénario TRACC · Réf. 1976-2005
      </p>
    </CategoryBlock>
  );
};

const CommuneDrawer: React.FC<Props> = ({ commune, onClose, climateActive }) => {
  const [fullCommune, setFullCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(true);
  const [eqDetails, setEqDetails] = useState<EquipmentDetail[]>([]);
  const [risks, setRisks] = useState<RiskDetail[]>([]);
  const [dvfData, setDvfData] = useState<DvfData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [climatData, setClimatData] = useState<ClimatData | null>(null);

  useEffect(() => {
    setLoading(true);
    setFullCommune(null);
    setEqDetails([]);
    setRisks([]);
    setDvfData(null);
    setAirQuality(null);
    setClimatData(null);
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

  const groupedByType = ELECTION_TYPE_ORDER
    .map(type => ({
      type,
      label: ELECTION_TYPE_LABELS[type],
      elections: displayCommune.history
        .filter(e => e.electionType === type)
        .sort((a, b) => b.year - a.year),
    }))
    .filter(g => g.elections.length > 0);

  const riskLevel: RiskLevel = risks.length >= 5 ? 'tres_expose' : risks.length >= 2 ? 'modere' : 'peu_expose';
  const riskConfig = RISK_LEVELS[riskLevel];

  const aqLevel = airQuality?.airQualityLevel as AirQuality | undefined;
  const aqConfig = aqLevel ? AIR_QUALITY_LEVELS[aqLevel] : null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[540px] md:inset-0 md:w-auto bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header bar with commune identity */}
        <div className="flex items-center justify-between px-6 md:px-10 py-3 border-b border-slate-100 flex-shrink-0 gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap">{displayCommune.name}</h2>
            <div className="flex items-center gap-3 text-slate-400 text-sm whitespace-nowrap">
              <span className="inline-flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {displayCommune.zipcode} — {displayCommune.department}
              </span>
              {displayCommune.population != null && (
                <span className="inline-flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {displayCommune.population.toLocaleString('fr-FR')} hab.
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-grow overflow-y-auto md:overflow-hidden px-6 py-5 md:px-10 md:flex md:flex-col">

          {loading ? (
            <div className="flex flex-col items-center py-16 md:flex-1">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Chargement des données...</p>
            </div>
          ) : (
            <div className="md:grid md:grid-cols-3 md:gap-8 md:min-h-0 md:flex-1 md:overflow-hidden">
              {/* Column 1: Climat */}
              <div className="md:overflow-y-auto md:pr-4">
                <CategoryBlock title="Environnement et risques" icon={Leaf}>
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

                  {airQuality && aqConfig && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualité de l'air</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${aqConfig.color}`}>
                          <Wind className="w-2.5 h-2.5" />
                          {aqConfig.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-800">{airQuality.pm25Concentration.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">µg/m³ PM2.5 (moyenne annuelle)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Source : Agence européenne pour l'environnement (2024)</p>
                    </div>
                  )}
                </CategoryBlock>

                {climateActive && climatData && <ClimatSection data={climatData} />}
                {!climateActive && (
                  <div className="py-4 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                      Activez les données climatiques pour voir les projections.
                    </p>
                  </div>
                )}
              </div>

              {/* Column 2: Services + Immobilier */}
              <div className="md:overflow-y-auto md:border-x md:border-slate-100 md:px-4">
                {eqDetails.length > 0 && (
                  <CategoryBlock title="Services et équipements" icon={Store}>
                    <EquipmentDetailsList details={eqDetails} />
                  </CategoryBlock>
                )}

                <CategoryBlock title="Immobilier" icon={Euro} isLast>
                  {dvfData ? (
                    <DvfChart dvfData={dvfData} inline />
                  ) : (
                    <p className="text-xs text-slate-400">Données immobilières indisponibles pour cette commune.</p>
                  )}
                </CategoryBlock>
              </div>

              {/* Column 3: Politique */}
              <div className="md:overflow-y-auto md:pl-4">
                <CategoryBlock title="Politique" icon={Scale} isLast>
                  <div className="flex items-center justify-between mb-1">
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
                </CategoryBlock>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CommuneDrawer;
