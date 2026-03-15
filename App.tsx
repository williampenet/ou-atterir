import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SlidersHorizontal, X, Scale, Menu, Loader2, Compass } from 'lucide-react';
import { searchCommunesInBounds, searchCommunesClimateInBounds, resultToMapMarker, getCommuneByInsee, computeWeightedScore } from './services/communeService';
import { Commune, IdealResult, PaginatedResults, SearchFilters, MapBounds, ClimateWeights } from './types';
import { DEFAULT_CLIMATE_WEIGHTS } from './constants';
import FilterSheet from './components/FilterSheet';
import ResultsList from './components/ResultsList';
import CommuneDrawer from './components/CommuneDrawer';
import CompareView from './components/CompareView';
import MapComponent from './components/MapComponent';
import BottomSheet from './components/BottomSheet';
import ClimateWeighting from './components/ClimateWeighting';
import OnboardingModal from './components/OnboardingModal';
import QuickFiltersBar from './components/QuickFiltersBar';

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
  const [fitBoundsKey, setFitBoundsKey] = useState(0);

  // ─── Climate toggle state (bidirectional ON/OFF) ───
  const [climateActive, setClimateActive] = useState(() => localStorage.getItem('climateActive') === 'true');
  const [climateWeights, setClimateWeights] = useState<ClimateWeights>(DEFAULT_CLIMATE_WEIGHTS);
  const [weightingPanelOpen, setWeightingPanelOpen] = useState(false);

  const toggleClimate = useCallback(() => {
    setClimateActive(prev => {
      const next = !prev;
      localStorage.setItem('climateActive', String(next));
      return next;
    });
  }, []);

  // ─── Onboarding modal (first visit only) ───
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('hasSeenOnboarding') !== 'true'
  );

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  }, []);

  const filtersRef = useRef(filters);
  const climateActiveRef = useRef(climateActive);
  const searchIdRef = useRef(0);
  const skipNextBoundsSearch = useRef(false);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => { climateActiveRef.current = climateActive; }, [climateActive]);

  const doSearch = useCallback((f: SearchFilters, bounds: MapBounds | null, landed: boolean) => {
    return landed
      ? searchCommunesClimateInBounds(f, bounds)
      : searchCommunesInBounds(f, bounds);
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
    setPage(1);
    skipNextBoundsSearch.current = true;

    const id = ++searchIdRef.current;
    setLoading(true);

    doSearch(filters, null, climateActive).then(({ results, total }) => {
      if (id !== searchIdRef.current) return;
      setAllResults(results);
      setTotalCount(total);
      setLoading(false);
      setFitBoundsKey(k => k + 1);
    }).catch(() => {
      if (id !== searchIdRef.current) return;
      setAllResults([]);
      setTotalCount(0);
      setLoading(false);
    });
  }, [filtersKey, climateActive, doSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    if (skipNextBoundsSearch.current) {
      skipNextBoundsSearch.current = false;
      return;
    }

    setPage(1);
    const id = ++searchIdRef.current;
    setLoading(true);

    doSearch(filtersRef.current, bounds, climateActiveRef.current).then(({ results, total }) => {
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
  }, [doSearch]);

  // Re-sort client-side when weights change (instant, no server call)
  const sortedResults = useMemo(() => {
    if (!climateActive) return allResults;
    return [...allResults].sort((a, b) => {
      const sa = a.climateScores ? computeWeightedScore(a.climateScores, climateWeights) : 50;
      const sb = b.climateScores ? computeWeightedScore(b.climateScores, climateWeights) : 50;
      return sa - sb;
    });
  }, [allResults, climateActive, climateWeights]);

  const markers = useMemo(() => sortedResults.map(resultToMapMarker), [sortedResults]);

  const paginatedResults: PaginatedResults<IdealResult> = useMemo(() => ({
    data: sortedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: totalCount,
    page,
    pageSize: PAGE_SIZE,
    hasMore: page * PAGE_SIZE < sortedResults.length,
  }), [sortedResults, page, totalCount]);

  const handlePageChange = (p: number) => setPage(p);

  const handleMapOpenDrawer = async (insee: string) => {
    const commune = await getCommuneByInsee(insee);
    if (commune) setSelectedCommune(commune);
  };

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
            {climateActive && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                <Compass className="w-2.5 h-2.5" />
                Climat
              </span>
            )}
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
        <>
          {/* Desktop: quick filters bar */}
          <div className="hidden sm:flex items-center max-w-[1400px] mx-auto w-full px-4 py-2 bg-slate-100 gap-2">
            <QuickFiltersBar filters={filters} onFiltersChange={setFilters} climateActive={climateActive} onToggleClimate={toggleClimate} />
            <div className="flex items-center gap-2 flex-shrink-0">
              {climateActive && (
                <button
                  onClick={() => setWeightingPanelOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 active:scale-95 transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Pondération
                </button>
              )}
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

          {/* Desktop: list + map side by side */}
          <div className="hidden sm:flex overflow-hidden" style={{ height: 'calc(100vh - 97px)' }}>
            {/* List panel */}
            <div className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
              <div className="px-4 py-4 space-y-4">
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
                    climateActive={climateActive}
                  />
                )}
              </div>
            </div>

            {/* Map panel */}
            <div className="flex-grow relative h-full">
              <MapComponent
                markers={markers}
                selectedInsee={selectedCommune?.insee ?? null}
                onOpenDrawer={handleMapOpenDrawer}
                onBoundsChange={handleBoundsChange}
                fitBoundsKey={fitBoundsKey}
                isVisible={activePage === 'explorer'}
                climateActive={climateActive}
              />
            </div>
          </div>

          {/* Mobile: full-screen map + bottom sheet */}
          <div className="sm:hidden relative" style={{ height: 'calc(100vh - 53px)' }}>
            <MapComponent
              markers={markers}
              selectedInsee={selectedCommune?.insee ?? null}
              onOpenDrawer={handleMapOpenDrawer}
              onBoundsChange={handleBoundsChange}
              fitBoundsKey={fitBoundsKey}
              isVisible={activePage === 'explorer'}
              climateActive={climateActive}
            />

            <BottomSheet communeCount={totalCount}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
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
                  climateActive={climateActive}
                />
              )}
            </BottomSheet>

            {/* Mobile: bottom bar with Climat toggle + Pondération + Filtres */}
            <div className={`fixed left-0 right-0 z-40 flex items-center justify-center gap-2 px-3 py-2 ${compareList.length > 0 ? 'bottom-16' : 'bottom-3'}`}>
              {/* Climate toggle */}
              <button
                onClick={toggleClimate}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition-all active:scale-95 ${
                  climateActive
                    ? 'bg-red-50 border border-red-300 text-red-700 shadow-red-200/50'
                    : 'bg-white border border-slate-200 text-slate-500 shadow-slate-200/50'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Climat</span>
                <span>{climateActive ? '✓' : '✗'}</span>
              </button>

              {/* Pondération (only when climate active) */}
              {climateActive && (
                <button
                  onClick={() => setWeightingPanelOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 active:scale-95 transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Pondération
                </button>
              )}

              {/* Filtres */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
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
        </>
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
          climateActive={climateActive}
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

/* ─── About Page (placeholder) ─── */

const AboutPage: React.FC = () => (
  <main className="flex-grow max-w-2xl mx-auto w-full px-4 py-12">
    <h2 className="text-2xl font-bold text-slate-800 mb-4">A propos</h2>
    <div className="prose prose-slate">
      <p className="text-slate-600 leading-relaxed">
        <strong>Ou Atterir</strong> est un outil d'exploration des communes francaises.
        Il permet de filtrer et comparer les communes selon des criteres politiques,
        geographiques, d'equipements et de qualite de vie.
      </p>
      <p className="text-slate-600 leading-relaxed mt-4">
        Les donnees proviennent de sources publiques : resultats electoraux du Ministere de l'Interieur,
        Base Permanente des Equipements (INSEE), Georisques, donnees DVF, et ATMO France.
      </p>
    </div>
  </main>
);

export default App;
