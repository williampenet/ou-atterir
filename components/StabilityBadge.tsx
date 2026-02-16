import React from 'react';
import { StabilityLevel } from '../types';
import { STABILITY_COLORS } from '../constants';
import { Shield, Activity, Anchor, AlertTriangle } from 'lucide-react';

interface Props {
  level: StabilityLevel;
}

const StabilityBadge: React.FC<Props> = ({ level }) => {
  const styles = STABILITY_COLORS[level];

  const getIcon = () => {
    switch (level) {
      case StabilityLevel.FORTRESS: return <Shield className="w-4 h-4 mr-1.5" />;
      case StabilityLevel.STABLE: return <Anchor className="w-4 h-4 mr-1.5" />;
      case StabilityLevel.SWING: return <Activity className="w-4 h-4 mr-1.5" />;
      case StabilityLevel.UNSTABLE: return <AlertTriangle className="w-4 h-4 mr-1.5" />;
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles}`}>
      {getIcon()}
      {level}
    </div>
  );
};

export default StabilityBadge;
