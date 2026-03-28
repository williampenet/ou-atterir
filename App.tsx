import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SlidersHorizontal, X, Scale, Menu } from 'lucide-react';
import { searchCommunesClimateInBounds, computeWeightedScore } from './services/communeService';
import { Commune, IdealResult, PaginatedResults, SearchFilters, ClimateWeights } from './types';
import { DEFAULT_CLIMATE_WEIGHTS } from './constants';
import FilterSheet from './components/FilterSheet';
import ResultsList from './components/ResultsList';
import CommuneDrawer from './components/CommuneDrawer';
import CompareView from './components/CompareView';
import ClimateWeighting from './components/ClimateWeighting';
import OnboardingModal from './components/OnboardingModal';
import QuickFiltersBar from './components/QuickFiltersBar';
import CommuneSearchBar from './components/CommuneSearchBar';

type AppPage = 'explorer' | 'about';
const PAGE_SIZE = 30;

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<AppPage>('explorer');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [allResults, setAllResults] = useState<IdealResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareList, setCompareList] = useState<Commune[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ─── Climate weighting (climate is always active) ───
  const [climateWeights, setClimateWeights] = useState<ClimateWeights>(DEFAULT_CLIMATE_WEIGHTS);
  const [weightingPanelOpen, setWeightingPanelOpen] = useState(false);

  // ─── Onboarding modal (first visit only) ───
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('hasSeenOnboarding') !== 'true'
  );

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  }, []);

  const searchIdRef = useRef(0);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    setPage(1);

    const id = ++searchIdRef.current;
    setLoading(true);

    searchCommunesClimateInBounds(filters, null).then(({ results, total }) => {
      if (id !== searchIdRef.current) return;
      setAllResults(results);
      setTotalCount(total);
      setLoading(false);
    }).catch(() => {
      if (id !== searchIdRef.current) return;
      setAllResults([]);
      setTotalCount(0);
      setLoading(false);
    });
  }, [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sort client-side when weights change (instant, no server call)
  const sortedResults = useMemo(() => {
    return [...allResults].sort((a, b) => {
      const sa = a.climateScores ? computeWeightedScore(a.climateScores, climateWeights) : 50;
      const sb = b.climateScores ? computeWeightedScore(b.climateScores, climateWeights) : 50;
      return sa - sb;
    });
  }, [allResults, climateWeights]);

  const paginatedResults: PaginatedResults<IdealResult> = useMemo(() => ({
    data: sortedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: totalCount,
    page,
    pageSize: PAGE_SIZE,
    hasMore: page * PAGE_SIZE < sortedResults.length,
  }), [sortedResults, page, totalCount]);

  const handlePageChange = (p: number) => setPage(p);

  const removeFromCompare = (insee: string) => {
    setCompareList(prev => prev.filter(c => c.insee !== insee));
  };

  const toggleCompare = (commune: Commune) => {
    setCompareList(prev => {
      const exists = prev.some(c => c.insee === commune.insee);
      if (exists) return prev.filter(c => c.insee !== commune.insee);
      if (prev.length >= 2) return prev;
      return [...prev, commune];
    });
  };

  const activeFilterCount =
    [filters.department, filters.bloc, filters.matchLevel, filters.prixM2Max].filter(Boolean).length +
    (filters.equipmentFilters?.length ?? 0) +
    (filters.populationSizes?.length ?? 0) +
    (filters.geoTags?.length ?? 0) +
    (filters.travelFilter?.insees ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">

      {/* ─── Header ─── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 py-3 flex-shrink-0">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <svg className="text-white w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V17L12 22L21 17V7L12 2L3 7Z" />
                <path d="M12 12L21 7" />
                <path d="M12 12L3 7" />
                <path d="M12 12V22" />
              </svg>
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Ou Atterir
            </h1>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-1 self-stretch -mb-px">
            <button
              onClick={() => setActivePage('explorer')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activePage === 'explorer'
                  ? 'text-indigo-700 border-indigo-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => setActivePage('about')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activePage === 'about'
                  ? 'text-indigo-700 border-indigo-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              A propos
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─── Mobile menu overlay ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[80] sm:hidden">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl animate-slide-in-right">
            <div className="p-5">
              <button
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <nav className="mt-12 space-y-1">
                <MobileNavButton
                  active={activePage === 'explorer'}
                  onClick={() => { setActivePage('explorer'); setMobileMenuOpen(false); }}
                >
                  Explorer
                </MobileNavButton>
                <MobileNavButton
                  active={activePage === 'about'}
                  onClick={() => { setActivePage('about'); setMobileMenuOpen(false); }}
                >
                  A propos
                </MobileNavButton>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* ─── Page content ─── */}
      {activePage === 'explorer' ? (
        <main className="flex-grow overflow-y-auto">
          {/* Toolbar: quick filters + buttons */}
          <div className="sticky top-0 z-30 bg-slate-100">
            <div className="hidden sm:flex items-center max-w-4xl mx-auto w-full px-4 py-2 gap-2">
              <QuickFiltersBar filters={filters} onFiltersChange={setFilters} />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setWeightingPanelOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 active:scale-95 transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Pondération
                </button>
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  + Filtres
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile: compact filter buttons */}
            <div className="sm:hidden flex items-center justify-center gap-2 px-4 py-2">
              <button
                onClick={() => setWeightingPanelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Pondération
              </button>
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main content: search + results list */}
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 pb-20">
            {/* Search bar */}
            <CommuneSearchBar onSelectCommune={setSelectedCommune} />

            {/* Results */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-medium">Recherche en cours...</p>
              </div>
            ) : (
              <ResultsList
                results={paginatedResults}
                selectedInsee={selectedCommune?.insee}
                onSelectCommune={setSelectedCommune}
                onPageChange={handlePageChange}
                compareList={compareList}
                onToggleCompare={toggleCompare}
              />
            )}
          </div>
        </main>
      ) : (
        <AboutPage />
      )}

      {/* ─── Compare tray ─── */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto sm:rounded-2xl sm:border sm:shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Scale className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {compareList.map(c => (
                <span key={c.insee} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-700 max-w-[200px]">
                  <span className="truncate">{c.name} ({c.zipcode})</span>
                  <button
                    onClick={() => removeFromCompare(c.insee)}
                    className="p-0.5 rounded-full hover:bg-purple-200 text-purple-400 hover:text-purple-700 transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {compareList.length === 1 && (
                <span className="text-[11px] text-slate-400 italic">+ 1 commune</span>
              )}
            </div>
            {compareList.length === 2 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all flex-shrink-0"
              >
                Comparer
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Overlays ─── */}
      <FilterSheet
        filters={filters}
        onFiltersChange={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        resultCount={totalCount}
      />

      {selectedCommune && (
        <CommuneDrawer
          commune={selectedCommune}
          onClose={() => setSelectedCommune(null)}
        />
      )}

      <ClimateWeighting
        open={weightingPanelOpen}
        onClose={() => setWeightingPanelOpen(false)}
        weights={climateWeights}
        onWeightsChange={setClimateWeights}
      />

      {compareOpen && compareList.length === 2 && (
        <CompareView
          communes={compareList as [Commune, Commune]}
          onClose={() => setCompareOpen(false)}
        />
      )}

      <OnboardingModal open={showOnboarding} onClose={handleDismissOnboarding} />
    </div>
  );
};

/* ─── Mobile nav button ─── */

const MobileNavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    {children}
  </button>
);

