import React, { useState, useEffect } from 'react';
import { Search, Map as MapIcon, BarChart2, Info, Compass } from 'lucide-react';
import { searchCommune, getNearbyCommunes } from './services/communeService';
import { Commune, IdealResult } from './types';
import CommuneCard from './components/CommuneCard';
import MapComponent from './components/MapComponent';
import IdealSearchForm from './components/IdealSearchForm';
import IdealResultsList from './components/IdealResultsList';

const App: React.FC = () => {
  const [searchZip, setSearchZip] = useState('');
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [nearbyCommunes, setNearbyCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'map'>('card'); // Mobile toggle
  const [searchMode, setSearchMode] = useState<'zipcode' | 'ideal'>('zipcode');
  const [idealResults, setIdealResults] = useState<IdealResult[] | null>(null);

  // Load nearby data on mount (mocking "Find towns around me" or generic load)
  useEffect(() => {
    getNearbyCommunes().then(setNearbyCommunes);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchZip || searchZip.length !== 5) {
      setError("Veuillez entrer un code postal à 5 chiffres.");
      return;
    }

    setLoading(true);
    setError('');
    setSelectedCommune(null);

    try {
      const result = await searchCommune(searchZip);
      if (result) {
        setSelectedCommune(result);
      } else {
        setError("Commune non trouvée dans la base de données MVP (Essayer 69001, 33000, 62110, 92200).");
      }
    } catch (err) {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">
      
      {/* Navigation / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
               <MapIcon className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Ou Atterir <span className="text-indigo-600 text-xs font-medium px-2 py-0.5 bg-indigo-50 rounded-full ml-1 align-middle">MVP</span></h1>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        
        {/* Left Column: Search & Card */}
        <section className={`flex-col gap-6 w-full lg:w-1/3 lg:min-w-[400px] ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Mode Toggle */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button
                onClick={() => { setSearchMode('zipcode'); setIdealResults(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${searchMode === 'zipcode' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Search className="w-3.5 h-3.5" /> Code postal
              </button>
              <button
                onClick={() => { setSearchMode('ideal'); setSelectedCommune(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${searchMode === 'ideal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Compass className="w-3.5 h-3.5" /> Commune idéale
              </button>
            </div>

            {searchMode === 'zipcode' ? (
              <>
                {/* Search Box */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Où souhaitez-vous habiter ?</h2>
                    <p className="text-slate-500 text-sm mb-4">Analysez l'histoire politique de votre future commune.</p>
                    
                    <form onSubmit={handleSearch} className="relative">
                        <input 
                            type="text" 
                            placeholder="Code postal (ex: 69001)"
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                            value={searchZip}
                            onChange={(e) => setSearchZip(e.target.value)}
                            maxLength={5}
                            inputMode="numeric"
                        />
                        <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                        <button 
                            type="submit"
                            className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg transition-colors"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-xs mt-2 font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                       <p className="text-xs text-slate-400 w-full mb-1">Essayer:</p>
                       {['69001', '33000', '62110', '92200', '75016'].map(zip => (
                           <button 
                            key={zip} 
                            onClick={() => {setSearchZip(zip);}} 
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                           >
                               {zip}
                           </button>
                       ))}
                    </div>
                </div>

                {/* Results Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm font-medium">Recherche des données électorales...</p>
                    </div>
                ) : selectedCommune ? (
                    <CommuneCard commune={selectedCommune} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60">
                        <BarChart2 className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-400 text-sm">Entrez un code postal pour voir l'historique politique et le score de stabilité.</p>
                    </div>
                )}
              </>
            ) : (
              <>
                <IdealSearchForm
                  onResults={(results) => {
                    setIdealResults(results);
                    setSelectedCommune(null);
                    if (results.length > 0) {
                      setNearbyCommunes(results.map(r => r.commune));
                    }
                  }}
                  onLoading={setLoading}
                />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm font-medium">Recherche en cours...</p>
                    </div>
                ) : idealResults !== null ? (
                    idealResults.length > 0 ? (
                      <IdealResultsList
                        results={idealResults}
                        onSelectCommune={(commune) => {
                          setSelectedCommune(commune);
                          setViewMode('map');
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60">
                        <Compass className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-400 text-sm">Aucune commune ne correspond à ces critères dans ce département.</p>
                      </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60">
                        <Compass className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-400 text-sm">Décrivez votre commune idéale pour lancer la recherche.</p>
                    </div>
                )}

                {selectedCommune && idealResults && (
                  <CommuneCard commune={selectedCommune} />
                )}
              </>
            )}
        </section>

        {/* Right Column: Map (Desktop) / Mobile Toggle View */}
        <section className={`flex-grow h-[500px] lg:h-auto w-full lg:w-2/3 rounded-2xl overflow-hidden relative ${viewMode === 'card' ? 'hidden lg:block' : 'block'}`}>
             <MapComponent 
                center={selectedCommune ? selectedCommune.coordinates : [46.603354, 1.888334]} // France center default
                communes={nearbyCommunes}
                selectedId={selectedCommune?.insee}
                isVisible={viewMode === 'map'}
             />
             
             {/* Map Overlay Stats (Optional) */}
             <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/20 z-[400] max-w-xs">
                 <p className="text-xs font-bold text-slate-500 uppercase">Légende</p>
                 <div className="mt-2 space-y-1">
                     <div className="flex items-center text-xs text-slate-700">
                         <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-full mr-2"></div> Forteresse (Stable)
                     </div>
                     <div className="flex items-center text-xs text-slate-700">
                         <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-full mr-2"></div> Instable / Bascule
                     </div>
                 </div>
             </div>
        </section>

      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-full px-1 py-1 flex items-center z-[1000]">
          <button 
            onClick={() => setViewMode('card')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'card' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
              Données
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
              Carte
          </button>
      </div>

    </div>
  );
};

export default App;
