import React, { useRef } from 'react';
import { motion, useAnimationControls, useDragControls, PanInfo } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  communeCount?: number;
}

type Snap = 'min' | 'mid' | 'full';

const HEADER_H = 53;
const HANDLE_H = 56;

function getSnapY(snap: Snap): number {
  const vh = window.innerHeight;
  switch (snap) {
    case 'full': return HEADER_H;
    case 'mid': return Math.round(vh * 0.5);
    case 'min': return vh - HANDLE_H;
  }
}

const BottomSheet: React.FC<Props> = ({ children, communeCount }) => {
  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const snapRef = useRef<Snap>('mid');

  const snapTo = (s: Snap) => {
    snapRef.current = s;
    controls.start(
      { y: getSnapY(s) },
      { type: 'spring', damping: 30, stiffness: 300 }
    );
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity, offset } = info;

    if (velocity.y > 300 || (velocity.y > -100 && offset.y > 60)) {
      snapTo(snapRef.current === 'full' ? 'mid' : 'min');
    } else if (velocity.y < -300 || (velocity.y < 100 && offset.y < -60)) {
      snapTo(snapRef.current === 'min' ? 'mid' : 'full');
    } else {
      snapTo(snapRef.current);
    }
  };

  return (
    <motion.div
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: getSnapY('full'), bottom: getSnapY('min') }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ y: getSnapY('mid') }}
      className="fixed left-0 right-0 z-30 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      style={{ height: 'calc(100vh + 200px)' }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        <div className="w-10 h-1 rounded-full bg-slate-300 mb-2" />
        {communeCount != null && (
          <p className="text-xs font-semibold text-slate-500">
            {communeCount} commune{communeCount !== 1 ? 's' : ''} dans la zone
          </p>
        )}
      </div>

      {/* Scrollable content */}
      <div
        className="overflow-y-auto overscroll-contain px-4 pb-32"
        style={{
          height: `calc(100vh - ${HEADER_H + HANDLE_H}px)`,
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default BottomSheet;
