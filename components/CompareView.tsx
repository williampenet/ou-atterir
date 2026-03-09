import React, { useEffect, useState } from 'react';
import { Commune, EquipmentSummary, EquipmentDomain, RiskDetail, RiskLevel, DvfData, DvfYearStat } from '../types';
import { getCommuneByInsee, getEquipmentSummary, getCommuneRisks, getDvfStats } from '../services/communeService';
import { EQUIPMENT_DOMAINS, RISK_LEVELS, MARKET_TENSION_LEVELS } from '../constants';
import { X, MapPin, Users, AlertTriangle, ShoppingBag, GraduationCap, Heart, Train, Dumbbell, Home, Building2, BarChart3 } from 'lucide-react';

interface Props {
  communes: [Commune, Commune];
  onClose: () => void;
}

interface CommuneFullData {
  commune: Commune;
  equipments: EquipmentSummary[];
  risks: RiskDetail[];
  dvf: DvfData | null;
}

const DOMAIN_ICONS: Record<EquipmentDomain, React.FC<{ className?: string }>> = {
  B: ShoppingBag, C: GraduationCap, D: Heart, E: Train, F: Dumbbell,
};

const ALL_DOMAINS: EquipmentDomain[] = ['B', 'C', 'D', 'E', 'F'];

const formatPrice = (v: number | null): string => {
  if (v == null) return '—';
  return v.toLocaleString('fr-FR') + ' €';
};

const getRiskLevel = (count: number): RiskLevel =>
  count >= 5 ? 'tres_expose' : count >= 2 ? 'modere' : 'peu_expose';

const getLatestPrice = (stats: DvfYearStat[], type: 'maison' | 'appartement'): number | null => {
  const filtered = stats.filter(s => s.typeLocal === type && s.prixM2Median != null);
  if (filtered.length === 0) return null;
  const latest = filtered.reduce((a, b) => (a.year > b.year ? a : b));
  return latest.prixM2Median;
};

