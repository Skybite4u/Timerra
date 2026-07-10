import React from 'react';
import { TimerMode } from '../types';
import { ModeIcon } from './ModeLogos';

interface ModeSelectorProps {
  activeMode: TimerMode;
  onChangeMode: (mode: TimerMode) => void;
}

export interface ModeItem {
  id: TimerMode;
  name: string;
  themeName: string;
  desc: string;
  colorClass: string;
}

export const MODES: ModeItem[] = [
  {
    id: 'focus',
    name: 'Solar Orb',
    themeName: 'Timerra Pomodoro',
    desc: 'Bespoke golden sun focus engine',
    colorClass: 'from-amber-500 to-orange-600 shadow-orange-500/20'
  },
  {
    id: 'stopwatch',
    name: 'Infinity Pulse',
    themeName: 'Stopwatch',
    desc: 'Endless blue energy flow stopwatch',
    colorClass: 'from-blue-500 to-cyan-500 shadow-blue-500/20'
  },
  {
    id: 'deepFocus',
    name: 'Crystal Core',
    themeName: 'Deep Focus',
    desc: 'Quiet amethyst light refractions',
    colorClass: 'from-purple-500 to-indigo-600 shadow-purple-500/20'
  },
  {
    id: 'infinityFocus',
    name: 'Galaxy Core',
    themeName: 'Infinity Focus',
    desc: 'Miniature swirling star system',
    colorClass: 'from-pink-500 to-violet-600 shadow-pink-500/20'
  },
  {
    id: 'shortBreak',
    name: 'Cloud Nest',
    themeName: 'Short Break',
    desc: 'Soft white sky and nesting birds',
    colorClass: 'from-sky-400 to-blue-500 shadow-sky-400/20'
  },
  {
    id: 'longBreak',
    name: 'Moon Core',
    themeName: 'Long Break',
    desc: 'Silver crescent lunar atmosphere',
    colorClass: 'from-slate-400 to-indigo-950 shadow-indigo-950/40'
  },
  {
    id: 'sprint',
    name: 'Rocket Engine',
    themeName: 'Sprint',
    desc: 'Blazing speed core (5-15 mins)',
    colorClass: 'from-red-500 to-orange-500 shadow-red-500/20'
  },
  {
    id: 'marathon',
    name: 'Ancient Library',
    themeName: 'Study Marathon',
    desc: 'Elegant warm golden book-dust',
    colorClass: 'from-yellow-600 to-amber-900 shadow-yellow-800/20'
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    themeName: 'Zen Mode',
    desc: 'Concentric water ripples and stone paths',
    colorClass: 'from-teal-400 to-emerald-600 shadow-teal-500/20'
  }
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onChangeMode }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-4 sm:mb-8 select-none">
      {/* Scrollable Container with Hidden Scrollbar */}
      <div className="relative">
        {/* Shadow Fades for horizontal scroll indicators on mobile */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-tm-bg-from to-transparent pointer-events-none z-10 sm:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-tm-bg-from to-transparent pointer-events-none z-10 sm:hidden" />

        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar pr-6 pl-4 sm:px-0 sm:flex-wrap sm:justify-center">
          {MODES.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onChangeMode(mode.id)}
                className={`snap-center shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 relative group active:scale-95 cursor-pointer border ${
                  isActive
                    ? `bg-white/[0.04] border-white/20 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)]`
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                }`}
                style={{
                  minWidth: '150px'
                }}
              >
                {/* Active Underline/Glow Effect */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-5 blur-[8px] pointer-events-none transition-all duration-300" />
                )}

                {/* Animated Icon frame */}
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-tr text-white border-white/10 shadow-lg scale-105' 
                      : 'bg-white/5 text-slate-400 border-white/5 group-hover:text-white group-hover:scale-105'
                  }`}
                  style={{
                    background: isActive ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 80%), var(--tm-primary)' : undefined
                  }}
                >
                  <ModeIcon mode={mode.id} className="w-5.5 h-5.5" />
                </div>

                {/* Text Labels */}
                <div className="flex flex-col text-left">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {mode.name}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate max-w-[100px]">
                    {mode.themeName}
                  </span>
                </div>

                {/* Tooltip on Hover for descriptions */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900/90 text-[9px] text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-white/10 whitespace-nowrap hidden md:block z-30 shadow-md">
                  {mode.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
