import React, { useEffect, useState } from 'react';
import { Commune, EquipmentSummary, EquipmentDomain } from '../types';
import { getCommuneByInsee, getEquipmentSummary } from '../services/communeService';
import { EQUIPMENT_DOMAINS } from '../constants';
import CommuneCard from './CommuneCard';
import { X, Building2, ShoppingBag, GraduationCap, Heart, Train, Dumbbell, Palmtree } from 'lucide-react';

interface Props {
  commune: Commune;
  onClose: () => void;
}

const DOMAIN_ICONS: Record<EquipmentDomain, React.FC<{ className?: string }>> = {
  A: Building2, B: ShoppingBag, C: GraduationCap, D: Heart,
  E: Train, F: Dumbbell, G: Palmtree,
};

const CommuneDrawer: React.FC<Props> = ({ commune, onClose }) => {
  const [fullCommune, setFullCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<EquipmentSummary[]>([]);

  useEffect(() => {
    setLoading(true);
    setFullCommune(null);
    setEquipments([]);
    Promise.all([
      getCommuneByInsee(commune.insee),
      getEquipmentSummary(commune.insee),
    ]).then(([data, eqs]) => {
      setFullCommune(data ?? commune);
      setEquipments(eqs);
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

          {/* Equipment summary */}
          {equipments.length > 0 && (
            <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Équipements & services</h4>
              <div className="grid grid-cols-2 gap-2">
                {equipments.map(eq => {
                  const Icon = DOMAIN_ICONS[eq.domain];
                  return (
                    <div key={eq.domain} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
                      <Icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{EQUIPMENT_DOMAINS[eq.domain]?.label ?? eq.domainLabel}</p>
                        <p className="text-[10px] text-slate-400">{eq.totalCount} équipement{eq.totalCount > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CommuneDrawer;
