import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { TimerStatus, TimerMode } from '../types';
import { motion } from 'motion/react';

interface DigitalTimerProps {
  minutes: string;
  seconds: string;
  status: TimerStatus;
  mode: TimerMode;
  onStartPause: () => void;
  onReset: () => void;
  subject?: string;
}

export const DigitalTimer: React.FC<DigitalTimerProps> = ({
  minutes,
  seconds,
  status,
  mode,
  onStartPause,
  onReset,
  subject,
}) => {
  const modeColors = {
    focus: {
      text: 'text-pink-500',
      glow: 'shadow-[0_0_60px_rgba(236,72,153,0.25)] border-pink-500/30',
      accent: 'bg-pink-500/15 text-pink-300 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]',
      glowClass: 'neon-glow-pink',
    },
    short_break: {
      text: 'text-purple-400',
      glow: 'shadow-[0_0_60px_rgba(168,85,247,0.25)] border-purple-500/30',
      accent: 'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
      glowClass: 'neon-glow-purple',
    },
    long_break: {
      text: 'text-indigo-400',
      glow: 'shadow-[0_0_60px_rgba(99,102,241,0.25)] border-indigo-500/30',
      accent: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]',
      glowClass: 'neon-glow-purple',
    },
  };

  const colors = modeColors[mode];

  return (
    <div className={`flex flex-col items-center justify-center p-5 xs:p-8 sm:p-10 rounded-[36px] transition-all duration-500 glossy-panel glossy-panel-hover relative overflow-hidden ${colors.glow}`}>
      {/* Immersive background glow dot */}
      <div className={`absolute -inset-10 opacity-15 bg-gradient-to-tr from-current to-transparent blur-3xl pointer-events-none ${colors.text}`} />

      {/* Mode Tag */}
      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all duration-300 mb-8 relative z-10 ${colors.accent}`}>
        {mode === 'focus' ? `Focusing: ${subject || 'General'}` : mode === 'short_break' ? 'Short Break' : 'Long Break'}
      </span>

      {/* Clock Display */}
      <motion.div 
        animate={status === 'running' ? { scale: [1, 1.01, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className={`font-futuristic font-black tracking-widest text-6xl sm:text-7xl md:text-8xl mb-10 flex items-center select-none relative z-10 ${colors.text} ${colors.glowClass}`}
        style={{ textShadow: mode === 'focus' ? '0 0 15px rgba(236,72,153,0.6)' : '0 0 15px rgba(168,85,247,0.6)' }}
      >
        <span className="w-[2.2ch] text-right tabular-nums">{minutes}</span>
        <span className="animate-pulse mx-1.5 opacity-70">:</span>
        <span className="w-[2ch] text-left tabular-nums">{seconds}</span>
      </motion.div>

      {/* Primary Actions */}
      <div className="flex items-center gap-6 relative z-10">
        <button
          id="btn-reset-digital"
          onClick={onReset}
          className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all duration-300 active:scale-90 shadow-md cursor-pointer"
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>

        <button
          id="btn-play-digital"
          onClick={onStartPause}
          className={`p-5.5 rounded-2xl text-white font-semibold transition-all duration-300 active:scale-90 shadow-lg cursor-pointer ${
            status === 'running'
              ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
              : mode === 'focus'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 shadow-pink-500/25'
              : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 shadow-purple-500/25'
          }`}
        >
          {status === 'running' ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
      </div>
    </div>
  );
};
