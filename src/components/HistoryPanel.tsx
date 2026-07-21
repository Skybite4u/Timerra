import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, Filter, ArrowUpDown, Download, Trash2, Calendar, Clock, 
  Tag, Compass, Smile, Smartphone, Flame, Award, BarChart2, Plus, Edit2, Check,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, TimerMode } from '../types';
import { TimerraDB } from '../lib/db';
import { playClick } from '../lib/audio';

interface InlineSessionNoteProps {
  s: Session;
  onSave: (notes: string) => Promise<void>;
}

const InlineSessionNote: React.FC<InlineSessionNoteProps> = ({ s, onSave }) => {
  const [val, setVal] = useState(s.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setVal(s.notes || '');
  }, [s.notes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVal(e.target.value);
    setIsSaved(false);
  };

  const handleBlur = async () => {
    if (val !== (s.notes || '')) {
      setIsSaving(true);
      await onSave(val);
      setIsSaving(false);
      setIsSaved(true);
      const t = setTimeout(() => setIsSaved(false), 2000);
      return () => clearTimeout(t);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        value={val}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Type brief, context-aware notes..."
        rows={1}
        className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-black/40 border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none min-h-[44px] font-sans leading-relaxed shadow-inner"
      />
      {isSaving && (
        <span className="absolute bottom-1.5 right-2 text-[9px] text-tm-primary font-bold animate-pulse">
          Saving...
        </span>
      )}
      {isSaved && !isSaving && (
        <span className="absolute bottom-1.5 right-2 text-[9px] text-emerald-400 font-bold flex items-center gap-1">
          <Check className="w-2.5 h-2.5" /> Saved
        </span>
      )}
      {!isSaving && !isSaved && val !== (s.notes || '') && (
        <span className="absolute bottom-1.5 right-2 text-[9px] text-amber-400 font-bold">
          Click away to save
        </span>
      )}
    </div>
  );
};

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
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest');
  
  // Note editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editMood, setEditMood] = useState('');

  // Manual Logging Form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [manualSubject, setManualSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [selectCustomSubject, setSelectCustomSubject] = useState(false);
  const [manualMode, setManualMode] = useState<TimerMode>('focus');
  const [manualDuration, setManualDuration] = useState<number>(25);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualGoal, setManualGoal] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualMood, setManualMood] = useState('Focused');

  // Deletion modals state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTimeString = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    if (isOpen) {
      setManualDate(getTodayString());
      setManualTime(getCurrentTimeString());
      setManualMode('focus');
      setManualDuration(25);
      setManualGoal('');
      setManualNotes('');
      setManualMood('Focused');
      setCustomSubject('');
      setSelectCustomSubject(false);

      // Fetch subjects list
      const fetchSubjects = async () => {
        try {
          const subs = await TimerraDB.allSubjects();
          setSubjectsList(subs);
          if (subs.length > 0) {
            setManualSubject(subs[0]);
          } else {
            setManualSubject('Deep Work');
          }
        } catch (err) {
          console.error('Failed to load subjects', err);
        }
      };
      fetchSubjects();
    }
  }, [isOpen]);

  const handleLogManualSession = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    const subjectToSave = selectCustomSubject ? customSubject.trim() : manualSubject;

    if (!subjectToSave) {
      alert("Please select or enter a subject name.");
      return;
    }

    if (!manualDuration || manualDuration <= 0) {
      alert("Please enter a valid duration in minutes.");
      return;
    }

    try {
      const [year, month, day] = manualDate.split('-').map(Number);
      const [hours, minutes] = manualTime.split(':').map(Number);
      const completedDate = new Date(year, month - 1, day, hours, minutes);
      const completedAt = completedDate.getTime();
      const durationSec = manualDuration * 60;
      const startTime = completedAt - durationSec * 1000;

      const getWeekNumber = (date: Date): string => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return `Week ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
      };

      const getMonthName = (date: Date): string => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[date.getMonth()];
      };

      const newSession: Session = {
        mode: manualMode,
        subject: subjectToSave,
        durationSec: durationSec,
        completedAt: completedAt,
        startTime: startTime,
        endTime: completedAt,
        actualDurationSec: durationSec,
        plannedDurationSec: durationSec,
        completed: true,
        goal: manualGoal.trim() || undefined,
        notes: manualNotes.trim() || undefined,
        mood: manualMood || 'Focused',
        device: 'Offline Log',
        date: manualDate,
        week: getWeekNumber(completedDate),
        month: getMonthName(completedDate)
      };

      // Add to IndexedDB
      await TimerraDB.addSession(newSession);

      // Save custom subject if newly created
      if (selectCustomSubject) {
        await TimerraDB.addSubject(subjectToSave);
      }

      // Close the form & reload history
      setShowManualForm(false);
      await reloadHistory();
    } catch (err) {
      console.error("Failed to manually log focus session:", err);
      alert("Failed to save the focus session. Please check your inputs.");
    }
  };

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
  const handleDeleteSession = (id: number) => {
    playClick();
    setDeleteTargetId(id);
  };

  const confirmDeleteSession = async () => {
    if (!deleteTargetId) return;
    playClick();
    try {
      await TimerraDB.deleteSession(deleteTargetId);
      await reloadHistory();
    } catch (e) {
      console.error('Failed to delete session:', e);
    } finally {
      setDeleteTargetId(null);
    }
  };

  // Clear entire history
  const handleClearHistory = () => {
    playClick();
    setIsClearingAll(true);
  };

  const confirmClearHistory = async () => {
    playClick();
    try {
      // Let's delete each session currently in local list.
      for (const s of sessions) {
        if (s.id) await TimerraDB.deleteSession(s.id);
      }
      await reloadHistory();
    } catch (e) {
      console.error('Failed to clear session history:', e);
    } finally {
      setIsClearingAll(false);
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

  // Filter sessions by selected date range
  const dateFilteredSessions = useMemo(() => {
    const now = new Date();
    
    // Start of current week (Sunday)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of current month (1st of month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    return sessions.filter((s) => {
      if (dateRangeFilter === 'week') {
        return s.completedAt >= startOfWeek.getTime();
      }
      if (dateRangeFilter === 'month') {
        return s.completedAt >= startOfMonth.getTime();
      }
      return true; // 'all'
    });
  }, [sessions, dateRangeFilter]);

  // Process Search, Filtering & Sorting
  const filteredSessions = useMemo(() => {
    return dateFilteredSessions.filter((s) => {
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
  }, [dateFilteredSessions, searchQuery, modeFilter, statusFilter, sortBy]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalSec = dateFilteredSessions.reduce((sum, s) => sum + s.durationSec, 0);
    const completedCount = dateFilteredSessions.filter(s => s.completed).length;
    const completionRate = dateFilteredSessions.length > 0 ? Math.round((completedCount / dateFilteredSessions.length) * 100) : 0;

    // Daily focus times to calculate streak
    const uniqueDays = new Set(
      dateFilteredSessions.map(s => new Date(s.completedAt).toDateString())
    );
    const totalDaysFocused = uniqueDays.size;

    // Find most productive subject overall
    const subjectMins: { [sub: string]: number } = {};
    dateFilteredSessions.forEach(s => {
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

    // Find most productive subject this week (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklySessions = dateFilteredSessions.filter(s => s.completedAt >= sevenDaysAgo);
    const weeklySubjectMins: { [sub: string]: number } = {};
    weeklySessions.forEach(s => {
      weeklySubjectMins[s.subject] = (weeklySubjectMins[s.subject] || 0) + s.durationSec / 60;
    });
    let weeklyTopSubject = 'None';
    let maxWeeklyMins = 0;
    Object.keys(weeklySubjectMins).forEach(sub => {
      if (weeklySubjectMins[sub] > maxWeeklyMins) {
        maxWeeklyMins = weeklySubjectMins[sub];
        weeklyTopSubject = sub;
      }
    });
    // Fallback to all-time top subject if no weekly session is recorded yet
    if (weeklyTopSubject === 'None' && topSubject !== 'None') {
      weeklyTopSubject = topSubject;
    }

    return {
      hours: (totalSec / 3600).toFixed(1),
      sessionsCount: dateFilteredSessions.length,
      completionRate,
      streak: totalDaysFocused,
      topSubject: topSubject.length > 18 ? topSubject.slice(0, 15) + '...' : topSubject,
      weeklyTopSubject: weeklyTopSubject.length > 18 ? weeklyTopSubject.slice(0, 15) + '...' : weeklyTopSubject
    };
  }, [dateFilteredSessions]);

  // Client-Side CSV Export File Generator
  const handleExportCSV = () => {
    playClick();
    if (filteredSessions.length === 0) {
      alert('No sessions matching the active filters are available to export.');
      return;
    }

    const headers = [
      'ID', 'Timer Mode', 'Subject', 'Start Time', 'End Time', 
      'Actual Duration (Sec)', 'Planned Duration (Sec)', 
      'Completed', 'Skipped', 'Stopped', 'Goal', 'Notes', 'Mood', 'Orb Theme', 'Device', 'Date', 'Week', 'Month'
    ];

    const rows = filteredSessions.map(s => [
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
    if (filteredSessions.length === 0) {
      alert('No sessions matching the active filters are available to export.');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredSessions, null, 2));
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Container Card: Slide-over on Desktop, Bottom Sheet on Mobile */}
      <div className="relative w-full md:max-w-2xl h-full md:h-screen mt-auto md:mt-0 bg-[#030712]/75 backdrop-blur-[24px] border-t md:border-t-0 md:border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden rounded-t-[2.5rem] md:rounded-t-none md:rounded-l-[2.5rem] animate-slide-in">
        
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

        {/* UNIFIED SCROLLABLE CORE BODY */}
        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scrollbar">

          {/* BENTO STATS METRICS GRID */}
          <div className="p-6 bg-white/[0.01] border-b border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-3.5 shrink-0">
          
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
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400/80 font-bold select-none">Weekly Top Subject</span>
            <div className="text-xs font-black text-tm-primary truncate mt-1 select-text">
              {stats.weeklyTopSubject}
            </div>
          </div>

        </div>

        {/* CONTROLS (SEARCH, FILTER, SORT, ACTIONS) - STICKY FOR ACCESSIBILITY */}
        <div className="px-6 py-4 border-b border-white/5 sticky top-0 z-20 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0 bg-[#030712]/45 backdrop-blur-md">
          
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
            
            {/* Date Range Select */}
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                playClick();
                setDateRangeFilter(e.target.value as any);
              }}
              className="bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer hover:bg-white/[0.05] transition-all"
              title="Filter by completion date range"
            >
              <option value="all" className="bg-[#0b1020]">All Time</option>
              <option value="week" className="bg-[#0b1020]">This Week</option>
              <option value="month" className="bg-[#0b1020]">This Month</option>
            </select>

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
          <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => { playClick(); setShowManualForm(prev => !prev); }}
              className={`flex-1 md:flex-none h-10 px-4 rounded-2xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                showManualForm 
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-bold' 
                  : 'bg-tm-primary/20 hover:bg-tm-primary/30 border border-tm-primary/20 text-white font-bold shadow-[0_0_15px_-3px_var(--tm-glow)]'
              }`}
              title="Manually log a past focus session completed offline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Session</span>
            </button>
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

        {/* SESSIONS CARDS LIST */}
        <div className="p-6 space-y-4 relative z-10 flex-1">
          
          {/* Manual Logging Form Card */}
          {showManualForm && (
            <form 
              onSubmit={handleLogManualSession}
              className="p-5 rounded-3xl bg-white/[0.03] border border-tm-primary/20 hover:border-tm-primary/30 transition-all flex flex-col gap-4 shadow-[0_0_25px_rgba(59,130,246,0.1)] animate-slide-in relative overflow-hidden"
            >
              {/* Subtle top decoration line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-tm-primary/40 via-tm-accent/40 to-tm-primary/40" />

              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-tm-primary/10 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-tm-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Log Past Focus Session
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { playClick(); setShowManualForm(false); }}
                  className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Subject Selector / Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    Subject / Project
                  </label>
                  {!selectCustomSubject ? (
                    <div className="flex gap-1.5">
                      <select
                        value={manualSubject}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setSelectCustomSubject(true);
                          } else {
                            setManualSubject(e.target.value);
                          }
                        }}
                        className="flex-1 bg-[#0b1020] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        {subjectsList.map((sub) => (
                          <option key={sub} value={sub} className="bg-[#0b1020] text-white">
                            {sub}
                          </option>
                        ))}
                        <option value="__custom__" className="bg-[#0b1020] text-tm-primary font-bold">
                          + Create Custom Subject...
                        </option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Enter custom subject name..."
                        className="flex-1 bg-white/[0.02] border border-tm-primary/30 focus:border-tm-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-600"
                        required
                        maxLength={40}
                      />
                      <button
                        type="button"
                        onClick={() => { playClick(); setSelectCustomSubject(false); }}
                        className="px-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Focus Mode Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-slate-500" />
                    Focus Style
                  </label>
                  <select
                    value={manualMode}
                    onChange={(e) => setManualMode(e.target.value as TimerMode)}
                    className="bg-[#0b1020] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="focus" className="bg-[#0b1020]">Timerra Pomodoro (Solar Orb)</option>
                    <option value="deepFocus" className="bg-[#0b1020]">Crystal Core (Calm)</option>
                    <option value="sprint" className="bg-[#0b1020]">Rocket Engine (Fast)</option>
                    <option value="marathon" className="bg-[#0b1020]">Ancient Library (Warm)</option>
                    <option value="zen" className="bg-[#0b1020]">Japanese Zen Garden (Peaceful)</option>
                  </select>
                </div>

                {/* Duration in Minutes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="bg-white/[0.02] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                    required
                  />
                </div>

                {/* Mood Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Smile className="w-3 h-3 text-slate-500" />
                    Focus Mindset / Mood
                  </label>
                  <select
                    value={manualMood}
                    onChange={(e) => setManualMood(e.target.value)}
                    className="bg-[#0b1020] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Focused" className="bg-[#0b1020]">Focused</option>
                    <option value="Calm" className="bg-[#0b1020]">Calm</option>
                    <option value="Energetic" className="bg-[#0b1020]">Energetic</option>
                    <option value="Tired" className="bg-[#0b1020]">Tired</option>
                    <option value="Distracted" className="bg-[#0b1020]">Distracted</option>
                  </select>
                </div>

                {/* Date Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Date Completed
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="bg-white/[0.02] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono text-slate-200"
                    required
                  />
                </div>

                {/* Time Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    Time Completed
                  </label>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="bg-white/[0.02] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono text-slate-200"
                    required
                  />
                </div>

                {/* Target Goal / Intention */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Award className="w-3 h-3 text-slate-500" />
                    Intended Goal / Milestone
                  </label>
                  <input
                    type="text"
                    value={manualGoal}
                    onChange={(e) => setManualGoal(e.target.value)}
                    placeholder="e.g. Completed Chapter 3 of Calculus study guide..."
                    className="bg-white/[0.02] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-600"
                    maxLength={100}
                  />
                </div>

                {/* Session Notes */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    Self-Reflection / Session Notes
                  </label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Type deep focus notes or reflection..."
                    rows={2}
                    className="bg-white/[0.02] border border-white/5 focus:border-tm-primary/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-600 resize-none font-sans"
                    maxLength={300}
                  />
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 justify-end border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => { playClick(); setShowManualForm(false); }}
                  className="h-9 px-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-extrabold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-tm-primary hover:bg-tm-primary/80 text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <Check className="w-3.5 h-3.5 font-bold" />
                  <span>Commit Session Log</span>
                </button>
              </div>

            </form>
          )}
          
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
                            <div className="space-y-2">
                              {(s.goal || s.mood) && (
                                <div className="bg-black/20 rounded-2xl p-3 border border-white/5 text-[11px] leading-relaxed text-slate-400 space-y-1 select-text">
                                  {s.goal && (
                                    <div>
                                      <span className="text-slate-500 font-extrabold uppercase text-[8px] tracking-wider block">Goal</span>
                                      <span className="text-slate-300 font-medium">{s.goal}</span>
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
                              )}
                              
                              <div className="space-y-1">
                                <span className="text-slate-500 font-extrabold uppercase text-[8px] tracking-wider block">
                                  Session Notes
                                </span>
                                <InlineSessionNote s={s} onSave={async (newNotes) => {
                                  try {
                                    const all = await TimerraDB.allSessions();
                                    const match = all.find(item => item.id === s.id);
                                    if (match) {
                                      const updated: Session = {
                                        ...match,
                                        notes: newNotes
                                      };
                                      await TimerraDB.updateSession(updated);
                                      await reloadHistory();
                                    }
                                  } catch (e) {
                                    console.error('Failed to update session notes inline:', e);
                                  }
                                }} />
                              </div>
                            </div>
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

      {/* DELETION CONFIRMATION MODALS */}
      <AnimatePresence>
        {deleteTargetId !== null && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 select-none">
            {/* Click backdrop to close */}
            <div className="absolute inset-0 cursor-default" onClick={() => setDeleteTargetId(null)} />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-[#060b18]/95 border border-rose-500/20 rounded-[2rem] p-6 shadow-[0_0_60px_rgba(239,68,68,0.15)] overflow-hidden backdrop-blur-[24px] text-center"
            >
              {/* Decorative radial warning glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Warning Indicator Icon */}
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-4 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>

              {/* Title & Warning description */}
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-2">Delete Forever?</h3>
              <p className="text-xs text-slate-400 leading-relaxed px-1">
                Are you sure you want to permanently delete this focus session record? This action is <strong className="text-rose-400">irreversible</strong> and will clear all metrics associated with it.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { playClick(); setDeleteTargetId(null); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSession}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:opacity-90 text-white shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all text-xs font-black uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClearingAll && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 select-none">
            {/* Click backdrop to close */}
            <div className="absolute inset-0 cursor-default" onClick={() => setIsClearingAll(false)} />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-[#060b18]/95 border border-rose-600/30 rounded-[2rem] p-6 shadow-[0_0_60px_rgba(220,38,38,0.25)] overflow-hidden backdrop-blur-[24px] text-center"
            >
              {/* Decorative intense radial warning glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

              {/* Danger Indicator Icon */}
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>

              {/* Title & Warning description */}
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-rose-500 mb-2">FORMAT DATABASE?</h3>
              <p className="text-xs text-slate-400 leading-relaxed px-1">
                CRITICAL WARNING: This will permanently delete <strong className="text-rose-400">ALL focus session logs</strong>. Your entire focus history, achievements, and statistics will be wiped forever.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { playClick(); setIsClearingAll(false); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearHistory}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white shadow-[0_0_20px_rgba(220,38,38,0.45)] transition-all text-xs font-black uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                >
                  Wipe Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  </div>
  );
};
