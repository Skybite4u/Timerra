import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, X, Minimize2, Maximize2, Sparkles, Heart } from 'lucide-react';

interface GuidedBreathingProps {
  onClose?: () => void;
  playClick?: () => void;
}

type BreathState = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export const GuidedBreathing: React.FC<GuidedBreathingProps> = ({ onClose, playClick }) => {
  const [breathState, setBreathState] = useState<BreathState>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [isMinimized, setIsMinimized] = useState(false);
  const [totalCycles, setTotalCycles] = useState(0);

  // Audio / sound cue simulated with quiet visual ripples
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Move to next state
          setBreathState((currentState) => {
            switch (currentState) {
              case 'inhale':
                return 'hold-in';
              case 'hold-in':
                return 'exhale';
              case 'exhale':
                return 'hold-out';
              case 'hold-out':
                setTotalCycles(c => c + 1);
                return 'inhale';
              default:
                return 'inhale';
            }
          });
          return 4; // Reset to 4 seconds for box breathing
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getInstructions = () => {
    switch (breathState) {
      case 'inhale':
        return {
          title: 'Breathe In',
          desc: 'Feel your chest rise and fill with positive energy',
          color: 'from-blue-500/20 to-cyan-500/20',
          glowColor: 'rgba(6, 182, 212, 0.4)',
          textColor: 'text-cyan-200',
          scale: 1.4,
        };
      case 'hold-in':
        return {
          title: 'Hold Breath',
          desc: 'Let the oxygen restore your body and clear your mind',
          color: 'from-cyan-500/20 to-indigo-500/20',
          glowColor: 'rgba(59, 130, 246, 0.4)',
          textColor: 'text-indigo-200',
          scale: 1.4,
        };
      case 'exhale':
        return {
          title: 'Breathe Out',
          desc: 'Release all tension, stress, and anxiety fully',
          color: 'from-indigo-500/20 to-blue-600/20',
          glowColor: 'rgba(99, 102, 241, 0.4)',
          textColor: 'text-blue-200',
          scale: 1.0,
        };
      case 'hold-out':
        return {
          title: 'Rest',
          desc: 'Enjoy this peaceful moment of perfect stillness',
          color: 'from-blue-600/10 to-blue-900/20',
          glowColor: 'rgba(30, 41, 59, 0.2)',
          textColor: 'text-slate-400',
          scale: 1.0,
        };
    }
  };

  const current = getInstructions();

  const handleToggleMinimize = () => {
    if (playClick) playClick();
    setIsMinimized(!isMinimized);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        width: isMinimized ? '300px' : '100%',
        height: isMinimized ? '80px' : 'auto',
      }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180 }}
      className={`relative mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-500 max-w-lg z-30 ${
        isMinimized ? 'p-3 flex items-center justify-between gap-4 mt-2 mb-4' : 'p-6 mt-4 mb-6'
      }`}
    >
      {/* Absolute background color overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br opacity-40 transition-all duration-1000 ease-in-out -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${current.glowColor} 0%, transparent 70%)`
        }}
      />

      {isMinimized ? (
        // --- MINIMIZED COMPACT VIEW ---
        <>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center relative">
              <motion.div
                animate={{
                  scale: [1, current.scale, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-cyan-400/20"
              />
              <Wind className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                <span>{current.title}</span>
                <span className="font-mono text-[10px] text-cyan-400 font-extrabold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                  {secondsLeft}s
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                Cycle {totalCycles + 1} • Keep breathing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleMinimize}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Expand Breathe Guide"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                onClick={() => { if (playClick) playClick(); onClose(); }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </>
      ) : (
        // --- FULL IMMERSIVE DECOMPRESSION VIEW ---
        <div className="flex flex-col items-center text-center">
          
          {/* Header row */}
          <div className="w-full flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-cyan-500/10">
                <Wind className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Guided Decompression</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleMinimize}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              {onClose && (
                <button
                  onClick={() => { if (playClick) playClick(); onClose(); }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Core Breathing Orb Visualizer */}
          <div className="relative w-48 h-48 my-6 flex items-center justify-center">
            
            {/* Outer peaceful ripple waves */}
            <motion.div
              animate={{
                scale: current.scale * 1.15,
                opacity: breathState === 'exhale' ? 0.1 : 0.25,
              }}
              transition={{
                duration: 4,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border border-cyan-400/30 bg-cyan-500/5 blur-sm"
              style={{ willChange: 'transform, opacity' }}
            />

            <motion.div
              animate={{
                scale: current.scale * 1.3,
                opacity: breathState === 'inhale' ? 0.25 : 0.1,
              }}
              transition={{
                duration: 4,
                ease: "easeInOut",
              }}
              className="absolute -inset-4 rounded-full border border-indigo-400/20 bg-indigo-500/5 blur-md"
              style={{ willChange: 'transform, opacity' }}
            />

            {/* Inner Glowing Fluid Core */}
            <motion.div
              animate={{
                scale: current.scale,
                backgroundColor: breathState === 'inhale' 
                  ? 'rgba(6, 182, 212, 0.15)' 
                  : breathState === 'hold-in'
                  ? 'rgba(59, 130, 246, 0.2)'
                  : breathState === 'exhale'
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'rgba(30, 41, 59, 0.1)',
                boxShadow: `0 0 40px ${current.glowColor}, inset 0 0 20px rgba(255,255,255,0.05)`,
              }}
              transition={{
                duration: 4,
                ease: "easeInOut",
              }}
              className="w-32 h-32 rounded-full border border-white/10 flex flex-col items-center justify-center relative backdrop-blur-md"
              style={{ willChange: 'transform, background-color, box-shadow' }}
            >
              {/* Countdown Numbers */}
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={`${breathState}-${secondsLeft}`}
                  initial={{ opacity: 0, scale: 0.7, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-3xl font-black text-white"
                >
                  {secondsLeft}
                </motion.span>
              </AnimatePresence>

              {/* Small heartbeat pulse inside the core */}
              <Heart className="w-3.5 h-3.5 text-white/30 mt-1 animate-pulse" />
            </motion.div>
          </div>

          {/* Interactive State Instructions Text */}
          <div className="space-y-1 mb-2 px-4 h-16 flex flex-col justify-center">
            <h3 className={`text-lg font-black uppercase tracking-widest transition-all duration-700 ${current.textColor}`}>
              {current.title}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {current.desc}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="w-full flex justify-between items-center bg-[#030712]/45 border border-white/5 rounded-2xl py-2 px-4 mt-2 text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Session Cycle {totalCycles + 1}</span>
            </div>
            <span>4s-4s-4s-4s Box Breathing</span>
          </div>

        </div>
      )}
    </motion.div>
  );
};
