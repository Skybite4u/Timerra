import React, { useState, useEffect, useRef } from 'react';
import { TimerMode, TimerStatus } from '../types';
import { MODES } from './ModeSelector';

interface CircularTimerProps {
  mode: TimerMode;
  status: TimerStatus;
  remainingSec: number;
  elapsedSec: number;
  totalDurationSec: number;
  cycle: number;
  subject: string;
  isFullscreen?: boolean;
  completedCycles?: number;
  totalCyclesTarget?: number;
}

// 100% Static background components wrapped in React.memo to completely bypass virtual DOM diffing and re-renders
const DoubleOrbitalRings = React.memo(() => (
  <>
    {/* Ring 1 - Standard rotation with state color accents */}
    <div 
      className="absolute rounded-full border border-dashed border-tm-primary/25 animate-ring-1 transition-all duration-[1000ms]"
      style={{
        width: '112%',
        height: '112%',
        transformStyle: 'preserve-3d',
        transform: 'rotateX(72deg)',
      }}
    >
      <span className="absolute w-3 h-3 rounded-full bg-tm-primary shadow-[0_0_15px_var(--tm-primary)] top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors duration-[1000ms]" />
    </div>

    {/* Ring 2 - Alternate reversed angle */}
    <div 
      className="absolute rounded-full border-2 border-dotted border-tm-accent/20 animate-ring-2 transition-all duration-[1000ms]"
      style={{
        width: '122%',
        height: '122%',
        transformStyle: 'preserve-3d',
        transform: 'rotateX(64deg) rotateY(18deg)',
      }}
    >
      <span className="absolute w-2.5 h-2.5 rounded-full bg-tm-accent shadow-[0_0_12px_var(--tm-accent)] bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 transition-colors duration-[1000ms]" />
    </div>
  </>
));
DoubleOrbitalRings.displayName = 'DoubleOrbitalRings';

const SolarParticleOrbits = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-0">
    <div className="absolute w-full h-full animate-sun-spin">
      <span className="absolute w-2 h-2 rounded-full bg-amber-400 blur-[1px] top-4 left-1/3 shadow-[0_0_8px_#F59E0B]" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300 blur-[1px] bottom-10 right-1/4 shadow-[0_0_6px_#FFE066]" />
      <span className="absolute w-2 h-2 rounded-full bg-orange-400 blur-[1px] top-1/2 right-4 shadow-[0_0_8px_#EA580C]" />
    </div>
  </div>
));
SolarParticleOrbits.displayName = 'SolarParticleOrbits';

const ShortBreakBirds = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-full">
    <svg className="absolute w-5 h-5 text-sky-400 animate-bird" style={{ animationDelay: '0s' }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21c-1.1 0-2-.9-2-2v-4.5c0-.8-.7-1.5-1.5-1.5H4c-1.1 0-2-.9-2-2s.9-2 2-2h4.5c.8 0 1.5-.7 1.5-1.5V4c0-1.1.9-2 2-2s2 .9 2 2v4.5c0 .8.7 1.5 1.5 1.5H20c1.1 0 2 .9 2 2s-.9 2-2 2h-4.5c-.8 0-1.5.7-1.5 1.5V19c0 1.1-.9 2-2 2z" className="scale-[0.5] origin-center" />
    </svg>
    <svg className="absolute w-4 h-4 text-sky-300 animate-bird" style={{ animationDelay: '6s' }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21c-1.1 0-2-.9-2-2v-4.5c0-.8-.7-1.5-1.5-1.5H4c-1.1 0-2-.9-2-2s.9-2 2-2h4.5c.8 0 1.5-.7 1.5-1.5V4c0-1.1.9-2 2-2s2 .9 2 2v4.5c0 .8.7 1.5 1.5 1.5H20c1.1 0 2 .9 2 2s-.9 2-2 2h-4.5c-.8 0-1.5.7-1.5 1.5V19c0 1.1-.9 2-2 2z" className="scale-[0.5] origin-center" />
    </svg>
  </div>
));
ShortBreakBirds.displayName = 'ShortBreakBirds';

