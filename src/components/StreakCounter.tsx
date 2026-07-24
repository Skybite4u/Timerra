import React from 'react';
import { Flame, Award, Calendar, Zap, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak?: number;
  lastFocusDate?: string; // YYYY-MM-DD
  theme?: string;
  className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak = 0,
  longestStreak = 0,
  lastFocusDate,
  theme,
  className = ''
}) => {
  const isLight = theme === 'glassyLight';

  // Determine streak level & title
  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { title: 'Legendary Master', color: 'from-amber-400 to-orange-500', icon: Trophy };
    if (streak >= 14) return { title: 'Unstoppable Momentum', color: 'from-purple-400 to-pink-500', icon: Zap };
    if (streak >= 7) return { title: 'Focus Champion', color: 'from-cyan-400 to-blue-500', icon: Award };
    if (streak >= 3) return { title: 'Building Habit', color: 'from-emerald-400 to-teal-500', icon: Sparkles };
    return { title: 'Focus Starter', color: 'from-slate-400 to-slate-500', icon: CheckCircle2 };
  };

  const badge = getStreakBadge(currentStreak);
  const BadgeIcon = badge.icon;

  // Milestone targets
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > currentStreak) || currentStreak + 10;
  const prevMilestone = [...milestones].reverse().find(m => m <= currentStreak) || 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
  );

  // Generate last 7 days visual streak indicators
  const today = new Date();
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    // Simulate active days based on streak count for display
    const isActive = (6 - i) < currentStreak;
    const isToday = i === 6;
    return { dayLabel, isActive, isToday };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xl overflow-hidden backdrop-blur-md ${
        isLight
          ? 'bg-sky-50/85 border-sky-300/70 shadow-[0_8px_25px_rgba(56,189,248,0.18)] text-slate-900'
          : 'bg-[#0a0f24]/85 border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)] text-white'
      } ${className}`}
    >
      {/* Background Flame Aura */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Header: Flame + Streak Count */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Flame Ring */}
            {currentStreak > 0 && (
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl blur-md"
              />
            )}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-[0_4px_18px_rgba(245,158,11,0.4)] relative z-10 shrink-0">
              <Flame className="w-6 h-6 text-white fill-amber-200 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-black tracking-tight drop-shadow-sm">
                {currentStreak}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Day{currentStreak === 1 ? '' : 's'} Streak
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <BadgeIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className={`bg-gradient-to-r ${badge.color} bg-clip-text text-transparent font-bold`}>
                {badge.title}
              </span>
            </div>
          </div>
        </div>

        {/* Longest Record Chip */}
        <div className={`flex flex-col items-end px-3 py-1.5 rounded-xl border text-right ${
          isLight ? 'bg-sky-200/60 border-sky-300/60' : 'bg-white/5 border-white/10'
        }`}>
          <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400">
            Best Record
          </span>
          <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            {Math.max(currentStreak, longestStreak)} Days
          </span>
        </div>
      </div>

      {/* Milestone Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
          <span>Target: {nextMilestone} Days</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${
          isLight ? 'bg-sky-200/80' : 'bg-white/10'
        }`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-red-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          />
        </div>
      </div>

      {/* 7-Day Activity Grid */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
          <Calendar className="w-3 h-3 text-amber-400" />
          7 Days
        </span>
        <div className="flex items-center gap-1.5">
          {weekDays.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                {day.dayLabel}
              </span>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] transition-all duration-300 ${
                  day.isActive
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)] scale-105'
                    : isLight
                    ? 'bg-sky-200/50 border border-sky-300/50 text-slate-400'
                    : 'bg-white/5 border border-white/10 text-slate-500'
                } ${day.isToday ? 'ring-2 ring-amber-400/80' : ''}`}
                title={`${day.dayLabel}: ${day.isActive ? 'Focus Completed' : 'No Activity'}`}
              >
                {day.isActive ? '✓' : '•'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
