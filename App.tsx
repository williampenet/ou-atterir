import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Scale, MapPin, Loader2, Map, List } from 'lucide-react';
import { searchCommunes, searchCommunesByText, getCommuneByInsee } from './services/communeService';
import { Commune, IdealResult, PaginatedResults, SearchFilters } from './types';
import { BLOC_COLORS } from './constants';
import FilterSheet from './components/FilterSheet';
import FilterBar from './components/FilterBar';
import ResultsList from './components/ResultsList';
import CommuneDrawer from './components/CommuneDrawer';
import CompareView from './components/CompareView';
import MapComponent from './components/MapComponent';
import StabilityBadge from './components/StabilityBadge';

type AppPage = 'accueil' | 'explorer';
type ViewMode = 'liste' | 'carte';

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('ouatterir_viewMode');
    if (stored === 'liste' || stored === 'carte') return stored;
  } catch { /* noop */ }
  return 'liste';
}

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<AppPage>('accueil');
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<PaginatedResults<IdealResult> | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareList, setCompareList] = useState<Commune[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const filtersRef = useRef(filters);
  const searchIdRef = useRef(0);

  useEffect(() => {
    try { localStorage.setItem('ouatterir_viewMode', viewMode); } catch { /* noop */ }
  }, [viewMode]);

  const doSearch = async (f: SearchFilters, page: number = 1) => {
    const id = ++searchIdRef.current;
    setLoading(true);
    try {
      const res = await searchCommunes(f, page);
      if (id === searchIdRef.current) setResults(res);
    } catch {
      if (id === searchIdRef.current) setResults({ data: [], total: 0, page: 1, pageSize: 30, hasMore: false });
    } finally {
      if (id === searchIdRef.current) setLoading(false);
    }
  };

  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    filtersRef.current = filters;
    doSearch(filters);
  }, [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handlePageChange = (page: number) => {
    doSearch(filtersRef.current, page);
  };

  const handleMapOpenDrawer = async (insee: string) => {
    const commune = await getCommuneByInsee(insee);
    if (commune) setSelectedCommune(commune);
  };

  const activeFilterCount =
    [filters.department, filters.bloc, filters.matchLevel, filters.riskLevel].filter(Boolean).length +
    (filters.equipmentFilters?.length ?? 0) +
    (filters.populationSizes?.length ?? 0) +
    (filters.geoTags?.length ?? 0) +
    (filters.travelFilter?.insees ? 1 : 0);

  const showMap = activePage === 'explorer' && viewMode === 'carte';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">

      {/* Header */}
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

          <nav className="flex gap-1 self-stretch -mb-px">
            <button
              onClick={() => setActivePage('accueil')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activePage === 'accueil'
                  ? 'text-indigo-700 border-indigo-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Accueil
            </button>
            <button
              onClick={() => setActivePage('explorer')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activePage === 'explorer'
                  ? 'text-indigo-700 border-indigo-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Explorer
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Page content */}
      {activePage === 'accueil' ? (
        <SearchPage
          compareList={compareList}
          onToggleCompare={toggleCompare}
          onSelectCommune={setSelectedCommune}
        />
      ) : (
        <>
          {/* FilterBar — sticky under header */}
          <FilterBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFiltersOpen(true)}
          />

          {/* Explorer content */}
          {viewMode === 'liste' ? (
            /* ── Liste only ── */
            <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-6 space-y-4 pb-24">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 text-sm font-medium">Recherche en cours...</p>
                </div>
              ) : results ? (
                <ResultsList
                  results={results}
                  selectedInsee={selectedCommune?.insee}
                  onSelectCommune={setSelectedCommune}
                  onPageChange={handlePageChange}
                  compareList={compareList}
                  onToggleCompare={toggleCompare}
                />
              ) : null}
            </main>
          ) : (
            /* ── Carte (+ liste on desktop) ── */
            <div className="flex flex-col sm:flex-row overflow-hidden" style={{ height: 'calc(100vh - 105px)' }}>
              {/* List panel — desktop only */}
              <div className="hidden sm:block sm:w-[380px] sm:flex-shrink-0 sm:overflow-y-auto sm:border-r sm:border-slate-200 sm:bg-white">
                <div className="px-4 py-4 space-y-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-500 text-sm font-medium">Recherche en cours...</p>
                    </div>
                  ) : results ? (
                    <ResultsList
                      results={results}
                      selectedInsee={selectedCommune?.insee}
                      onSelectCommune={setSelectedCommune}
                      onPageChange={handlePageChange}
                      compareList={compareList}
                      onToggleCompare={toggleCompare}
                    />
                  ) : null}
                </div>
              </div>

              {/* Map panel */}
              <div className="flex-grow relative h-full">
                <MapComponent
                  filters={filters}
                  selectedInsee={selectedCommune?.insee ?? null}
                  onOpenDrawer={handleMapOpenDrawer}
                  onClearDepartment={() => setFilters(f => ({ ...f, department: undefined }))}
                  isVisible={showMap}
                />
              </div>
            </div>
          )}

          {/* Mobile bottom toggle — only on mobile */}
          <div className={`sm:hidden fixed left-1/2 -translate-x-1/2 z-40 ${compareList.length > 0 ? 'bottom-20' : 'bottom-5'}`}>
            <button
              onClick={() => setViewMode(viewMode === 'liste' ? 'carte' : 'liste')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              {viewMode === 'liste' ? (
                <><Map className="w-4 h-4" /> Carte</>
              ) : (
                <><List className="w-4 h-4" /> Liste</>
              )}
            </button>
          </div>
        </>
      )}

      {/* Compare tray */}
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

      {/* Filter drawer */}
      <FilterSheet
        filters={filters}
        onFiltersChange={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        resultCount={results?.total}
      />

      {/* Detail drawer */}
      {selectedCommune && (
        <CommuneDrawer
          commune={selectedCommune}
          onClose={() => setSelectedCommune(null)}
        />
      )}

      {/* Compare view */}
      {compareOpen && compareList.length === 2 && (
        <CompareView
          communes={compareList as [Commune, Commune]}
          onClose={() => setCompareOpen(false)}
        />
      )}

    </div>
  );
};

