import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Bell, BellOff, Search, Trash2, Check, CheckCheck, 
  Award, Database, Sparkles, BarChart2, Flame, Sliders, Info, Clock,
  Eye, ShieldAlert, CheckCircle, Smartphone, Archive
} from 'lucide-react';
import { NotificationManager, TimerraNotification, NotificationCategory } from '../lib/notificationManager';
import { playClick } from '../lib/audio';
import { Session } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isSilenceModeActive: boolean;
  onToggleSilenceMode?: () => void;
  onOpenCompletedSubjects?: () => void;
  sessions: Session[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  isSilenceModeActive,
  onToggleSilenceMode,
  onOpenCompletedSubjects,
  sessions
}) => {
  const [notifications, setNotifications] = useState<TimerraNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  // Streak Loss Warning and Risk Calculations
  const streakDays = useMemo(() => {
    const focusSess = sessions.filter(s => s.mode === 'focus');
    if (focusSess.length === 0) return 0;

    const uniqueDates = Array.from(new Set<string>(
      focusSess.map(s => new Date(s.completedAt).toISOString().split('T')[0])
    )).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

    const expectedStr = new Date().toISOString().split('T')[0];
    const prevDay = new Date();
    prevDay.setDate(prevDay.getDate() - 1);
    const prevStr = prevDay.toISOString().split('T')[0];

    if (uniqueDates[0] !== expectedStr && uniqueDates[0] !== prevStr) {
      return 0;
    }

    let streak = 0;
    const tracker = new Date(uniqueDates[0]);

    for (let i = 0; i < uniqueDates.length; i++) {
      const uStr = uniqueDates[i];
      const matchStr = tracker.toISOString().split('T')[0];
      if (uStr === matchStr) {
        streak++;
        tracker.setDate(tracker.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [sessions]);

  const hasFocusSessionToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions.some(s => s.mode === 'focus' && new Date(s.completedAt).toISOString().split('T')[0] === todayStr);
  }, [sessions]);

  const isStreakAtRisk = streakDays > 0 && !hasFocusSessionToday;
  const currentHour = new Date().getHours();
  const isLateHourRisk = currentHour >= 20; // 8:00 PM or later

  // Automatically dispatch a notification event once per day when they are at risk
  useEffect(() => {
    if (isOpen && isStreakAtRisk) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastWarnedToday = localStorage.getItem('timerra_last_streak_risk_warning_date');
      
      if (lastWarnedToday !== todayStr) {
        localStorage.setItem('timerra_last_streak_risk_warning_date', todayStr);
        
        const title = isLateHourRisk 
          ? 'CRITICAL: Streak at Risk of Resetting! ⚡'
          : 'Keep Your Study Streak Active! 🔥';
          
        const message = isLateHourRisk
          ? `It is past 8:00 PM and you have not completed a focus session today. Log a focus session before midnight to save your pristine ${streakDays}-day streak!`
          : `You currently have an active ${streakDays}-day study streak, but no focus sessions have been completed today. Log just one focus session today to keep your streak alive!`;

        NotificationManager.addNotification(
          title,
          message,
          'Focus Goals',
          isLateHourRisk, // critical if past 8:00 PM
          isSilenceModeActive
        );
      }
    }
  }, [isOpen, isStreakAtRisk, streakDays, isLateHourRisk, isSilenceModeActive]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevNotificationsCountRef = useRef<number>(0);

  // Load and subscribe to notification changes
  const reloadNotifications = () => {
    const loaded = NotificationManager.loadNotifications();
    setNotifications(loaded);
    setBrowserPermission(NotificationManager.getBrowserPermissionState());
  };

  // Keep the latest log entry in view automatically when new notifications arrive
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      if (notifications.length > prevNotificationsCountRef.current) {
        // Smoothly scroll to top where the latest log entry is rendered
        scrollContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      prevNotificationsCountRef.current = notifications.length;
    }
  }, [notifications.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      reloadNotifications();
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleChanged = () => {
      reloadNotifications();
    };
    window.addEventListener('timerra_notifications_changed', handleChanged);
    return () => {
      window.removeEventListener('timerra_notifications_changed', handleChanged);
    };
  }, []);

  // Browser Permission Request Handler
  const handleEnableBrowserNotifications = async () => {
    playClick();
    const result = await NotificationManager.requestBrowserPermission();
    setBrowserPermission(result);
    
    if (result === 'granted') {
      NotificationManager.addNotification(
        'System Access Authorized',
        'Browser-level notifications are now successfully integrated with your study machine.',
        'System',
        false,
        isSilenceModeActive
      );
    }
  };

  // Mark single as read
  const handleMarkAsRead = (id: string) => {
    playClick();
    NotificationManager.markAsRead(id);
  };

  // Delete single
  const handleDelete = (id: string) => {
    playClick();
    NotificationManager.deleteNotification(id);
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    playClick();
    NotificationManager.markAllAsRead();
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('Clear all notifications in your history vault?')) {
      playClick();
      NotificationManager.clearAll();
    }
  };

  // Categories helper definitions with icons & color themes
  const categoryMetaData: {
    [key in NotificationCategory]: { label: string; icon: any; bg: string; text: string; border: string };
  } = {
    Milestones: { label: 'Milestones', icon: Award, bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    Capsules: { label: 'Capsules', icon: Database, bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    'Legacy Cards': { label: 'Legacy Cards', icon: Sparkles, bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    Analytics: { label: 'Analytics', icon: BarChart2, bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
    'Focus Goals': { label: 'Focus Goals', icon: Flame, bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    System: { label: 'System', icon: Sliders, bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    Updates: { label: 'Updates', icon: Info, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  };

  // Filter and Search processing
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Search term check
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(term);
        const matchesMsg = n.message.toLowerCase().includes(term);
        if (!matchesTitle && !matchesMsg) return false;
      }

      // Category check
      if (selectedCategory !== 'all' && n.category !== selectedCategory) {
        return false;
      }

      // Read status check
      if (statusFilter === 'unread' && n.isRead) return false;
      if (statusFilter === 'read' && !n.isRead) return false;

      return true;
    });
  }, [notifications, searchQuery, selectedCategory, statusFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Group notifications into Today, Yesterday, This Week, and Older timelines
  const groupedFeed = useMemo(() => {
    const today: TimerraNotification[] = [];
    const yesterday: TimerraNotification[] = [];
    const thisWeek: TimerraNotification[] = [];
    const older: TimerraNotification[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    
    const tempYesterday = new Date();
    tempYesterday.setDate(now.getDate() - 1);
    const yesterdayStr = tempYesterday.toDateString();

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

    filteredNotifications.forEach(n => {
      const date = new Date(n.timestamp);
      const dateStr = date.toDateString();

      if (dateStr === todayStr) {
        today.push(n);
      } else if (dateStr === yesterdayStr) {
        yesterday.push(n);
      } else if (date.getTime() >= startOfWeek.getTime()) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return [
      { title: 'Today', items: today },
      { title: 'Yesterday', items: yesterday },
      { title: 'This Week', items: thisWeek },
      { title: 'Older', items: older }
    ].filter(group => group.items.length > 0);
  }, [filteredNotifications]);

  // Relative Time String Helper
  const getRelativeTimeString = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-fade-in select-none">
      {/* Back click exit */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Slide-over container panel: Slide-over on Desktop, Elegant Float Sheet on Mobile */}
      <div className="relative w-full md:max-w-md h-[95vh] md:h-screen mt-auto md:mt-0 bg-[#060814]/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10 shadow-2xl flex flex-col overflow-hidden rounded-t-[2.5rem] md:rounded-t-none md:rounded-l-[2.5rem] animate-slide-in">
        
        {/* Living background light waves */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-tm-primary/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-tm-accent/5 rounded-full pointer-events-none" />

         {/* HEADER PANEL */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-tm-primary animate-pulse" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-[#070b1a] text-[9px] font-bold flex items-center justify-center text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-[0.25em] uppercase text-white">
                Focus Feed
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Notification Center & Central Timeline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Completed Subjects Button (No Notification Badge as requested) */}
            <button
              onClick={() => { playClick(); onOpenCompletedSubjects?.(); }}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/15 hover:border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 hover:text-white transition-all cursor-pointer relative shrink-0"
              title="Completed Subjects Archive"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-[10px] uppercase tracking-wider">Completed</span>
            </button>

            {/* Exit button */}
            <button
              onClick={onClose}
              className="w-11 h-11 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Close Panel"
              id="close_logs_btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS / SILENCE AND BROWSER NOTIFICATIONS BAR */}
        <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 flex flex-col gap-3 relative z-10 shrink-0">
          
          {/* Absolute Silence Mode Status Widget */}
          <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl flex items-center justify-center ${isSilenceModeActive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border border-white/5'}`}>
                {isSilenceModeActive ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Absolute Silence Mode
                  {isSilenceModeActive && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                </span>
                <p className="text-[10px] text-slate-400 leading-none">
                  {isSilenceModeActive ? 'Silence enabled. All milestone and tip alerts are held.' : 'Allows non-critical visual notifications.'}
                </p>
              </div>
            </div>
            {onToggleSilenceMode && (
              <button
                onClick={onToggleSilenceMode}
                className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-xl border transition-all cursor-pointer min-w-[70px] text-center ${
                  isSilenceModeActive
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
                id="toggle_silence_mode_btn"
              >
                {isSilenceModeActive ? 'Active' : 'Silence'}
              </button>
            )}
          </div>

          {/* Streak Risk Warning Widget */}
          {isStreakAtRisk && (
            <div className={`flex flex-col gap-2.5 border rounded-2xl p-3.5 transition-all relative overflow-hidden ${
              isLateHourRisk 
                ? 'bg-rose-500/[0.06] border-rose-500/35 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
                : 'bg-amber-500/[0.03] border-amber-500/25'
            }`}>
              {/* Hot visual highlight glow */}
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none -mr-4 -mt-4 ${
                isLateHourRisk ? 'bg-rose-500/15' : 'bg-amber-500/10'
              }`} />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isLateHourRisk 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    <Flame className={`w-4 h-4 ${isLateHourRisk ? 'animate-bounce text-rose-400' : 'animate-pulse text-amber-400'}`} />
                  </div>
                  <div className="space-y-0.5">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLateHourRisk ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      Streak at Risk ({streakDays}d)
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLateHourRisk ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    </span>
                    <p className="text-[10px] text-slate-300 leading-normal font-medium">
                      {isLateHourRisk 
                        ? `Critical: It's past 8:00 PM! Complete a focus session before midnight to save your pristine ${streakDays}-day streak.`
                        : `You have an active streak from yesterday but haven't focused today yet. Keep the fire burning!`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    onClose();
                  }}
                  className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all shrink-0 hover:scale-[1.03] active:scale-[0.97] ${
                    isLateHourRisk 
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border-rose-500/35' 
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border-amber-500/25'
                  }`}
                >
                  Focus Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS CONTAINER */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          
          {/* Browser Notification API Prompt (Now scrolls with notifications) */}
          {browserPermission !== 'granted' && (
            <div className="flex items-center justify-between bg-tm-primary/5 border border-tm-primary/20 rounded-2xl p-3.5 mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-tm-primary/10 text-tm-primary border border-tm-primary/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">Browser Popups</span>
                  <p className="text-[10px] text-slate-400 leading-none">Alert me when focus timers finish in background tabs.</p>
                </div>
              </div>
              <button
                onClick={handleEnableBrowserNotifications}
                className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-xl bg-tm-primary/20 hover:bg-tm-primary/30 text-white border border-tm-primary/30 transition-all cursor-pointer"
                id="enable_browser_notifications_btn"
              >
                Enable
              </button>
            </div>
          )}

          {/* SEARCH, SORTING AND CATEGORY PILLS (Now scrolls with notifications) */}
          <div className="space-y-4 pb-4 border-b border-white/5">
            {/* Quick Search & Actions Row */}
            <div className="flex gap-2">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history logs..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-tm-primary placeholder-slate-500"
                />
              </div>

              {/* Read status filter select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0b1020]">All</option>
                <option value="unread" className="bg-[#0b1020]">Unread</option>
                <option value="read" className="bg-[#0b1020]">Read</option>
              </select>
            </div>

            {/* Category Pill Horizontal Scroller */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => { playClick(); setSelectedCategory('all'); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0 border ${
                  selectedCategory === 'all'
                    ? 'bg-white/10 border-white/20 text-white shadow-inner'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                All Logs
              </button>
              {Object.keys(categoryMetaData).map((catName) => {
                const meta = categoryMetaData[catName as NotificationCategory];
                const isSelected = selectedCategory === catName;
                return (
                  <button
                    key={catName}
                    onClick={() => { playClick(); setSelectedCategory(catName); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white/10 border-white/20 text-white shadow-inner'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.text}`} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center text-slate-500">
                <BellOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">No feed events found</h4>
                <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                  {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search criteria or category filters.'
                    : 'Focus goals, unlocked milestones, capsule actions, and system updates will stream into your timeline.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedFeed.map((group) => (
                <div key={group.title} className="space-y-3">
                  <div className="text-[9px] uppercase tracking-[0.25em] text-tm-primary font-extrabold border-b border-white/[0.03] pb-1 select-none">
                    {group.title}
                  </div>
                  <div className="space-y-3">
                    {group.items.map((n) => {
                      const meta = categoryMetaData[n.category] || categoryMetaData.System;
                      const CategoryIcon = meta.icon;
                      
                      return (
                        <div
                          key={n.id}
                          className={`p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] backdrop-blur-md border ${
                            n.isCritical 
                              ? 'border-rose-500/30 bg-rose-500/[0.02]' 
                              : n.isRead 
                                ? 'border-white/[0.05] bg-white/[0.01]' 
                                : 'border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.15)] bg-white/[0.04]'
                          } hover:bg-white/[0.06] hover:border-white/25 transition-all flex items-start gap-3 sm:gap-3.5 relative group tm-3d-bar-shadow`}
                        >
                          {/* Unread Glow Dot Indicator */}
                          {!n.isRead && (
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-tm-primary shadow-[0_0_8px_var(--tm-glow)]" />
                          )}

                          {/* Category Icon Capsule */}
                          <div className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.text} border ${meta.border} flex items-center justify-center shrink-0`}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>

                          {/* Content Detail */}
                          <div className="flex-1 space-y-1 min-w-0 pr-6">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                                {meta.label}
                                {n.isCritical && (
                                  <span className="text-rose-400 font-extrabold uppercase bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20 text-[7px]">
                                    Critical
                                  </span>
                                )}
                              </span>
                              <span className="text-[8px] font-bold font-mono text-slate-500 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {getRelativeTimeString(n.timestamp)}
                              </span>
                            </div>

                            <h4 className={`text-xs font-bold leading-snug truncate ${n.isRead ? 'text-slate-300 font-semibold' : 'text-white'}`}>
                              {n.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                              {n.message}
                            </p>
                          </div>

                          {/* Quick Single actions */}
                          <div className="absolute right-3.5 top-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="w-7 h-7 bg-[#070b1a] hover:bg-white/5 border border-white/5 text-slate-400 hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                title="Mark as Read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(n.id)}
                              className="w-7 h-7 bg-[#070b1a] hover:bg-rose-500/10 border border-white/5 text-slate-400 hover:text-rose-400 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* BOTTOM MASTER BAR */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-white/5 bg-[#050813] flex items-center justify-between relative z-10 shrink-0">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Logs
            </button>

            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Read
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
