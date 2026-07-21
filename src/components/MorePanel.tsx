import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, ChevronRight, Award, Sparkles, Clock, Dna, Star, HelpCircle, Database, Sliders, BarChart2, Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MorePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction: (action: string) => void;
  todaySessionsCount: number;
  streakDays: number;
  timerRunning?: boolean;
  timerStatus?: 'running' | 'paused' | 'idle';
  isFullscreen?: boolean;
}

interface NavItem {
  id: string;
  name: string;
  description: string;
  category: 'workspace' | 'growth' | 'application';
  icon: React.ComponentType<any>;
  color: string;
  badge?: string;
}

export const MorePanel: React.FC<MorePanelProps> = ({ 
  isOpen, 
  onClose, 
  onTriggerAction,
  todaySessionsCount,
  streakDays,
  timerRunning = false,
  timerStatus = 'idle',
  isFullscreen = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showShortcuts) {
      setPressedKey(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      let keyId = '';
      if (e.key === ' ') {
        keyId = 'space';
      } else {
        keyId = e.key.toLowerCase();
      }

      if (['space', 'r', 'f', 's', 'm'].includes(keyId)) {
        // Prevent default spacebar scrolling
        if (keyId === 'space') {
          e.preventDefault();
        }
        setPressedKey(keyId);
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    const handleBlur = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [showShortcuts]);

  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'milestone',
      name: 'Milestone Vault',
      description: 'Audit study achievements & active streaks',
      category: 'workspace',
      icon: Award,
      color: 'border-amber-500/10',
      badge: `${streakDays}d Streak`
    },
    {
      id: 'legacy',
      name: 'Legacy Cards',
      description: 'Collect holographic digital focus memory cards',
      category: 'workspace',
      icon: Sparkles,
      color: 'border-rose-500/10'
    },
    {
      id: 'history',
      name: 'Focus Chronicle',
      description: 'Central chronological timeline of deep work',
      category: 'workspace',
      icon: Clock,
      color: 'border-purple-500/10'
    },
    {
      id: 'constellation',
      name: 'Focus Constellation',
      description: 'Interactive sky coordinates of study habits',
      category: 'workspace',
      icon: Star,
      color: 'border-amber-500/10'
    },
    {
      id: 'dna',
      name: 'Focus DNA',
      description: 'Cognitive behavior profiles & trait analyzer',
      category: 'growth',
      icon: Dna,
      color: 'border-indigo-500/10',
      badge: 'Growth'
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Performance charts & weekly focus trends',
      category: 'growth',
      icon: BarChart2,
      color: 'border-emerald-500/10'
    },
    {
      id: 'guide',
      name: 'Help Guide',
      description: 'Shortcuts, systems explanation & FAQ manual',
      category: 'application',
      icon: HelpCircle,
      color: 'border-teal-500/10'
    },
    {
      id: 'backup',
      name: 'Backup / Sync',
      description: 'Export raw database JSON or restore payload',
      category: 'application',
      icon: Database,
      color: 'border-sky-500/10'
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Timer intervals, sound effects & theme presets',
      category: 'application',
      icon: Sliders,
      color: 'border-white/5'
    }
  ], [streakDays]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return navItems;
    return navItems.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q)
    );
  }, [searchQuery, navItems]);

  const categories = [
    { id: 'workspace', label: 'Workspace Assets' },
    { id: 'growth', label: 'Growth & Insights' },
    { id: 'application', label: 'Application Systems' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Panel Container: Slide-over on desktop, Bottom Sheet on mobile */}
      <div className="relative w-full md:max-w-md h-full md:h-screen mt-auto md:mt-0 bg-[#030712]/70 backdrop-blur-[24px] border-t md:border-t-0 md:border-l border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden max-h-[85vh] md:max-h-screen rounded-t-[2.5rem] md:rounded-t-none md:rounded-l-[2.5rem] animate-slide-in">
        
        {/* Living background blur lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-tm-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-tm-accent/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />

        {/* HEADER */}
        <div className="p-6 border-b border-white/10 bg-white/[0.01] flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner">
              <span className="text-xl font-bold text-tm-primary">☰</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-[0.25em] uppercase text-white">
                Timerra Portal
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Workspace Layers & Analytics Navigator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Dismiss Portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BAR (Sticky) */}
        <div className="p-5 border-b border-white/10 bg-white/[0.01] relative z-10 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features, tools or logs..."
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-tm-primary/50 placeholder-slate-500 transition-colors"
            />
          </div>
        </div>

        {/* BODY (Scrollable content) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 relative z-10 custom-scrollbar scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No features match "{searchQuery}"
            </div>
          ) : (
            categories.map(cat => {
              const itemsInCat = filteredItems.filter(item => item.category === cat.id);
              if (itemsInCat.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-3">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/80 pl-1">
                    {cat.label}
                  </h3>
                  <div className="space-y-2">
                    {itemsInCat.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onClose();
                            onTriggerAction(item.id);
                          }}
                          className="w-full text-left p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 flex items-center justify-between group cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:scale-110 shrink-0 group-hover:bg-tm-primary/10 group-hover:border-tm-primary/30">
                              <Icon size={18} className="text-slate-300 group-hover:text-tm-primary transition-colors" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white group-hover:text-tm-primary transition-colors flex items-center gap-1.5">
                                {item.name}
                                {item.badge && (
                                  <span className="text-[8px] bg-tm-primary/20 border border-tm-primary/30 text-tm-primary px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase">
                                    {item.badge}
                                  </span>
                                )}
                              </span>
                              <p className="text-[10px] text-slate-400/90 leading-tight">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors translate-x-0 group-hover:translate-x-0.5 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* KEYBOARD SHORTCUTS TRIGGER BUTTON */}
          <div className="pt-2">
            <button
              onClick={() => setShowShortcuts(true)}
              className="w-full text-left p-3.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 flex items-center justify-between group cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:scale-110 shrink-0 group-hover:bg-rose-500/10 group-hover:border-rose-500/30">
                  <Keyboard size={18} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                    Keyboard Shortcuts
                  </span>
                  <p className="text-[10px] text-slate-400/90 leading-tight">
                    Instant hotkeys to seamlessly control the focus timer
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg shrink-0 group-hover:bg-rose-500/20 transition-colors">
                View
              </span>
            </button>
          </div>

          {/* TIMERRA ABOUT INFO BLOCK */}
          <div className="pt-4">
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col gap-1.5 text-center relative overflow-hidden backdrop-blur-md">
              <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-tm-accent/5 rounded-full blur-xl" />
              <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-extrabold">Timerra OS v2.0</span>
              <p className="text-[9.5px] text-slate-400/90 leading-relaxed max-w-xs mx-auto">
                Handcrafted, beautifully structured, 100% client-side digital sanctuary for focus and deep cognitive organization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Glassy Modal Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md px-4">
            {/* Click backdrop to close */}
            <div className="absolute inset-0 cursor-default" onClick={() => setShowShortcuts(false)} />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-[#060b18]/95 border border-white/[0.08] rounded-[2rem] p-6 shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden backdrop-blur-[24px]"
            >
              {/* Decorative glows */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowShortcuts(false)}
                className="absolute top-4 right-4 w-8 h-8 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Title */}
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 animate-pulse">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Timerra Hotkeys</h3>
                  <p className="text-[9.5px] text-slate-400 font-medium">Control study sessions instantly</p>
                </div>
              </div>

              {/* Interactive Keypress Help Info */}
              <div className="mb-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-left relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Input Detector</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Press any hotkey listed below on your keyboard to see the live detector flash and trigger!
                </p>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-2.5 relative z-10">
                {/* Spacebar */}
                <div 
                  className={`flex flex-col gap-1.5 p-3 rounded-2xl border transition-all duration-200 ${
                    pressedKey === 'space' 
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.01]' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pressedKey === 'space' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-300 font-bold transition-colors">Play / Pause Timer</span>
                    </div>
                    <kbd 
                      className={`px-3 py-1 text-[9px] font-mono rounded-lg transition-all duration-150 uppercase tracking-wider shadow-sm ${
                        pressedKey === 'space'
                          ? 'bg-rose-500 text-white border border-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-110 font-black'
                          : 'bg-white/5 border border-white/10 text-slate-200'
                      }`}
                    >
                      Space
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.03]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Status:</span>
                    {timerStatus === 'running' ? (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/25">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Active (Running)
                      </span>
                    ) : timerStatus === 'paused' ? (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/25">
                        <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" /> Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/25">
                        <span className="w-1 h-1 rounded-full bg-blue-400" /> Ready (Idle)
                      </span>
                    )}
                  </div>
                </div>

                {/* Reset R */}
                <div 
                  className={`flex flex-col gap-1.5 p-3 rounded-2xl border transition-all duration-200 ${
                    pressedKey === 'r' 
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.01]' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pressedKey === 'r' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-300 font-bold transition-colors">Reset Focus Session</span>
                    </div>
                    <kbd 
                      className={`px-3 py-1 text-[9px] font-mono rounded-lg transition-all duration-150 uppercase tracking-wider shadow-sm ${
                        pressedKey === 'r'
                          ? 'bg-rose-500 text-white border border-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-110 font-black'
                          : 'bg-white/5 border border-white/10 text-slate-200'
                      }`}
                    >
                      R
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.03]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Status:</span>
                    {timerStatus !== 'idle' ? (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/25">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" /> Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-white/[0.03] text-slate-500 px-2 py-0.5 rounded-full font-bold border border-white/5">
                        Unavailable (No Active Session)
                      </span>
                    )}
                  </div>
                </div>

                {/* Fullscreen F */}
                <div 
                  className={`flex flex-col gap-1.5 p-3 rounded-2xl border transition-all duration-200 ${
                    pressedKey === 'f' 
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.01]' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pressedKey === 'f' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-300 font-bold transition-colors">Toggle Fullscreen Mode</span>
                    </div>
                    <kbd 
                      className={`px-3 py-1 text-[9px] font-mono rounded-lg transition-all duration-150 uppercase tracking-wider shadow-sm ${
                        pressedKey === 'f'
                          ? 'bg-rose-500 text-white border border-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-110 font-black'
                          : 'bg-white/5 border border-white/10 text-slate-200'
                      }`}
                    >
                      F
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.03]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Status:</span>
                    {isFullscreen ? (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full font-bold border border-purple-500/25 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                        Active (Fullscreen)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/25">
                        Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Settings S */}
                <div 
                  className={`flex flex-col gap-1.5 p-3 rounded-2xl border transition-all duration-200 ${
                    pressedKey === 's' 
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.01]' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pressedKey === 's' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-300 font-bold transition-colors">Open System Settings</span>
                    </div>
                    <kbd 
                      className={`px-3 py-1 text-[9px] font-mono rounded-lg transition-all duration-150 uppercase tracking-wider shadow-sm ${
                        pressedKey === 's'
                          ? 'bg-rose-500 text-white border border-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-110 font-black'
                          : 'bg-white/5 border border-white/10 text-slate-200'
                      }`}
                    >
                      S
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.03]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Status:</span>
                    <span className="inline-flex items-center gap-1 text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/25">
                      Available
                    </span>
                  </div>
                </div>

                {/* Stopwatch M */}
                <div 
                  className={`flex flex-col gap-1.5 p-3 rounded-2xl border transition-all duration-200 ${
                    pressedKey === 'm' 
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.01]' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pressedKey === 'm' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-300 font-bold transition-colors">Toggle Stopwatch Mode</span>
                    </div>
                    <kbd 
                      className={`px-3 py-1 text-[9px] font-mono rounded-lg transition-all duration-150 uppercase tracking-wider shadow-sm ${
                        pressedKey === 'm'
                          ? 'bg-rose-500 text-white border border-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-110 font-black'
                          : 'bg-white/5 border border-white/10 text-slate-200'
                      }`}
                    >
                      M
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.03]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Status:</span>
                    {timerStatus === 'idle' ? (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/25">
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[8px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold border border-rose-500/25">
                        Locked (Active Session)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action hint footer */}
              <div className="mt-5 pt-3.5 border-t border-white/5 text-center relative z-10">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                  *Hotkeys are active unless typing in an input
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