/* ─── Search Page (Accueil) ─── */

interface SearchPageProps {
  compareList: Commune[];
  onToggleCompare: (commune: Commune) => void;
  onSelectCommune: (commune: Commune) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ compareList, onToggleCompare, onSelectCommune }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IdealResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchCommunesByText(trimmed);
      setResults(res);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-6 pb-24">
      {/* Search input */}
      <div className="max-w-xl mx-auto mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-1 text-center">Rechercher une commune</h2>
        <p className="text-sm text-slate-400 mb-4 text-center">Par nom ou code postal</p>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Nom de commune ou code postal..."
            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setHasSearched(false); inputRef.current?.focus(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Recherche...</p>
        </div>
      ) : !hasSearched ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-10 h-10 text-slate-200 mb-4" />
          <p className="text-slate-400 text-sm font-medium">Tapez au moins 2 caractères</p>
          <p className="text-slate-300 text-xs mt-1">pour rechercher une commune</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="w-10 h-10 text-slate-200 mb-4" />
          <p className="text-slate-400 text-sm font-medium">Aucune commune trouvée</p>
          <p className="text-slate-300 text-xs mt-1">Vérifiez l'orthographe ou essayez un code postal</p>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-2">
          <p className="text-xs text-slate-500 font-medium px-1 mb-2">
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </p>
          {results.map(r => {
            const inCompare = compareList.some(c => c.insee === r.commune.insee);
            const compareFull = compareList.length >= 2 && !inCompare;
            const blocColor = r.latestBloc ? (BLOC_COLORS[r.latestBloc] || '#94a3b8') : '#94a3b8';

            return (
              <div
                key={r.commune.insee}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelectCommune(r.commune)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center text-slate-400 text-[11px]">
                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                      {r.commune.department}
                    </div>
                    <StabilityBadge level={r.commune.stability} compact />
                  </div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {r.commune.name} <span className="font-medium text-slate-400">({r.commune.zipcode})</span>
                  </p>
                  {r.latestWinner && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: blocColor }} />
                      {r.latestWinner}{r.latestNuanceLabel ? ` (${r.latestNuanceLabel})` : ''}
                    </div>
                  )}
                </div>
                <div
                  role="checkbox"
                  aria-checked={inCompare}
                  aria-label="Ajouter à la comparaison"
                  onClick={(e) => { e.stopPropagation(); if (!compareFull || inCompare) onToggleCompare(r.commune); }}
                  className={`p-1.5 rounded-lg border transition-all flex-shrink-0 ${
                    inCompare
                      ? 'bg-purple-100 border-purple-300 text-purple-600'
                      : compareFull
                        ? 'border-slate-100 text-slate-200 cursor-not-allowed'
                        : 'border-slate-200 text-slate-300 hover:border-purple-200 hover:text-purple-400 cursor-pointer'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default App;
