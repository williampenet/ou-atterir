import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { searchCommunes } from './services/communeService';
import { Commune, IdealResult, PaginatedResults, SearchFilters } from './types';
import FilterPanel from './components/FilterPanel';
import ResultsList from './components/ResultsList';
import CommuneDrawer from './components/CommuneDrawer';

const App: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<PaginatedResults<IdealResult> | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(false);
  const filtersRef = useRef(filters);

  const doSearch = async (f: SearchFilters, page: number = 1) => {
    setLoading(true);
    try {
      const res = await searchCommunes(f, page);
      setResults(res);
    } catch {
      setResults({ data: [], total: 0, page: 1, pageSize: 30, hasMore: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filtersRef.current = filters;
    doSearch(filters);
  }, [filters]);

  const handlePageChange = (page: number) => {
    doSearch(filtersRef.current, page);
  };

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
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-6 space-y-4">

        <FilterPanel onFiltersChange={setFilters} />

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
