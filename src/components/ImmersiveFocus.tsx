import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Minimize2, 
  Maximize2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Keyboard
} from 'lucide-react';
import { TimerMode, TimerStatus, TimerSettings } from '../types';
import { MODES } from './ModeSelector';
import { playClick } from '../lib/audio';

interface ImmersiveFocusProps {
  mode: TimerMode;
  status: TimerStatus;
  remainingSec: number;
  elapsedSec: number;
  totalDurationSec: number;
  cycle: number;
  subject: string;
  settings: TimerSettings;
  todaySessionsCount: number;
  totalMinutesToday: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onExit: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedY: number;
  speedX: number;
  color: string;
}

export const ImmersiveFocus: React.FC<ImmersiveFocusProps> = ({
  mode,
  status,
  remainingSec,
  elapsedSec,
  totalDurationSec,
  cycle,
  subject,
  settings,
  todaySessionsCount,
  totalMinutesToday,
  onTogglePlay,
  onReset,
  onSkip,
  onExit,
}) => {
  // --- Cursor and Controls Visibility ---
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  // --- Clock Settings ---
  const [showClock, setShowClock] = useState(() => {
    return localStorage.getItem('timerra_immersive_clock') !== 'false';
  });
  const [currentTime, setCurrentTime] = useState('');

  // --- Dynamic Particles ---
  const [particles, setParticles] = useState<Particle[]>([]);

  // --- Golden completion glow state ---
  const [goldenBlast, setGoldenBlast] = useState(false);
  const prevRemainingSecRef = useRef(remainingSec);

  // --- Fullscreen State ---
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // --- Keyboard Shortcuts Help ---
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Update Clock continuously
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync clock preference
  useEffect(() => {
    localStorage.setItem('timerra_immersive_clock', String(showClock));
  }, [showClock]);

  // Generate background cinematic floating particles
  useEffect(() => {
    const pCount = 30;
    const initialParticles: Particle[] = Array.from({ length: pCount }).map((_, idx) => ({
      id: idx,
      x: Math.random() * 100,
      y: Math.random() * 100 + 100, // Start below screen or at bottom
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      speedY: Math.random() * 0.8 + 0.2,
      speedX: (Math.random() - 0.5) * 0.3,
      color: idx % 3 === 0 ? 'rgba(251, 191, 36, 0.4)' : idx % 3 === 1 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(255, 255, 255, 0.3)', // Gold, Cyan, or White
    }));
    setParticles(initialParticles);

    // Particle animator loop
    let animFrame: number;
    const updateParticles = () => {
      setParticles(prev => 
        prev.map(p => {
          let nextY = p.y - p.speedY;
          let nextX = p.x + p.speedX;
          // Wrap around screen boundaries
          if (nextY < -10) {
            nextY = 110;
            nextX = Math.random() * 100;
          }
          if (nextX < -5 || nextX > 105) {
            nextX = Math.random() * 100;
          }
          return { ...p, y: nextY, x: nextX };
        })
      );
      animFrame = requestAnimationFrame(updateParticles);
    };
    animFrame = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Monitor session completion trigger for Golden Energy Burst
  useEffect(() => {
    const prev = prevRemainingSecRef.current;
    // When count reaches zero from positive count
    if (prev > 0 && remainingSec === 0 && (mode === 'focus' || mode === 'deepFocus' || mode === 'sprint' || mode === 'marathon' || mode === 'zen')) {
      setGoldenBlast(true);
      const timer = setTimeout(() => setGoldenBlast(false), 5000);
      return () => clearTimeout(timer);
    }
    prevRemainingSecRef.current = remainingSec;
  }, [remainingSec, mode]);

  // Handle activity detection (Mouse movement and touch)
  const handleActivity = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      // Hide controls only if timer is running (to keep controls always active when paused/idle)
      if (status === 'running') {
        setControlsVisible(false);
      }
    }, 4000);
  };

  useEffect(() => {
    // Initial activity trigger
    handleActivity();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [status]);

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Handle local keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Space bar: Play/Pause
          e.preventDefault();
          onTogglePlay();
          handleActivity();
          break;
        case 'r': // Restart/Reset
          e.preventDefault();
          onReset();
          handleActivity();
          break;
        case 'n': // Next Session (Skip)
          e.preventDefault();
          onSkip();
          handleActivity();
          break;
        case 'f': // Toggle Fullscreen
          e.preventDefault();
          toggleFullscreen();
          handleActivity();
          break;
        case 'h':
        case '?':
          e.preventDefault();
          playClick();
          setShowShortcuts(prev => !prev);
          handleActivity();
          break;
        case 'escape': // Exit Immersive or Close Shortcuts
          e.preventDefault();
          if (showShortcuts) {
            playClick();
            setShowShortcuts(false);
          } else {
            onExit();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onReset, onSkip, onExit, showShortcuts]);

  // Compute fill ratio
  let fillLevel = 0;
  if (mode === 'stopwatch' || mode === 'infinityFocus') {
    fillLevel = Math.min(1, elapsedSec / 3600);
  } else if (totalDurationSec > 0) {
    fillLevel = Math.max(0, Math.min(1, remainingSec / totalDurationSec));
  }

  // Wave position
  const waveY = 92 - fillLevel * 84;

  // Formatting Stopwatch Time (HH:MM:SS.MS)
  const renderStopwatch = () => {
    const totalMs = Math.floor(elapsedSec * 1000);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
      <div className="flex items-baseline justify-center font-mono select-none cursor-default tabular-nums text-[7.5vw] md:text-[5vw] lg:text-[4.5vw] font-black tracking-tight leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        {h > 0 && (
          <>
            <span>{pad(h)}</span>
            <span className="text-[5vw] md:text-[3.5vw] font-medium mx-1 text-white/50">:</span>
          </>
        )}
        <span>{pad(m)}</span>
        <span className="text-[5vw] md:text-[3.5vw] font-medium mx-1 text-white/50">:</span>
        <span>{pad(s)}</span>
        <span className="text-[5vw] md:text-[3.5vw] font-medium mx-0.5 text-tm-primary">.</span>
        <span className="text-[5.5vw] md:text-[3.8vw] font-extrabold text-tm-primary/80">{pad(ms)}</span>
      </div>
    );
  };

  // Formatting Countdown Timer (MM:SS)
  const renderStandardTime = () => {
    const displaySecs = mode === 'infinityFocus' ? elapsedSec : remainingSec;
    const totalSeconds = Math.ceil(displaySecs);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
      <div 
        className="font-mono font-black select-none cursor-default tabular-nums text-[10vw] sm:text-[8vw] md:text-[6.5vw] lg:text-[6vw] leading-none text-white transition-all duration-300"
        style={{ textShadow: '0 4px 30px rgba(0, 0, 0, 0.7), 0 0 24px var(--tm-glow)' }}
      >
        {h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
      </div>
    );
  };

  const getModeLabel = () => {
    const match = MODES.find(m => m.id === mode);
    return match ? match.themeName : 'Study Period';
  };

  return (
    <div 
      className={`fixed inset-0 bg-[#04050d] z-50 overflow-hidden flex flex-col items-center justify-between py-8 sm:py-12 px-6 transition-all duration-1000 ${
        controlsVisible ? '' : 'cursor-none'
      }`}
    >
      {/* 1. CINEMATIC GRADIENT LIGHTING BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[#04050d]">
        {/* Shifting radial lighting spheres */}
        <div 
          className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-25 mix-blend-screen transition-all duration-[8000ms] ease-in-out"
          style={{
            background: mode.includes('Break')
              ? 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(3, 7, 18, 0) 70%)'
              : 'radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(3, 7, 18, 0) 70%)',
            left: status === 'running' ? '10%' : '50%',
            top: '20%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div 
          className="absolute w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-20 mix-blend-screen transition-all duration-[9000ms] ease-in-out"
          style={{
            background: mode.includes('Break')
              ? 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, rgba(3, 7, 18, 0) 75%)'
              : 'radial-gradient(circle, rgba(236, 72, 153, 0.24) 0%, rgba(3, 7, 18, 0) 75%)',
            right: status === 'running' ? '15%' : '40%',
            bottom: '10%',
            transform: 'translate(50%, 50%)',
          }}
        />

        {/* Slow Breathing Ambient Background Animation */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_100%)] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* 2. SOFT DRIFTING PARTICLES CANVAS */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full transition-transform duration-100 ease-out"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
              filter: p.size > 2 ? 'blur(0.5px)' : 'none',
              boxShadow: p.size > 2 ? `0 0 10px ${p.color}` : 'none',
            }}
          />
        ))}
      </div>

      {/* 3. TOP META PANEL (Clock, Subject, Goal, Back, toggles) */}
      <div 
        className={`w-full max-w-5xl flex items-center justify-between z-10 transition-opacity duration-700 ease-in-out ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Minimize2 className="w-4 h-4 text-tm-primary" />
            <span>Exit Immersive</span>
          </button>
          
          {/* Active Goal widget */}
          <div className="hidden xs:flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-500">Goal:</span>
            <span className="text-white font-mono font-bold">{todaySessionsCount}/{settings.cyclesBeforeLongBreak}</span>
          </div>
        </div>

        {/* Center Title branding info */}
        <div className="text-center">
          <span className="font-mono text-xs font-extrabold tracking-[0.4em] text-white/40 uppercase">
            TIME<span className="text-tm-primary/50">RRA</span>
          </span>
        </div>

        {/* Right Corner Control Panel */}
        <div className="flex items-center gap-3">
          {/* Optional Clock toggle */}
          {showClock && (
            <div className="bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl text-xs font-bold font-mono tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-tm-primary" />
              <span>{currentTime}</span>
            </div>
          )}

          <button
            onClick={() => setShowClock(!showClock)}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={showClock ? "Hide Clock" : "Show Clock"}
          >
            {showClock ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { playClick(); setShowShortcuts(true); }}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Keyboard Shortcuts (H or ?)"
          >
            <Keyboard className="w-4 h-4 text-tm-primary animate-pulse" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4. MAIN RESPONSIVE ORB & TIMER CORE AREA */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full z-10 max-h-[70vh]">
        
        {/* Cinematic double orbital orbits surrounding the core (responsive sizing) */}
        <div 
          className="absolute rounded-full border border-dashed border-tm-primary/10 animate-ring-1 pointer-events-none"
          style={{
            width: 'min(62vw, 550px)',
            height: 'min(62vw, 550px)',
            transform: 'rotateX(72deg) translateZ(0)',
          }}
        />
        <div 
          className="absolute rounded-full border-2 border-dotted border-tm-accent/10 animate-ring-2 pointer-events-none"
          style={{
            width: 'min(68vw, 600px)',
            height: 'min(68vw, 600px)',
            transform: 'rotateX(60deg) rotateY(15deg) translateZ(0)',
          }}
        />

        {/* THE IMMERSIVE RESPONSIVE RESPONSIVE ORB CORE (Occupies 45-60% of viewport) */}
        <div 
          className={`rounded-full relative flex flex-col items-center justify-center border transition-all duration-[1500ms] ${
            mode === 'focus' ? 'border-orange-500/20 shadow-[0_0_60px_rgba(245,158,11,0.2)] animate-breathe' :
            mode === 'stopwatch' ? 'border-blue-500/15 shadow-[0_0_50px_rgba(59,130,246,0.12)] animate-breathe' :
            mode === 'deepFocus' ? 'border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.18)] animate-breathe' :
            mode === 'infinityFocus' ? 'border-pink-500/20 shadow-[0_0_65px_rgba(236,72,153,0.18)] animate-breathe' :
            mode === 'shortBreak' ? 'border-sky-400/15 shadow-[0_0_45px_rgba(56,189,248,0.12)] animate-breathe' :
            mode === 'longBreak' ? 'border-indigo-400/15 shadow-[0_0_55px_rgba(79,70,229,0.15)] animate-breathe' :
            mode === 'sprint' ? 'border-red-500/25 shadow-[0_0_70px_rgba(239,68,68,0.22)] animate-breathe' :
            mode === 'marathon' ? 'border-yellow-600/20 shadow-[0_0_55px_rgba(217,119,6,0.15)] animate-breathe' :
            'border-teal-500/20 shadow-[0_0_50px_rgba(20,184,166,0.15)] animate-breathe' // zen
          }`}
          style={{
            width: 'min(50vw, 440px)',
            height: 'min(50vw, 440px)',
            minWidth: '220px',
            minHeight: '220px',
            animationDuration: '7s',
            background: 
              mode === 'focus' ? `radial-gradient(circle at 35% 35%, rgba(254,240,138,0.18) 0%, rgba(249,115,22,0.06) 50%, rgba(2,3,10,0.92) 100%)` :
              mode === 'stopwatch' ? `radial-gradient(circle at 35% 35%, rgba(191,219,254,0.15) 0%, rgba(30,58,138,0.06) 60%, rgba(2,3,10,0.95) 100%)` :
              mode === 'deepFocus' ? `radial-gradient(circle at 35% 35%, rgba(232,121,249,0.12) 0%, rgba(88,28,135,0.05) 60%, rgba(3,1,10,0.97) 100%)` :
              mode === 'infinityFocus' ? `radial-gradient(circle at 50% 50%, rgba(244,114,182,0.12) 0%, rgba(76,29,149,0.04) 50%, rgba(2,1,8,0.97) 100%)` :
              mode === 'shortBreak' ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25) 0%, rgba(186,230,253,0.15) 50%, rgba(5,30,55,0.92) 100%)` :
              mode === 'longBreak' ? `radial-gradient(circle at 35% 35%, rgba(226,232,240,0.12) 0%, rgba(30,27,75,0.05) 60%, rgba(2,1,10,0.97) 100%)` :
              mode === 'sprint' ? `radial-gradient(circle at 35% 35%, rgba(254,205,211,0.18) 0%, rgba(153,27,27,0.08) 60%, rgba(4,1,1,0.95) 100%)` :
              mode === 'marathon' ? `radial-gradient(circle at 35% 35%, rgba(253,230,138,0.15) 0%, rgba(120,53,15,0.05) 60%, rgba(3,1,1,0.95) 100%)` :
              `radial-gradient(circle at 35% 35%, rgba(204,251,241,0.15) 0%, rgba(17,94,89,0.04) 60%, rgba(1,4,4,0.95) 100%)` // zen
          }}
        >
          {/* Glass specular sweep highlight */}
          <div className="absolute top-2 inset-x-8 h-[20%] bg-gradient-to-b from-white/10 to-transparent rounded-full blur-[2px] z-10 pointer-events-none" />

          {/* Dynamic Wave levels Inside Orb */}
          {(mode === 'stopwatch' || mode === 'shortBreak' || mode === 'zen' || mode === 'focus') && (
            <div 
              className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none transition-all duration-1000 ease-in-out z-0 overflow-hidden rounded-full"
              style={{ transform: `translateY(${waveY}%)` }}
            >
              <div className={`absolute inset-0 w-[200%] h-full animate-wave-a opacity-15 ${
                mode === 'focus' ? 'text-orange-500' :
                mode === 'shortBreak' ? 'text-sky-400' :
                mode === 'zen' ? 'text-teal-400' : 'text-blue-500'
              }`}>
                <svg className="w-full h-full fill-current" viewBox="0 0 576 400" preserveAspectRatio="none">
                  <path d="M 0 15 Q 72 0, 144 15 T 288 15 T 432 15 T 576 15 L 576 400 L 0 400 Z" />
                </svg>
              </div>
            </div>
          )}

          {/* Inside-Orb Information Block */}
          <div className="flex flex-col items-center justify-center text-center px-4 relative z-10">
            {/* Minimalist Subject */}
            <span className={`text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase mb-1.5 px-3 py-1 rounded-full transition-all duration-300 truncate max-w-[170px] sm:max-w-[220px] ${
              status === 'running'
                ? 'text-tm-primary bg-tm-primary/5 border border-tm-primary/15'
                : 'text-white/40 bg-white/[0.01]'
            }`}>
              {subject || 'Silent Focus'}
            </span>

            {/* HIGH-READABILITY DYNAMIC RESPONSIVE TIMER READOUT */}
            <div className="min-h-[50px] sm:min-h-[70px] flex items-center justify-center w-full">
              {mode === 'stopwatch' ? renderStopwatch() : renderStandardTime()}
            </div>

            {/* Active Period Label */}
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 mt-2 flex items-center gap-1.5 justify-center">
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'running' ? 'bg-tm-primary animate-pulse shadow-[0_0_8px_var(--tm-primary)]' : 'bg-white/20'
              }`} />
              {getModeLabel()}
            </span>

            {/* Cycle and duration estimate details */}
            {mode !== 'stopwatch' && mode !== 'infinityFocus' && (
              <span className="text-[8px] sm:text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1.5">
                Cycle {cycle} • {settings.cyclesBeforeLongBreak - (cycle % settings.cyclesBeforeLongBreak || settings.cyclesBeforeLongBreak)} Left
              </span>
            )}
          </div>

          {/* 5. IMMERSIVE GOLDEN ENERGY Burst Overlay on Completion */}
          {goldenBlast && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden rounded-full">
              {/* Soft warm golden expanding core */}
              <div className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-yellow-300/40 via-amber-400/50 to-orange-400/40 animate-explosion" style={{ animationDuration: '2.5s' }} />
              <div className="absolute w-44 h-44 rounded-full border-2 border-yellow-400/30 animate-explosion" style={{ animationDuration: '3.5s', animationDelay: '0.2s' }} />
              
              {/* Soft floating golden dust particles */}
              {[...Array(12)].map((_, idx) => {
                const angle = `${idx * (360 / 12)}deg`;
                const dist = `${60 + Math.random() * 80}px`;
                return (
                  <span 
                    key={idx}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-500 shadow-[0_0_10px_#f59e0b] opacity-80"
                    style={{
                      '--angle': angle,
                      '--dist': dist,
                      animation: 'particle-drift 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                      animationDelay: `${idx * 0.08}s`
                    } as any}
                  />
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* 6. BOTTOM CONTROL DECK (Play/Pause, Reset, Next phase, Exit) */}
      <div 
        className={`w-full max-w-xl flex flex-col items-center gap-3.5 z-10 transition-opacity duration-700 ease-in-out ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Active subject info & streak overview */}
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400/70 font-semibold select-none flex items-center gap-1">
          <span>Currently studying</span>
          <span className="text-white font-bold">{subject || 'No Subject'}</span>
          <span>• Session duration {settings.focusMinutes}m</span>
        </p>

        {/* Minimal controls tray */}
        <div className="flex items-center gap-5 bg-black/40 backdrop-blur-md px-8 py-3.5 rounded-full border border-white/5 shadow-2xl transition-all duration-300 hover:scale-105">
          <button
            onClick={onReset}
            className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
            title="Restart Session (R)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-4.5 rounded-full bg-tm-primary hover:scale-105 active:scale-95 text-white transition-all cursor-pointer shadow-[0_0_20px_var(--tm-primary)]"
            title={status === 'running' ? 'Pause (Space)' : 'Play (Space)'}
          >
            {status === 'running' ? (
              <Pause className="w-6 h-6 fill-current text-white animate-pulse" />
            ) : (
              <Play className="w-6 h-6 fill-current text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={onSkip}
            className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
            title="Next Session (N)"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard shortcut guide */}
        <p className="text-[9px] text-slate-500 font-medium tracking-wider uppercase mt-1">
          [Space] Play/Pause • [R] Restart • [N] Next • [F] Fullscreen • <button onClick={() => { playClick(); setShowShortcuts(true); }} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 font-bold tracking-wider uppercase text-[9px] inline-flex items-center gap-0.5 select-none">[H or ?] Shortcuts</button> • [ESC] Exit
        </p>
      </div>

      {/* 7. GLASSMORPHIC KEYBOARD SHORTCUTS REFERENCE CARD OVERLAY */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative transform transition-all duration-300 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-tm-primary">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-sans font-bold text-white text-sm tracking-wide">
                    Timerra Shortcuts
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                    Quick Control Guide
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { playClick(); setShowShortcuts(false); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close shortcuts panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shortcut Grid */}
            <div className="p-6 space-y-4">
              {[
                { label: 'Play / Pause Session', keys: ['Space'] },
                { label: 'Restart Current Session', keys: ['R'] },
                { label: 'Skip to Next Phase', keys: ['N'] },
                { label: 'Toggle Fullscreen Mode', keys: ['F'] },
                { label: 'Toggle Shortcuts Panel', keys: ['H', '?'] },
                { label: 'Exit Immersive Focus', keys: ['ESC'] },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0 pb-3 last:pb-0">
                  <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    {item.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span className="text-[10px] text-slate-500 font-bold">or</span>}
                        <kbd className="min-w-[32px] h-6 px-2 bg-white/5 hover:bg-white/10 border-b-2 border-white/20 rounded font-mono text-[10px] text-white font-bold flex items-center justify-center shadow-inner tracking-widest uppercase">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950/40 border-t border-white/[0.05] text-center">
              <p className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">
                Press H, ?, ESC or Click Outside to Dismiss
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Keyframes injected safely */}
      <style>{`
        @keyframes breathe-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
        .animate-breathe {
          animation: breathe-gentle 7s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
};
