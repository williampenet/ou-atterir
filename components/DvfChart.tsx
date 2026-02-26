import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DvfData, MarketTension } from '../types';
import { MARKET_TENSION_LEVELS } from '../constants';
import { Home, Building2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface Props {
  dvfData: DvfData;
}

const MAISON_COLOR = '#f59e0b';
const APPART_COLOR = '#3b82f6';

const formatPrice = (v: number | null): string => {
  if (v == null) return '—';
  return v.toLocaleString('fr-FR') + ' €';
};

const DvfChart: React.FC<Props> = ({ dvfData }) => {
  const { stats, tension, transactionsDerniereAnnee } = dvfData;

  const { chartData, latestMaison, latestAppart, evolutionMaison, evolutionAppart } = useMemo(() => {
    const years = [...new Set(stats.map(s => s.year))].sort();

    const byYear: Record<number, { maison: number | null; appart: number | null; txMaison: number; txAppart: number }> = {};
    for (const y of years) {
      byYear[y] = { maison: null, appart: null, txMaison: 0, txAppart: 0 };
    }
    for (const s of stats) {
      if (!byYear[s.year]) continue;
      if (s.typeLocal === 'maison') {
        byYear[s.year].maison = s.prixM2Median;
        byYear[s.year].txMaison = s.nbMutations;
      } else {
        byYear[s.year].appart = s.prixM2Median;
        byYear[s.year].txAppart = s.nbMutations;
      }
    }

    const chartData = years.map(y => ({
      year: y,
      maison: byYear[y].maison,
      appart: byYear[y].appart,
      txMaison: byYear[y].txMaison,
      txAppart: byYear[y].txAppart,
    }));

    const lastYear = years[years.length - 1];
    const firstYear = years[0];
    const latestMaison = byYear[lastYear]?.maison ?? null;
    const latestAppart = byYear[lastYear]?.appart ?? null;
    const firstMaison = byYear[firstYear]?.maison ?? null;
    const firstAppart = byYear[firstYear]?.appart ?? null;

    const evolutionMaison = firstMaison && latestMaison
      ? Math.round(((latestMaison - firstMaison) / firstMaison) * 100)
      : null;
    const evolutionAppart = firstAppart && latestAppart
      ? Math.round(((latestAppart - firstAppart) / firstAppart) * 100)
      : null;

    return { chartData, latestMaison, latestAppart, evolutionMaison, evolutionAppart };
  }, [stats]);

  if (stats.length === 0) {
    return (
      <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marché immobilier</h4>
        <p className="text-xs text-slate-400 mt-2">Données indisponibles pour cette commune.</p>
      </div>
    );
  }

  const hasMaison = stats.some(s => s.typeLocal === 'maison');
  const hasAppart = stats.some(s => s.typeLocal === 'appartement');
  const totalMutations = stats.reduce((acc, s) => acc + s.nbMutations, 0);
  const lowData = totalMutations < 5;

  const TrendIcon = ({ value }: { value: number | null }) => {
    if (value == null) return null;
    if (value > 0) return <TrendingUp className="w-3 h-3" />;
    if (value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const trendColor = (value: number | null) => {
    if (value == null) return 'text-slate-400';
    return value >= 0 ? 'text-emerald-600' : 'text-red-500';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          {point.maison != null && (
            <p className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MAISON_COLOR }} />
              <span className="text-slate-600">Maisons : {formatPrice(point.maison)}/m²</span>
              <span className="text-slate-400 ml-1">({point.txMaison} tx)</span>
            </p>
          )}
          {point.appart != null && (
            <p className="flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: APPART_COLOR }} />
              <span className="text-slate-600">Apparts : {formatPrice(point.appart)}/m²</span>
              <span className="text-slate-400 ml-1">({point.txAppart} tx)</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marché immobilier</h4>
        {tension && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${MARKET_TENSION_LEVELS[tension].color}`}>
            <BarChart3 className="w-2.5 h-2.5" />
            {MARKET_TENSION_LEVELS[tension].label}
          </span>
        )}
      </div>

      {lowData && (
        <p className="text-[10px] text-amber-600 mb-2">Peu de données disponibles pour cette commune.</p>
      )}

      {/* Metric cards */}
      <div className={`grid gap-2 mb-3 ${hasMaison && hasAppart ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {hasMaison && (
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
            <Home className="w-4 h-4 flex-shrink-0" style={{ color: MAISON_COLOR }} />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Maisons</p>
              <p className="text-sm font-bold text-slate-700">{formatPrice(latestMaison)}/m²</p>
              {evolutionMaison != null && (
                <p className={`text-[10px] font-medium flex items-center gap-0.5 ${trendColor(evolutionMaison)}`}>
                  <TrendIcon value={evolutionMaison} />
                  {evolutionMaison > 0 ? '+' : ''}{evolutionMaison}% / 5 ans
                </p>
              )}
            </div>
          </div>
        )}
        {hasAppart && (
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
            <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: APPART_COLOR }} />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Appartements</p>
              <p className="text-sm font-bold text-slate-700">{formatPrice(latestAppart)}/m²</p>
              {evolutionAppart != null && (
                <p className={`text-[10px] font-medium flex items-center gap-0.5 ${trendColor(evolutionAppart)}`}>
                  <TrendIcon value={evolutionAppart} />
                  {evolutionAppart > 0 ? '+' : ''}{evolutionAppart}% / 5 ans
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <>
          <p className="text-[10px] text-slate-400 uppercase font-medium tracking-wider mb-1">
            Évolution prix médian au m²
          </p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                {hasMaison && (
                  <Line
                    type="monotone"
                    dataKey="maison"
                    name="Maisons"
                    stroke={MAISON_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: MAISON_COLOR, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                )}
                {hasAppart && (
                  <Line
                    type="monotone"
                    dataKey="appart"
                    name="Appartements"
                    stroke={APPART_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: APPART_COLOR, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-1 px-1">
            {hasMaison && (
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: MAISON_COLOR, display: 'inline-block' }} />
                <span className="text-[10px] text-slate-400">Maisons</span>
              </div>
            )}
            {hasAppart && (
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: APPART_COLOR, display: 'inline-block' }} />
                <span className="text-[10px] text-slate-400">Appartements</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Transaction count */}
      <p className="text-[10px] text-slate-400 mt-2">
        {transactionsDerniereAnnee > 0
          ? `${transactionsDerniereAnnee} transaction${transactionsDerniereAnnee > 1 ? 's' : ''} / dernière année`
          : 'Aucune transaction récente'
        }
      </p>
    </div>
  );
};

export default DvfChart;