const CompareView: React.FC<Props> = ({ communes, onClose }) => {
  const [data, setData] = useState<[CommuneFullData | null, CommuneFullData | null]>([null, null]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    const fetchOne = async (c: Commune): Promise<CommuneFullData> => {
      const [full, eqs, rks, dvf] = await Promise.all([
        getCommuneByInsee(c.insee),
        getEquipmentSummary(c.insee),
        getCommuneRisks(c.insee),
        getDvfStats(c.insee),
      ]);
      return { commune: full ?? c, equipments: eqs, risks: rks, dvf };
    };

    Promise.all([fetchOne(communes[0]), fetchOne(communes[1])]).then(([a, b]) => {
      setData([a, b]);
      setLoading(false);
    });
  }, [communes[0].insee, communes[1].insee]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [a, b] = data;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex flex-col bg-white sm:inset-4 sm:rounded-2xl sm:shadow-2xl sm:m-auto sm:max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Comparaison</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex border-b border-slate-100">
          {communes.map((c, i) => (
            <button
              key={c.insee}
              onClick={() => setActiveTab(i)}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === i
                  ? 'text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {c.name} ({c.zipcode})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-sm font-medium">Chargement des données...</p>
            </div>
          ) : a && b ? (
            <div className="p-5 space-y-6">
              <HeaderSection a={a} b={b} activeTab={activeTab} />
              <RisksSection a={a} b={b} activeTab={activeTab} />
              <DvfSection a={a} b={b} activeTab={activeTab} />
              <EquipmentsSection a={a} b={b} activeTab={activeTab} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{children}</h4>
);

const HighlightValue: React.FC<{ value: number | null; otherValue: number | null; lowerIsBetter?: boolean; children: React.ReactNode }> = ({
  value, otherValue, lowerIsBetter = false, children,
}) => {
  if (value == null || otherValue == null) return <>{children}</>;
  const isBetter = lowerIsBetter ? value < otherValue : value > otherValue;
  return <span className={isBetter ? 'text-emerald-600 font-bold' : ''}>{children}</span>;
};

/* ─── Header ─── */
const HeaderSection: React.FC<{ a: CommuneFullData; b: CommuneFullData; activeTab: number }> = ({ a, b, activeTab }) => {
  const renderColumn = (d: CommuneFullData) => (
    <div className="flex-1 min-w-0">
      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">{d.commune.name}</h2>
      <div className="flex items-center gap-3 text-slate-400 text-xs">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {d.commune.zipcode} — {d.commune.department}
        </span>
        {d.commune.population != null && (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Users className="w-3 h-3" />
            <HighlightValue value={d.commune.population} otherValue={d === a ? b.commune.population ?? null : a.commune.population ?? null}>
              {d.commune.population.toLocaleString('fr-FR')} hab.
            </HighlightValue>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="hidden sm:flex gap-6">
        {renderColumn(a)}
        <div className="w-px bg-slate-200 self-stretch" />
        {renderColumn(b)}
      </div>
      <div className="sm:hidden">
        {renderColumn(activeTab === 0 ? a : b)}
      </div>
    </div>
  );
};

/* ─── Risks ─── */
const RisksSection: React.FC<{ a: CommuneFullData; b: CommuneFullData; activeTab: number }> = ({ a, b, activeTab }) => {
  const renderColumn = (d: CommuneFullData, other: CommuneFullData) => {
    const level = getRiskLevel(d.risks.length);
    const config = RISK_LEVELS[level];
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <HighlightValue value={d.risks.length} otherValue={other.risks.length} lowerIsBetter>
            <span className="text-sm font-bold text-slate-700">{d.risks.length} risque{d.risks.length !== 1 ? 's' : ''}</span>
          </HighlightValue>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.color}`}>
            <AlertTriangle className="w-2.5 h-2.5" />
            {config.label}
          </span>
        </div>
        {d.risks.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {d.risks.map(r => (
              <span key={r.numRisque} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                {r.libelleRisque}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Aucun risque répertorié.</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <SectionTitle>Risques répertoriés</SectionTitle>
      <div className="hidden sm:flex gap-6">
        {renderColumn(a, b)}
        <div className="w-px bg-slate-200 self-stretch" />
        {renderColumn(b, a)}
      </div>
      <div className="sm:hidden">
        {renderColumn(activeTab === 0 ? a : b, activeTab === 0 ? b : a)}
      </div>
    </div>
  );
};

/* ─── DVF / Immobilier ─── */
const DvfSection: React.FC<{ a: CommuneFullData; b: CommuneFullData; activeTab: number }> = ({ a, b, activeTab }) => {
  const aPrixMaison = a.dvf ? getLatestPrice(a.dvf.stats, 'maison') : null;
  const bPrixMaison = b.dvf ? getLatestPrice(b.dvf.stats, 'maison') : null;
  const aPrixAppart = a.dvf ? getLatestPrice(a.dvf.stats, 'appartement') : null;
  const bPrixAppart = b.dvf ? getLatestPrice(b.dvf.stats, 'appartement') : null;

  const renderColumn = (d: CommuneFullData, otherMaison: number | null, otherAppart: number | null) => {
    if (!d.dvf || d.dvf.stats.length === 0) {
      return (
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400">Données indisponibles.</p>
        </div>
      );
    }

    const prixMaison = getLatestPrice(d.dvf.stats, 'maison');
    const prixAppart = getLatestPrice(d.dvf.stats, 'appartement');

    return (
      <div className="flex-1 min-w-0 space-y-2">
        {d.dvf.tension && (
          <div className="flex justify-end">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${MARKET_TENSION_LEVELS[d.dvf.tension].color}`}>
              <BarChart3 className="w-2.5 h-2.5" />
              {MARKET_TENSION_LEVELS[d.dvf.tension].label}
            </span>
          </div>
        )}
        {prixMaison != null && (
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
            <Home className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Maisons</p>
              <p className="text-sm font-bold text-slate-700">
                <HighlightValue value={prixMaison} otherValue={otherMaison} lowerIsBetter>
                  {formatPrice(prixMaison)}/m²
                </HighlightValue>
              </p>
            </div>
          </div>
        )}
        {prixAppart != null && (
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
            <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Appartements</p>
              <p className="text-sm font-bold text-slate-700">
                <HighlightValue value={prixAppart} otherValue={otherAppart} lowerIsBetter>
                  {formatPrice(prixAppart)}/m²
                </HighlightValue>
              </p>
            </div>
          </div>
        )}
        <p className="text-[10px] text-slate-400">
          {d.dvf.transactionsDerniereAnnee > 0
            ? `${d.dvf.transactionsDerniereAnnee} transaction${d.dvf.transactionsDerniereAnnee > 1 ? 's' : ''} / dernière année`
            : 'Aucune transaction récente'}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <SectionTitle>Marché immobilier</SectionTitle>
      <div className="hidden sm:flex gap-6">
        {renderColumn(a, bPrixMaison, bPrixAppart)}
        <div className="w-px bg-slate-200 self-stretch" />
        {renderColumn(b, aPrixMaison, aPrixAppart)}
      </div>
      <div className="sm:hidden">
        {activeTab === 0
          ? renderColumn(a, bPrixMaison, bPrixAppart)
          : renderColumn(b, aPrixMaison, aPrixAppart)}
      </div>
    </div>
  );
};

/* ─── Equipments ─── */
const EquipmentsSection: React.FC<{ a: CommuneFullData; b: CommuneFullData; activeTab: number }> = ({ a, b, activeTab }) => {
  const getCount = (eqs: EquipmentSummary[], domain: EquipmentDomain): number => {
    const found = eqs.find(e => e.domain === domain);
    return found?.totalCount ?? 0;
  };

  const renderDesktop = () => (
    <div className="space-y-2">
      {ALL_DOMAINS.map(domain => {
        const Icon = DOMAIN_ICONS[domain];
        const label = EQUIPMENT_DOMAINS[domain]?.label ?? domain;
        const countA = getCount(a.equipments, domain);
        const countB = getCount(b.equipments, domain);
        const maxCount = Math.max(countA, countB, 1);

        return (
          <div key={domain} className="flex items-center gap-3">
            <div className="w-28 flex items-center gap-2 flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-slate-600 truncate">{label}</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <span className={`text-xs font-bold w-8 text-right ${countA > countB ? 'text-emerald-600' : countA === countB ? 'text-slate-600' : 'text-slate-400'}`}>
                {countA}
              </span>
              <div className="flex-1 flex h-4 gap-0.5">
                <div className="flex-1 flex justify-end">
                  <div
                    className={`h-full rounded-l-full ${countA >= countB ? 'bg-indigo-400' : 'bg-indigo-200'}`}
                    style={{ width: `${(countA / maxCount) * 100}%` }}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className={`h-full rounded-r-full ${countB >= countA ? 'bg-purple-400' : 'bg-purple-200'}`}
                    style={{ width: `${(countB / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-bold w-8 ${countB > countA ? 'text-emerald-600' : countB === countA ? 'text-slate-600' : 'text-slate-400'}`}>
                {countB}
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-indigo-500 font-semibold">{a.commune.name} ({a.commune.zipcode})</span>
        <span className="text-[10px] text-purple-500 font-semibold">{b.commune.name} ({b.commune.zipcode})</span>
      </div>
    </div>
  );

  const renderMobileColumn = (d: CommuneFullData, other: CommuneFullData) => (
    <div className="grid grid-cols-2 gap-2">
      {ALL_DOMAINS.map(domain => {
        const Icon = DOMAIN_ICONS[domain];
        const label = EQUIPMENT_DOMAINS[domain]?.label ?? domain;
        const count = getCount(d.equipments, domain);
        const otherCount = getCount(other.equipments, domain);
        return (
          <div key={domain} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
            <Icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
              <p className="text-[10px] text-slate-400">
                <HighlightValue value={count} otherValue={otherCount}>
                  {count} équipement{count > 1 ? 's' : ''}
                </HighlightValue>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <SectionTitle>Équipements & services</SectionTitle>
      <div className="hidden sm:block">{renderDesktop()}</div>
      <div className="sm:hidden">
        {renderMobileColumn(activeTab === 0 ? a : b, activeTab === 0 ? b : a)}
      </div>
    </div>
  );
};

export default CompareView;
