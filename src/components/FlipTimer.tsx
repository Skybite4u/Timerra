import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { TimerStatus, TimerMode } from '../types';

interface FlipTimerProps {
  minutes: string;
  seconds: string;
  status: TimerStatus;
  mode: TimerMode;
  onStartPause: () => void;
  onReset: () => void;
  subject?: string;
}

interface SlideDigitProps {
  digit: string;
  textColorClass: string;
  glowClass: string;
}

const SlideDigit: React.FC<SlideDigitProps> = ({ digit, textColorClass, glowClass }) => {
  return (
    <div className="relative h-24 w-16 sm:h-32 sm:w-22 md:h-36 md:w-24 bg-slate-950/40 border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Decorative center line of flip clock */}
      <div className="absolute left-0 right-0 h-[1.5px] bg-white/10 top-1/2 z-10" />
      
      <AnimatePresence mode="popLayout">
        <motion.div
          key={digit}
          initial={{ y: 35, opacity: 0, rotateX: 60 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: -35, opacity: 0, rotateX: -60 }}
          transition={{ type: 'spring', damping: 14, stiffness: 140 }}
          className={`absolute font-futuristic font-black text-4xl sm:text-5xl md:text-6xl tabular-nums select-none ${textColorClass} ${glowClass}`}
          style={{ textShadow: textColorClass.includes('pink') ? '0 0 12px rgba(236,72,153,0.5)' : '0 0 12px rgba(168,85,247,0.5)' }}
        >
          {digit}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const FlipTimer: React.FC<FlipTimerProps> = ({
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

  // Split digits
  const paddedMin = minutes.padStart(2, '0');
  const paddedSec = seconds.padStart(2, '0');

  const m1 = paddedMin[0];
  const m2 = paddedMin[1];
  const s1 = paddedSec[0];
  const s2 = paddedSec[1];

  return (
    <div className={`flex flex-col items-center justify-center p-10 rounded-[36px] transition-all duration-500 glossy-panel glossy-panel-hover relative overflow-hidden ${colors.glow}`}>
      {/* Dynamic atmospheric color backplate */}
      <div className={`absolute -inset-10 opacity-15 bg-gradient-to-tr from-current to-transparent blur-3xl pointer-events-none ${colors.text}`} />

      {/* Mode Tag */}
      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all duration-300 mb-8 relative z-10 ${colors.accent}`}>
        {mode === 'focus' ? `Focusing: ${subject || 'General'}` : mode === 'short_break' ? 'Short Break' : 'Long Break'}
      </span>

      {/* Clock Display */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-10 relative z-10">
        <SlideDigit digit={m1} textColorClass={colors.text} glowClass={colors.glowClass} />
        <SlideDigit digit={m2} textColorClass={colors.text} glowClass={colors.glowClass} />
        
        <div className="flex flex-col gap-3 justify-center items-center px-1 sm:px-2">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse opacity-70 ${colors.text} bg-current`} style={{ boxShadow: colors.text.includes('pink') ? '0 0 8px rgba(236,72,153,0.6)' : '0 0 8px rgba(168,85,247,0.6)' }} />
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse opacity-70 ${colors.text} bg-current`} style={{ boxShadow: colors.text.includes('pink') ? '0 0 8px rgba(236,72,153,0.6)' : '0 0 8px rgba(168,85,247,0.6)' }} />
        </div>

        <SlideDigit digit={s1} textColorClass={colors.text} glowClass={colors.glowClass} />
        <SlideDigit digit={s2} textColorClass={colors.text} glowClass={colors.glowClass} />
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-6 relative z-10">
        <button
          id="btn-reset-flip"
          onClick={onReset}
          className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all duration-300 active:scale-90 shadow-md cursor-pointer"
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>

        <button
          id="btn-play-flip"
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
