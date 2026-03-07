import React from 'react';
import { StabilityLevel } from '../types';
import { STABILITY_COLORS } from '../constants';
import { Shield, Activity } from 'lucide-react';

interface Props {
  level: StabilityLevel;
  compact?: boolean;
}

const StabilityBadge: React.FC<Props> = ({ level, compact }) => {
  const styles = STABILITY_COLORS[level];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles}`}>
        {level === StabilityLevel.FORTERESSE ? <Shield className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
        {level}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles}`}>
      {level === StabilityLevel.FORTERESSE ? <Shield className="w-4 h-4 mr-1.5" /> : <Activity className="w-4 h-4 mr-1.5" />}
      {level}
    </div>
  );
};

export default StabilityBadge;
