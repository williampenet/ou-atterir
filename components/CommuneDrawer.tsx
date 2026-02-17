import React, { useEffect, useState } from 'react';
import { Commune } from '../types';
import { getCommuneByInsee } from '../services/communeService';
import CommuneCard from './CommuneCard';
import { X } from 'lucide-react';

interface Props {
  commune: Commune;
  onClose: () => void;
}

const CommuneDrawer: React.FC<Props> = ({ commune, onClose }) => {
  const [fullCommune, setFullCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setFullCommune(null);
    getCommuneByInsee(commune.insee).then((data) => {
      setFullCommune(data ?? commune);
      setLoading(false);
    });
  }, [commune.insee]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[480px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Detail commune</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto px-6 py-5">
          <CommuneCard
            commune={fullCommune ?? commune}
            loading={loading}
          />
        </div>
      </div>
    </>
  );
};

export default CommuneDrawer;
