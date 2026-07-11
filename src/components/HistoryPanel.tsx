import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, Filter, ArrowUpDown, Download, Trash2, Calendar, Clock, 
  Tag, Compass, Smile, Smartphone, Flame, Award, BarChart2, Plus, Edit2, Check
} from 'lucide-react';
import { Session, TimerMode } from '../types';
import { TimerraDB } from '../lib/db';
import { playClick } from '../lib/audio';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onSessionsUpdated: (updated: Session[]) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  sessions,
  onSessionsUpdated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest');
  
  // Note editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editMood, setEditMood] = useState('');

  // Local storage cache or fetch to make sure database is fully aligned
  const reloadHistory = async () => {
    try {
      const all = await TimerraDB.allSessions();
      onSessionsUpdated(all);
    } catch (e) {
      console.error('Failed to reload session history from IndexedDB:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadHistory();
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Single Session deletion
  const handleDeleteSession = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this focus session record?')) {
      playClick();
      try {
        await TimerraDB.deleteSession(id);
        await reloadHistory();
      } catch (e) {
        console.error('Failed to delete session:', e);
      }
    }
  };

  // Clear entire history
  const handleClearHistory = async () => {
    if (window.confirm('CRITICAL ACTION: This will permanently delete ALL focus session logs. This action is irreversible. Proceed?')) {
      playClick();
      try {
        // We'll delete them one by one or create a clear function in DB. 
        // Let's delete each session currently in local list.
        for (const s of sessions) {
          if (s.id) await TimerraDB.deleteSession(s.id);
        }
        await reloadHistory();
      } catch (e) {
        console.error('Failed to clear session history:', e);
      }
    }
  };

  // Start editing a card
  const startEditing = (s: Session) => {
    playClick();
    setEditingId(s.id || null);
    setEditNotes(s.notes || '');
    setEditGoal(s.goal || '');
    setEditMood(s.mood || 'Focused');
  };

  // Save changes to card
  const saveEditing = async (id: number) => {
    playClick();
    try {
      const all = await TimerraDB.allSessions();
      const match = all.find(s => s.id === id);
      if (match) {
        const updated: Session = {
          ...match,
          notes: editNotes,
          goal: editGoal,
          mood: editMood
        };
        await TimerraDB.updateSession(updated);
      }
      setEditingId(null);
      await reloadHistory();
    } catch (e) {
      console.error('Failed to update session details:', e);
    }
  };

  // Process Search, Filtering & Sorting
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSubject = s.subject.toLowerCase().includes(query);
        const matchNotes = (s.notes || '').toLowerCase().includes(query);
        const matchGoal = (s.goal || '').toLowerCase().includes(query);
        if (!matchSubject && !matchNotes && !matchGoal) return false;
      }

      // Mode filter
      if (modeFilter !== 'all' && s.mode !== modeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && !s.completed) return false;
        if (statusFilter === 'skipped' && !s.skipped) return false;
        if (statusFilter === 'stopped' && !s.stopped && !s.cancelled) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return b.completedAt - a.completedAt;
      if (sortBy === 'oldest') return a.completedAt - b.completedAt;
      if (sortBy === 'longest') return b.durationSec - a.durationSec;
      if (sortBy === 'shortest') return a.durationSec - b.durationSec;
      return 0;
    });
  }, [sessions, searchQuery, modeFilter, statusFilter, sortBy]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
    const completedCount = sessions.filter(s => s.completed).length;
    const completionRate = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0;

    // Daily focus times to calculate streak
    const uniqueDays = new Set(
      sessions.map(s => new Date(s.completedAt).toDateString())
    );
    const totalDaysFocused = uniqueDays.size;

    // Find most productive subject
    const subjectMins: { [sub: string]: number } = {};
    sessions.forEach(s => {
      subjectMins[s.subject] = (subjectMins[s.subject] || 0) + s.durationSec / 60;
    });
    let topSubject = 'None';
    let maxMins = 0;
    Object.keys(subjectMins).forEach(sub => {
      if (subjectMins[sub] > maxMins) {
        maxMins = subjectMins[sub];
        topSubject = sub;
      }
    });

    return {
      hours: (totalSec / 3600).toFixed(1),
      sessionsCount: sessions.length,
      completionRate,
      streak: totalDaysFocused,
      topSubject: topSubject.length > 18 ? topSubject.slice(0, 15) + '...' : topSubject
    };
  }, [sessions]);

  // Client-Side CSV Export File Generator
  const handleExportCSV = () => {
    playClick();
    if (sessions.length === 0) {
      alert('No sessions available to export.');
      return;
    }

    const headers = [
      'ID', 'Timer Mode', 'Subject', 'Start Time', 'End Time', 
      'Actual Duration (Sec)', 'Planned Duration (Sec)', 
      'Completed', 'Skipped', 'Stopped', 'Goal', 'Notes', 'Mood', 'Orb Theme', 'Device', 'Date', 'Week', 'Month'
    ];

    const rows = sessions.map(s => [
      s.id || '',
      s.mode,
      `"${s.subject.replace(/"/g, '""')}"`,
      s.startTime ? new Date(s.startTime).toISOString() : '',
      new Date(s.completedAt).toISOString(),
      s.durationSec,
      s.plannedDurationSec || '',
      s.completed ? 'TRUE' : 'FALSE',
      s.skipped ? 'TRUE' : 'FALSE',
      s.stopped ? 'TRUE' : 'FALSE',
      s.goal ? `"${s.goal.replace(/"/g, '""')}"` : '',
      s.notes ? `"${s.notes.replace(/"/g, '""')}"` : '',
      s.mood || '',
      s.orbTheme || '',
      s.device || '',
      s.date || '',
      s.week || '',
      s.month || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timerra_focus_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-Side JSON Export File Generator
  const handleExportJSON = () => {
    playClick();
    if (sessions.length === 0) {
      alert('No sessions available to export.');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `timerra_focus_history_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModeStyles = (mode: TimerMode) => {
    const studyModes = ['focus', 'deepFocus', 'sprint', 'marathon', 'zen', 'infinityFocus'];
    if (studyModes.includes(mode)) {
      return { bg: 'bg-tm-primary/10 text-tm-primary border-tm-primary/15', label: 'Focus' };
    }
    return { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/15', label: 'Break' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Container Card */}
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[820px] bg-[#070b1a]/95 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Subtle glowing highlights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-tm-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-tm-accent/5 rounded-full blur-[120px] pointer-events-none" />

        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-tm-primary" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-[0.25em] uppercase text-white">
                Advanced History Hub
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Audited Session Logs, Local Analytics & Interactive Note Vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Dismiss Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BENTO STATS METRICS GRID */}
        <div className="p-6 bg-white/[0.01] border-b border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-3.5 relative z-10 shrink-0">
          
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400/80 font-bold select-none">Total Hours</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white font-mono">{stats.hours}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase font-sans">hrs</span>
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400/80 font-bold select-none">Completed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white font-mono">{stats.sessionsCount}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase font-sans">blocks</span>
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400/80 font-bold select-none">Success Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-400 font-mono">{stats.completionRate}%</span>
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400/80 font-bold select-none">Days Active</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-400 font-mono">{stats.streak}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase font-sans">days</span>
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-1 col-span-2 sm:col-span-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400/80 font-bold select-none">Primary Target</span>
            <div className="text-xs font-black text-tm-primary truncate mt-1 select-text">
              {stats.topSubject}
            </div>
          </div>

        </div>

        {/* CONTROLS (SEARCH, FILTER, SORT, ACTIONS) */}
        <div className="px-6 py-4 border-b border-white/5 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0 bg-[#060a17]/50">
          
          {/* Left: Search input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, notes, goal..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-tm-primary placeholder-slate-500"
            />
          </div>

          {/* Center: Filters & Sorters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            {/* Mode Select */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b1020]">All Modes</option>
              <option value="focus" className="bg-[#0b1020]">Focus Sessions</option>
              <option value="deepFocus" className="bg-[#0b1020]">Deep Focus</option>
              <option value="infinityFocus" className="bg-[#0b1020]">Infinity Focus</option>
              <option value="sprint" className="bg-[#0b1020]">Sprint</option>
              <option value="marathon" className="bg-[#0b1020]">Marathon</option>
              <option value="zen" className="bg-[#0b1020]">Zen Garden</option>
              <option value="shortBreak" className="bg-[#0b1020]">Short Break</option>
              <option value="longBreak" className="bg-[#0b1020]">Long Break</option>
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b1020]">All Statuses</option>
              <option value="completed" className="bg-[#0b1020]">Completed</option>
              <option value="stopped" className="bg-[#0b1020]">Stopped / Cancelled</option>
              <option value="skipped" className="bg-[#0b1020]">Skipped</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#0b1020]">Newest First</option>
              <option value="oldest" className="bg-[#0b1020]">Oldest First</option>
              <option value="longest" className="bg-[#0b1020]">Longest Duration</option>
              <option value="shortest" className="bg-[#0b1020]">Shortest Duration</option>
            </select>

          </div>

          {/* Right: Export/Delete buttons */}
          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex-1 md:flex-none h-10 px-4 bg-tm-primary/10 hover:bg-tm-primary/20 border border-tm-primary/15 text-tm-primary hover:text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              title="Download as Microsoft Excel compatible CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex-1 md:flex-none h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              title="Download as standard structural JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            {sessions.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="w-10 h-10 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Format entire study database"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* SESSIONS CARDS GRID/LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          
          {filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center text-slate-500">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">No study records matching filters</h4>
                <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                  Try adjusting your search query, choosing a different mode, or expanding the status criteria.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSessions.map((s) => {
                const isEditing = editingId === s.id;
                const { bg, label } = getModeStyles(s.mode);
                const focusDate = new Date(s.completedAt);
                const formatTime = focusDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={s.id || s.completedAt}
                    className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between gap-4 relative group shadow-xl hover:bg-white/[0.03]"
                  >
                    {/* Mode Tag and quick actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${bg}`}>
                          {label}: {s.mode}
                        </span>
                        {s.completed && (
                          <span className="text-[8px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Completed
                          </span>
                        )}
                        {s.skipped && (
                          <span className="text-[8px] font-extrabold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">
                            Skipped
                          </span>
                        )}
                        {(s.stopped || s.cancelled) && (
                          <span className="text-[8px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
                            Stopped
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isEditing && (
                          <button
                            onClick={() => startEditing(s)}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                            title="Edit Notes & Goals"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSession(s.id!)}
                          className="w-7 h-7 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          title="Delete Session Record"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Main Content Details */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between select-text">
                        <h4 className="text-sm font-black text-white truncate max-w-[200px]">
                          {s.subject}
                        </h4>
                        <span className="text-base font-extrabold text-white font-mono tracking-wider flex items-center gap-1">
                          {Math.floor(s.durationSec / 60)}<span className="text-[10px] text-slate-500 font-bold uppercase font-sans">m</span>
                          {s.durationSec % 60 > 0 && (
                            <>
                              {s.durationSec % 60}
                              <span className="text-[10px] text-slate-500 font-bold uppercase font-sans">s</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Goal and notes info */}
                      <div className="space-y-1.5 select-text">
                        {isEditing ? (
                          <div className="space-y-2 pt-1 select-none">
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Focus Goal</label>
                              <input
                                type="text"
                                value={editGoal}
                                onChange={(e) => setEditGoal(e.target.value)}
                                placeholder="State your focus objective..."
                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-tm-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Session Notes</label>
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="What did you achieve during this focus block?..."
                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-tm-primary min-h-[50px] resize-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Focus Mood</label>
                              <select
                                value={editMood}
                                onChange={(e) => setEditMood(e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                              >
                                <option value="Focused">Focused</option>
                                <option value="Calm">Calm</option>
                                <option value="Tired">Tired</option>
                                <option value="Distracted">Distracted</option>
                                <option value="Energetic">Energetic</option>
                              </select>
                            </div>
                            <button
                              onClick={() => saveEditing(s.id!)}
                              className="w-full h-8 bg-tm-primary text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-tm-primary/80"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <>
                            {(s.goal || s.notes || s.mood) ? (
                              <div className="bg-black/20 rounded-2xl p-3 border border-white/5 text-[11px] leading-relaxed text-slate-400 space-y-1 select-text">
                                {s.goal && (
                                  <div>
                                    <span className="text-slate-500 font-extrabold uppercase text-[8px] tracking-wider block">Goal</span>
                                    <span className="text-slate-300 font-medium">{s.goal}</span>
                                  </div>
                                )}
                                {s.notes && (
                                  <div className="mt-1">
                                    <span className="text-slate-500 font-extrabold uppercase text-[8px] tracking-wider block">Notes</span>
                                    <span className="text-slate-300 italic">"{s.notes}"</span>
                                  </div>
                                )}
                                {s.mood && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-slate-500 font-extrabold uppercase text-[8px] tracking-wider">Mood:</span>
                                    <span className="text-tm-primary font-bold text-[10px] bg-tm-primary/5 px-1.5 py-0.2 rounded border border-tm-primary/10 flex items-center gap-1">
                                      <Smile className="w-3 h-3" />
                                      {s.mood}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-500 italic">No notes or goals registered for this session. Hover card to edit.</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metadata Footer bar of Card */}
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold border-t border-white/5 pt-3 select-none">
                      <span className="flex items-center gap-1 font-mono uppercase">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        {s.date || focusDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-600" />
                        {formatTime}
                      </span>
                      {s.device && (
                        <span className="flex items-center gap-1 uppercase tracking-wider">
                          <Smartphone className="w-3 h-3 text-slate-600" />
                          {s.device}
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
