import React, { useEffect, useState } from 'react';
import { Commune, ElectionType, EquipmentSummary, EquipmentDomain, RiskDetail, RiskLevel, DvfData, AirQuality } from '../types';
import { getCommuneByInsee, getEquipmentSummary, getCommuneRisks, getDvfStats, getCommuneAirQuality, AirQualityData } from '../services/communeService';
import { BLOC_COLORS, EQUIPMENT_DOMAINS, RISK_LEVELS, AIR_QUALITY_LEVELS } from '../constants';
import CommuneCard from './CommuneCard';
import DvfChart from './DvfChart';
import {
  X, ShoppingBag, GraduationCap, Heart, Train, Dumbbell,
  AlertTriangle, Wind, Leaf, Store, Scale, Euro,
} from 'lucide-react';

interface Props {
  commune: Commune;
  onClose: () => void;
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

const CommuneDrawer: React.FC<Props> = ({ commune, onClose }) => {
  const [fullCommune, setFullCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<EquipmentSummary[]>([]);
  const [risks, setRisks] = useState<RiskDetail[]>([]);
  const [dvfData, setDvfData] = useState<DvfData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);

  useEffect(() => {
    setLoading(true);
    setFullCommune(null);
    setEquipments([]);
    setRisks([]);
    setDvfData(null);
    setAirQuality(null);
    Promise.all([
      getCommuneByInsee(commune.insee),
      getEquipmentSummary(commune.insee),
      getCommuneRisks(commune.insee),
      getDvfStats(commune.insee),
      getCommuneAirQuality(commune.insee),
    ]).then(([data, eqs, rks, dvf, aq]) => {
      setFullCommune(data ?? commune);
      setEquipments(eqs);
      setRisks(rks);
      setDvfData(dvf);
      setAirQuality(aq);
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

      <div className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[540px] lg:w-[600px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Détail commune</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-grow overflow-y-auto px-6 py-5">

          {/* Commune identity header */}
          <div className="pb-6 mb-6 border-b border-slate-200">
            <CommuneCard commune={displayCommune} />
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Chargement des données...</p>
            </div>
          ) : (
            <>
              {/* 1. Environnement et risques */}
              <CategoryBlock title="Environnement et risques" icon={Leaf}>
                {/* Risks */}
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

                {/* Air quality */}
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

              {/* 2. Services et équipements */}
              {equipments.length > 0 && (
                <CategoryBlock title="Services et équipements" icon={Store}>
                  <div className="grid grid-cols-2 gap-2">
                    {equipments.map(eq => {
                      const Icon = DOMAIN_ICONS[eq.domain];
                      return (
                        <div key={eq.domain} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                          <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{EQUIPMENT_DOMAINS[eq.domain]?.label ?? eq.domainLabel}</p>
                            <p className="text-[10px] text-slate-400">{eq.totalCount} équipement{eq.totalCount > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CategoryBlock>
              )}

              {/* 3. Politique */}
              <CategoryBlock title="Politique" icon={Scale}>
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

              {/* 4. Immobilier */}
              <CategoryBlock title="Immobilier" icon={Euro} isLast>
                {dvfData ? (
                  <DvfChart dvfData={dvfData} inline />
                ) : (
                  <p className="text-xs text-slate-400">Données immobilières indisponibles pour cette commune.</p>
                )}
              </CategoryBlock>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CommuneDrawer;
