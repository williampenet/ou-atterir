import React from 'react';
import { Compass, SlidersHorizontal, Search } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Compass,
    title: 'Tri par exposition climatique',
    description: 'Les communes sont classées selon leur exposition au changement climatique (températures, eau, risques naturels, qualité de l\'air, sols). Les moins exposées apparaissent en premier.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Search,
    title: 'Affinez votre recherche',
    description: 'Filtrez par département, taille de commune, équipements, géographie, tendance politique et bien plus.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: SlidersHorizontal,
    title: 'Ajustez vos priorités',
    description: 'Utilisez le bouton Pondération pour donner plus ou moins d\'importance à chaque dimension climatique.',
    color: 'bg-emerald-100 text-emerald-600',
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-filter-sheet overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-indigo-600 to-orange-500 px-6 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Bienvenue sur Où Atterir
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Votre parcours en 3 étapes
            </p>
          </div>

          {/* Steps */}
          <div className="px-6 py-6 space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${step.color}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px h-4 bg-slate-200 mt-1" />
                  )}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
            >
              C'est parti !
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingModal;