/* ─── About Page ─── */

const AboutPage: React.FC = () => (
  <main className="flex-grow w-full bg-slate-50">
    {/* Hero */}
    <div className="bg-gradient-to-br from-indigo-700 to-indigo-500 text-white">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-3">À propos</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
          Où atterrir face au<br />dérèglement climatique ?
        </h2>
        <p className="text-indigo-100 text-lg leading-relaxed max-w-xl">
          Un outil d'exploration des communes françaises, pensé pour ceux qui se demandent
          où vivre à l'horizon 2030–2050.
        </p>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-6 py-12 space-y-14">

      {/* Mission */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">La mission</h3>
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            Le titre du projet s'inspire des travaux de Bruno Latour et Nikolaj Schultz,
            notamment du <em>Mémo sur la nouvelle classe écologique</em> (2022). Face à l'accélération
            du dérèglement climatique, la question du territoire où l'on vit — et où l'on pourra
            continuer à vivre — devient une question politique de premier plan.
          </p>
          <p>
            Où Atterrir propose un cadre de comparaison entre les 34 000+ communes françaises,
            en croisant leur vulnérabilité climatique à horizon 2050 avec des critères pratiques :
            équipements, prix de l'immobilier, géographie, tendance politique locale.
            L'objectif n'est pas de prescrire un choix, mais de rendre visible ce que les données
            permettent de savoir.
          </p>
        </div>
      </section>

      {/* Scoring climatique */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Le score d'exposition climatique</h3>
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            Chaque commune reçoit un score global d'exposition climatique entre 0 et 100,
            calculé comme la moyenne de quatre dimensions. Ce score est une <strong>rang percentile</strong> :
            une commune à 80 est plus exposée que 80 % des communes françaises.
            Plus le score est bas, moins la commune est exposée.
          </p>
          <p>
            Les projections utilisées sont celles de l'horizon <strong>2050</strong>, issu du scénario
            TRACC (Trajectoire de Réchauffement de Référence pour l'Adaptation au Changement Climatique),
            qui correspond à un réchauffement de +2,7 °C en France hexagonale par rapport
            à la période de référence 1976–2005. Chaque score est la médiane de 17 modèles climatiques.
          </p>
        </div>

        {/* Tableau des 4 dimensions */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Dimension</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Indicateurs composants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">🌡️ Températures</td>
                <td className="px-4 py-3 text-slate-500">Jours très chauds ≥ 35 °C (S1), nuits chaudes (S2), vagues de froid (S4), îlot de chaleur urbain (ICU)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">💧 Eau</td>
                <td className="px-4 py-3 text-slate-500">Sécheresse atmosphérique (S3), sol sec en été (R5), raréfaction des jours de pluie estivaux (G4 — inversé)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">⚠️ Risques</td>
                <td className="px-4 py-3 text-slate-500">Risque incendie de végétation (R4), précipitations extrêmes (R2), nombre de risques naturels répertoriés (GASPAR)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">💨 Air</td>
                <td className="px-4 py-3 text-slate-500">Concentration en PM2.5 (particules fines)</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">🌱 Sols</td>
                <td className="px-4 py-3 text-slate-400 italic">Données en cours d'intégration</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-500 leading-relaxed">
          Le bouton <strong>Pondération</strong> permet d'ajuster le poids de chaque dimension
          selon vos priorités personnelles. Le reclassement s'opère instantanément, sans nouvel
          appel au serveur.
        </p>
      </section>

      {/* Sources */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Sources de données</h3>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Données</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 text-slate-700 font-medium">Projections climatiques</td>
                <td className="px-4 py-3 text-slate-500">Climadiag Commune — Météo-France · Scénario TRACC · Réf. 1976–2005</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700 font-medium">Qualité de l'air (PM2.5)</td>
                <td className="px-4 py-3 text-slate-500">Agence européenne pour l'environnement (2024)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700 font-medium">Risques naturels</td>
                <td className="px-4 py-3 text-slate-500">Géorisques — BDPR/GASPAR, Ministère de la Transition écologique</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700 font-medium">Résultats électoraux</td>
                <td className="px-4 py-3 text-slate-500">Ministère de l'Intérieur — élections municipales</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700 font-medium">Équipements et services</td>
                <td className="px-4 py-3 text-slate-500">Base Permanente des Équipements (BPE) — INSEE</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700 font-medium">Prix de l'immobilier</td>
                <td className="px-4 py-3 text-slate-500">Demandes de Valeurs Foncières (DVF) — DGFiP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Limites */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Précautions d'usage</h3>
        <ul className="space-y-3 text-slate-600 leading-relaxed">
          <li className="flex gap-3">
            <span className="text-slate-300 mt-0.5 flex-shrink-0">—</span>
            <span>Les scores climatiques sont des <strong>rangs relatifs</strong> entre communes françaises,
            pas des mesures absolues de danger. Une commune à 65/100 n'est pas « dangereuse » :
            elle est plus exposée que la médiane nationale.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-slate-300 mt-0.5 flex-shrink-0">—</span>
            <span>Les projections 2050 sont des <strong>médianes de 17 modèles climatiques</strong>.
            Elles représentent le résultat le plus probable, pas une certitude. L'incertitude
            s'accroît à mesure qu'on s'éloigne de l'horizon de référence.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-slate-300 mt-0.5 flex-shrink-0">—</span>
            <span>Les données sont agrégées à l'<strong>échelle communale</strong>. Des disparités
            importantes peuvent exister au sein d'une même commune (vallée vs. plateau,
            centre-ville vs. périphérie).</span>
          </li>
          <li className="flex gap-3">
            <span className="text-slate-300 mt-0.5 flex-shrink-0">—</span>
            <span>La dimension <strong>Sols</strong> (pollution, retrait-gonflement des argiles) n'est
            pas encore intégrée dans le score global. Elle sera ajoutée dans une version ultérieure.</span>
          </li>
        </ul>
      </section>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 text-xs text-slate-400 leading-relaxed">
        Où Atterrir est un projet indépendant et non commercial. Les données utilisées sont
        publiques et librement accessibles. Si vous identifiez une erreur ou souhaitez
        contribuer, n'hésitez pas à nous contacter.
      </div>

    </div>
  </main>
);

export default App;