const TwinklingStars = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-0">
    <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDuration: '2s' }} />
    <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDuration: '3.5s' }} />
    <div className="absolute bottom-1/4 left-1/3 w-1 h-1 rounded-full bg-slate-300 animate-pulse" style={{ animationDuration: '2.8s' }} />
    <div className="absolute bottom-1/3 right-1/3 w-1 h-1 rounded-full bg-slate-200 animate-pulse" style={{ animationDuration: '4s' }} />
  </div>
));
TwinklingStars.displayName = 'TwinklingStars';

const SprintSpeedLines = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-full">
    <div className="absolute w-[1.5px] h-10 bg-orange-400/40 left-12 animate-speed-line" style={{ animationDelay: '0s', animationDuration: '1.2s' }} />
    <div className="absolute w-[1.5px] h-14 bg-red-400/40 right-14 animate-speed-line" style={{ animationDelay: '0.4s', animationDuration: '0.9s' }} />
    <div className="absolute w-[2px] h-8 bg-yellow-400/30 left-1/2 animate-speed-line" style={{ animationDelay: '0.8s', animationDuration: '1.5s' }} />
  </div>
));
SprintSpeedLines.displayName = 'SprintSpeedLines';

const LibraryDust = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-full">
    <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/60 left-16 animate-dust" style={{ animationDelay: '0s', animationDuration: '6s' }} />
    <span className="absolute w-2 h-2 rounded-full bg-yellow-300/60 right-20 animate-dust" style={{ animationDelay: '2s', animationDuration: '4.5s' }} />
    <span className="absolute w-1 h-1 rounded-full bg-amber-300/50 left-1/2 animate-dust" style={{ animationDelay: '3.5s', animationDuration: '5.2s' }} />
  </div>
));
LibraryDust.displayName = 'LibraryDust';

const CherryBlossoms = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-full">
    <span className="absolute w-2 h-3 bg-pink-300/70 rounded-full left-24 animate-cherry" style={{ animationDelay: '0s', animationDuration: '10s' }} />
    <span className="absolute w-2.5 h-3.5 bg-pink-400/60 rounded-full right-24 animate-cherry" style={{ animationDelay: '3s', animationDuration: '8s' }} />
  </div>
));
CherryBlossoms.displayName = 'CherryBlossoms';

const CrystalCoreDecorator = React.memo<{ isFullscreen: boolean }>(({ isFullscreen }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 scale-90 sm:scale-105">
    <svg className={`${isFullscreen ? 'w-80 h-80 sm:w-96 sm:h-96' : 'w-48 h-48'} opacity-80 transition-all duration-500`} viewBox="0 0 100 100" fill="none">
      <polygon points="50,12 72,40 50,60 28,40" fill="url(#crysTopGrad)" opacity="0.85" />
      <polygon points="28,40 50,60 50,92 14,54" fill="url(#crysSideLGrad)" opacity="0.75" />
      <polygon points="72,40 50,60 50,92 86,54" fill="url(#crysSideRGrad)" opacity="0.85" />
      <defs>
        <linearGradient id="crysTopGrad" x1="50" y1="12" x2="50" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="crysSideLGrad" x1="28" y1="40" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="crysSideRGrad" x1="72" y1="40" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#701A75" />
        </linearGradient>
      </defs>
    </svg>
  </div>
));
CrystalCoreDecorator.displayName = 'CrystalCoreDecorator';

const MoonCoreDecorator = React.memo<{ isFullscreen: boolean }>(({ isFullscreen }) => (
  <div className="absolute inset-0 pointer-events-none z-0">
    {/* Aurora background - animated 100% via CSS for hardware acceleration */}
    <div 
      className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-teal-500/20 via-emerald-500/25 to-indigo-500/20 blur-2xl transition-all animate-aurora"
    />
    {/* Silver Moon */}
    <div className={`absolute top-10 right-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-400 opacity-30 shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center transition-all duration-500 ${isFullscreen ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-24 h-24'}`}>
      <span className="absolute w-4 h-4 rounded-full bg-black/5 top-3 left-6" />
      <span className="absolute w-3 h-3 rounded-full bg-black/5 bottom-4 left-4" />
      <span className="absolute w-5 h-5 rounded-full bg-black/5 bottom-6 right-6" />
    </div>
  </div>
));
MoonCoreDecorator.displayName = 'MoonCoreDecorator';

