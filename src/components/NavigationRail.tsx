import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Sliders, Database, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BellCapsuleIcon, HistoryCapsuleIcon, DnaCapsuleIcon, PortalCapsuleIcon 
} from './NavigationCapsuleIcons';

interface NavigationRailProps {
  // Navigation actions
  onOpenNotificationCenter: () => void;
  onOpenHistoryPanel: () => void;
  onOpenFocusDna: () => void;
  onOpenConstellation: () => void;
  onOpenMorePanel: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenGuide: () => void;
  
  // Timer State & Control
  timerRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onReturnToWorkspace: () => void;

  unreadCount: number;
  activePanel?: 'logs' | 'history' | 'dna' | 'more' | 'none';
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  onOpenNotificationCenter,
  onOpenHistoryPanel,
  onOpenFocusDna,
  onOpenConstellation,
  onOpenMorePanel,
  onOpenSettings,
  onOpenBackup,
  onOpenGuide,
  timerRunning,
  onTogglePlay,
  onReset,
  onSkip,
  onReturnToWorkspace,
  unreadCount,
  activePanel = 'none'
}) => {
  const [showOrbMenu, setShowOrbMenu] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  // Handle Mobile Orb Touch Interactions:
  // - Single Tap: return to timer workspace (scroll to top, dismiss panels)
  // - Double Tap: resumes/toggles last active timer
  // - Long Press / Hold: opens Focus Command Menu
  const handleOrbTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    // Check Double Tap
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap Action
      onTogglePlay();
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
      return;
    }
    lastTapRef.current = now;

    // Start Long Press timer (500ms)
    touchTimeoutRef.current = setTimeout(() => {
      setShowOrbMenu(true);
      // Play a tiny vibration if supported
      if (navigator.vibrate) {
        navigator.vibrate(35);
      }
      touchTimeoutRef.current = null;
    }, 550);
  };

  const handleOrbTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
      
      // Since it wasn't a long press or part of double tap yet, wait briefly to ensure it's a single tap
      setTimeout(() => {
        // If another tap hasn't occurred within 250ms, trigger single tap
        if (Date.now() - lastTapRef.current >= 280) {
          onReturnToWorkspace();
        }
      }, 280);
    }
  };

  // Standard Mouse Click for Desktop Orb
  const handleDesktopOrbClick = () => {
    onReturnToWorkspace();
  };

  const handleDesktopOrbDoubleClick = () => {
    onTogglePlay();
  };

  return (
    <>
      <style>{`
        .nav-premium-btn {
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      background-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1) !important;
          will-change: transform, opacity;
        }
        .nav-premium-btn:hover {
          transform: scale(1.08) !important;
        }
        .nav-premium-btn:active {
          transform: scale(0.92) !important;
        }
        .nav-premium-rail {
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          will-change: transform, opacity;
        }
      `}</style>
      {/* BACKGROUND DISMISS LAYER FOR RADIAL ORB MENU */}
      <AnimatePresence>
        {showOrbMenu && (
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" 
            onClick={() => setShowOrbMenu(false)}
          />
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 1. DESKTOP FLOATING LEFT NAVIGATION RAIL */}
      {/* ======================================================== */}
      <div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-4 py-6 px-3 bg-[#030712]/35 border border-white/[0.08] rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(255,255,255,0.08)] select-none animate-fade-in group hover:border-white/[0.15] hover:bg-[#030712]/50 nav-premium-rail">
        
        {/* Workspace Brand / Timer Area Return */}
        <button
          onClick={handleDesktopOrbClick}
          onDoubleClick={handleDesktopOrbDoubleClick}
          onMouseEnter={() => setIsHovered('orb')}
          onMouseLeave={() => setIsHovered(null)}
          className={`relative w-11 h-11 rounded-full bg-gradient-to-tr from-tm-primary/15 to-tm-accent/15 border flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group/orb ${
            activePanel === 'none' ? 'border-tm-primary/60 shadow-[0_0_15px_rgba(59,130,246,0.35)]' : 'border-white/10'
          }`}
          title="Single Tap: Workspace | Double Tap: Toggle Play"
        >
          {/* Pulsing Core */}
          <span className={`absolute w-3 h-3 rounded-full ${timerRunning ? 'bg-emerald-500 animate-ping' : 'bg-tm-primary animate-pulse'}`} />
          <span className={`absolute w-2.5 h-2.5 rounded-full ${timerRunning ? 'bg-emerald-400' : 'bg-tm-primary'}`} />
          
          {/* Tooltip */}
          <AnimatePresence>
            {isHovered === 'orb' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-16 bg-black/95 text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-3 rounded-xl border border-white/10 shadow-lg whitespace-nowrap z-50 pointer-events-none"
              >
                Workspace Core
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-white/5" />

        {/* 🔔 Focus Feed (Logs) */}
        <button
          onClick={onOpenNotificationCenter}
          onMouseEnter={() => setIsHovered('logs')}
          onMouseLeave={() => setIsHovered(null)}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn ${
            activePanel === 'logs' 
              ? 'bg-tm-primary/15 border border-tm-primary/45 shadow-[0_0_15px_rgba(59,130,246,0.25)]' 
              : 'border border-transparent hover:border-white/10'
          }`}
        >
          <BellCapsuleIcon size={30} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}

          <AnimatePresence>
            {isHovered === 'logs' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-16 bg-black/95 text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-3 rounded-xl border border-white/10 shadow-lg whitespace-nowrap z-50 pointer-events-none"
              >
                Focus Feed
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* 📜 History Hub */}
        <button
          onClick={onOpenHistoryPanel}
          onMouseEnter={() => setIsHovered('history')}
          onMouseLeave={() => setIsHovered(null)}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn ${
            activePanel === 'history' 
              ? 'bg-purple-500/15 border border-purple-500/45 shadow-[0_0_15px_rgba(168,85,247,0.25)]' 
              : 'border border-transparent hover:border-white/10'
          }`}
        >
          <HistoryCapsuleIcon size={30} />

          <AnimatePresence>
            {isHovered === 'history' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-16 bg-black/95 text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-3 rounded-xl border border-white/10 shadow-lg whitespace-nowrap z-50 pointer-events-none"
              >
                History Hub
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* 📊 Focus DNA */}
        <button
          onClick={onOpenFocusDna}
          onMouseEnter={() => setIsHovered('dna')}
          onMouseLeave={() => setIsHovered(null)}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn ${
            activePanel === 'dna' 
              ? 'bg-indigo-500/15 border border-indigo-500/45 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
              : 'border border-transparent hover:border-white/10'
          }`}
        >
          <DnaCapsuleIcon size={30} />

          <AnimatePresence>
            {isHovered === 'dna' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-16 bg-black/95 text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-3 rounded-xl border border-white/10 shadow-lg whitespace-nowrap z-50 pointer-events-none"
              >
                Focus DNA
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-white/5" />

        {/* ☰ More Portal */}
        <button
          onClick={onOpenMorePanel}
          onMouseEnter={() => setIsHovered('more')}
          onMouseLeave={() => setIsHovered(null)}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn ${
            activePanel === 'more' 
              ? 'bg-amber-500/15 border border-amber-500/45 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
              : 'border border-transparent hover:border-white/10'
          }`}
        >
          <PortalCapsuleIcon size={30} className="animate-pulse-slow" />

          <AnimatePresence>
            {isHovered === 'more' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-16 bg-black/95 text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-3 rounded-xl border border-white/10 shadow-lg whitespace-nowrap z-50 pointer-events-none"
              >
                Portal (More)
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE FLOATING ORB DOCK */}
      {/* ======================================================== */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-40 bg-[#030712]/50 border border-white/[0.08] rounded-full py-2 px-3 flex items-center justify-between shadow-[0_25px_60px_-10px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.12)] select-none nav-premium-rail pb-[calc(8px+env(safe-area-inset-bottom))]">
        
        {/* 🔔 Mobile Focus Feed */}
        <button
          onClick={onOpenNotificationCenter}
          className={`w-11 h-11 rounded-full flex items-center justify-center relative nav-premium-btn ${
            activePanel === 'logs' 
              ? 'bg-tm-primary/10 border border-tm-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]' 
              : 'border border-transparent'
          }`}
        >
          <BellCapsuleIcon size={26} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* 📜 Mobile History Hub */}
        <button
          onClick={onOpenHistoryPanel}
          className={`w-11 h-11 rounded-full flex items-center justify-center nav-premium-btn ${
            activePanel === 'history' 
              ? 'bg-purple-500/10 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]' 
              : 'border border-transparent'
          }`}
        >
          <HistoryCapsuleIcon size={26} />
        </button>

        {/* 🟢 CENTERED MOBILE ORB (Sleek, Core Active Glow) */}
        <div className="relative -mt-4 shrink-0">
          <button
            onTouchStart={handleOrbTouchStart}
            onTouchEnd={handleOrbTouchEnd}
            onClick={onReturnToWorkspace}
            className={`w-13 h-13 rounded-full bg-gradient-to-tr from-tm-primary to-tm-accent flex items-center justify-center shadow-[0_0_20px_var(--tm-glow)] border border-white/20 active:scale-90 transition-all cursor-pointer relative z-40 group ${
              activePanel === 'none' ? 'ring-2 ring-tm-primary/50 ring-offset-2 ring-offset-black/40' : ''
            }`}
          >
            {/* Spinning orbital light ring */}
            <span className="absolute inset-0 rounded-full border border-white/25 animate-spin-slow opacity-50" />
            <span className={`w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-lg ${timerRunning ? 'animate-pulse' : ''}`}>
              <span className={`w-2 h-2 rounded-full ${timerRunning ? 'bg-emerald-500' : 'bg-tm-primary'}`} />
            </span>
          </button>

          {/* Glowing Aura Ring behind Orb */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-tm-primary to-tm-accent opacity-25 blur-md -z-10 animate-pulse" />
        </div>

        {/* 📊 Mobile Insights */}
        <button
          onClick={onOpenFocusDna}
          className={`w-11 h-11 rounded-full flex items-center justify-center nav-premium-btn ${
            activePanel === 'dna' 
              ? 'bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
              : 'border border-transparent'
          }`}
        >
          <DnaCapsuleIcon size={26} />
        </button>

        {/* ☰ Mobile More Button */}
        <button
          onClick={onOpenMorePanel}
          className={`w-11 h-11 rounded-full flex items-center justify-center nav-premium-btn ${
            activePanel === 'more' 
              ? 'bg-amber-500/10 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
              : 'border border-transparent'
          }`}
        >
          <PortalCapsuleIcon size={26} className="animate-pulse-slow" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. PREMIUM ORB RADIAL COMMAND MENU (ABOVE MOBILE DOCK) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showOrbMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 30, x: '-50%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-24 left-1/2 z-50 w-[280px] bg-[#070b1a]/95 backdrop-blur-xl border border-white/10 rounded-[32px] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3.5 select-none"
          >
            <div className="text-center border-b border-white/5 pb-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-white">Orb Commands</p>
              <p className="text-[8px] text-slate-400 mt-0.5 font-medium">Quick Workspace State Toggles</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onTogglePlay(); setShowOrbMenu(false); }}
                className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-white"
              >
                {timerRunning ? <Pause className="w-4 h-4 text-tm-primary" /> : <Play className="w-4 h-4 text-emerald-400" />}
                <span>{timerRunning ? 'Pause' : 'Resume'}</span>
              </button>
              
              <button
                onClick={() => { onReset(); setShowOrbMenu(false); }}
                className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-white"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => { onSkip(); setShowOrbMenu(false); }}
                className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-white col-span-2 justify-center"
              >
                <Sliders className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Skip Session Mode</span>
              </button>
            </div>

            <div className="h-px bg-white/5 my-0.5" />

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => { onOpenSettings(); setShowOrbMenu(false); }}
                title="Settings"
                className="p-2.5 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-lg flex flex-col items-center gap-1 text-[8px] font-bold text-slate-300"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Config</span>
              </button>
              <button
                onClick={() => { onOpenBackup(); setShowOrbMenu(false); }}
                title="Backup Capsules"
                className="p-2.5 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-lg flex flex-col items-center gap-1 text-[8px] font-bold text-slate-300"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Capsule</span>
              </button>
              <button
                onClick={() => { onOpenGuide(); setShowOrbMenu(false); }}
                title="Help Guide"
                className="p-2.5 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-lg flex flex-col items-center gap-1 text-[8px] font-bold text-slate-300"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                <span>Guide</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
