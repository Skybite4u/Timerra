import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, Sparkles, Pin, Trophy, LayoutGrid, Calendar, 
  Layers, Lock, Eye, EyeOff, Award, Bookmark, ArrowRight,
  TrendingUp, CircleDot, Flame, Clock, Database, Milestone as MilestoneIcon
} from 'lucide-react';
import { Milestone, UserVaultState, MilestoneRarity } from '../lib/vaultTypes';
import { VaultManager } from '../lib/vaultManager';
import { INITIAL_MILESTONES } from '../lib/vaultData';
import { playClick } from '../lib/audio';

interface MilestoneVaultProps {
  onClose: () => void;
  sessions: any[];
  streakDays: number;
  totalFocusHours: string;
}

export const MilestoneVault: React.FC<MilestoneVaultProps> = ({ 
  onClose,
  sessions,
  streakDays,
  totalFocusHours
}) => {
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // --- Load Vault State ---
  const [vaultState, setVaultState] = useState<UserVaultState>(() => VaultManager.loadState());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'vault' | 'timeline' | 'showcase'>('vault');

  // Track vault viewed timestamps to reset Navbar badges
  useEffect(() => {
    localStorage.setItem('timerra_last_vault_opened_time', Date.now().toString());
    window.dispatchEvent(new Event('timerra_vault_opened'));
  }, []);

  // Filter milestones unlocked within the last 48 hours for the "Recently Unlocked" section
  const recentlyUnlockedMilestones = useMemo(() => {
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
    return INITIAL_MILESTONES.map(m => ({
      ...m,
      unlockedAt: vaultState.unlockedIds[m.id]
    })).filter(m => m.unlockedAt && m.unlockedAt >= fortyEightHoursAgo)
       .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
  }, [vaultState.unlockedIds]);

  // --- Category definitions ---
  const categories = [
    { id: 'all', label: 'All Fields', icon: LayoutGrid, color: 'text-tm-primary' },
    { id: 'orb', label: '🌌 Orb Journey', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'capsule', label: '📦 Capsule Mastery', icon: Database, color: 'text-blue-400' },
    { id: 'mood', label: '🎭 Mood Explorer', icon: CircleDot, color: 'text-emerald-400' },
    { id: 'legacy', label: '🌠 Focus Legacy', icon: Award, color: 'text-purple-400' },
    { id: 'energy', label: '⚡ Energy Flow', icon: Flame, color: 'text-rose-400' },
    { id: 'mind', label: '🧠 Mind Evolution', icon: CircleDot, color: 'text-cyan-400' },
    { id: 'balance', label: '🌿 Balance Path', icon: HeartIcon, color: 'text-green-400' },
    { id: 'summit', label: '🏔 Summit Journey', icon: TrendingUp, color: 'text-amber-500' },
    { id: 'relic', label: '💠 Hidden Relics', icon: Lock, color: 'text-cyan-300' },
    { id: 'vault', label: '👑 Legendary Vault', icon: Trophy, color: 'text-amber-400' }
  ];

  // Helper Custom Heart icon for balance since Heart is standard
  function HeartIcon(props: any) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    );
  }

  // --- Level Stats ---
  const { level, xpInLevel, xpNeededForNext, percent } = useMemo(() => {
    return VaultManager.calculateLevelAndXp(vaultState.totalXp);
  }, [vaultState.totalXp]);

  // Evolving Orb description based on current level
  const orbDetails = useMemo(() => {
    if (level < 10) return { name: 'Orb Awakening', color: 'from-blue-500 to-indigo-600', desc: 'A young spark just beginning to glow with focus energy.' };
    if (level < 20) return { name: 'Orb Resonance', color: 'from-emerald-500 to-teal-600', desc: 'Resonating smoothly with steady study habits.' };
    if (level < 35) return { name: 'Orb Harmony', color: 'from-purple-500 to-pink-600', desc: 'Perfectly balanced focus emission across all cycles.' };
    if (level < 50) return { name: 'Orb Ascension', color: 'from-amber-400 to-orange-600', desc: 'Ascending to high frequency energy levels.' };
    if (level < 75) return { name: 'Orb Fusion', color: 'from-rose-500 via-fuchsia-500 to-purple-600', desc: 'Stellar fusion levels of focus power.' };
    if (level < 100) return { name: 'Orb Singularity', color: 'from-cyan-400 via-teal-400 to-emerald-400 animate-pulse', desc: 'A massive black hole of productivity drawing in time itself.' };
    return { name: 'Orb Infinity', color: 'from-rose-500 via-yellow-500 to-cyan-500 bg-[length:300%_300%] animate-gradient', desc: 'Eternal mastery. Spacetime has collapsed under your relentless discipline.' };
  }, [level]);

  // --- Process and Filter Milestones list ---
  const filteredMilestones = useMemo(() => {
    return INITIAL_MILESTONES.map(m => {
      const unlockedAt = vaultState.unlockedIds[m.id];
      return {
        ...m,
        unlockedAt
      };
    }).filter(m => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        // If locked and secret, don't let it search by name unless unlocked
        if (m.secret && !m.unlockedAt) {
          return false;
        }
        if (!m.name.toLowerCase().includes(query) && !m.description.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== 'all' && m.category !== selectedCategory) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === 'unlocked' && !m.unlockedAt) return false;
      if (statusFilter === 'locked' && m.unlockedAt) return false;

      // 4. Rarity Filter
      if (rarityFilter !== 'all' && m.rarity !== rarityFilter) return false;

      return true;
    });
  }, [vaultState.unlockedIds, searchQuery, selectedCategory, statusFilter, rarityFilter]);

  // Chronological timeline nodes
  const timelineMilestones = useMemo(() => {
    const unlocked = INITIAL_MILESTONES.map(m => ({
      ...m,
      unlockedAt: vaultState.unlockedIds[m.id]
    })).filter(m => !!m.unlockedAt);
    
    // Sort oldest to newest
    unlocked.sort((a, b) => (a.unlockedAt || 0) - (b.unlockedAt || 0));
    return unlocked;
  }, [vaultState.unlockedIds]);

  // Pin / Unpin handler
  const handlePinToggle = (id: string) => {
    playClick();
    let updated: UserVaultState;
    if (vaultState.pinnedIds.includes(id)) {
      updated = VaultManager.unpinMilestone(id);
    } else {
      updated = VaultManager.pinMilestone(id);
    }
    setVaultState(updated);
  };

  // Helper to resolve specific milestone styles
  const rarityColors = (rarity: MilestoneRarity) => {
    switch (rarity) {
      case 'Common': return { border: 'border-slate-500/20 hover:border-slate-500/40', text: 'text-slate-400', badge: 'bg-slate-500/10 text-slate-300', glow: 'shadow-slate-500/5', color: 'from-slate-400 to-slate-600' };
      case 'Rare': return { border: 'border-blue-500/20 hover:border-blue-500/40', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-300', glow: 'shadow-blue-500/5', color: 'from-blue-400 to-indigo-600' };
      case 'Epic': return { border: 'border-purple-500/20 hover:border-purple-500/40', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-300', glow: 'shadow-purple-500/5', color: 'from-purple-400 to-fuchsia-600' };
      case 'Legendary': return { border: 'border-amber-500/20 hover:border-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300', glow: 'shadow-amber-500/5', color: 'from-amber-400 to-orange-600' };
      case 'Mythic': return { border: 'border-rose-500/30 hover:border-rose-500/50', text: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300', glow: 'shadow-rose-500/10', color: 'from-rose-400 to-red-600' };
      case 'Celestial': return { border: 'border-cyan-400/40 hover:border-cyan-400/60', text: 'text-cyan-300', badge: 'bg-cyan-400/15 text-cyan-200 animate-pulse', glow: 'shadow-cyan-400/15', color: 'from-cyan-400 via-indigo-400 to-purple-400' };
    }
  };

  const unlockedCount = useMemo(() => {
    return Object.keys(vaultState.unlockedIds).length;
  }, [vaultState.unlockedIds]);

  const completionPercent = useMemo(() => {
    return Math.floor((unlockedCount / INITIAL_MILESTONES.length) * 100);
  }, [unlockedCount]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl animate-fade-in p-2 sm:p-4 select-none overflow-hidden">
      
      {/* LUXURY GLASS CONTENT BOX */}
      <div className="w-full max-w-6xl h-[92vh] sm:h-[88vh] rounded-[32px] bg-[#070b19]/90 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative">
        
        {/* Living background light waves */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-tm-primary/10 rounded-full blur-[100px] pointer-events-none -translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-tm-accent/10 rounded-full blur-[100px] pointer-events-none translate-x-12 translate-y-12" />

        {/* VAULT MODAL HEADER */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-[0.25em] uppercase text-white">
                Timerra Milestone Vault
              </h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Premium Collectible Accomplishments and Progression Museum</p>
            </div>
          </div>

          <button 
            onClick={() => { playClick(); onClose(); }}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VAULT MASTER BODY */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          
          {/* LEVEL & PROGRESS SUMMARY BANNER (Luxury Apple Card style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Level Card */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-tm-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-1.5 relative">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Your Current Rank</span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-black text-white font-mono">{level}</h2>
                  <span className="text-xs font-bold text-tm-primary tracking-wide">Focus Level</span>
                </div>
                <p className="text-[10px] text-slate-400">Total XP: <span className="font-mono text-slate-200 font-bold">{vaultState.totalXp} XP</span></p>
              </div>

              {/* Central Glowing Level Circle */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-white/5 fill-none" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" className="stroke-tm-primary fill-none" strokeWidth="4" 
                    strokeDasharray={`${2 * Math.PI * 28}`} 
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - percent / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold font-mono text-white">{percent}%</span>
              </div>
            </div>

            {/* Current Evolving Orb Card */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4 relative overflow-hidden group col-span-1 md:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-r from-tm-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Evolving Orb Graphic */}
              <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${orbDetails.color} flex items-center justify-center relative shadow-lg shrink-0 overflow-hidden`}>
                <div className="absolute inset-0.5 rounded-full bg-black/15 backdrop-blur-sm" />
                <Sparkles className="w-6 h-6 text-white relative z-10 animate-pulse" />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Active Solar Core State</span>
                <h3 className="text-lg font-black text-white">{orbDetails.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">{orbDetails.desc}</p>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-slate-400 font-bold">
                <Clock className="w-3 h-3 text-tm-primary" />
                {totalFocusHours} Focus Hours
              </div>
            </div>

          </div>

          {/* VAULT MODAL TAB SELECTOR */}
          <div className="flex border-b border-white/5 pb-0.5">
            <button 
              onClick={() => { playClick(); setActiveTab('vault'); }}
              className={`pb-3 text-xs uppercase tracking-widest font-extrabold border-b-2 px-4 transition-all cursor-pointer ${activeTab === 'vault' ? 'border-tm-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Accomplishments
            </button>
            <button 
              onClick={() => { playClick(); setActiveTab('timeline'); }}
              className={`pb-3 text-xs uppercase tracking-widest font-extrabold border-b-2 px-4 transition-all cursor-pointer ${activeTab === 'timeline' ? 'border-tm-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Focus Timeline ({unlockedCount})
            </button>
            <button 
              onClick={() => { playClick(); setActiveTab('showcase'); }}
              className={`pb-3 text-xs uppercase tracking-widest font-extrabold border-b-2 px-4 transition-all cursor-pointer ${activeTab === 'showcase' ? 'border-tm-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Crystal Showcase ({vaultState.pinnedIds.length}/6)
            </button>
          </div>

          {/* TAB 1: VAULT EXPLORER */}
          {activeTab === 'vault' && (
            <div className="space-y-6 animate-fade-in">

              {/* RECENTLY UNLOCKED SECTION (shows only if there are items unlocked in the last 48 hours) */}
              {recentlyUnlockedMilestones.length > 0 && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/[0.03] via-orange-500/[0.01] to-transparent border border-amber-500/15 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[50px] pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" />
                      Recently Unlocked Accomplishments
                    </h3>
                    <span className="text-[9px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">Last 48 Hours</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {recentlyUnlockedMilestones.map((m) => {
                      const style = rarityColors(m.rarity);
                      return (
                        <div 
                          key={`recent_${m.id}`}
                          className={`p-3.5 rounded-2xl bg-[#080c1d] border ${style.border} ${style.glow} flex flex-col justify-between relative overflow-hidden`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${style.badge}`}>
                                {m.rarity}
                              </span>
                              <span className="text-[9px] font-bold font-mono text-tm-primary">
                                +{m.xpAward} XP
                              </span>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white truncate">{m.name}</h4>
                              <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">{m.description}</p>
                            </div>
                          </div>
                          <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider mt-2.5 pt-2 border-t border-white/5">
                            Unlocked {new Date(m.unlockedAt!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} today
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* SEARCH & FILTER CONTROLS */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search query input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search milestones..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white focus:outline-none focus:border-tm-primary placeholder-slate-500"
                  />
                </div>

                {/* Status selector */}
                <div className="flex gap-2 shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#0b1020]">All Status</option>
                    <option value="unlocked" className="bg-[#0b1020]">Unlocked</option>
                    <option value="locked" className="bg-[#0b1020]">Locked</option>
                  </select>

                  <select
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#0b1020]">All Rarities</option>
                    <option value="Common" className="bg-[#0b1020]">Common</option>
                    <option value="Rare" className="bg-[#0b1020]">Rare</option>
                    <option value="Epic" className="bg-[#0b1020]">Epic</option>
                    <option value="Legendary" className="bg-[#0b1020]">Legendary</option>
                    <option value="Mythic" className="bg-[#0b1020]">Mythic</option>
                    <option value="Celestial" className="bg-[#0b1020]">Celestial</option>
                  </select>
                </div>
              </div>

              {/* DOUBLE PANELS: LEFT SIDE CATEGORIES, RIGHT SIDE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* Categories vertical sidebar */}
                <div className="lg:col-span-1 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block pl-3 mb-2">Category Fields</span>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { playClick(); setSelectedCategory(cat.id); }}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs font-semibold
                          ${selectedCategory === cat.id 
                            ? 'bg-white/10 text-white shadow-inner' 
                            : 'hover:bg-white/[0.03] text-slate-400 hover:text-slate-200'}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Milestones grid display */}
                <div className="lg:col-span-3 space-y-4">
                  
                  {/* Grid layout stats header */}
                  <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-semibold">
                    <span>Showing {filteredMilestones.length} milestones</span>
                    <span>{completionPercent}% Completed</span>
                  </div>

                  {filteredMilestones.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 bg-white/[0.01] border border-white/5 rounded-3xl">
                      No milestones match your active query filters. Try selecting another category!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredMilestones.map((m) => {
                        const style = rarityColors(m.rarity);
                        const isPinned = vaultState.pinnedIds.includes(m.id);
                        
                        // Handle secret/hidden elements
                        const showSecretLock = m.secret && !m.unlockedAt;
                        const name = showSecretLock ? '???' : m.name;
                        const description = showSecretLock ? 'Solve the cosmic prompt to reveal this hidden relic.' : m.description;

                        return (
                          <div 
                            key={m.id}
                            className={`p-5 rounded-3xl bg-white/[0.01] border ${style.border} ${style.glow} flex flex-col justify-between transition-all duration-300 relative overflow-hidden group hover:scale-[1.01] ${m.unlockedAt ? '' : 'opacity-65'}`}
                          >
                            {/* Unlocked glowing indicators */}
                            {m.unlockedAt && (
                              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${style.color} shadow-lg`} />
                              </div>
                            )}

                            <div className="space-y-3 relative">
                              {/* Rarity & XP block */}
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${style.badge}`}>
                                  {m.rarity}
                                </span>
                                
                                <span className="text-[10px] font-bold font-mono text-tm-primary">
                                  +{m.xpAward} XP
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-sm font-black text-white flex items-center gap-1.5 leading-none">
                                  {showSecretLock && <Lock className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />}
                                  {name}
                                </h4>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                                  {description}
                                </p>
                              </div>
                            </div>

                            {/* Unlock date & Pin trigger row */}
                            <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
                              {m.unlockedAt ? (
                                <>
                                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                                    Unlocked {new Date(m.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <button
                                    onClick={() => handlePinToggle(m.id)}
                                    className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold
                                      ${isPinned 
                                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                                        : 'hover:bg-white/5 text-slate-500 hover:text-slate-300 border border-transparent'}`}
                                    title={isPinned ? 'Unpin from Showcase' : 'Pin to Showcase'}
                                  >
                                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                                    {isPinned ? 'Pinned' : 'Pin'}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Locked
                                  </span>
                                  <span className="text-[10px] font-bold font-mono text-slate-500">
                                    {m.progressTarget ? `Progress: 0/${m.progressTarget}` : 'Incomplete'}
                                  </span>
                                </>
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
          )}

          {/* TAB 2: FOCUS TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-8 p-4">
              
              <div className="max-w-xl mx-auto text-center space-y-2">
                <h3 className="text-lg font-black text-white">Your Animated Focus Timeline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every milestone you unlock appears on this energy map. Relive your productivity stages connected by winding ley lines of focus.
                </p>
              </div>

              {timelineMilestones.length === 0 ? (
                <div className="p-16 text-center text-xs text-slate-500 bg-white/[0.01] border border-white/5 rounded-3xl max-w-lg mx-auto">
                  Your timeline is currently empty! Complete study hours or restore backups to populate your first nodes.
                </div>
              ) : (
                <div className="relative max-w-xl mx-auto py-8">
                  
                  {/* Longitudinal glowing line */}
                  <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-gradient-to-b from-tm-primary via-tm-accent to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] opacity-40" />

                  {/* Nodes listing */}
                  <div className="space-y-10 relative">
                    {timelineMilestones.map((m, index) => {
                      const style = rarityColors(m.rarity);
                      return (
                        <div key={m.id} className="flex items-start gap-6 group">
                          
                          {/* Chrono glowing bulb */}
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${style.color} flex items-center justify-center text-white shrink-0 relative z-10 shadow-[0_0_20px_var(--tm-glow)] border-4 border-[#070b19]`}>
                            <Award className="w-5 h-5" />
                          </div>

                          {/* Node Description detail card */}
                          <div className="flex-1 p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all space-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
                            
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                                Node #{index + 1} • {new Date(m.unlockedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className={`text-[8px] uppercase font-black tracking-wider px-2 py-0.5 rounded ${style.badge}`}>
                                {m.rarity}
                              </span>
                            </div>

                            <h4 className="text-sm font-black text-white">{m.name}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{m.description}</p>
                            
                            <div className="text-[10px] text-tm-primary font-bold font-mono">
                              +{m.xpAward} XP Awarded
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: CRYSTAL SHOWCASE */}
          {activeTab === 'showcase' && (
            <div className="space-y-8 p-4">
              
              <div className="max-w-2xl mx-auto text-center space-y-2">
                <h3 className="text-lg font-black text-white">The Luxury Crystal Showcase</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select and pin up to 6 of your proudest milestones to display inside this premium glass trophy box.
                </p>
              </div>

              {/* CRYSTAL SHOWCASE DISPLAY AREA */}
              <div className="max-w-3xl mx-auto p-8 rounded-[36px] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-md">
                
                {/* Visual Glass shelf layout */}
                <div className="absolute inset-x-0 bottom-12 h-[3px] bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_15px_30px_rgba(255,255,255,0.15)] pointer-events-none" />

                {/* 6 Showcase slots */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
                  {[...Array(6)].map((_, index) => {
                    const pinId = vaultState.pinnedIds[index];
                    const pinMilestone = pinId ? INITIAL_MILESTONES.find(m => m.id === pinId) : null;
                    const style = pinMilestone ? rarityColors(pinMilestone.rarity) : null;

                    return (
                      <div 
                        key={index}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all border
                          ${pinMilestone 
                            ? `bg-gradient-to-b from-[#101426]/90 to-black/90 ${style?.border} shadow-lg scale-105` 
                            : 'bg-white/[0.01] border-dashed border-white/5 text-slate-600'}`}
                      >
                        {pinMilestone ? (
                          <>
                            {/* Glass reflections */}
                            <div className="absolute inset-1 rounded-2xl bg-white/[0.02] pointer-events-none" />
                            
                            {/* Icon visual */}
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${style?.color} flex items-center justify-center text-white shadow-md mb-2`}>
                              <Trophy className="w-4 h-4" />
                            </div>

                            <span className="text-[9px] font-black text-white text-center px-2 truncate w-full leading-none mb-1">
                              {pinMilestone.name}
                            </span>
                            
                            <span className={`text-[7px] uppercase font-bold tracking-wider px-1 rounded bg-white/5 ${style?.text}`}>
                              {pinMilestone.rarity}
                            </span>

                            {/* Unpin button overlay on hover */}
                            <button
                              onClick={() => handlePinToggle(pinMilestone.id)}
                              className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 text-white rounded-full hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow"
                              title="Unpin Milestone"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-center p-2">
                            <Pin className="w-4 h-4 mb-1.5 opacity-40" />
                            <span className="text-[8px] uppercase tracking-wider font-bold">Empty Slot</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Pin instructions */}
              <div className="text-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Browse accomplishments tab and click "Pin" to populate this showcase shelf
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