const FlickeringFlames = React.memo(() => (
  <div className="absolute inset-x-0 bottom-0 h-32 flex items-end justify-center pointer-events-none z-0">
    <svg className="w-40 h-28 opacity-85" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,10 70,80 62,95 38,95 30,80" fill="#EF4444" opacity="0.3" />
      <polygon points="50,30 65,85 58,95 42,95 35,85" fill="#F97316" opacity="0.5" />
      <polygon points="50,50 58,90 54,95 46,95 42,90" fill="#FBBF24" opacity="0.8" />
    </svg>
  </div>
));
FlickeringFlames.displayName = 'FlickeringFlames';

const WaterRipples = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-between">
    {/* Water ripples */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute w-48 h-48 rounded-full border border-teal-400/20 animate-ripple" style={{ animationDelay: '0s' }} />
      <div className="absolute w-48 h-48 rounded-full border border-teal-400/20 animate-ripple" style={{ animationDelay: '2s' }} />
    </div>
    {/* Stones at the bottom */}
    <div className="flex justify-center gap-1.5 pb-3 z-10 mt-auto">
      <span className="w-10 h-5 bg-slate-800/80 rounded-full blur-[1px] border border-slate-700/20" />
      <span className="w-8 h-4.5 bg-slate-700/80 rounded-full blur-[1px] border border-slate-600/20" />
      <span className="w-12 h-6.5 bg-slate-800/90 rounded-full blur-[1px] border border-slate-700/20" />
    </div>
  </div>
));
WaterRipples.displayName = 'WaterRipples';

