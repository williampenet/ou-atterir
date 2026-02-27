import React, { useState, useEffect, useRef } from 'react';
import { Info, Search, X, Filter, BarChart3, Scale } from 'lucide-react';
import { searchCommunes } from './services/communeService';
import { Commune, IdealResult, PaginatedResults, SearchFilters } from './types';
import FilterSheet from './components/FilterSheet';
import ResultsList from './components/ResultsList';
import CommuneDrawer from './components/CommuneDrawer';
import CompareView from './components/CompareView';

const App: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<PaginatedResults<IdealResult> | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareList, setCompareList] = useState<Commune[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(() => localStorage.getItem('ouatterir-notice-dismissed') !== 'true');
  const filtersRef = useRef(filters);
  const searchIdRef = useRef(0);

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
  }, [filtersKey]);

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

  const dismissNotice = () => {
    setShowNotice(false);
    localStorage.setItem('ouatterir-notice-dismissed', 'true');
  };

  const toggleNotice = () => {
    const next = !showNotice;
    setShowNotice(next);
    localStorage.setItem('ouatterir-notice-dismissed', next ? '' : 'true');
  };

  const activeFilterCount =
    [filters.department, filters.bloc, filters.matchLevel, filters.riskLevel].filter(Boolean).length +
    (filters.equipmentFilters?.length ?? 0) +
    (filters.populationSizes?.length ?? 0) +
    (filters.geoTags?.length ?? 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg className="text-white w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V17L12 22L21 17V7L12 2L3 7Z" />
                <path d="M12 12L21 7" />
                <path d="M12 12L3 7" />
                <path d="M12 12V22" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Ou Atterir
              <span className="text-indigo-600 text-xs font-medium px-2 py-0.5 bg-indigo-50 rounded-full ml-1.5 align-middle">MVP</span>
            </h1>
          </div>
          <button onClick={toggleNotice} className={`transition-colors ${showNotice ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-6 space-y-4 pb-24">

        {showNotice && (
          <div className="relative bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <button
              onClick={dismissNotice}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-base font-bold text-slate-900 mb-2">
                Trouvez la commune qui vous correspond
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                <strong>Ou Atterir</strong> croise les donnees publiques (equipements, stabilite politique, demographie, immobilier, risques naturels…) pour vous aider a identifier les communes francaises ou il fait bon vivre, travailler ou s'installer.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/60">
                  <Filter className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Filtrez</p>
                    <p className="text-xs text-slate-500">Departement, taille, equipements, risques…</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/60">
                  <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Comparez</p>
                    <p className="text-xs text-slate-500">Scores, prix immobiliers, services de proximite</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Floating search/filter button */}
      <div className={`fixed left-1/2 -translate-x-1/2 z-40 ${compareList.length > 0 ? 'bottom-20' : 'bottom-5'}`}>
        <button
          onClick={() => setFiltersOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Search className="w-4 h-4" />
          Rechercher
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-bold bg-white text-indigo-600 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter sheet */}
      <FilterSheet
        filters={filters}
        onFiltersChange={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        resultCount={results?.total}
        compareList={compareList}
        onToggleCompare={toggleCompare}
        onSelectCommune={setSelectedCommune}
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

export default App;
