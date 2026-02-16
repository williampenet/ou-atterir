import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ElectionResult } from '../types';
import { SPECTRUM_VALUE, NUANCE_COLORS } from '../constants';

interface Props {
  history: ElectionResult[];
}

const TrendChart: React.FC<Props> = ({ history }) => {
  // Sort history by year ascending
  const data = [...history]
    .sort((a, b) => a.year - b.year)
    .map(h => ({
      year: h.year,
      value: SPECTRUM_VALUE[h.winnerNuance],
      nuance: h.winnerNuance,
      score: h.score,
      name: h.winnerName
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
          <p className="font-bold text-slate-800">{label}</p>
          <p className="text-slate-600 font-medium">{point.name}</p>
          <p style={{ color: NUANCE_COLORS[point.nuance] }}>
            {point.nuance} ({point.score}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-48 w-full mt-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">Trajectoire Politique (G → D)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="year" 
            tick={{fontSize: 12, fill: '#64748b'}} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[1, 7]} 
            hide 
          />
          <ReferenceLine y={4} stroke="#94a3b8" strokeDasharray="2 2" />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-2 font-medium">
        <span>GAUCHE</span>
        <span>CENTRE</span>
        <span>DROITE</span>
      </div>
    </div>
  );
};

export default TrendChart;