export const CircularTimer = React.memo<CircularTimerProps>(({
  mode,
  status,
  remainingSec,
  elapsedSec,
  totalDurationSec,
  cycle,
  subject,
  isFullscreen = false,
  completedCycles,
  totalCyclesTarget,
}) => {
  const [explosionActive, setExplosionActive] = useState(false);
  const prevModeRef = useRef<TimerMode>(mode);

  // Trigger Pomodoro finish explosion when transition happens from focus to a break, or when countdown reaches zero
  useEffect(() => {
    if (prevModeRef.current === 'focus' && (mode === 'shortBreak' || mode === 'longBreak')) {
      setExplosionActive(true);
      const timer = setTimeout(() => setExplosionActive(false), 3500);
      return () => clearTimeout(timer);
    }
    prevModeRef.current = mode;
  }, [mode]);

  // Handle local explosion trigger just in case
  useEffect(() => {
    if (mode === 'focus' && remainingSec <= 0.05 && status === 'running') {
      setExplosionActive(true);
      const timer = setTimeout(() => setExplosionActive(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [remainingSec, mode, status]);

  // Compute fill ratio
  let fillLevel = 0;
  if (mode === 'stopwatch' || mode === 'infinityFocus') {
    fillLevel = Math.min(1, elapsedSec / 3600); // Rises slowly
  } else if (totalDurationSec > 0) {
    fillLevel = Math.max(0, Math.min(1, remainingSec / totalDurationSec)); // Drains
  }

  // Wave position
  const waveY = 92 - fillLevel * 84;

  // Setup default values for completed and target cycles
  const completedCount = completedCycles !== undefined ? completedCycles : Math.max(0, cycle - 1);
  const targetCount = totalCyclesTarget || 4;

  const cycleDots = Array.from({ length: targetCount }).map((_, i) => {
    // Distribute around the ring of radius 44.5 inside a 100x100 SVG viewbox
    // Start from -Math.PI / 2 (top) and go clockwise
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / targetCount;
    const cx = 50 + 44.5 * Math.cos(angle);
    const cy = 50 + 44.5 * Math.sin(angle);
    const isCompleted = i < completedCount;
    const isCurrent = i === completedCount && ['focus', 'deepFocus', 'sprint', 'marathon', 'zen'].includes(mode) && status === 'running';
    return { cx, cy, isCompleted, isCurrent, index: i };
  });

  // Render Stopwatch (Hours, Minutes, Seconds, Milliseconds)
  const renderStopwatchTime = () => {
    const totalMs = Math.floor(elapsedSec * 1000);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
      <div className="flex items-baseline justify-center font-mono text-white select-text cursor-default tabular-nums">
        {h > 0 && (
          <>
            <span className={isFullscreen ? "text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black" : "text-3xl sm:text-5xl md:text-6xl font-black"}>{pad(h)}</span>
            <span className={isFullscreen ? "text-2xl sm:text-4xl md:text-5xl font-medium mx-1 text-white/50" : "text-lg sm:text-2xl md:text-3xl font-medium mx-0.5 text-white/50"}>:</span>
          </>
        )}
        <span className={isFullscreen ? "text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black" : "text-3xl sm:text-5xl md:text-6xl font-black"}>{pad(m)}</span>
        <span className={isFullscreen ? "text-2xl sm:text-4xl md:text-5xl font-medium mx-1 text-white/50" : "text-lg sm:text-2xl md:text-3xl font-medium mx-0.5 text-white/50"}>:</span>
        <span className={isFullscreen ? "text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black" : "text-3xl sm:text-5xl md:text-6xl font-black"}>{pad(s)}</span>
        <span className={isFullscreen ? "text-2xl sm:text-4xl md:text-5xl font-medium mx-1 text-tm-primary" : "text-lg sm:text-2xl md:text-3xl font-medium mx-0.5 text-tm-primary"}>.</span>
        <span className={isFullscreen ? "text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-tm-primary/80" : "text-xl sm:text-3xl md:text-4xl font-extrabold text-tm-primary/80"}>{pad(ms)}</span>
      </div>
    );
  };

  // Render countdown or infinity count-up formats
  const renderStandardTime = () => {
    const displaySecs = mode === 'infinityFocus' ? elapsedSec : remainingSec;
    const totalSeconds = Math.ceil(displaySecs);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
      <h1 
        className={`font-mono font-bold tracking-tight text-white select-text cursor-default tabular-nums ${
          isFullscreen 
            ? 'text-6xl sm:text-8xl md:text-[8rem] lg:text-[10rem] leading-none' 
            : 'text-4xl sm:text-6xl md:text-7xl'
        }`}
        style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 16px var(--tm-glow)' }}
      >
        {h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
      </h1>
    );
  };

  // Human-friendly mode titles
  const getModeLabel = () => {
    const match = MODES.find(m => m.id === mode);
    return match ? match.themeName : 'Focus Period';
  };

  // Calculate Estimated Finish (Only for Countdown modes like Deep Focus)
  const getEstFinishTime = () => {
    const finishTime = new Date(Date.now() + remainingSec * 1000);
    return finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 relative select-none w-full">
      
      {/* Scoped Embedded CSS animations for premium hardware-accelerated 60fps rendering */}
      <style>{`
        /* Core rotations */
        @keyframes sun-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes float-calm {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes crystal-shimmer {
          0%, 100% { filter: hue-rotate(0deg) brightness(1); }
          50% { filter: hue-rotate(25deg) brightness(1.2); }
        }
        @keyframes galaxy-swirl-anim {
          0% { transform: rotate(360deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes cloud-move-slow {
          0%, 100% { transform: translateX(-5px) translateY(0); }
          50% { transform: translateX(5px) translateY(-3px); }
        }
        @keyframes bird-fly {
          0% { transform: translate(-40px, 15px) scale(0.7); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translate(50px, -20px) scale(0.9); opacity: 0; }
        }
        @keyframes speed-line-fall {
          0% { transform: translateY(-120px); opacity: 0; }
          30% { opacity: 0.6; }
          70% { opacity: 0.6; }
          100% { transform: translateY(120px); opacity: 0; }
        }
        @keyframes dust-rise {
          0% { transform: translateY(60px) scale(0.6); opacity: 0; }
          40% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-60px) scale(1.1); opacity: 0; }
        }
        @keyframes ripple-wave {
          0% { transform: scale(0.4); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes cherry-fall {
          0% { transform: translate(-30px, -60px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translate(30px, 60px) rotate(240deg); opacity: 0; }
        }
        @keyframes explosion-burst {
          0% { transform: scale(0.7); opacity: 0; filter: blur(0px); }
          15% { opacity: 1; filter: blur(2px); }
          100% { transform: scale(1.8); opacity: 0; filter: blur(15px); }
        }
        @keyframes particle-drift {
          0% { transform: rotate(0deg) translate(0, 0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: rotate(var(--angle)) translate(var(--dist), var(--dist)); opacity: 0; }
        }

        .animate-sun-spin { animation: sun-spin 18s linear infinite; will-change: transform; }
        .animate-float-gentle { animation: float-gentle 6s ease-in-out infinite; will-change: transform; }
        .animate-float-calm { animation: float-calm 8s ease-in-out infinite; will-change: transform; }
        .animate-crystal-shimmer { animation: crystal-shimmer 12s ease-in-out infinite; will-change: filter; }
        .animate-galaxy { animation: galaxy-swirl-anim 25s linear infinite; will-change: transform; }
        .animate-cloud-slow { animation: cloud-move-slow 8s ease-in-out infinite; will-change: transform; }
        .animate-bird { animation: bird-fly 14s ease-in-out infinite; will-change: transform; }
        .animate-speed-line { animation: speed-line-fall 1.5s linear infinite; will-change: transform; }
        .animate-dust { animation: dust-rise 5s ease-in-out infinite; will-change: transform; }
        .animate-ripple { animation: ripple-wave 4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite; will-change: transform, opacity; }
        .animate-cherry { animation: cherry-fall 9s ease-in-out infinite; will-change: transform, opacity; }
        .animate-explosion { animation: explosion-burst 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; will-change: transform, opacity; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 3D Orbit Perspective Container */}
      <div 
        className={`relative flex items-center justify-center transition-all duration-700 ${
          isFullscreen 
            ? 'w-[320px] h-[320px] xs:w-[420px] xs:h-[420px] sm:w-[520px] sm:h-[520px] md:w-[620px] md:h-[620px] lg:w-[680px] lg:h-[680px]' 
            : 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96'
        }`}
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        
        {/* --- DYNAMIC DOUBLE ORBITAL RINGS --- */}
        <DoubleOrbitalRings />

        {/* --- DYNAMIC AMBIENT SHIFTING PARTICLES --- */}
        {mode === 'focus' && <SolarParticleOrbits />}
        {mode === 'shortBreak' && <ShortBreakBirds />}
        {mode === 'longBreak' && <TwinklingStars />}
        {mode === 'sprint' && <SprintSpeedLines />}
        {mode === 'marathon' && <LibraryDust />}
        {mode === 'zen' && <CherryBlossoms />}

        {/* --- THE SIGNATURE MORPHING ORB --- */}
        <div 
          className={`w-full h-full rounded-full relative overflow-hidden tm-orb flex flex-col items-center justify-center z-10 transition-all duration-[1000ms] ${
            mode === 'focus' ? 'animate-float-gentle border-orange-500/30 shadow-[0_0_40px_rgba(245,158,11,0.25)]' :
            mode === 'stopwatch' ? 'animate-float-calm border-blue-500/20 shadow-[0_0_35px_rgba(59,130,246,0.15)]' :
            mode === 'deepFocus' ? 'animate-float-calm animate-crystal-shimmer border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.2)]' :
            mode === 'infinityFocus' ? 'animate-galaxy border-pink-500/30 shadow-[0_0_45px_rgba(236,72,153,0.2)]' :
            mode === 'shortBreak' ? 'animate-float-gentle border-sky-400/20 shadow-[0_0_30px_rgba(56,189,248,0.15)]' :
            mode === 'longBreak' ? 'animate-float-gentle border-indigo-400/20 shadow-[0_0_40px_rgba(79,70,229,0.2)]' :
            mode === 'sprint' ? 'animate-breathe border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)]' :
            mode === 'marathon' ? 'animate-float-gentle border-yellow-600/30 shadow-[0_0_35px_rgba(217,119,6,0.2)]' :
            'animate-float-gentle border-teal-500/30 shadow-[0_0_35px_rgba(20,184,166,0.2)]' // zen
          }`}
          style={{ 
            transformStyle: 'preserve-3d',
            background: 
              mode === 'focus' ? `radial-gradient(circle at 30% 30%, rgba(254,240,138,0.25) 0%, rgba(249,115,22,0.1) 50%, rgba(0,0,0,0.85) 100%)` :
              mode === 'stopwatch' ? `radial-gradient(circle at 30% 30%, rgba(191,219,254,0.18) 0%, rgba(30,58,138,0.1) 60%, rgba(0,0,0,0.9) 100%)` :
              mode === 'deepFocus' ? `radial-gradient(circle at 30% 30%, rgba(232,121,249,0.15) 0%, rgba(88,28,135,0.08) 60%, rgba(5,2,15,0.95) 100%)` :
              mode === 'infinityFocus' ? `radial-gradient(circle at 50% 50%, rgba(244,114,182,0.15) 0%, rgba(76,29,149,0.05) 50%, rgba(3,1,10,0.95) 100%)` :
              mode === 'shortBreak' ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35) 0%, rgba(186,230,253,0.2) 50%, rgba(12,74,110,0.85) 100%)` :
              mode === 'longBreak' ? `radial-gradient(circle at 30% 30%, rgba(226,232,240,0.15) 0%, rgba(30,27,75,0.08) 60%, rgba(3,2,12,0.95) 100%)` :
              mode === 'sprint' ? `radial-gradient(circle at 30% 30%, rgba(254,205,211,0.22) 0%, rgba(153,27,27,0.1) 60%, rgba(10,1,1,0.9) 100%)` :
              mode === 'marathon' ? `radial-gradient(circle at 30% 30%, rgba(253,230,138,0.2) 0%, rgba(120,53,15,0.08) 60%, rgba(8,2,1,0.9) 100%)` :
              `radial-gradient(circle at 30% 30%, rgba(204,251,241,0.2) 0%, rgba(17,94,89,0.05) 60%, rgba(2,6,6,0.9) 100%)` // zen
          }}
        >

          {/* --- LAYERED VISUAL ELEMENTS --- */}

          {/* 1. Waves (Used in Stopwatch, Cloud Nest, Zen Garden) */}
          {(mode === 'stopwatch' || mode === 'shortBreak' || mode === 'zen' || mode === 'focus') && (
            <div 
              className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none transition-all duration-[1000ms] cubic-bezier(0.4, 0, 0.2, 1) z-0"
              style={{ transform: `translateY(${waveY}%)` }}
            >
              {/* Wave A */}
              <div className={`absolute inset-0 w-[200%] h-full animate-wave-a transition-all duration-700 ${
                mode === 'focus' ? 'text-orange-500/10' :
                mode === 'shortBreak' ? 'text-sky-400/25' :
                mode === 'zen' ? 'text-teal-400/15' :
                'text-blue-500/15'
              }`}>
                <svg className="w-full h-full fill-current" viewBox="0 0 576 400" preserveAspectRatio="none">
                  <path d="M 0 15 Q 72 0, 144 15 T 288 15 T 432 15 T 576 15 L 576 400 L 0 400 Z" />
                </svg>
              </div>

              {/* Wave B */}
              <div className={`absolute inset-0 w-[200%] h-full animate-wave-b transition-all duration-700 ${
                mode === 'focus' ? 'text-amber-500/5' :
                mode === 'shortBreak' ? 'text-white/20' :
                mode === 'zen' ? 'text-teal-300/10' :
                'text-cyan-400/10'
              }`} style={{ filter: 'hue-rotate(12deg)' }}>
                <svg className="w-full h-full fill-current" viewBox="0 0 576 400" preserveAspectRatio="none">
                  <path d="M 0 12 Q 72 25, 144 12 T 288 12 T 432 12 T 576 12 L 576 400 L 0 400 Z" />
                </svg>
              </div>
            </div>
          )}

          {/* 2. Solar Plasma SVG Overlays (Solar Orb Theme) */}
          {mode === 'focus' && (
            <div className="absolute inset-0 pointer-events-none z-0 mix-blend-screen opacity-70">
              {/* Core Sun Brightness factor */}
              <svg className="w-full h-full animate-sun-spin" viewBox="0 0 100 100">
                <defs>
                  <radialGradient id="sunCoreGrad">
                    <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r={22 + (status === 'running' ? 4 : 0) * fillLevel} fill="url(#sunCoreGrad)" className="transition-all duration-1000" />
                {/* Plasma bursts */}
                <ellipse cx="50" cy="50" rx="35" ry="12" fill="#FBBF24" opacity="0.15" transform="rotate(30 50 50)" />
                <ellipse cx="50" cy="50" rx="35" ry="12" fill="#EA580C" opacity="0.15" transform="rotate(110 50 50)" />
              </svg>
            </div>
          )}

          {/* 3. Floating 3D Crystal Core (Crystal Core Theme) */}
          {mode === 'deepFocus' && <CrystalCoreDecorator isFullscreen={isFullscreen} />}

          {/* 4. Nebula Clouds and Galaxy Swirl (Galaxy Core Theme) */}
          {mode === 'infinityFocus' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden rounded-full scale-100 opacity-80">
              <div 
                className="w-full h-full flex items-center justify-center transition-all duration-1000"
                style={{
                  // Brighter galaxy as time increases
                  filter: `brightness(${1 + Math.min(1.2, elapsedSec / 1200)}) saturate(${1 + Math.min(0.8, elapsedSec / 1800)})`
                }}
              >
                <svg className={`${isFullscreen ? 'w-80 h-80 sm:w-[420px] sm:h-[420px]' : 'w-56 h-56'} animate-sun-spin transition-all duration-500`} viewBox="0 0 100 100" fill="none">
                  {/* Outer spiral */}
                  <path d="M50 50 Q66 30 60 12 T32 8" stroke="url(#galCorePink)" strokeWidth="4.5" strokeLinecap="round" opacity="0.8" />
                  <path d="M50 50 Q34 70 40 88 T68 92" stroke="url(#galCorePink)" strokeWidth="4.5" strokeLinecap="round" opacity="0.8" />
                  <path d="M50 50 Q28 35 18 56 T36 78" stroke="url(#galCoreBlue)" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
                  <path d="M50 50 Q72 65 82 44 T64 22" stroke="url(#galCoreBlue)" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
                  {/* Central hyper-glowing white hole */}
                  <circle cx="50" cy="50" r="9" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 10px #F472B6)' }} />
                  <defs>
                    <linearGradient id="galCorePink" x1="0" y1="0" x2="100" y2="100%">
                      <stop offset="0%" stopColor="#F472B6" />
                      <stop offset="100%" stopColor="#DB2777" />
                    </linearGradient>
                    <linearGradient id="galCoreBlue" x1="0" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#312E81" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {/* 5. Glowing Moon & Aurora (Moon Core Theme) */}
          {mode === 'longBreak' && <MoonCoreDecorator isFullscreen={isFullscreen} />}

          {/* 6. Flickering Flames (Rocket Engine Theme) */}
          {mode === 'sprint' && <FlickeringFlames />}

          {/* 7. Shimmering glass Water ripples & Stones (Zen Garden Theme) */}
          {mode === 'zen' && <WaterRipples />}

          {/* Specular glass reflection top highlight (VisionOS feel) */}
          <div 
            className="absolute top-3 inset-x-12 h-[22%] bg-gradient-to-b from-white/20 to-transparent rounded-full blur-[3px] z-20 pointer-events-none"
            style={{ transform: 'translateZ(20px)' }}
          />

          {/* Bottom rim subtle ambient glow */}
          <div 
            className="absolute bottom-2 inset-x-16 h-[12%] bg-gradient-to-t from-white/10 to-transparent rounded-full blur-[5px] z-20 pointer-events-none"
            style={{ transform: 'translateZ(15px)' }}
          />

          {/* --- CYCLE RING VISUALIZATION --- */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none" viewBox="0 0 100 100">
            {/* Subtle connecting track line */}
            <circle
              cx="50"
              cy="50"
              r="44.5"
              fill="none"
              stroke="currentColor"
              className="text-white/[0.04]"
              strokeWidth="0.75"
              strokeDasharray="1.5 2.5"
            />
            {cycleDots.map((dot) => (
              <g key={dot.index} className="transition-all duration-500">
                {/* Outer halo / glowing layer for completed dots */}
                {dot.isCompleted && (
                  <circle
                    cx={dot.cx}
                    cy={dot.cy}
                    r="4.5"
                    fill="currentColor"
                    className="text-tm-primary/20 blur-[2px]"
                  />
                )}
                {dot.isCurrent && (
                  <circle
                    cx={dot.cx}
                    cy={dot.cy}
                    r="5.5"
                    fill="none"
                    stroke="currentColor"
                    className="text-tm-primary animate-pulse"
                    strokeWidth="0.5"
                    style={{ transformOrigin: '50% 50%' }}
                  />
                )}
                
                {/* Core Dot */}
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.isCurrent ? 2.5 : 1.8}
                  className={`transition-all duration-500 ${
                    dot.isCompleted
                      ? 'fill-tm-primary stroke-tm-primary/40 stroke-[0.5]'
                      : dot.isCurrent
                      ? 'fill-tm-primary shadow-[0_0_8px_var(--tm-primary)]'
                      : 'fill-white/10 stroke-white/5 stroke-[0.5]'
                  }`}
                />
                
                {/* Standard browser tooltip on hover */}
                <title>
                  {`Cycle ${dot.index + 1}: ${
                    dot.isCompleted ? 'Completed' : dot.isCurrent ? 'In Progress' : 'Remaining'
                  }`}
                </title>
              </g>
            ))}
          </svg>

          {/* --- MAIN DISPLAY CONTENT INSIDE ORB (3D perspective layer) --- */}
          <div 
            className="flex flex-col items-center justify-center z-20 text-center px-6 relative w-full"
            style={{ transform: 'translateZ(40px)' }}
          >
            {/* Subject Indicator */}
            <span className={`text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-1 drop-shadow-md truncate max-w-[190px] sm:max-w-[240px] px-3 py-1 rounded-full transition-all duration-300 ${
              status === 'running'
                ? 'text-tm-primary bg-tm-primary/10 border border-tm-primary/30 shadow-[0_0_15px_rgba(var(--tm-glow-rgb),0.2)] animate-pulse'
                : 'text-white/50 bg-white/[0.02] border border-white/5'
            }`}>
              {subject || 'No Subject'}
            </span>

            {/* Time Readout Box */}
            <div className="min-h-[50px] sm:min-h-[64px] flex items-center justify-center w-full">
              {mode === 'stopwatch' ? renderStopwatchTime() : renderStandardTime()}
            </div>

            {/* Dynamic Live Minute/Remaining Time Counter */}
            {mode !== 'stopwatch' && mode !== 'infinityFocus' && (
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-tm-primary/90 mt-0.5 animate-pulse">
                Remaining Time: {Math.floor(remainingSec / 60)}m {Math.floor(remainingSec % 60)}s
              </div>
            )}

            {/* Status / Label */}
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] uppercase text-white/70 mt-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                status === 'running' 
                  ? 'bg-tm-primary animate-pulse shadow-[0_0_8px_var(--tm-primary)]' 
                  : 'bg-white/30'
              }`} />
              {getModeLabel()}
            </span>

            {/* Specialized Secondary Metric display */}
            {mode === 'deepFocus' && status === 'running' && (
              <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest mt-2 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10 transition-all duration-500">
                Finish ~ {getEstFinishTime()}
              </span>
            )}

            {mode === 'infinityFocus' && status === 'running' && (
              <span className="text-[9px] sm:text-[10px] text-pink-400/80 uppercase tracking-widest mt-2 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/10 transition-all duration-500">
                Energy: {Math.floor(elapsedSec / 10)} CP
              </span>
            )}

            {/* Cycle Count Indicator (Only for Pomodoro/Break modes) */}
            {mode !== 'stopwatch' && mode !== 'infinityFocus' && (
              <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest mt-2.5">
                Cycle {cycle}
              </span>
            )}
          </div>

          {/* --- EXPLOSION PARTICLE BURST OVERLAY (Pomodoro Finish) --- */}
          {explosionActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden rounded-full">
              {/* Central flare */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-300 animate-explosion" />
              {/* Flaring sun-spot rings */}
              <div className="absolute w-36 h-36 rounded-full border-4 border-amber-400/40 animate-explosion" style={{ animationDelay: '0.15s' }} />
              {/* Small dynamic particle bursts */}
              {[...Array(14)].map((_, idx) => {
                const angle = `${idx * (360 / 14)}deg`;
                const dist = `${40 + Math.random() * 50}px`;
                return (
                  <span 
                    key={idx}
                    className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-300 to-orange-500"
                    style={{
                      '--angle': angle,
                      '--dist': dist,
                      animation: 'particle-drift 1.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                      animationDelay: `${Math.random() * 0.15}s`
                    } as any}
                  />
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
});

CircularTimer.displayName = 'CircularTimer';
