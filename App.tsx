import React, { useState, useEffect, useRef } from 'react';
import { Info, SlidersHorizontal } from 'lucide-react';
import { searchCommunes } from './services/communeService';
import { Commune, IdealResult, PaginatedResults, SearchFilters } from './types';
import FilterSheet from './components/FilterSheet';
import ResultsList from './components/ResultsList';
import CommuneDrawer from './components/CommuneDrawer';

const App: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<PaginatedResults<IdealResult> | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const handlePageChange = (page: number) => {
    doSearch(filtersRef.current, page);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-all bg-white"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-6 space-y-4 pb-24 sm:pb-6">
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
          />
        ) : null}
      </main>

      {/* Mobile floating filter button */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 sm:hidden">
        <button
          onClick={() => setFiltersOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
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
      />

      {/* Detail drawer */}
      {selectedCommune && (
        <CommuneDrawer
          commune={selectedCommune}
          onClose={() => setSelectedCommune(null)}
        />
      )}

    </div>
  );
};

export default App;
