import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, Calendar, Star, Pin, Archive, Trash2, Heart, Plus, Download,
  Sliders, Search, LayoutGrid, Sparkles, Database, Shield, ShieldCheck,
  Award, RefreshCw, BarChart2, MessageSquare, Flame, Clock, HelpCircle,
  Maximize2, Printer, Image, Share2
} from 'lucide-react';
import { LegacyCard, UserVaultState, MilestoneRarity } from '../lib/vaultTypes';
import { VaultManager } from '../lib/vaultManager';
import { LegacyCardUtils } from '../lib/legacyCardUtils';
import { CapsuleDB, SavedCapsule } from '../lib/capsuleDb';
import { playClick, playComplete } from '../lib/audio';

interface LegacyCardCenterProps {
  onClose: () => void;
  sessions: any[];
  streakDays: number;
  totalFocusHours: string;
}

export const LegacyCardCenter: React.FC<LegacyCardCenterProps> = ({
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

  // --- States ---
  const [cards, setCards] = useState<LegacyCard[]>(() => VaultManager.loadLegacyCards());
  const [selectedCardId, setSelectedCardId] = useState<string | null>(() => {
    const loaded = VaultManager.loadLegacyCards();
    return loaded.length > 0 ? loaded[0].id : null;
  });
  const [capsules, setCapsules] = useState<SavedCapsule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  
  // Modal toggles
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [selectedPeriodToGen, setSelectedPeriodToGen] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('weekly');
  const [showCapsuleLinker, setShowCapsuleLinker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTheme, setExportTheme] = useState<'wallpaper' | 'social' | 'print'>('wallpaper');

  // --- Load Capsules list for Linking ---
  React.useEffect(() => {
    CapsuleDB.getAll().then(setCapsules);
  }, []);

  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null;
    return cards.find(c => c.id === selectedCardId) || null;
  }, [cards, selectedCardId]);

  // --- Filtering & Sorting cards ---
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!c.title.toLowerCase().includes(query) && !c.periodLabel.toLowerCase().includes(query)) {
          return false;
        }
      }
      // 2. Rarity
      if (rarityFilter !== 'all' && c.rarity !== rarityFilter) {
        return false;
      }
      // 3. Period
      if (periodFilter !== 'all' && c.period !== periodFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt); // Newest first
  }, [cards, searchQuery, rarityFilter, periodFilter]);

  // --- Handlers ---
  const handleGenerateCard = () => {
    playComplete();
    const vaultState = VaultManager.loadState();
    const nextNum = cards.length + 1;
    
    // Generate new card with mock stats but real totals
    const newCard = LegacyCardUtils.generateCard(
      nextNum,
      selectedPeriodToGen,
      sessions,
      { theme: 'blue', focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4, autoAdvance: true, tickSound: false, subject: 'Deep Work' }, // baseline configuration
      Object.keys(vaultState.unlockedIds).length,
      vaultState.level,
      vaultState.totalXp,
      capsules.length,
      0
    );

    VaultManager.addLegacyCard(newCard);
    
    // Refresh local list
    const updated = VaultManager.loadLegacyCards();
    setCards(updated);
    setSelectedCardId(newCard.id);
    setShowGenerateConfirm(false);
  };

  const handleDeleteCard = (id: string) => {
    playClick();
    const card = cards.find(c => c.id === id);
    if (card?.isProtected) {
      alert('This collectible card is PROTECTED. Toggle the shield lock in actions panel to enable deletion.');
      return;
    }
    
    if (confirm('Are you sure you want to permanently delete this collectible Legacy Card? This action is irreversible.')) {
      VaultManager.deleteLegacyCard(id);
      const updated = VaultManager.loadLegacyCards();
      setCards(updated);
      if (selectedCardId === id) {
        setSelectedCardId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  const handleToggleFavorite = (id: string) => {
    playClick();
    const updated = VaultManager.toggleFavoriteCard(id);
    setCards(updated);
  };

  const handleTogglePin = (id: string) => {
    playClick();
    const updated = VaultManager.togglePinCard(id);
    setCards(updated);
  };

  const handleToggleProtect = (id: string) => {
    playClick();
    const updated = VaultManager.toggleProtectCard(id);
    setCards(updated);
  };

  const handleLinkCapsule = (capsuleId: string) => {
    if (!selectedCardId) return;
    playClick();
    const updated = VaultManager.linkCardToCapsule(selectedCardId, capsuleId);
    setCards(updated);
    setShowCapsuleLinker(false);
  };

  // Render dynamic radar-helix points for Legacy DNA
  const getRadarPoints = (dnaStr: string) => {
    const points = dnaStr.split(',').map(Number);
    const centerX = 80;
    const centerY = 80;
    const maxRadius = 55;
    
    // Represent 6 parameters in angular coordinate system (60 degrees interval)
    return points.map((p, index) => {
      const angle = (index * 60) * (Math.PI / 180) - (Math.PI / 2); // Shift by 90 deg so first point sits at apex
      const radius = (p / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in p-2 sm:p-4 select-none overflow-hidden">
      
      {/* MAJESTIC CONTAINER */}
      <div className="w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-[32px] bg-[#050813]/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative">
        
        {/* Living atmospheric lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-tm-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-tm-accent/10 rounded-full blur-[100px] pointer-events-none" />

        {/* HEADER BAR */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 text-white shadow-lg animate-pulse">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-[0.25em] uppercase text-white">
                Timerra Legacy Cards
              </h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Collectible Dynamic Photographic Signatures of Focus and Flow</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Generate new card button */}
            <button
              onClick={() => { playClick(); setShowGenerateConfirm(true); }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_12px_rgba(34,211,238,0.2)]"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Card
            </button>

            <button 
              onClick={() => { playClick(); onClose(); }}
              className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRIMARY SPLIT INTERFACE: LEFT TIMELINE / RIGHT MAIN CARD PREVIEW */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* LEFT SIDEBAR: ALL COLLECTED CARDS TIMELINE */}
          <div className="w-full md:w-80 border-r border-white/5 flex flex-col overflow-hidden bg-black/20 shrink-0">
            
            {/* SEARCH AND FILTERS PANEL */}
            <div className="p-4 border-b border-white/5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-[11px] text-white focus:outline-none focus:border-tm-primary placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#0b1020]">All Rarities</option>
                  <option value="Common" className="bg-[#0b1020]">Common</option>
                  <option value="Rare" className="bg-[#0b1020]">Rare</option>
                  <option value="Epic" className="bg-[#0b1020]">Epic</option>
                  <option value="Legendary" className="bg-[#0b1020]">Legendary</option>
                  <option value="Mythic" className="bg-[#0b1020]">Mythic</option>
                  <option value="Celestial" className="bg-[#0b1020]">Celestial</option>
                </select>

                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#0b1020]">All Cycles</option>
                  <option value="weekly" className="bg-[#0b1020]">Weekly</option>
                  <option value="monthly" className="bg-[#0b1020]">Monthly</option>
                  <option value="quarterly" className="bg-[#0b1020]">Quarterly</option>
                  <option value="yearly" className="bg-[#0b1020]">Yearly</option>
                </select>
              </div>
            </div>

            {/* HORIZONTAL / VERTICAL COMPACT CARDS SCROLLER */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredCards.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-600">
                  No collectible cards in history matching this filter.
                </div>
              ) : (
                filteredCards.map((c) => {
                  const isSelected = c.id === selectedCardId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { playClick(); setSelectedCardId(c.id); }}
                      className={`w-full p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 group
                        ${isSelected 
                          ? 'bg-white/5 border-white/10 shadow-lg' 
                          : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'}`}
                    >
                      {/* Top colored band based on rarity */}
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                      
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <span className="text-[8px] font-mono font-bold text-slate-500 tracking-wider">
                            {c.cardNumberStr} • {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          <h4 className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors mt-0.5">
                            {c.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">{c.periodLabel}</p>
                        </div>
                        
                        <span className={`text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded
                          ${c.rarity === 'Celestial' ? 'bg-cyan-500/10 text-cyan-300' : 
                            c.rarity === 'Mythic' ? 'bg-rose-500/10 text-rose-300' : 
                            c.rarity === 'Legendary' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-800 text-slate-300'}`}
                        >
                          {c.rarity}
                        </span>
                      </div>

                      {/* Summary mini indicators */}
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" />
                          {c.focusHours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-slate-600" />
                          {c.currentStreakDays}d streak
                        </span>
                        {c.isFavorited && <Heart className="w-3 h-3 text-rose-400 fill-current ml-auto" />}
                        {c.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-current ml-auto" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT SIDE: PREMIUM ACTIVE COLLECTED CARD EXPANSION & LIVING CARD VIEW */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center bg-black/40 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            
            {selectedCard ? (
              <>
                {/* 1. THE LIVING LEGACY CARD COMPONENT (Luxury Glassmorphic structure with mouse reflections) */}
                <div className="w-[330px] h-[480px] rounded-[28px] bg-gradient-to-b from-[#0b0f20]/90 via-slate-950/95 to-[#020510]/95 border border-white/10 shadow-2xl relative overflow-hidden group shrink-0 flex flex-col justify-between p-6 select-none animate-fade-in">
                  
                  {/* Glowing edge ring */}
                  <div className="absolute inset-0 rounded-[28px] border-2 border-white/5 pointer-events-none group-hover:border-cyan-500/10 transition-colors duration-500" />

                  {/* Living Card particle effects in background */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full bg-cyan-400/20 blur-xl animate-pulse"
                        style={{
                          top: `${Math.random() * 80}%`,
                          left: `${Math.random() * 80}%`,
                          width: `${Math.random() * 50 + 20}px`,
                          height: `${Math.random() * 50 + 20}px`,
                          animationDuration: `${Math.random() * 6 + 4}s`,
                          animationDelay: `${Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Top glass reflection light beam */}
                  <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                  {/* CARD HEADER */}
                  <div className="flex justify-between items-start relative z-10 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 leading-none block">Timerra Legacy</span>
                      <span className="text-[11px] font-bold text-slate-400 mt-1 block font-mono">{selectedCard.periodLabel}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-white font-mono block leading-none">{selectedCard.cardNumberStr}</span>
                      <span className="text-[8px] text-slate-500 font-semibold uppercase block mt-1">Snapshot</span>
                    </div>
                  </div>

                  {/* CARD CORE BODY (Orb Memory centered & Legacy DNA behind it) */}
                  <div className="relative flex items-center justify-center my-4 h-40">
                    
                    {/* SVG Radar Graph representing 'Legacy DNA' */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-40 h-40 opacity-30 group-hover:opacity-50 transition-opacity" viewBox="0 0 160 160">
                        {/* Radar outline circles */}
                        <circle cx="80" cy="80" r="55" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2" opacity="0.2" />
                        <circle cx="80" cy="80" r="35" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2" opacity="0.15" />
                        <circle cx="80" cy="80" r="15" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2" opacity="0.1" />
                        
                        {/* Grid axes */}
                        {[0, 30, 60].map(angle => (
                          <line 
                            key={angle}
                            x1={80 - 55 * Math.cos(angle * Math.PI / 180)} 
                            y1={80 - 55 * Math.sin(angle * Math.PI / 180)}
                            x2={80 + 55 * Math.cos(angle * Math.PI / 180)} 
                            y2={80 + 55 * Math.sin(angle * Math.PI / 180)}
                            stroke="white" 
                            strokeWidth="0.5" 
                            opacity="0.1"
                          />
                        ))}

                        {/* Unlocked custom polygon mapping user DNA points */}
                        <polygon 
                          points={getRadarPoints(selectedCard.dnaPattern)}
                          fill="rgba(34, 211, 238, 0.1)"
                          stroke="rgba(34, 211, 238, 0.6)"
                          strokeWidth="1.5"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>

                    {/* ORB MEMORY core node (centered) */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_35px_rgba(34,211,238,0.45)] group-hover:shadow-[0_0_55px_rgba(34,211,238,0.7)] transition-shadow duration-700">
                      {/* Inner crystal */}
                      <div className="absolute inset-0.5 rounded-full bg-black/15 backdrop-blur-sm" />
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <Sparkles className="w-5 h-5 text-white animate-bounce" />
                        <span className="text-[7px] uppercase font-bold text-white/80 tracking-widest leading-none mt-1">Memory</span>
                      </div>
                    </div>

                  </div>

                  {/* USER STATS DATA MATRIX */}
                  <div className="grid grid-cols-3 gap-y-3 gap-x-2 relative z-10 py-3 border-t border-b border-white/5 text-center">
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold block leading-none">Focus Hours</span>
                      <span className="text-sm font-black font-mono text-white block mt-1">{selectedCard.focusHours} hrs</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold block leading-none">Sessions</span>
                      <span className="text-sm font-black font-mono text-white block mt-1">{selectedCard.completedSessions}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold block leading-none">Best Streak</span>
                      <span className="text-sm font-black font-mono text-white block mt-1">{selectedCard.bestStreakDays} days</span>
                    </div>
                  </div>

                  {/* BRANDING BOTTOM LINE */}
                  <div className="flex justify-between items-center relative z-10 pt-3">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-white uppercase leading-none block">{selectedCard.title}</span>
                      <span className="text-[8px] text-slate-500 font-semibold uppercase block mt-1">Dynamic Class Code</span>
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-md">
                      {selectedCard.rarity}
                    </span>
                  </div>

                </div>

                {/* 2. ACTIONS AND ANALYTICS INSPECTION BAR */}
                <div className="flex-1 w-full max-w-md space-y-6 animate-fade-in self-stretch flex flex-col justify-between">
                  
                  {/* High level info block */}
                  <div className="space-y-4">
                    
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-extrabold">Timerra Memory Core</span>
                      <h2 className="text-2xl font-black text-white tracking-wide">{selectedCard.title}</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        This Legacy Card represents your customized focus journey catalogued on{' '}
                        {new Date(selectedCard.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                      </p>
                    </div>

                    {/* GAUGES PANEL (Productivity, Consistency, Balance, Recovery) */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <BarChart2 className="w-4 h-4 text-cyan-400" />
                        Focus Core Scores
                      </h4>

                      <div className="space-y-3">
                        {/* Productivity Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Productivity Index</span>
                            <span className="text-white font-mono">{selectedCard.productivityScore}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${selectedCard.productivityScore}%` }} />
                          </div>
                        </div>

                        {/* Consistency Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Consistency Quotient</span>
                            <span className="text-white font-mono">{selectedCard.consistencyScore}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${selectedCard.consistencyScore}%` }} />
                          </div>
                        </div>

                        {/* Balance Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Work/Rest Balance</span>
                            <span className="text-white font-mono">{selectedCard.balanceScore}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedCard.balanceScore}%` }} />
                          </div>
                        </div>

                        {/* Recovery Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Recovery Index</span>
                            <span className="text-white font-mono">{selectedCard.recoveryScore}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedCard.recoveryScore}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI BEHAVIOR INSIGHT QUOTE */}
                    <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-2 relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl" />
                      <h4 className="text-[10px] uppercase tracking-widest text-cyan-300 font-extrabold flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        JOURNEY QUOTE & BEHAVIOR SUMMARY
                      </h4>
                      <p className="text-xs text-slate-300 font-medium italic leading-relaxed">
                        "{selectedCard.insight}"
                      </p>
                    </div>

                    {/* CAPSULE ARCHIVE LINKING STATUS */}
                    <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="font-bold text-white">Capsule Archive Link</p>
                          <p className="text-[10px] text-slate-500">
                            {selectedCard.linkedCapsuleId 
                              ? `Linked to capsule ID: ${selectedCard.linkedCapsuleId.slice(0, 8)}...` 
                              : 'Not currently linked to any Capsule'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => { playClick(); setShowCapsuleLinker(true); }}
                        className="px-3 py-1.5 hover:bg-white/15 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold uppercase text-slate-300 tracking-wider cursor-pointer"
                      >
                        Link Capsule
                      </button>
                    </div>

                  </div>

                  {/* BASE CONTROLS & ACTIONS HUB */}
                  <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                    
                    {/* Pin button */}
                    <button
                      onClick={() => handleTogglePin(selectedCard.id)}
                      className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1
                        ${selectedCard.isPinned 
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' 
                          : 'hover:bg-white/5 text-slate-400 border-white/5'}`}
                      title={selectedCard.isPinned ? 'Unpin card from profile' : 'Pin card to profile'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${selectedCard.isPinned ? 'fill-current' : ''}`} />
                      {selectedCard.isPinned ? 'Pinned' : 'Pin'}
                    </button>

                    {/* Favorite button */}
                    <button
                      onClick={() => handleToggleFavorite(selectedCard.id)}
                      className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1
                        ${selectedCard.isFavorited 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                          : 'hover:bg-white/5 text-slate-400 border-white/5'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${selectedCard.isFavorited ? 'fill-current' : ''}`} />
                      Favorite
                    </button>

                    {/* Protect toggle button */}
                    <button
                      onClick={() => handleToggleProtect(selectedCard.id)}
                      className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1
                        ${selectedCard.isProtected 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                          : 'hover:bg-white/5 text-slate-400 border-white/5'}`}
                      title={selectedCard.isProtected ? 'Unprotect' : 'Protect Card from Deletion'}
                    >
                      {selectedCard.isProtected ? <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> : <Shield className="w-3.5 h-3.5" />}
                      {selectedCard.isProtected ? 'Locked' : 'Protect'}
                    </button>

                    {/* Export / Print layout toggle */}
                    <button
                      onClick={() => { playClick(); setShowExportModal(true); }}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Card
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteCard(selectedCard.id)}
                      className="px-3 py-2 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>

                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-500 space-y-4">
                <div className="p-4 rounded-full bg-white/[0.01] border border-white/5">
                  <Award className="w-8 h-8 text-slate-600 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-300">No Collected Cards</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                    Generate your first premium Legacy Card to seal a permanent chapter of your local productivity journey!
                  </p>
                </div>
                <button
                  onClick={() => { playClick(); setShowGenerateConfirm(true); }}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Generate First Card
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL OVERLAY: CHOOSE PERIOD AND MANUALLY GENERATE CARD */}
      {showGenerateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4 select-none">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0b0e20] border border-white/10 shadow-2xl space-y-5 text-center">
            <h3 className="text-lg font-black text-white">Create Collectible Memory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compile your current statistics, streaks, and subject categories into a dynamic glassmorphic card. These records cannot be altered.
            </p>

            <div className="space-y-2 text-left">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block pl-1">Choose Focus Cycle</span>
              <div className="grid grid-cols-2 gap-2">
                {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => { playClick(); setSelectedPeriodToGen(p); }}
                    className={`p-3 rounded-xl border text-xs uppercase font-extrabold transition-all cursor-pointer text-center
                      ${selectedPeriodToGen === p 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow' 
                        : 'bg-white/[0.01] text-slate-400 border-white/5 hover:bg-white/[0.03]'}`}
                  >
                    {p} Card
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowGenerateConfirm(false)}
                className="flex-1 py-3 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase text-slate-400 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleGenerateCard}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl text-xs font-black uppercase cursor-pointer shadow-lg"
              >
                Compile Legacy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY: SECURE CAPSULE LINKER */}
      {showCapsuleLinker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4 select-none">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0b0e20] border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white text-center">Link Timerra Capsule</h3>
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Linking this memory card to a Capsule allows you to backup, sync, and restore both files simultaneously. Select from your saved Capsules below:
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto overscroll-contain pr-1">
              {capsules.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white/[0.01] border border-white/5 rounded-2xl">
                  No active backup capsules found on this device. Create a Capsule first inside Backup Modal!
                </div>
              ) : (
                capsules.map(cap => (
                  <button
                    key={cap.id}
                    onClick={() => handleLinkCapsule(cap.id)}
                    className="w-full p-3 bg-white/[0.01] border border-white/5 hover:border-white/10 text-left rounded-xl transition-all text-xs flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-white truncate max-w-[220px]">{cap.filename}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(cap.createdAt).toLocaleDateString()} • {(cap.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">Select</span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setShowCapsuleLinker(false)}
              className="w-full py-3 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase text-slate-400 cursor-pointer mt-4"
            >
              Cancel Link
            </button>
          </div>
        </div>
      )}

      {/* EXPORT OPTIONS OVERLAY (MOCK) */}
      {showExportModal && selectedCard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4 select-none">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-[#0a0d1d] border border-white/10 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-black text-white">Export Layout Studio</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => { playClick(); setExportTheme('wallpaper'); }}
                className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider text-center cursor-pointer ${exportTheme === 'wallpaper' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.01] border-white/5 text-slate-400'}`}
              >
                Wallpaper Frame
              </button>
              <button 
                onClick={() => { playClick(); setExportTheme('social'); }}
                className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider text-center cursor-pointer ${exportTheme === 'social' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.01] border-white/5 text-slate-400'}`}
              >
                Square (PNG)
              </button>
              <button 
                onClick={() => { playClick(); setExportTheme('print'); }}
                className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider text-center cursor-pointer ${exportTheme === 'print' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.01] border-white/5 text-slate-400'}`}
              >
                Print PDF Style
              </button>
            </div>

            {/* Simulated frame rendering preview */}
            <div className="p-6 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
              
              {exportTheme === 'wallpaper' && (
                <div className="w-[140px] h-[220px] rounded-2xl border border-white/20 bg-gradient-to-b from-[#0b0e20] to-[#040612] flex flex-col justify-between p-4 shadow-lg scale-105">
                  <div className="text-center"><span className="text-[6px] font-mono font-bold text-slate-500">TIMERRA WALLPAPER SNAPSHOT</span></div>
                  <div className="w-12 h-12 rounded-full bg-cyan-400/20 blur-sm mx-auto my-2 border border-cyan-400/10 animate-pulse" />
                  <div className="text-[7px] text-slate-400 leading-tight text-center">{selectedCard.title}</div>
                  <div className="text-center"><span className="text-[6px] font-mono text-slate-600">{selectedCard.cardNumberStr}</span></div>
                </div>
              )}

              {exportTheme === 'social' && (
                <div className="aspect-square w-[160px] rounded-xl border border-white/20 bg-gradient-to-b from-cyan-950/20 to-black p-4 flex flex-col justify-between shadow-lg">
                  <div className="flex justify-between items-center"><span className="text-[6px] text-cyan-400 font-extrabold">TIMERRA COLLECTIBLE</span><span className="text-[5px] text-slate-500">SHARE</span></div>
                  <div className="text-center my-2"><h4 className="text-[9px] text-white font-extrabold">{selectedCard.title}</h4><p className="text-[6px] text-slate-400 leading-none mt-1">{selectedCard.periodLabel}</p></div>
                  <div className="flex justify-between items-center"><span className="text-[5px] text-slate-600">v1.1 Core</span><span className="text-[6px] text-white font-mono">{selectedCard.focusHours}h</span></div>
                </div>
              )}

              {exportTheme === 'print' && (
                <div className="w-[160px] h-[200px] bg-white text-black p-4 flex flex-col justify-between shadow-2xl">
                  <div className="text-center border-b border-black/15 pb-1"><h5 className="text-[7px] font-extrabold uppercase font-mono tracking-widest text-black">Timerra Legacy Certificate</h5></div>
                  <div className="my-2 space-y-1"><p className="text-[5px] font-bold text-neutral-800">Title: {selectedCard.title}</p><p className="text-[5px] text-neutral-600">Cycle: {selectedCard.periodLabel}</p><p className="text-[5px] text-neutral-600">Focus Completed: {selectedCard.focusHours} Hours</p></div>
                  <div className="flex justify-between items-center pt-2 border-t border-black/10"><span className="text-[4px] text-neutral-400">Digital Seal</span><span className="text-[4px] text-neutral-500 font-mono">ID: {selectedCard.id.slice(0, 8)}</span></div>
                </div>
              )}

            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase text-slate-400 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  playComplete();
                  alert(`High Quality ${exportTheme} layout of card ${selectedCard.cardNumberStr} successfully saved to local device!`);
                  setShowExportModal(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl text-xs font-black uppercase cursor-pointer shadow-lg"
              >
                Confirm Download
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
