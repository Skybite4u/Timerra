import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, Award, Shield, Zap, ChevronRight, Check } from 'lucide-react';
import { DnaStage } from '../lib/focusDna';
import { playComplete, vibrateStart } from '../lib/audio';

interface DnaEvolutionCeremonyProps {
  stage: DnaStage;
  onClose: () => void;
}

export const DnaEvolutionCeremony: React.FC<DnaEvolutionCeremonyProps> = ({ stage, onClose }) => {
  const [phase, setPhase] = useState<'intro' | 'orb_pulsing' | 'energy_surge' | 'transformation_reveal'>('intro');

  useEffect(() => {
    // Play deep complete chime and physical vibration
    playComplete();
    vibrateStart();

    // Staggered premium sequence:
    // 1. Intro (0ms): Screen dims, deep particles floating.
    // 2. Orb Pulsing (500ms): Central Core begins high intensity breathing.
    // 3. Energy Surge (1500ms): Concentric shockwave lines expand.
    // 4. Reveal (2500ms): The brand new Focus DNA Stage details fly forward.

    const t1 = setTimeout(() => setPhase('orb_pulsing'), 500);
    const t2 = setTimeout(() => setPhase('energy_surge'), 1400);
    const t3 = setTimeout(() => setPhase('transformation_reveal'), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stage]);

  return (
    <div className="fixed inset-0 w-full h-full z-[120] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl select-none overflow-hidden font-sans">
      
      {/* Cinematic energy background particle grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1.5}px`,
              height: `${Math.random() * 4 + 1.5}px`,
              animationDuration: `${Math.random() * 5 + 3}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Central Evolving Orb core layout */}
      <div className="relative flex items-center justify-center w-72 h-72">
        
        {/* Ambient shockwave rings during surges */}
        {phase !== 'intro' && (
          <>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 0.15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
              className="absolute rounded-full border-2 border-dashed w-60 h-60"
              style={{ borderColor: stage.color }}
            />
            <div className="absolute rounded-full border border-white/5 w-72 h-72 animate-spin" style={{ animationDuration: '30s' }} />
          </>
        )}

        {/* Big kinetic impact ring */}
        {phase === 'energy_surge' && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${stage.color} 20%, transparent 75%)` }}
          />
        )}

        {/* Evolving Core Orb */}
        <div 
          className={`relative z-10 w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-tr transition-all duration-1000 ease-out 
            ${stage.glowClass}
            ${phase === 'intro' ? 'scale-0 rotate-0 opacity-0' : 'scale-100 rotate-180 opacity-100'} 
            ${phase === 'orb_pulsing' ? 'scale-110' : ''} 
            ${phase === 'energy_surge' ? 'scale-125' : ''} 
            ${phase === 'transformation_reveal' ? 'scale-95 opacity-80' : ''}`}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${stage.color} 0%, ${stage.accentColor} 100%)`
          }}
        >
          {/* Internal glass mirror reflection */}
          <div className="absolute inset-1 rounded-full bg-black/10 backdrop-blur-sm" />
          
          <Sparkles className="w-12 h-12 text-white relative z-20 animate-bounce" />
        </div>
      </div>

      {/* Narrative transformation details card */}
      <div 
        className={`mt-10 max-w-md w-full px-6 transition-all duration-1000 ease-out transform flex flex-col items-center text-center
          ${phase === 'transformation_reveal' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-95 pointer-events-none'}`}
      >
        <span className="text-[10px] uppercase font-black tracking-[0.35em] text-tm-primary mb-2 animate-pulse">
          Timerra Focus DNA Evolved
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-6">
          Identity Alignment Achieved
        </h2>

        {/* Interactive stats / cosmetics card unlocked */}
        <div className="w-full p-6 sm:p-8 rounded-[28px] border border-white/10 bg-slate-900/40 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Accent border top line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          
          <div className="px-4 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider mb-5 shadow-sm inline-block"
               style={{ backgroundColor: stage.color }}>
            Stage {stage.level} Unlocked
          </div>

          <h3 className="text-2xl font-black text-white tracking-wide mb-3">
            {stage.name}
          </h3>

          <p className="text-xs text-slate-300 italic mb-5">
            "{stage.identity}"
          </p>

          <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
            {stage.description}
          </p>

          {/* Cosmetic rewards items */}
          <div className="border-t border-white/5 pt-5 space-y-3">
            <h4 className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Unveiled Cosmetic Rewards</h4>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-1.5 text-[10px] text-slate-300 font-bold">
                <Check className="w-3.5 h-3.5 text-tm-primary shrink-0" />
                <span>{stage.orbTheme} Skin</span>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-1.5 text-[10px] text-slate-300 font-bold">
                <Check className="w-3.5 h-3.5 text-tm-primary shrink-0" />
                <span>Exclusive Aura Glow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acknowledge close controls */}
        <button
          onClick={() => { playComplete(); onClose(); }}
          className="mt-8 px-8 py-3 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-lg shadow-black/30"
        >
          Embrace Transformation
        </button>
      </div>

    </div>
  );
};
