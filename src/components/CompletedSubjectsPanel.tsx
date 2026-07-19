import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock, 
  Calendar, 
  TrendingUp, 
  ChevronLeft, 
  Sparkles,
  Timer
} from 'lucide-react';
import { Session } from '../types';

interface CompletedSubjectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  completedSubjects: string[];
  completedDates?: Record<string, number>;
  sessions?: Session[];
  onRestoreSubject: (sub: string) => void;
  onDeleteSubject: (sub: string) => void;
}

export const CompletedSubjectsPanel: React.FC<CompletedSubjectsPanelProps> = ({
  isOpen,
  onClose,
  completedSubjects,
  completedDates,
  sessions,
  onRestoreSubject,
  onDeleteSubject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = completedSubjects.filter(sub =>
    sub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations for a specific subject
  const getSubjectStats = (subName: string) => {
    const subjectSessions = (sessions || []).filter(
      s => s.subject === subName && s.mode === 'focus'
    );
    const totalSessionsCount = subjectSessions.length;
    const totalDuration = subjectSessions.reduce((sum, s) => sum + s.durationSec, 0);
    const avgDuration = totalSessionsCount > 0 ? Math.round(totalDuration / totalSessionsCount) : 0;
    
    // Find last focus date in sessions as backup if not explicitly tracked
    let completionTimestamp = completedDates?.[subName];
    if (!completionTimestamp && subjectSessions.length > 0) {
      completionTimestamp = Math.max(...subjectSessions.map(s => s.completedAt));
    }
    
    return {
      totalSessionsCount,
      totalDuration,
      avgDuration,
      completionTimestamp,
    };
  };

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Recently';
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankBadge = (totalSecs: number) => {
    const hrs = totalSecs / 3600;
    if (hrs >= 10) return { name: 'Focus Paragon 🏆', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    if (hrs >= 5) return { name: 'Elite Scholar 🌟', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' };
    if (hrs >= 1) return { name: 'Deep Focused 🌱', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    return { name: 'Initiate Miner 🪵', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#0a0d1e]/95 border border-emerald-500/20 rounded-3xl shadow-[0_0_55px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col max-h-[85vh] tm-glass-dense animate-scale-up">
        
        {selectedSubject ? (
          /* --- SELECTED SUBJECT DETAILED SUMMARY VIEW --- */
          (() => {
            const stats = getSubjectStats(selectedSubject);
            const rank = getRankBadge(stats.totalDuration);
            
            // Calculate global average focus duration across all focus sessions
            const globalFocusSessions = (sessions || []).filter(s => s.mode === 'focus');
            const globalTotalDuration = globalFocusSessions.reduce((sum, s) => sum + s.durationSec, 0);
            const globalAvgDuration = globalFocusSessions.length > 0 ? Math.round(globalTotalDuration / globalFocusSessions.length) : 0;

            return (
              <>
                {/* Detail Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/15 to-teal-500/15">
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-extrabold tracking-wider transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>BACK TO ARCHIVE</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Detail Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-5">
                  
                  {/* Subject Name and Rank Banner */}
                  <div className="text-center space-y-2.5 bg-white/[0.01] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Archive className="w-20 h-20 text-emerald-400" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse">
                      <Award className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-wide">{selectedSubject}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Study Legacy Report</p>
                    </div>
                    <div className="inline-block">
                      <span className={`text-[10px] font-black tracking-wider px-3 py-1 rounded-full border ${rank.color}`}>
                        {rank.name}
                      </span>
                    </div>
                  </div>

                  {/* 2x2 Breakdown Stats Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    {/* Stat 1: Total Focus Time */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">Total Focus</span>
                      </div>
                      <span className="text-sm font-black text-white pt-1">
                        {formatDuration(stats.totalDuration)}
                      </span>
                    </div>

                    {/* Stat 2: Total Sessions */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">Sessions</span>
                      </div>
                      <span className="text-sm font-black text-white pt-1">
                        {stats.totalSessionsCount} session{stats.totalSessionsCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Stat 3: Avg Session Duration */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col space-y-1 relative overflow-hidden group/stat">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Timer className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">Avg Duration</span>
                        </div>
                        {/* Dynamic Trend Indicator Arrow and Percentage */}
                        {globalAvgDuration > 0 && stats.avgDuration > 0 && (() => {
                          const diffSec = stats.avgDuration - globalAvgDuration;
                          const diffPercent = Math.round((diffSec / globalAvgDuration) * 100);
                          const isAbove = diffSec > 0;
                          const isSame = diffSec === 0;

                          if (isSame) {
                            return (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-400/10 px-1.5 py-0.5 rounded" title="Exactly same as global average">
                                Same
                              </span>
                            );
                          }

                          return (
                            <span 
                              className={`inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                                isAbove 
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              }`}
                              title={`Global average is ${formatDuration(globalAvgDuration)}`}
                            >
                              {isAbove ? (
                                <ArrowUpRight className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <ArrowDownRight className="w-2.5 h-2.5 text-rose-400" />
                              )}
                              <span>{isAbove ? '+' : ''}{diffPercent}%</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="pt-1 flex flex-col">
                        <span className="text-sm font-black text-white">
                          {formatDuration(stats.avgDuration)}
                        </span>
                        {globalAvgDuration > 0 && (
                          <span className="text-[9px] text-slate-500 mt-1">
                            Global Avg: {formatDuration(globalAvgDuration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stat 4: Completion Date */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">Achieved On</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 pt-1.5 truncate">
                        {formatDate(stats.completionTimestamp)}
                      </span>
                    </div>

                  </div>

                  {/* Aesthetic achievements banner */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5 flex gap-3 items-start">
                    <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Archive Preservation Info</h4>
                      <p className="text-[10px] leading-relaxed text-slate-400">
                        All study sessions completed under this subject remain fully logged in your statistics and charts. You can restore this subject to active status anytime.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Detail Footer */}
                <div className="p-4 border-t border-white/5 bg-black/30 flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onRestoreSubject(selectedSubject);
                        setSelectedSubject(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 text-xs font-black tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteSubject(selectedSubject);
                        setSelectedSubject(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-black transition-all flex items-center justify-center cursor-pointer"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold tracking-wider transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </>
            );
          })()
        ) : (
          /* --- COMPLETED SUBJECTS LIST VIEW --- */
          <>
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                  <Archive className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">Completed Subjects</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Archive of your successfully achieved focus subjects</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* Stats Bar */}
              <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">Total Completed Objectives</span>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-lg">
                  {completedSubjects.length}
                </span>
              </div>

              {/* Search Box */}
              {completedSubjects.length > 0 && (
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search completed subjects..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              )}

              {/* Subjects List */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {filtered.length > 0 ? (
                  filtered.map(sub => (
                    <div
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-emerald-500/20 transition-all group cursor-pointer"
                    >
                      <div className="flex flex-col max-w-[65%]">
                        <span className="text-xs font-bold text-slate-200 line-through decoration-emerald-500/50 group-hover:text-emerald-400 transition-colors">{sub}</span>
                        <span className="text-[9px] text-emerald-500 mt-0.5 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Finished • Click for Stats
                        </span>
                      </div>

                      <div className="flex items-center gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreSubject(sub);
                          }}
                          className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/10 cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Restore to Active"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Deselect</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSubject(sub);
                          }}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 cursor-pointer transition-all"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto text-slate-500">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400">
                        {completedSubjects.length === 0 ? "No Completed Subjects Yet" : "No Match Found"}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {completedSubjects.length === 0
                          ? "Finish some active subjects in your focus hub to start building your legacy!"
                          : "Try checking your spelling or search for another term."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
              >
                Done
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
