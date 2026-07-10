import React, { useState, useEffect } from 'react';
import { Settings, RotateCcw, Play, Pause, SkipForward, Database, Maximize2, Minimize2 } from 'lucide-react';
import { TimerStatus } from '../types';

interface ArcuateDeckProps {
  status: TimerStatus;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onToggleFullscreen: () => void;
}

export const ArcuateDeck: React.FC<ArcuateDeckProps> = ({
  status,
  isFullscreen,
  onTogglePlay,
  onReset,
  onSkip,
  onOpenSettings,
  onOpenBackup,
  onToggleFullscreen,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Responsive listener to scale arc radius beautifully
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configuration for 6 buttons along the deck
  const buttons = [
    { id: 'settings', label: 'Settings', icon: Settings, action: onOpenSettings },
    { id: 'reset', label: 'Reset Timer', icon: RotateCcw, action: onReset },
    { id: 'play', label: status === 'running' ? 'Pause' : 'Play', icon: status === 'running' ? Pause : Play, action: onTogglePlay, isCenter: true },
    { id: 'skip', label: 'Skip Cycle', icon: SkipForward, action: onSkip },
    { id: 'backup', label: 'Timerra Capsule', icon: Database, action: onOpenBackup },
    { id: 'fullscreen', label: 'Fullscreen', icon: isFullscreen ? Minimize2 : Maximize2, action: onToggleFullscreen },
  ];

  if (isMobile) {
    // Clean, robust linear flex row/grid on mobile to prevent clipping and guarantee perfect touch target sizes (>= 44px)
    return (
      <div className="w-full max-w-sm mx-auto px-4 mt-6">
        <div className="flex items-center justify-around gap-1 bg-white/[0.02] border border-white/5 p-2.5 rounded-2xl tm-glass shadow-xl">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={btn.action}
                title={btn.label}
                className={`rounded-full flex items-center justify-center group active:scale-95 cursor-pointer tm-btn transition-all duration-300 relative ${
                  btn.isCenter
                    ? 'w-13 h-13 bg-gradient-to-tr from-tm-primary to-tm-accent border-tm-primary/30 text-white shadow-md z-20'
                    : 'w-11 h-11 text-white/80 hover:text-white border border-white/5 bg-white/[0.01]'
                }`}
                style={{
                  minWidth: btn.isCenter ? '52px' : '44px',
                  minHeight: btn.isCenter ? '52px' : '44px',
                }}
              >
                {/* White reflection glints */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Glowing ring underlay on hover/touch */}
                <span className={`absolute -inset-0.5 rounded-full border border-tm-primary/0 group-hover:border-tm-primary/40 group-hover:shadow-[0_0_12px_var(--tm-glow)] transition-all pointer-events-none ${btn.isCenter ? 'border-white/20' : ''}`} />

                <Icon className={btn.isCenter ? 'w-5 h-5' : 'w-4.5 h-4.5'} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop/Tablet Arc Layout with exact radial angles
  const n = buttons.length;
  const spread = 46; // total arc degrees
  const start = -spread / 2;
  const step = spread / (n - 1);

  const radiusX = 240; // horizontal arc radius
  const radiusY = 20;   // vertical arc lift height

  return (
    <div className="w-full max-w-lg mx-auto relative h-32 mt-8 flex items-center justify-center">
      {/* Decorative track ring backing behind buttons */}
      <div 
        className="absolute border border-white/[0.03] rounded-full pointer-events-none"
        style={{
          width: '480px',
          height: '90px',
          top: '15px',
          transform: 'rotateX(75deg)',
        }}
      />

      {/* Render buttons mapped exactly to computed polar-to-cartesian offsets */}
      {buttons.map((btn, i) => {
        const angle = start + step * i;
        const rad = (angle * Math.PI) / 180;
        const x = Math.sin(rad) * radiusX;
        const y = -Math.cos(rad) * radiusY;

        const Icon = btn.icon;

        // Render layout
        return (
          <button
            key={btn.id}
            onClick={btn.action}
            title={btn.label}
            className={`absolute rounded-full flex items-center justify-center group active:scale-95 cursor-pointer tm-btn text-white/80 hover:text-white transition-all duration-300 ${
              btn.isCenter
                ? 'w-16 h-16 z-20 bg-gradient-to-tr from-tm-primary to-tm-accent border-tm-primary/30 text-white shadow-lg'
                : 'w-12 h-12 z-10'
            }`}
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            {/* White reflection glints */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Glowing ring underlay on hover */}
            <span className={`absolute -inset-0.5 rounded-full border border-tm-primary/0 group-hover:border-tm-primary/40 group-hover:shadow-[0_0_12px_var(--tm-glow)] transition-all pointer-events-none ${btn.isCenter ? 'border-white/20' : ''}`} />

            <Icon className={btn.isCenter ? 'w-7 h-7' : 'w-5 h-5'} />
          </button>
        );
      })}
    </div>
  );
};
