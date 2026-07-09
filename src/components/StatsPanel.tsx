import React from 'react';
import { StudyLog } from '../types';
import { Trophy, Clock, Flame, Calendar, BookOpen, Trash2, ShieldCheck, ShieldAlert, Database, PieChart as ChartIcon, Plus, X, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { WeeklyBarChart } from './WeeklyBarChart';
import { SubjectPieChart } from './SubjectPieChart';
import { getFromIndexedDB } from '../utils/db';
import { motion, AnimatePresence } from 'motion/react';

interface StatsPanelProps {
  logs: StudyLog[];
  pomodoroGoal: number;
  lastSyncTime: number | null;
  onClearLogs?: () => void;
  subjectsList?: string[];
  onAddManualSession?: (durationMinutes: number, subject: string, notes?: string, dateStr?: string) => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ 
  logs, 
  pomodoroGoal, 
  lastSyncTime, 
  onClearLogs,
  subjectsList = ['Math', 'Physics', 'Chemistry', 'Coding', 'English', 'Biology'],
  onAddManualSession 
}) => {
  const [lastSyncedFromIDB, setLastSyncedFromIDB] = React.useState<number | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [manualDuration, setManualDuration] = React.useState<number>(25);
  const [manualSubject, setManualSubject] = React.useState<string>(subjectsList[0] || 'Coding');
  const [manualNotes, setManualNotes] = React.useState<string>('');
  const [manualDate, setManualDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchLastSynced = async () => {
      const ts = await getFromIndexedDB<number>('last_synced');
      setLastSyncedFromIDB(ts);
    };
    fetchLastSynced();
  }, [lastSyncTime, logs]);

  // Set default subject if list changes
  React.useEffect(() => {
    if (subjectsList.length > 0 && !subjectsList.includes(manualSubject)) {
      setManualSubject(subjectsList[0]);
    }
  }, [subjectsList]);

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubject) return;

    if (onAddManualSession) {
      onAddManualSession(manualDuration, manualSubject, manualNotes, manualDate);
      setFeedback('🎉 Retroactive study session logged successfully!');
      
      // Reset
      setManualDuration(25);
      setManualNotes('');
      
      setTimeout(() => {
        setFeedback(null);
        setIsModalOpen(false);
      }, 1500);
    }
  };

  // 1. Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Logs for today
  const todayLogs = logs.filter(log => log.date === todayStr);
  const totalMinutesToday = todayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const pomodorosToday = todayLogs.filter(log => log.mode === 'focus').length;

  // Streak calculations (consecutive days)
  const getStreak = (allLogs: StudyLog[]): number => {
    if (allLogs.length === 0) return 0;
    
    // Get unique sorted dates of study
    const uniqueDates = Array.from(new Set(allLogs.map(log => log.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const checkDate = new Date();
    let streak = 0;
    let currentCheckIndex = 0;

    // Check if user studied today or yesterday to continue streak
    const format = (d: Date) => d.toISOString().split('T')[0];
    const today = format(checkDate);
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterday = format(checkDate);

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0;
    }

    let expectedDate = new Date(uniqueDates[0]);
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentStr = uniqueDates[i];
      const expectedStr = expectedDate.toISOString().split('T')[0];
      
      if (currentStr === expectedStr) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = getStreak(logs);

  // 3. Mode break-downs
  const totalFocusMinutes = logs
    .filter(log => log.mode === 'focus')
    .reduce((sum, log) => sum + log.durationMinutes, 0);

  // Check if no backup has been performed in over 24 hours (24 * 60 * 60 * 1000 = 86400000 ms)
  const isBackupWarning = !lastSyncedFromIDB || (Date.now() - lastSyncedFromIDB > 24 * 60 * 60 * 1000);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Backup Status Widget */}
      <div className={`p-4 rounded-2xl glossy-panel glossy-panel-hover transition-all duration-300 relative overflow-hidden ${
        isBackupWarning 
          ? 'border-rose-500/10 text-rose-200 shadow-rose-500/[0.02]' 
          : 'border-emerald-500/10 text-emerald-200 shadow-emerald-500/[0.02]'
      }`}>
        <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none ${
          isBackupWarning ? 'bg-rose-500' : 'bg-emerald-500'
        }`} />
        
        <div className="flex items-start gap-3 relative z-10">
          <div className={`p-2 rounded-xl border flex-shrink-0 ${
            isBackupWarning 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {isBackupWarning ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
          </div>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Backup Security Center
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isBackupWarning 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isBackupWarning ? 'At Risk' : 'Protected'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-sm font-semibold text-white">
                {isBackupWarning ? 'Backup Overdue' : 'Local Logs Secured'}
              </span>
              <span className="text-[10px] text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Database size={11} className="text-slate-500" />
                Last Synced: {lastSyncedFromIDB ? new Date(lastSyncedFromIDB).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Never'}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              {isBackupWarning 
                ? '⚠️ You have not saved a backup of your study logs in over 24 hours. Export a JSON backup to protect your focus history from data loss.' 
                : 'Your study statistics are fully mirrored offline. Keep performing periodic exports to guarantee safety.'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Focus Minutes */}
        <div className="p-4 rounded-2xl glossy-panel glossy-panel-hover flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-blue-500/5 blur-xl" />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Focus</span>
            <Clock className="text-blue-400" size={16} />
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-extralight text-white font-sans">{totalMinutesToday}</span>
            <span className="text-xs text-blue-300 ml-1">mins</span>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="p-4 rounded-2xl glossy-panel glossy-panel-hover flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-amber-500/5 blur-xl" />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Goal</span>
            <Trophy className="text-amber-400" size={16} />
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-extralight text-white font-sans">{pomodorosToday} / {pomodoroGoal}</span>
            <span className="text-[10px] text-amber-300 block mt-1 truncate">
              {pomodorosToday >= pomodoroGoal ? '🎉 Goal Achieved!' : `${pomodoroGoal - pomodorosToday} left`}
            </span>
          </div>
        </div>

        {/* Focus Streak */}
        <div className="p-4 rounded-2xl glossy-panel glossy-panel-hover flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-indigo-500/5 blur-xl" />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Streak</span>
            <Flame className="text-indigo-400" size={16} />
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-extralight text-white font-sans">{streak}</span>
            <span className="text-xs text-indigo-300 ml-1">days</span>
          </div>
        </div>

        {/* Total Focus Ever */}
        <div className="p-4 rounded-2xl glossy-panel glossy-panel-hover flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-emerald-500/5 blur-xl" />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Focus</span>
            <BookOpen className="text-emerald-400" size={16} />
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-extralight text-white font-sans">{totalFocusMinutes}</span>
            <span className="text-xs text-emerald-300 ml-1">mins</span>
          </div>
        </div>

        {/* Calculated Focus Score (Premium Metric) */}
        <div className="p-4 rounded-2xl glossy-panel glossy-panel-hover flex flex-col justify-between min-h-[110px] relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-pink-500/5 blur-xl" />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Focus Score</span>
            <Trophy className="text-pink-400 animate-pulse" size={16} />
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-extralight text-white font-sans">
              {Math.min(100, Math.round(
                (Math.min(1, pomodorosToday / pomodoroGoal) * 50) + 
                (Math.min(5, streak) * 10)
              ))}
            </span>
            <span className="text-xs text-pink-300 ml-1">/ 100</span>
            <span className="text-[8.5px] text-pink-500 font-bold uppercase tracking-widest block mt-1">Based on Goal & Streak</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div className="p-5 rounded-2xl glossy-panel glossy-panel-hover flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Calendar size={14} className="text-blue-400" />
              Weekly Study Distribution
            </h3>
          </div>
          <div className="w-full h-full flex items-center justify-center">
            <WeeklyBarChart logs={logs} />
          </div>
        </div>

        {/* Subject Breakdown Pie Chart */}
        <div className="p-5 rounded-2xl glossy-panel glossy-panel-hover flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <ChartIcon size={14} className="text-purple-400" />
              Subject Time Distribution
            </h3>
          </div>
          <div className="w-full h-full flex items-center justify-center">
            <SubjectPieChart logs={logs} />
          </div>
        </div>
      </div>

      {/* Log History */}
      <div className="p-5 rounded-2xl glossy-panel glossy-panel-hover">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            Focus Log History
          </h3>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-pink-500/15 to-purple-500/15 hover:from-pink-500/25 hover:to-purple-500/25 text-pink-300 hover:text-white border border-pink-500/25 hover:border-pink-500/40 px-3 py-1.5 rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={12} className="text-pink-400" />
              Manual Add
            </button>
            {onClearLogs && logs.length > 0 && (
              <button
                id="btn-clear-logs"
                onClick={onClearLogs}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                Clear Logs
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-white/5 rounded-xl">
            No study sessions recorded yet. Start focusing to build history!
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
            {logs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${
                    log.mode === 'focus' ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]' : log.mode === 'short_break' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`} />
                  <div>
                    <p className="text-slate-200 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>{log.mode === 'focus' ? 'Focus Session' : log.mode === 'short_break' ? 'Short Break' : 'Long Break'}</span>
                      {log.mode === 'focus' && log.subject && (
                        <span className="text-[9px] bg-pink-500/15 text-pink-300 px-1.5 py-0.5 rounded-md font-mono border border-pink-500/20 uppercase tracking-wider">
                          {log.subject}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {log.notes && <span className="text-slate-600 italic block mt-0.5 text-[9px]">"{log.notes}"</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-300">{log.durationMinutes}</span>
                  <span className="text-[10px] text-slate-500 ml-1">min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Add Session Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md rounded-3xl p-6 bg-slate-950/80 border border-pink-500/20 shadow-[0_0_50px_rgba(236,72,153,0.15)] backdrop-blur-3xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
              
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400">
                    <Plus size={16} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                    Log Retroactive Session
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {feedback ? (
                <div className="py-8 text-center text-xs font-semibold text-pink-300 animate-pulse">
                  {feedback}
                </div>
              ) : (
                <form onSubmit={handleSubmitManual} className="flex flex-col gap-4">
                  {/* Duration Selector */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Study Duration</span>
                      <span className="text-pink-400 font-mono text-xs">{manualDuration} minutes</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-pink-500 border border-white/5"
                      />
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(Math.max(1, Number(e.target.value)))}
                        className="w-16 px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-mono font-bold text-center text-slate-200 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  {/* Subject Grid */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Select Subject
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {subjectsList.map((subj) => (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => setManualSubject(subj)}
                          className={`px-2 py-2 rounded-xl text-[10px] font-semibold border transition-all truncate text-center cursor-pointer ${
                            manualSubject === subj
                              ? 'bg-pink-500/15 text-pink-300 border-pink-500/35 shadow-[0_0_12px_rgba(236,72,153,0.15)] font-bold'
                              : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          {subj}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <CalendarIcon size={11} className="text-purple-400" />
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={manualDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-pink-500 w-full"
                    />
                  </div>

                  {/* Notes Area */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <FileText size={11} className="text-purple-400" />
                      Personal Session Notes (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. Practiced full-stack state mechanics and custom charts..."
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-pink-500 h-16 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-pink-500/20 active:scale-95"
                    >
                      Log Session
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
