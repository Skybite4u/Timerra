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
  unreadCount
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
          transform: scale(1.1) !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .nav-premium-btn:active {
          transform: scale(0.9) !important;
          background-color: rgba(255, 255, 255, 0.16) !important;
        }
        .nav-premium-rail {
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
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
      <div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-5 py-7 px-3.5 bg-[#070b1a]/70 border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] select-none animate-fade-in group hover:border-white/20 hover:bg-[#070b1a]/85 nav-premium-rail">
        
        {/* Workspace Brand / Timer Area Return */}
        <button
          onClick={handleDesktopOrbClick}
          onDoubleClick={handleDesktopOrbDoubleClick}
          onMouseEnter={() => setIsHovered('orb')}
          onMouseLeave={() => setIsHovered(null)}
          className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-tm-primary/20 to-tm-accent/20 border border-tm-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group/orb"
          title="Single Tap: Workspace | Double Tap: Toggle Play"
        >
          {/* Pulsing Core */}
          <span className={`absolute w-3.5 h-3.5 rounded-full ${timerRunning ? 'bg-emerald-500 animate-ping' : 'bg-tm-primary animate-pulse'}`} />
          <span className={`absolute w-3 h-3 rounded-full ${timerRunning ? 'bg-emerald-400' : 'bg-tm-primary'}`} />
          
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
        <div className="w-8 h-px bg-white/10" />

        {/* 🔔 Focus Feed (Logs) */}
        <button
          onClick={onOpenNotificationCenter}
          onMouseEnter={() => setIsHovered('logs')}
          onMouseLeave={() => setIsHovered(null)}
          className="relative w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn"
        >
          <BellCapsuleIcon size={32} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
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
          className="relative w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn"
        >
          <HistoryCapsuleIcon size={32} />

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
          className="relative w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn"
        >
          <DnaCapsuleIcon size={32} />

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
        <div className="w-8 h-px bg-white/10" />

        {/* ☰ More Portal */}
        <button
          onClick={onOpenMorePanel}
          onMouseEnter={() => setIsHovered('more')}
          onMouseLeave={() => setIsHovered(null)}
          className="relative w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 nav-premium-btn"
        >
          <PortalCapsuleIcon size={32} className="animate-pulse-slow" />

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
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm z-40 bg-[#070b1a]/70 border border-white/10 rounded-full py-2.5 px-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.65)] select-none nav-premium-rail pb-[calc(10px+env(safe-area-inset-bottom))]">
        
        {/* 🔔 Mobile Focus Feed */}
        <button
          onClick={onOpenNotificationCenter}
          className="w-12 h-12 rounded-full flex items-center justify-center relative nav-premium-btn"
        >
          <BellCapsuleIcon size={28} />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* 📜 Mobile History Hub */}
        <button
          onClick={onOpenHistoryPanel}
          className="w-12 h-12 rounded-full flex items-center justify-center nav-premium-btn"
        >
          <HistoryCapsuleIcon size={28} />
        </button>

        {/* 🟢 CENTERED MOBILE ORB (25% Larger, Tap-Action-Driven) */}
        <div className="relative -mt-4 shrink-0">
          <button
            onTouchStart={handleOrbTouchStart}
            onTouchEnd={handleOrbTouchEnd}
            onClick={onReturnToWorkspace}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-tm-primary to-tm-accent flex items-center justify-center shadow-[0_0_25px_var(--tm-glow)] border border-white/20 active:scale-90 transition-all cursor-pointer relative z-40 group"
          >
            {/* Spinning orbital light ring */}
            <span className="absolute inset-0 rounded-full border border-white/30 animate-spin-slow opacity-60" />
            <span className={`w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shadow-lg ${timerRunning ? 'animate-pulse' : ''}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${timerRunning ? 'bg-emerald-500' : 'bg-tm-primary'}`} />
            </span>
          </button>

          {/* Glowing Aura Ring behind Orb */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-tm-primary to-tm-accent opacity-30 blur-md -z-10 animate-pulse" />
        </div>

        {/* 📊 Mobile Insights */}
        <button
          onClick={onOpenFocusDna}
          className="w-12 h-12 rounded-full flex items-center justify-center nav-premium-btn"
        >
          <DnaCapsuleIcon size={28} />
        </button>

        {/* ☰ Mobile More Button */}
        <button
          onClick={onOpenMorePanel}
          className="w-12 h-12 rounded-full flex items-center justify-center nav-premium-btn"
        >
          <PortalCapsuleIcon size={28} className="animate-pulse-slow" />
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
