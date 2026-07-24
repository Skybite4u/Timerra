import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Clock, Target, Activity, Coffee, Flame, ShieldAlert, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { TimerMode, TimerStatus } from '../types';

interface MiniTimerCardProps {
  mode: TimerMode;
  status: TimerStatus;
  remainingSec: number;
  elapsedSec: number;
  totalDurationSec: number;
  subject: string;
  theme: string;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip?: () => void;
  className?: string;
}

const MODE_CONFIGS: Record<TimerMode, { label: string; icon: React.FC<{ className?: string }>; colorClass: string }> = {
  focus: { label: 'Standard Focus', icon: Target, colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  deepFocus: { label: 'Deep Focus', icon: ShieldAlert, colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  shortBreak: { label: 'Short Break', icon: Coffee, colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  longBreak: { label: 'Long Break', icon: Coffee, colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  sprint: { label: 'Sprint 10m', icon: Flame, colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  marathon: { label: 'Marathon 60m', icon: Activity, colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  zen: { label: 'Zen Garden', icon: Sparkles, colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  stopwatch: { label: 'Stopwatch', icon: Clock, colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  infinityFocus: { label: 'Infinity Focus', icon: InfinityIcon, colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
};

export const MiniTimerCard: React.FC<MiniTimerCardProps> = ({
  mode,
  status,
  remainingSec,
  elapsedSec,
  totalDurationSec,
  subject,
  theme,
  onTogglePlay,
  onReset,
  onSkip,
  className = ''
}) => {
  const isLight = theme === 'glassyLight';
  const isCountUp = mode === 'stopwatch' || mode === 'infinityFocus';
  const displaySeconds = isCountUp ? elapsedSec : remainingSec;

  const formatDisplay = (sec: number) => {
    const safeSec = Math.max(0, Math.floor(sec));
    const h = Math.floor(safeSec / 3600);
    const m = Math.floor((safeSec % 3600) / 60);
    const s = safeSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  let progressPercent = 0;
  if (!isCountUp && totalDurationSec > 0) {
    progressPercent = Math.min(100, Math.max(0, ((totalDurationSec - remainingSec) / totalDurationSec) * 100));
  } else if (isCountUp) {
    progressPercent = 100;
  }

  const modeInfo = MODE_CONFIGS[mode] || MODE_CONFIGS.focus;
  const ModeIcon = modeInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl p-4 border transition-all duration-300 shadow-xl overflow-hidden backdrop-blur-md ${
        isLight
          ? 'bg-sky-50/80 border-sky-300/70 shadow-[0_8px_25px_rgba(56,189,248,0.15)] text-slate-900'
          : 'bg-[#090d1a]/80 border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.6)] text-white'
      } ${className}`}
    >
      {/* Top Header: Mode Badge + Subject Tag */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${modeInfo.colorClass}`}>
          <ModeIcon className="w-3.5 h-3.5" />
          <span>{modeInfo.label}</span>
        </div>

        <div className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border truncate max-w-[140px] ${
          isLight ? 'bg-sky-200/60 text-slate-700 border-sky-300/50' : 'bg-white/5 text-slate-300 border-white/10'
        }`}>
          {subject || 'General'}
        </div>
      </div>

      {/* Main Time Display & Status */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-3xl font-black tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {formatDisplay(displaySeconds)}
            </span>

            {/* Pulsing Status Dot */}
            <div className="flex items-center gap-1.5 ml-1">
              <span className={`w-2.5 h-2.5 rounded-full ${
                status === 'running' 
                  ? 'bg-emerald-400 animate-ping' 
                  : status === 'paused' 
                  ? 'bg-amber-400' 
                  : 'bg-slate-400'
              }`} />
              <span className={`text-[10px] uppercase font-extrabold tracking-widest ${
                status === 'running'
                  ? 'text-emerald-400'
                  : status === 'paused'
                  ? 'text-amber-400'
                  : isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center ${
              status === 'running'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-tm-primary/20 text-tm-primary border-tm-primary/40 hover:bg-tm-primary/30'
            }`}
            title={status === 'running' ? 'Pause Session' : 'Start Session'}
          >
            {status === 'running' ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onReset}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-md ${
              isLight
                ? 'bg-slate-200/80 text-slate-700 border-slate-300 hover:bg-slate-300'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onSkip && (['shortBreak', 'longBreak'].includes(mode)) && (
            <button
              onClick={onSkip}
              className="p-2.5 rounded-xl border bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer active:scale-95"
              title="Skip Break"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
        isLight ? 'bg-sky-200/80' : 'bg-white/10'
      }`}>
        <motion.div
          className="h-full bg-gradient-to-r from-tm-primary via-tm-accent to-emerald-400 rounded-full"
          style={{ width: `${progressPercent}%` }}
          transition={{ ease: "easeInOut", duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};
