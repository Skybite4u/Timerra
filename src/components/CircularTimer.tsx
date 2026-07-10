import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Settings,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { TimerMode, TimerStatus } from '../types';

interface CircularTimerProps {
  minutes: string;
  seconds: string;
  status: TimerStatus;
  mode: TimerMode;
  progress: number; // 0 to 100
  onStartPause: () => void;
  onReset: () => void;
  subject: string;
  subjectColor?: string; // Persistent custom color
  onSkip?: () => void;
  onPrevSubject?: () => void;
  onNextSubject?: () => void;
  cycleInfo?: string; // e.g. "1/4"
  onSettings?: () => void; // Optional trigger for settings panel
}

const ORB_THEMES = [
  { id: 'blue', name: 'Blue', strokeStart: '#3b82f6', strokeEnd: '#0ea5e9', glow: 'rgba(59, 130, 246, 0.4)' },
  { id: 'purple', name: 'Purple', strokeStart: '#a855f7', strokeEnd: '#ec4899', glow: 'rgba(168, 85, 247, 0.4)' },
  { id: 'emerald', name: 'Emerald', strokeStart: '#10b981', strokeEnd: '#06b6d4', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'orange', name: 'Orange', strokeStart: '#f97316', strokeEnd: '#f59e0b', glow: 'rgba(249, 115, 22, 0.4)' },
  { id: 'red', name: 'Red', strokeStart: '#ef4444', strokeEnd: '#f43f5e', glow: 'rgba(239, 68, 68, 0.4)' },
  { id: 'cyber', name: 'Cyber', strokeStart: '#00f2fe', strokeEnd: '#4facfe', glow: 'rgba(0, 242, 254, 0.4)' },
  { id: 'midnight', name: 'Midnight', strokeStart: '#6366f1', strokeEnd: '#1e1b4b', glow: 'rgba(99, 102, 241, 0.3)' },
  { id: 'aurora', name: 'Aurora', strokeStart: '#10b981', strokeEnd: '#a855f7', glow: 'rgba(34, 197, 94, 0.4)' },
];

