import React from 'react';
import { Trophy, Flame, Clock, Sparkles, Lock, Check } from 'lucide-react';
import { StudyLog, Achievement } from '../types';
import { ACHIEVEMENTS_LIST, calculateStreak } from '../utils/achievements';

interface AchievementsPanelProps {
  logs: StudyLog[];
  earnedIds: string[];
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ logs, earnedIds }) => {
  const currentStreak = calculateStreak(logs);
  
  // Calculate stats for overview
  const focusLogs = logs.filter(log => log.mode === 'focus');
  const totalFocusMinutes = focusLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalCompletedCount = focusLogs.length;

  // Group logs by day to calculate max sessions in any single day
  const sessionsPerDay: { [key: string]: number } = {};
  focusLogs.forEach(log => {
    sessionsPerDay[log.date] = (sessionsPerDay[log.date] || 0) + 1;
  });
  const maxSessionsInOneDay = Object.values(sessionsPerDay).reduce((max, val) => Math.max(max, val), 0);

  // Helper to check progress towards a locked achievement
  const getProgressPercent = (achievementId: string): number => {
    if (earnedIds.includes(achievementId)) return 100;

    switch (achievementId) {
      case 'first_step':
        return totalCompletedCount >= 1 ? 100 : 0;
      case 'deep_work':
        const hasDeep = focusLogs.some(log => log.durationMinutes >= 45);
        return hasDeep ? 100 : 0;
      case 'half_day':
        return Math.min(100, (maxSessionsInOneDay / 4) * 100);
      case 'power_user':
        return Math.min(100, (maxSessionsInOneDay / 8) * 100);
      case 'consistency_3':
        return Math.min(100, (currentStreak / 3) * 100);
      case 'consistency_7':
        return Math.min(100, (currentStreak / 7) * 100);
      case 'centurion':
        return Math.min(100, (totalFocusMinutes / 500) * 100);
      case 'cloud_sync':
        return 0; // Triggered on first sync event
      default:
        return 0;
    }
  };

  return (
    <div className="w-full flex flex-col p-5 rounded-3xl glossy-panel glossy-panel-hover relative overflow-hidden animate-fade-in select-none">
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
      
      {/* Title Header */}
      <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Zen Achievements</h3>
            <p className="text-[10px] text-slate-500">Earn badges & build focus streaks</p>
          </div>
        </div>

        {/* Earned ratio badge */}
        <div className="px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
          <Sparkles size={10} className="animate-pulse" />
          <span>{earnedIds.length} / {ACHIEVEMENTS_LIST.length} Badges</span>
        </div>
      </div>

      {/* Stats Summary Bento Bar */}
      <div className="grid grid-cols-3 gap-2 mb-5 relative z-10">
        {/* Streak */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
          <div className={`p-1.5 rounded-full mb-1 ${currentStreak > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-600'}`}>
            <Flame size={14} className={currentStreak > 0 ? 'animate-bounce' : ''} />
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Streak</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span>
        </div>

        {/* Total Time */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
          <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-400 mb-1">
            <Clock size={14} />
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Time</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5">{totalFocusMinutes}m</span>
        </div>

        {/* Completed Pomodoros */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
          <div className="p-1.5 rounded-full bg-indigo-500/10 text-indigo-400 mb-1">
            <Trophy size={14} />
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5">{totalCompletedCount} focus</span>
        </div>
      </div>

      {/* Badges Bento-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 max-h-[360px] overflow-y-auto pr-1">
        {ACHIEVEMENTS_LIST.map(achievement => {
          const isEarned = earnedIds.includes(achievement.id);
          const percent = getProgressPercent(achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-start gap-3 relative overflow-hidden ${
                isEarned
                  ? 'bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.03] border-amber-500/20 shadow-md shadow-amber-500/[0.02]'
                  : 'bg-white/[0.01] border-white/5 hover:border-white/10'
              }`}
            >
              {/* Highlight background glow for earned */}
              {isEarned && (
                <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />
              )}

              {/* Badge Visual */}
              <div className="relative">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-inner transition-all duration-300 ${
                  isEarned
                    ? 'bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-slate-100 border border-amber-500/30'
                    : 'bg-white/5 text-slate-600 border border-white/5 filter grayscale'
                }`}>
                  {achievement.badgeEmoji}
                </div>
                {!isEarned && (
                  <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-500 shadow-sm">
                    <Lock size={8} />
                  </div>
                )}
                {isEarned && (
                  <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-amber-500 text-slate-950 border border-slate-950 shadow-sm">
                    <Check size={8} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Details text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider truncate ${isEarned ? 'text-amber-300' : 'text-slate-400'}`}>
                    {achievement.title}
                  </h4>
                </div>
                <p className="text-[9px] text-slate-500 leading-normal mt-0.5 mb-1.5">
                  {achievement.description}
                </p>

                {/* Progress bar or requirement tag */}
                {isEarned ? (
                  <span className="inline-block text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Unlocked
                  </span>
                ) : (
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center justify-between text-[8px] text-slate-500">
                      <span>{achievement.requirementText}</span>
                      <span>{Math.round(percent)}%</span>
                    </div>
                    {percent > 0 && (
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500/40 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
