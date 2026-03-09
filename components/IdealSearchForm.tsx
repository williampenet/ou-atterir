import React, { useState, useEffect } from 'react';
import { PoliticalBloc, IdealResult, PaginatedResults } from '../types';
import { BLOC_COLORS, formatDepartments, Department } from '../constants';
import { getDepartments, searchIdealCommunes } from '../services/communeService';
import { Compass } from 'lucide-react';

interface Props {
  onResults: (results: PaginatedResults<IdealResult>, bloc: PoliticalBloc, department: string) => void;
  onLoading: (loading: boolean) => void;
}

const BLOC_OPTIONS = [
  { value: PoliticalBloc.EXTRÊME_GAUCHE, label: 'Extrême-gauche' },
  { value: PoliticalBloc.GAUCHE, label: 'Gauche' },
  { value: PoliticalBloc.CENTRE, label: 'Centre' },
  { value: PoliticalBloc.DROITE, label: 'Droite' },
  { value: PoliticalBloc.EXTREME_DROITE, label: 'Extrême-droite' },
];

const IdealSearchForm: React.FC<Props> = ({ onResults, onLoading }) => {
  const [bloc, setBloc] = useState<PoliticalBloc | ''>('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getDepartments().then(names => setDepartments(formatDepartments(names)));
  }, []);

  const handleSearch = async (page: number = 1) => {
    if (!bloc || !department) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    onLoading(true);
    try {
      const results = await searchIdealCommunes(bloc, department, page);
      onResults(results, bloc, department);
    } catch {
      setError('Erreur lors de la recherche.');
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-800">Trouver la commune idéale</h2>
      </div>

      <div className="text-sm text-slate-700 leading-relaxed space-y-3">
        <p className="text-slate-500 text-sm mb-4">Complétez la phrase pour lancer la recherche :</p>

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          <span>Je cherche une commune</span>
          <select
            value={bloc}
            onChange={(e) => setBloc(e.target.value as PoliticalBloc)}
            className="inline-flex px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            style={bloc ? { color: BLOC_COLORS[bloc as PoliticalBloc] } : {}}
          >
            <option value="">orientation...</option>
            {BLOC_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          <span>dans le département</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="inline-flex px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">département...</option>
            {departments.map(d => (
              <option key={d.name} value={d.name}>{d.code} — {d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-3 font-medium bg-red-50 p-2 rounded-lg">{error}</p>}

      <button
        onClick={() => handleSearch(1)}
        disabled={!bloc || !department}
        className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Rechercher
      </button>
    </div>
  );
};

export default IdealSearchForm;