export function CircularTimer({
  minutes,
  seconds,
  status,
  mode,
  progress,
  onStartPause,
  onReset,
  subject,
  subjectColor,
  onSkip,
  onPrevSubject,
  onNextSubject,
  cycleInfo = '1/4',
  onSettings
}: CircularTimerProps) {
  // --- Orb states ---
  const [orbMode, setOrbMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem('timerra_orb_theme') || 'auto';
  });

  // --- Internal Stopwatch Engine ---
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [stopwatchStatus, setStopwatchStatus] = useState<'idle' | 'running' | 'paused'>('idle');

  // --- UI feedback states ---
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [tickSoundEnabled, setTickSoundEnabled] = useState<boolean>(false);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [rippleTarget, setRippleTarget] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio synthesis
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  };

  const playSynthSound = (type: 'click' | 'tick' | 'complete') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'complete') {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.1 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.8);
        });
      }
    } catch (e) {
      console.warn('Audio synth failed:', e);
    }
  };

  // Metronome tick sounds
  useEffect(() => {
    const isRunning = orbMode === 'pomodoro' ? status === 'running' : stopwatchStatus === 'running';
    if (isRunning && tickSoundEnabled) {
      const interval = setInterval(() => {
        playSynthSound('tick');
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, stopwatchStatus, orbMode, tickSoundEnabled, soundEnabled]);

  // Stopwatch Interval Timer
  useEffect(() => {
    if (stopwatchStatus === 'running') {
      const interval = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stopwatchStatus]);

  // Completion flash trigger
  useEffect(() => {
    if (orbMode === 'pomodoro' && minutes === '00' && seconds === '00' && status === 'idle') {
      setJustCompleted(true);
      playSynthSound('complete');
      const timeout = setTimeout(() => setJustCompleted(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [minutes, seconds, status, orbMode]);

  // Keyboard Shortcuts Support
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === ' ') {
        e.preventDefault();
        playSynthSound('click');
        if (orbMode === 'pomodoro') {
          onStartPause();
        } else {
          setStopwatchStatus(prev => prev === 'running' ? 'paused' : 'running');
        }
      } else if (key === 'r') {
        playSynthSound('click');
        if (orbMode === 'pomodoro') {
          onReset();
        } else {
          setStopwatchTime(0);
          setStopwatchStatus('idle');
        }
      } else if (key === 'f') {
        toggleNativeFullscreen();
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [orbMode, onStartPause, onReset]);

  // Fullscreen support
  const toggleNativeFullscreen = () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error('Fullscreen API failed:', err);
        });
      } else {
        document.exitFullscreen();
      }
    } catch (err) {
      console.error(err);
      setIsNativeFullscreen(!isNativeFullscreen);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement && document.fullscreenElement === containerRef.current;
      setIsNativeFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleAction = (btnId: string, callback: () => void) => {
    playSynthSound('click');
    setRippleTarget(btnId);
    setTimeout(() => setRippleTarget(null), 400);
    callback();
  };

  // Determine current theme colors
  const getTheme = () => {
    let baseTheme = ORB_THEMES[0]; // blue
    
    // Auto resolution based on subjectColor or mode
    if (activeThemeId === 'auto') {
      if (subjectColor) {
        return {
          id: 'auto',
          name: 'Subject Default',
          strokeStart: subjectColor,
          strokeEnd: subjectColor === '#3b82f6' ? '#0ea5e9' : `${subjectColor}dd`,
          glow: `${subjectColor}50`,
        };
      }
      
      // Secondary fallback of modes
      if (mode === 'short_break') {
        return ORB_THEMES[2]; // Emerald
      } else if (mode === 'long_break') {
        return ORB_THEMES[1]; // Purple
      }
    } else {
      const matched = ORB_THEMES.find(t => t.id === activeThemeId);
      if (matched) baseTheme = matched;
    }
    return baseTheme;
  };

  const theme = getTheme();

  // Cycle Themes manually
  const cycleTheme = () => {
    const ids = ['auto', ...ORB_THEMES.map(t => t.id)];
    const currentIndex = ids.indexOf(activeThemeId);
    const nextIndex = (currentIndex + 1) % ids.length;
    const nextId = ids[nextIndex];
    setActiveThemeId(nextId);
    localStorage.setItem('timerra_orb_theme', nextId);
    playSynthSound('click');
  };

  // Formatting stopwatch display
  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const getEstimatedFinishTime = () => {
    const now = new Date();
    if (orbMode === 'pomodoro') {
      const remainingMins = parseInt(minutes, 10) || 0;
      const remainingSecs = parseInt(seconds, 10) || 0;
      const totalRemainingMs = (remainingMins * 60 + remainingSecs) * 1000;
      
      const finishDate = new Date(now.getTime() + totalRemainingMs);
      let hours = finishDate.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = finishDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutesStr} ${ampm}`;
    } else {
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutesStr} ${ampm}`;
    }
  };

  // Compute energy fluid levels
  // Countdown: drains from 100 to 0 (progress prop is 0 to 100)
  // Stopwatch: swells up with time up to 90
  const energyLevel = orbMode === 'pomodoro' 
    ? Math.min(100, Math.max(0, progress))
    : stopwatchStatus === 'idle' ? 20 : Math.min(95, 20 + (stopwatchTime * 0.05));

  // Base64 wave drawing
  // Draw wave that stretches 200px wide for seamless scrolling translation
  const waveY = 100 - energyLevel;
  const wavePath1 = `M 0 ${waveY} Q 25 ${waveY - 5}, 50 ${waveY} T 100 ${waveY} T 150 ${waveY} T 200 ${waveY} L 200 100 L 0 100 Z`;
  const wavePath2 = `M 0 ${waveY} Q 25 ${waveY + 3}, 50 ${waveY} T 100 ${waveY} T 150 ${waveY} T 200 ${waveY} L 200 100 L 0 100 Z`;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-center transition-all duration-1000 relative select-none w-full ${
        isNativeFullscreen 
          ? 'fixed inset-0 z-50 bg-[#070b13] py-16 px-6 justify-center' 
          : 'py-2 px-1'
      }`}
      style={{
        '--orb-glow': theme.glow,
        transition: 'background-color 1s ease-in-out'
      } as any}
    >
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes orb-breath {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.05)); }
          50% { transform: scale(1.025); filter: drop-shadow(0 0 35px var(--orb-glow, rgba(255, 255, 255, 0.15))); }
        }
        @keyframes wave-flow-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-flow-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes rotate-orbit-1 {
          0% { transform: rotateX(70deg) rotateY(15deg) rotateZ(0deg); }
          100% { transform: rotateX(70deg) rotateY(15deg) rotateZ(360deg); }
        }
        @keyframes rotate-orbit-2 {
          0% { transform: rotateX(60deg) rotateY(-20deg) rotateZ(360deg); }
          100% { transform: rotateX(60deg) rotateY(-20deg) rotateZ(0deg); }
        }
        @keyframes rotate-orbit-3 {
          0% { transform: rotateX(75deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(75deg) rotateY(0deg) rotateZ(360deg); }
        }
        .animate-orb-float {
          animation: orb-float 7s ease-in-out infinite;
        }
        .animate-orb-breath {
          animation: orb-breath 4s ease-in-out infinite;
        }
        .animate-wave-1 {
          animation: wave-flow-left 14s linear infinite;
        }
        .animate-wave-2 {
          animation: wave-flow-right 10s linear infinite;
        }
        .animate-orbit-1 {
          animation: rotate-orbit-1 18s linear infinite;
        }
        .animate-orbit-2 {
          animation: rotate-orbit-2 22s linear infinite;
        }
        .animate-orbit-3 {
          animation: rotate-orbit-3 26s linear infinite;
        }
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          transform: scale(0);
          animation: ripple 0.4s linear;
          pointer-events: none;
        }
        @keyframes ripple {
          to {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>

      {/* --- HUD HEADER --- */}
      <div className={`w-full max-w-md flex flex-wrap items-center justify-center sm:justify-between gap-2.5 mb-6 relative z-30 ${isNativeFullscreen ? 'opacity-80 scale-105' : ''}`}>
        {/* SUBJECT SELECTION PANEL */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onPrevSubject && handleAction('prev-subj', onPrevSubject)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Previous Subject"
          >
            <ChevronLeft size={14} />
          </button>
          <div 
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all duration-1000"
            style={{
              backgroundColor: `${theme.strokeStart}1a`,
              color: theme.strokeStart,
              borderColor: `${theme.strokeStart}30`,
              boxShadow: `0 0 10px ${theme.strokeStart}10`
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="truncate max-w-[110px]">{orbMode === 'pomodoro' ? (mode === 'focus' ? subject : mode.replace('_', ' ')) : 'Stopwatch'}</span>
          </div>
          <button 
            onClick={() => onNextSubject && handleAction('next-subj', onNextSubject)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Next Subject"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* METRONOME TICK & SOUND & THEME MANUAL SELECTOR */}
        <div className="flex items-center gap-1.5">
          {/* Theme cycling picker */}
          <button
            onClick={cycleTheme}
            className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-all cursor-pointer"
            title={`Active Theme: ${theme.name}. Click to change.`}
          >
            <span 
              className="w-2 h-2 rounded-full border border-white/20 transition-all duration-1000" 
              style={{ background: `linear-gradient(135deg, ${theme.strokeStart}, ${theme.strokeEnd})` }}
            />
            <span className="text-[8px] font-mono opacity-80">{theme.name}</span>
          </button>

          <button
            onClick={() => handleAction('metronome', () => setTickSoundEnabled(!tickSoundEnabled))}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border transition-all cursor-pointer ${
              tickSoundEnabled && (status === 'running' || stopwatchStatus === 'running')
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Tick Sound"
          >
            Tick
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </div>

      {/* --- SEGMENTED MODE SWITCHER --- */}
      <div className="mb-8 w-full max-w-[280px] relative z-30">
        <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-white/10 gap-1.5 relative shadow-inner">
          <button
            onClick={() => {
              setOrbMode('pomodoro');
              playSynthSound('click');
            }}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 relative z-10 cursor-pointer ${
              orbMode === 'pomodoro' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {orbMode === 'pomodoro' && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/[0.02] border border-white/10 rounded-xl -z-10 shadow-md" />
            )}
            <span>🍅 Pomodoro</span>
          </button>
          <button
            onClick={() => {
              setOrbMode('stopwatch');
              playSynthSound('click');
            }}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 relative z-10 cursor-pointer ${
              orbMode === 'stopwatch' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {orbMode === 'stopwatch' && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/[0.02] border border-white/10 rounded-xl -z-10 shadow-md" />
            )}
            <span>⏱ Stopwatch</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          THE CORE GLASS ORB STAGE
          ========================================== */}
      <div 
        className={`relative flex items-center justify-center transition-all duration-1000 ${
          isNativeFullscreen 
            ? 'w-[280px] h-[280px] min-[360px]:w-[320px] min-[360px]:h-[320px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px] my-10' 
            : 'w-[210px] h-[210px] min-[360px]:w-[240px] min-[360px]:h-[240px] min-[400px]:w-[260px] min-[400px]:h-[260px] sm:w-[290px] sm:h-[290px] md:w-[310px] md:h-[310px] my-4'
        }`}
      >
        {/* Under-Glow Radial Backlight Aura (matching theme colors) */}
        <div 
          className="absolute inset-4 rounded-full blur-[50px] opacity-35 transition-all duration-1000 pointer-events-none z-0"
          style={{ 
            background: `radial-gradient(circle, ${theme.strokeStart} 0%, ${theme.strokeEnd} 100%)`,
            transform: 'scale(1.1)'
          }}
        />

        {/* --- TRIPLE 3D ORBIT SYSTEM --- */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          {/* Orbit 1 */}
          <div 
            className="absolute w-[120%] h-[120%] rounded-full border border-dashed animate-orbit-1"
            style={{
              transformStyle: 'preserve-3d',
              borderColor: `${theme.strokeStart}30`,
            }}
          >
            <div 
              className="absolute w-2.5 h-2.5 rounded-full shadow-[0_0_12px_currentColor]"
              style={{
                top: '0%',
                left: '50%',
                color: theme.strokeStart,
                backgroundColor: theme.strokeStart,
              }}
            />
          </div>
          
          {/* Orbit 2 */}
          <div 
            className="absolute w-[128%] h-[128%] rounded-full border border-dotted animate-orbit-2"
            style={{
              transformStyle: 'preserve-3d',
              borderColor: `${theme.strokeEnd}25`,
            }}
          >
            <div 
              className="absolute w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]"
              style={{
                bottom: '15%',
                right: '15%',
                color: theme.strokeEnd,
                backgroundColor: theme.strokeEnd,
              }}
            />
          </div>

          {/* Orbit 3 */}
          <div 
            className="absolute w-[138%] h-[138%] rounded-full border animate-orbit-3"
            style={{
              transformStyle: 'preserve-3d',
              borderColor: `${theme.strokeStart}15`,
            }}
          >
            <div 
              className="absolute w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
              style={{
                top: '75%',
                left: '12%',
                color: theme.strokeStart,
                backgroundColor: theme.strokeStart,
              }}
            />
          </div>
        </div>

        {/* -------------------------------------------
            THE GLASS SPHERE CONTAINER
            ------------------------------------------- */}
        <div 
          className={`w-full h-full rounded-full relative flex items-center justify-center overflow-hidden border border-white/20 backdrop-blur-3xl transition-all duration-1000 animate-orb-float animate-orb-breath z-20 ${
            justCompleted 
              ? 'scale-[1.08] border-white/60 shadow-[0_0_80px_rgba(255,255,255,0.7)]' 
              : 'shadow-[inset_0_20px_40px_rgba(255,255,255,0.12),_inset_0_-20px_40px_rgba(0,0,0,0.6),_0_25px_50px_rgba(0,0,0,0.5)]'
          }`}
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.0) 60%), rgba(10, 18, 36, 0.35)',
          }}
        >
          {/* --- WAVE ENERGY LAYER (Liquid fluid container filling based on timer progress) --- */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none select-none z-0">
            <svg 
              className="absolute inset-0 w-[200%] h-full transition-all duration-1000 ease-in-out" 
              viewBox="0 0 200 100" 
              preserveAspectRatio="none"
              style={{ opacity: justCompleted ? 0.95 : 0.45 }}
            >
              <defs>
                <linearGradient id="fluidGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={theme.strokeStart} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={theme.strokeEnd} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="fluidGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={theme.strokeEnd} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={theme.strokeStart} stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Overlapping sine waves translating in opposite directions */}
              <path 
                d={wavePath2} 
                fill="url(#fluidGrad2)" 
                className="animate-wave-2 transition-all duration-1000" 
              />
              <path 
                d={wavePath1} 
                fill="url(#fluidGrad1)" 
                className="animate-wave-1 transition-all duration-1000" 
              />
            </svg>
          </div>

          {/* --- ORB GLASS GLARES AND SHADOW REFLECTIONS --- */}
          {/* Premium Crescent Top Light Cast */}
          <div className="absolute top-4 left-6 right-6 h-1/4 rounded-full bg-gradient-to-b from-white/35 to-transparent filter blur-[1px] transform -rotate-3 opacity-90 pointer-events-none select-none z-20" />
          
          {/* Bottom Rim Reflection Accent */}
          <div className="absolute bottom-5 left-1/3 right-1/3 h-[12%] rounded-full bg-gradient-to-t from-white/15 to-transparent filter blur-[2px] opacity-75 pointer-events-none select-none z-20" />

          {/* Left subtle glare */}
          <div className="absolute top-1/4 left-3 w-[6%] h-2/5 rounded-full bg-gradient-to-r from-white/10 to-transparent filter blur-[1px] transform -rotate-12 opacity-50 pointer-events-none select-none z-20" />

          {/* -------------------------------------------
              ORB CONTENT HUD (TEXT DISPLAY)
              ------------------------------------------- */}
          <div className="relative flex flex-col items-center justify-center text-center z-10 px-6">
            
            {/* Top Indicator / Mode Tag */}
            <span 
              className="text-[9px] font-black uppercase tracking-[0.25em] mb-2 transition-colors duration-1000 flex items-center gap-1"
              style={{ 
                color: theme.strokeStart,
                textShadow: `0 0 10px ${theme.strokeStart}50`
              }}
            >
              <Sparkles size={8} className="animate-spin" style={{ animationDuration: '6s' }} />
              {orbMode === 'pomodoro' ? (mode === 'focus' ? 'Focusing' : 'Relaxing') : 'Stopwatch'}
            </span>

            {/* MAIN CLOCK DIGITAL TIME */}
            <div 
              className="font-sans font-black tracking-tight text-white flex items-center tabular-nums leading-none mb-2"
              style={{ 
                fontSize: isNativeFullscreen ? '4.75rem' : '3.5rem',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(255, 255, 255, 0.15)'
              }}
            >
              {orbMode === 'pomodoro' ? (
                <>
                  <span>{minutes}</span>
                  <span className={`mx-0.5 ${status === 'running' ? 'animate-pulse' : 'opacity-70'}`}>:</span>
                  <span>{seconds}</span>
                </>
              ) : (
                <span className="text-[2.5rem] sm:text-[3rem] font-medium leading-none tracking-tight">
                  {formatStopwatch(stopwatchTime)}
                </span>
              )}
            </div>

            {/* Bottom metadata indicators */}
            <div className="flex flex-col items-center gap-1">
              {/* Loop cycle display */}
              <div className="flex items-center gap-1 text-[8.5px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950/40 py-0.5 px-2 rounded-full border border-white/5 shadow-inner">
                <span>Cycle:</span>
                <span className="text-white font-mono">{orbMode === 'pomodoro' ? cycleInfo : 'Continuous'}</span>
              </div>

              {/* Dynamic Estimated Completion End Timer */}
              <div className="flex items-center gap-1 text-[8.5px] text-slate-500 font-mono">
                <Info size={9} />
                <span>{orbMode === 'pomodoro' ? `Ends: ${getEstimatedFinishTime()}` : `Time: ${getEstimatedFinishTime()}`}</span>
              </div>
            </div>

            {/* Glowing orb base ripple helper */}
            {justCompleted && (
              <span className="absolute text-[10px] font-bold tracking-widest text-emerald-400 uppercase animate-bounce top-1/2 mt-12 bg-emerald-500/10 border border-emerald-500/20 py-1 px-2.5 rounded-xl">
                Goal Reached! 🌟
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          CURVED ARCUATE BUTTON DECK
          ========================================== */}
      <div className={`w-full max-w-sm flex items-center justify-center gap-4.5 mt-8 select-none relative z-30 ${isNativeFullscreen ? 'scale-105 mt-12' : ''}`}>
        
        {/* BUTTON 1: SETTINGS (Left Arch) */}
        <div className="relative group translate-y-2.5 transition-transform">
          <button
            onClick={() => onSettings && handleAction('settings', onSettings)}
            disabled={!onSettings}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-90 hover:scale-110 cursor-pointer shadow-md backdrop-blur-md relative overflow-hidden"
            title="Open Configurations (⚙)"
          >
            {rippleTarget === 'settings' && <span className="ripple-effect" style={{ left: '50%', top: '50%' }} />}
            <Settings size={15} />
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950/90 text-[8.5px] font-bold uppercase tracking-wider text-white rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
            Settings
          </div>
        </div>

        {/* BUTTON 2: RESET (Center-Left Arch) */}
        <div className="relative group translate-y-1 transition-transform">
          <button
            onClick={() => handleAction('reset', () => {
              if (orbMode === 'pomodoro') {
                onReset();
              } else {
                setStopwatchTime(0);
                setStopwatchStatus('idle');
              }
            })}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all active:scale-90 hover:scale-110 cursor-pointer shadow-md backdrop-blur-md relative overflow-hidden"
            title="Reset Timer (R)"
          >
            {rippleTarget === 'reset' && <span className="ripple-effect" style={{ left: '50%', top: '50%' }} />}
            <RotateCcw size={16} />
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950/90 text-[8.5px] font-bold uppercase tracking-wider text-white rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
            Reset (R)
          </div>
        </div>

        {/* BUTTON 3: START/PAUSE (Peak of the Curve - Vibrant Highlight!) */}
        <div className="relative group transition-transform">
          <button
            onClick={() => handleAction('start-pause', () => {
              if (orbMode === 'pomodoro') {
                onStartPause();
              } else {
                setStopwatchStatus(prev => prev === 'running' ? 'paused' : 'running');
              }
            })}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 hover:scale-110 cursor-pointer shadow-lg border relative overflow-hidden"
            style={{
              backgroundColor: (orbMode === 'pomodoro' ? status === 'running' : stopwatchStatus === 'running')
                ? 'rgba(255, 255, 255, 0.95)'
                : 'rgba(255, 255, 255, 0.08)',
              borderColor: (orbMode === 'pomodoro' ? status === 'running' : stopwatchStatus === 'running')
                ? '#ffffff'
                : `${theme.strokeStart}35`,
              color: (orbMode === 'pomodoro' ? status === 'running' : stopwatchStatus === 'running')
                ? '#070b13'
                : '#ffffff',
              boxShadow: (orbMode === 'pomodoro' ? status === 'running' : stopwatchStatus === 'running')
                ? `0 0 30px -3px ${theme.strokeStart}, inset 0 2px 4px rgba(255,255,255,0.4)`
                : `0 8px 25px -5px ${theme.strokeStart}20`
            }}
            title={
              (orbMode === 'pomodoro' ? status === 'running' : stopwatchStatus === 'running')
                ? 'Pause (Spacebar)'
                : 'Start (Spacebar)'
            }
          >
            {rippleTarget === 'start-pause' && <span className="ripple-effect" style={{ left: '50%', top: '50%' }} />}
            {(orbMode === 'pomodoro' ? status === 'running' : stopwatchStatus === 'running') ? (
              <Pause size={22} className="fill-current" />
            ) : (
              <Play size={22} className="fill-current translate-x-0.5" />
            )}
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-slate-950/90 text-[8.5px] font-bold uppercase tracking-wider text-white rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
            Start / Pause (Space)
          </div>
        </div>

        {/* BUTTON 4: SKIP (Center-Right Arch) */}
        <div className="relative group translate-y-1 transition-transform">
          <button
            onClick={() => {
              if (orbMode === 'pomodoro') {
                onSkip && handleAction('skip', onSkip);
              } else {
                // In stopwatch, flashing split confirmation as visual reward
                handleAction('skip', () => {
                  setStopwatchTime(prev => prev + 60); // fast-forward 1 min for testing / splits!
                });
              }
            }}
            disabled={orbMode === 'pomodoro' && !onSkip}
            className={`w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all active:scale-90 hover:scale-110 shadow-md backdrop-blur-md relative overflow-hidden ${
              orbMode === 'pomodoro' && !onSkip ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title={orbMode === 'pomodoro' ? 'Skip Session' : 'Add 1 Minute (+1m)'}
          >
            {rippleTarget === 'skip' && <span className="ripple-effect" style={{ left: '50%', top: '50%' }} />}
            <SkipForward size={16} />
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950/90 text-[8.5px] font-bold uppercase tracking-wider text-white rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
            {orbMode === 'pomodoro' ? 'Skip' : '+1 Min'}
          </div>
        </div>

        {/* BUTTON 5: FULLSCREEN (Right Arch) */}
        <div className="relative group translate-y-2.5 transition-transform">
          <button
            onClick={() => handleAction('fullscreen', toggleNativeFullscreen)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-90 hover:scale-110 cursor-pointer shadow-md backdrop-blur-md relative overflow-hidden"
            title="Toggle Immersive Fullscreen (F)"
          >
            {rippleTarget === 'fullscreen' && <span className="ripple-effect" style={{ left: '50%', top: '50%' }} />}
            {isNativeFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950/90 text-[8.5px] font-bold uppercase tracking-wider text-white rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
            {isNativeFullscreen ? 'Exit (Esc)' : 'Fullscreen (F)'}
          </div>
        </div>

      </div>

      {/* SUBTLE HUD CYCLE FOOTER DESCRIPTION */}
      <div className={`mt-6 text-[9.5px] text-slate-500 font-mono tracking-widest uppercase select-none ${isNativeFullscreen ? 'opacity-50' : ''}`}>
        Timerra Space Navigation
      </div>

    </div>
  );
}
