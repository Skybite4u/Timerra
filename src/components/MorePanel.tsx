import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, ChevronRight, Award, Sparkles, Clock, Dna, Star, HelpCircle, Database, Sliders, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MorePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction: (action: string) => void;
  todaySessionsCount: number;
  streakDays: number;
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
  streakDays
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

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
    </div>
  );
};
