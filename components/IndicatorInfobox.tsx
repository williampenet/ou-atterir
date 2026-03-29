import React from 'react';
import { IndicatorTooltipContent } from '../constants';

interface Props {
  content: IndicatorTooltipContent;
  multiplier?: number | null;
}

const IndicatorInfobox: React.FC<Props> = ({ content, multiplier }) => (
  <div className="my-1.5 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2.5 text-[11px] text-sky-800 space-y-1.5">
    <p>{content.what}</p>

    {multiplier != null && multiplier > 1 && (
      <p className="text-orange-600 font-medium">
        ×{multiplier} en 2050 : valeur projetée divisée par la référence 1976-2005, arrondie à une décimale.
      </p>
    )}

    <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 border-t border-sky-200">
      <span className="text-slate-400 font-medium">Couleurs :</span>
      <span className="text-slate-500">Gris = stable (≤ ×1,2)</span>
      <span className="text-amber-600">Ambre = ×1,2–2</span>
      <span className="text-orange-600">Orange = ×2–5</span>
      <span className="text-red-600">Rouge = ×5+</span>
    </div>

    {content.note && (
      <p className="text-sky-700 font-medium">{content.note}</p>
    )}

    <p className="text-slate-400">Réf. = moyenne 1976-2005 (pas la valeur actuelle)</p>
  </div>
);

export default IndicatorInfobox;
