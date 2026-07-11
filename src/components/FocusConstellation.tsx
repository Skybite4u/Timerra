import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Filter, Award, Sparkles, Compass, Flame, Shield, Activity, 
  HelpCircle, Star, Calendar, ZoomIn, ZoomOut, Maximize2, Check, ArrowRight
} from 'lucide-react';
import { Session } from '../types';
import { calculateFocusDna, getConstellationState, CONSTELLATION_STARS, StarPoint } from '../lib/focusDna';
import { playClick, playComplete } from '../lib/audio';

interface FocusConstellationProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
}

export const FocusConstellation: React.FC<FocusConstellationProps> = ({ isOpen, onClose, sessions }) => {
  // Navigation & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedStar, setSelectedStar] = useState<StarPoint | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Pan and Zoom viewport state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // For pinch-to-zoom on touch mobile
  const lastTouchDistance = useRef<number | null>(null);

  const dnaState = calculateFocusDna(sessions);
  const { stars, connections } = useMemo(() => {
    return getConstellationState(sessions, dnaState);
  }, [sessions, dnaState]);

  // Handle auto-centering on the default core star initially
  useEffect(() => {
    if (isOpen) {
      // Core star is at (500, 500)
      if (viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        // Set pan so (500, 500) is in the middle
        const initialPanX = rect.width / 2 - 500 * zoom;
        const initialPanY = rect.height / 2 - 500 * zoom;
        setPanX(initialPanX);
        setPanY(initialPanY);
      }
      
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Viewport navigation mouse controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPanX(e.clientX - dragStart.current.x);
    setPanY(e.clientY - dragStart.current.y);
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Touch controls for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
    } else if (e.touches.length === 2) {
      // Start pinch gesture tracking
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      setPanX(e.touches[0].clientX - dragStart.current.x);
      setPanY(e.touches[0].clientY - dragStart.current.y);
    } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch to zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastTouchDistance.current;
      setZoom(prev => Math.min(2.5, Math.max(0.5, prev * (1 + (delta - 1) * 0.4))));
      lastTouchDistance.current = dist;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    lastTouchDistance.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom in or out relative to mouse position
    const zoomFactor = 1.1;
    let nextZoom = zoom;
    if (e.deltaY < 0) {
      nextZoom = Math.min(2.5, zoom * zoomFactor);
    } else {
      nextZoom = Math.max(0.5, zoom / zoomFactor);
    }
    setZoom(nextZoom);
  };

  // Center on viewport helpers
  const handleRecenter = () => {
    playClick();
    setZoom(1);
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      setPanX(rect.width / 2 - 500);
      setPanY(rect.height / 2 - 500);
    }
  };

  // Searching and Filtering
  const filteredStars = stars.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          st.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || st.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const unlockedCount = stars.filter(s => s.isUnlocked).length;

  return (
    <div className="fixed inset-0 w-full h-full z-50 flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden">
      
      {/* Absolute nebula cosmic backdrops */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_50%] from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 filter blur-[120px] pointer-events-none animate-pulse" />

      {/* Floating particles sky backgrounds (decorative stars) */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: `${(i * 17) % 100}%`,
              left: `${(i * 31) % 100}%`,
              width: `${(i % 3) + 1}px`,
              height: `${(i % 3) + 1}px`,
              animationDuration: `${(i % 4) + 2}s`
            }}
          />
        ))}
      </div>

      {/* Header Panel Layout */}
      <header className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-950/70 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <Star className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Focus Constellation</h2>
              <button 
                onClick={() => { playClick(); setShowGuide(!showGuide); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
              Interactive Behavioral Astral Sky • Unlocked {unlockedCount} / {stars.length} Stars
            </p>
          </div>
        </div>

        {/* Navigation Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto justify-end">
          {/* Recentering button */}
          <button 
            onClick={handleRecenter}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Recenter Camera"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => { playClick(); setZoom(p => Math.min(2.5, p + 0.15)); }}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button 
            onClick={() => { playClick(); setZoom(p => Math.max(0.5, p - 0.15)); }}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Close main window */}
          <button
            onClick={() => { playClick(); onClose(); }}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Guide Informational Banner */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 bg-indigo-950/40 border-b border-indigo-500/10 overflow-hidden text-xs text-slate-300 py-4 flex items-start gap-3 relative z-10"
          >
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white">The Living Sky of Timerra:</strong> This interactive sky maps your local discipline. Stars generate automatically when milestones, streak targets, or focus ratios are fulfilled. Active connection lines emerge to link related paths (such as Lunar star to Milestone Vault). 
              <br />
              <span className="text-slate-400 font-medium">Controls: Drag/Swipe to Pan around the infinite sky. Scroll Wheel or Pinch to Zoom. Click any star to view memories.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Controls Overlay Bar (Search / Filter) */}
      <div className="p-3 bg-slate-900/50 border-b border-white/5 flex flex-col sm:flex-row items-center gap-3 relative z-10 px-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search unlocked stars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tm-primary/50 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          {[
            { id: 'all', label: 'All Constellations' },
            { id: 'core', label: 'Primary Core' },
            { id: 'temporal', label: 'Temporal Schedule' },
            { id: 'discipline', label: 'Discipline & Streaks' },
            { id: 'habit', label: 'Recovery & Habits' },
            { id: 'achievement', label: 'Achievements' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => { playClick(); setCategoryFilter(opt.id); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap active:scale-95
                ${categoryFilter === opt.id 
                  ? 'bg-tm-primary/10 border-tm-primary/30 text-white' 
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEWPORT GRAPH STAGE (Zoom and Pan container) */}
      <div 
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative"
      >
        {/* Render SVG interactive galaxy canvas */}
        <svg 
          className="absolute inset-0 origin-top-left pointer-events-none"
          style={{
            width: '1000px',
            height: '1000px',
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transition: isDragging.current ? 'none' : 'transform 100ms ease-out'
          }}
          viewBox="0 0 1000 1000"
        >
          <defs>
            {/* Custom high glow radial filter definitions */}
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="activeLineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* SECTION A: Constellation connections pathways */}
          <g id="sky-connections">
            {connections.map((conn, idx) => {
              // Find matching coordinates
              const fromStar = stars.find(s => s.id === conn.fromId);
              const toStar = stars.find(s => s.id === conn.toId);
              if (!fromStar || !toStar) return null;

              return (
                <line
                  key={idx}
                  x1={fromStar.x}
                  y1={fromStar.y}
                  x2={toStar.x}
                  y2={toStar.y}
                  className={`transition-all duration-1000 ${conn.pathStyle}
                    ${conn.active 
                      ? 'stroke-[2px] opacity-70 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse' 
                      : 'stroke-[1px] opacity-10 stroke-dasharray="4 4"'}`}
                />
              );
            })}
          </g>

          {/* SECTION B: Glowing Nebula Rings centers */}
          <g id="sky-nebula">
            {stars.filter(s => s.isUnlocked).map(s => (
              <circle
                key={`neb-${s.id}`}
                cx={s.x}
                cy={s.y}
                r={s.category === 'core' ? "45" : "25"}
                className="opacity-[0.03]"
                fill="url(#skyGrad)"
                style={{
                  fill: s.category === 'core' ? '#cbd5e1' : s.category === 'achievement' ? '#a855f7' : '#3b82f6'
                }}
              />
            ))}
          </g>

          {/* SECTION C: Active clicking nodes (stars) */}
          <g id="sky-stars">
            {stars.map((s) => {
              const isMatch = filteredStars.some(fs => fs.id === s.id);
              const isSelected = selectedStar?.id === s.id;

              return (
                <g 
                  key={s.id}
                  className={`pointer-events-auto cursor-pointer transition-all duration-300
                    ${isMatch ? 'opacity-100' : 'opacity-20'}
                    ${s.isUnlocked ? 'hover:scale-125' : 'hover:scale-105'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    setSelectedStar(s);
                  }}
                >
                  {/* Subtle pulsing background highlight for unlocked stars */}
                  {s.isUnlocked && (
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={s.category === 'core' ? "18" : "11"}
                      className="fill-white/5 stroke-white/10 stroke-[0.5px] animate-ping"
                      style={{ animationDuration: s.category === 'core' ? '4s' : '6s' }}
                    />
                  )}

                  {/* Core Star outline */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.category === 'core' ? "10" : "6"}
                    className={`transition-all duration-500
                      ${s.isUnlocked 
                        ? isSelected 
                          ? 'fill-white stroke-tm-primary stroke-[3px] filter drop-shadow-[0_0_15px_white]' 
                          : 'fill-white stroke-white/20 stroke-1'
                        : 'fill-slate-800 stroke-slate-700 stroke-[1px]'}`}
                    filter={s.isUnlocked ? "url(#starGlow)" : undefined}
                    style={{
                      fill: s.isUnlocked 
                        ? '#ffffff' 
                        : '#1e293b',
                      stroke: s.isUnlocked 
                        ? s.category === 'achievement' 
                          ? '#a855f7' 
                          : s.category === 'habit' 
                            ? '#10b981' 
                            : s.category === 'core' 
                              ? '#ffffff' 
                              : '#3b82f6' 
                        : '#334155'
                    }}
                  />

                  {/* Small inner core for unlocked stars */}
                  {s.isUnlocked && (
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={s.category === 'core' ? "4" : "2"}
                      fill={s.category === 'achievement' ? '#c084fc' : s.category === 'habit' ? '#34d399' : '#ffffff'}
                    />
                  )}

                  {/* Text Star Labels below standard nodes */}
                  <text
                    x={s.x}
                    y={s.y + (s.category === 'core' ? 24 : 16)}
                    textAnchor="middle"
                    className={`font-mono text-[9px] font-extrabold uppercase tracking-widest
                      ${s.isUnlocked 
                        ? 'fill-slate-300' 
                        : 'fill-slate-600'}`}
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Mini Compass Legend card at bottom-left */}
        <div className="absolute bottom-4 left-4 p-4 bg-slate-950/80 border border-white/5 rounded-2xl backdrop-blur-md space-y-2 pointer-events-auto max-w-[240px]">
          <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Constellation Star Map</h5>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-white filter drop-shadow-[0_0_4px_white]" />
              <span>Core Origin (Active)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 filter drop-shadow-[0_0_4px_#3b82f6]" />
              <span>Temporal / Discipline</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 filter drop-shadow-[0_0_4px_#10b981]" />
              <span>Habit / Recovery</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 filter drop-shadow-[0_0_4px_#a855f7]" />
              <span>Vault Achievement</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 pl-4.5 border-l border-white/5 mt-1">
              <span>● Locked Node</span>
            </div>
          </div>
        </div>

        {/* Sidebar Panel for Star Details (AnimatePresence modal overlay on the right) */}
        <AnimatePresence>
          {selectedStar && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="absolute right-4 top-4 bottom-4 w-full sm:w-80 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col justify-between backdrop-blur-xl pointer-events-auto z-20"
            >
              <div className="space-y-5">
                {/* Panel Close trigger */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-[9px] bg-white/5 px-2.5 py-0.5 rounded font-black tracking-widest text-slate-500 uppercase">
                    {selectedStar.category} Star
                  </span>
                  <button 
                    onClick={() => { playClick(); setSelectedStar(null); }}
                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Star display branding */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className={`w-5 h-5 ${selectedStar.isUnlocked ? 'text-amber-400 fill-amber-400/20' : 'text-slate-600'}`} />
                    <h3 className="text-lg font-black text-white tracking-wide">{selectedStar.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    {selectedStar.description}
                  </p>
                </div>

                {/* Unlock prerequisites status */}
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1.5">
                  <h5 className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Required Habit Criterion</h5>
                  <p className="text-[10px] text-slate-300 leading-normal font-bold">
                    {selectedStar.unlockCondition}
                  </p>
                </div>

                {/* Unlock status tracker */}
                <div className="space-y-2">
                  <h5 className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Biometric Alignment</h5>
                  {selectedStar.isUnlocked ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">Active Star Core Unlocked</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2 text-slate-400">
                      <HelpCircle className="w-4 h-4 shrink-0 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">Awaiting Alignment</span>
                    </div>
                  )}
                </div>

                {/* Context-aware suggestions */}
                {!selectedStar.isUnlocked && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2 text-[10px] text-indigo-300 leading-relaxed font-medium">
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                    <span>Study consistently with Timerra. As you accumulate more sessions, this star node will trigger glowing connections.</span>
                  </div>
                )}
              </div>

              {/* Action acknowledgement buttons */}
              <button
                onClick={() => { playClick(); setSelectedStar(null); }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                Return to Cosmos
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Instructions Banner */}
      <footer className="p-4 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
        <div>
          <span>TIMERRA COGNITIVE SYSTEM V1.0</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium uppercase tracking-widest">
          <span>Local IndexedDB Encrypted</span>
        </div>
      </footer>
    </div>
  );
};
