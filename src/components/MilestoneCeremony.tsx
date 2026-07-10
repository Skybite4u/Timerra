import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Star, Shield, Zap, ZapOff, Trophy } from 'lucide-react';
import { Milestone } from '../lib/vaultTypes';
import { playComplete, vibrateStart } from '../lib/audio';

interface MilestoneCeremonyProps {
  milestone: Milestone;
  onClose: () => void;
}

export const MilestoneCeremony: React.FC<MilestoneCeremonyProps> = ({ milestone, onClose }) => {
  const [stage, setStage] = useState<'intro' | 'orb_pulse' | 'wave_expand' | 'card_reveal'>('intro');

  useEffect(() => {
    // Play complete chime and short vibration
    playComplete();
    vibrateStart();

    // Staggered cinematic sequence:
    // 1. Intro (0ms): Background darkens, central camera focus
    // 2. Orb Pulse (500ms): Central core glows deeply
    // 3. Wave Expand (1200ms): Central core emits shockwave rings
    // 4. Card Reveal (2000ms): Milestone details fly into view

    const t1 = setTimeout(() => setStage('orb_pulse'), 400);
    const t2 = setTimeout(() => setStage('wave_expand'), 1100);
    const t3 = setTimeout(() => setStage('card_reveal'), 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [milestone]);

  const rarityStyles = {
    Common: {
      border: 'border-slate-500/30',
      bg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90',
      text: 'text-slate-300',
      glow: 'shadow-[0_0_30px_rgba(100,116,139,0.3)]',
      color: 'from-slate-400 to-slate-600',
    },
    Rare: {
      border: 'border-blue-500/30',
      bg: 'bg-gradient-to-b from-blue-950/80 to-slate-950/95',
      text: 'text-blue-400',
      glow: 'shadow-[0_0_40px_rgba(59,130,246,0.4)]',
      color: 'from-blue-400 to-indigo-600',
    },
    Epic: {
      border: 'border-purple-500/30',
      bg: 'bg-gradient-to-b from-purple-950/80 to-slate-950/95',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.5)]',
      color: 'from-purple-400 to-fuchsia-600',
    },
    Legendary: {
      border: 'border-amber-500/40',
      bg: 'bg-gradient-to-b from-amber-950/80 to-slate-950/95',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_60px_rgba(245,158,11,0.6)]',
      color: 'from-amber-400 to-orange-600',
    },
    Mythic: {
      border: 'border-rose-500/50',
      bg: 'bg-gradient-to-b from-rose-950/85 to-slate-950/95',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_80px_rgba(244,63,94,0.7)]',
      color: 'from-rose-400 to-red-600',
    },
    Celestial: {
      border: 'border-cyan-400/60',
      bg: 'bg-gradient-to-b from-[#082030]/90 to-[#030712]/95',
      text: 'text-cyan-300',
      glow: 'shadow-[0_0_100px_rgba(34,211,238,0.8)]',
      color: 'from-cyan-400 via-indigo-400 to-purple-400',
    }
  };

  const style = rarityStyles[milestone.rarity] || rarityStyles.Common;

  return (
    <div className="fixed inset-0 w-full h-full z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md select-none overflow-hidden">
      
      {/* 1. Living Space Particle field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-gradient-to-r ${style.color} opacity-40 animate-ping`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              animationDuration: `${Math.random() * 4 + 3}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 2. Central Solar Orb core and shockwaves */}
      <div className="relative flex items-center justify-center w-64 h-64">
        
        {/* Shockwave Rings */}
        {stage !== 'intro' && (
          <>
            <div className={`absolute rounded-full border border-white/25 bg-white/5 animate-pulse w-48 h-48 opacity-10 transition-all duration-1000 scale-[1.2]`} />
            <div className={`absolute rounded-full border-2 border-dashed border-white/10 w-64 h-64 animate-spin`} style={{ animationDuration: '25s' }} />
          </>
        )}

        {stage === 'wave_expand' && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent animate-ping scale-150 duration-700" />
        )}

        {/* The Central Evolving Orb */}
        <div 
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-tr ${style.color} shadow-2xl transition-all duration-1000 ease-out 
            ${stage === 'intro' ? 'scale-0 rotate-0 opacity-0' : 'scale-100 rotate-180 opacity-100'} 
            ${stage === 'orb_pulse' ? 'scale-110 shadow-[0_0_60px_var(--tm-glow)]' : ''} 
            ${stage === 'wave_expand' ? 'scale-125 shadow-[0_0_100px_white]' : ''} 
            ${stage === 'card_reveal' ? 'scale-90 opacity-60' : ''}`}
          style={{
            boxShadow: `0 0 50px rgba(${milestone.rarity === 'Celestial' ? '34,211,238' : '245,158,11'}, 0.5)`
          }}
        >
          {/* Inner crystal reflections */}
          <div className="absolute inset-1 rounded-full bg-black/20 backdrop-blur-sm" />
          <Award className="w-14 h-14 text-white relative z-20 animate-bounce" />
        </div>
      </div>

      {/* 3. Cinematic Card Reveal Overlay */}
      <div 
        className={`mt-8 max-w-md w-full px-6 transition-all duration-1000 ease-out transform flex flex-col items-center
          ${stage === 'card_reveal' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-24 scale-95 pointer-events-none'}`}
      >
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400 mb-1 animate-pulse">
          Timerra Milestone Vault
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Congratulations!
        </h2>

        {/* Milestone Display Box */}
        <div className={`w-full p-6 sm:p-8 rounded-[28px] border ${style.border} ${style.bg} ${style.glow} flex flex-col items-center text-center relative overflow-hidden`}>
          
          {/* Top light glow beam */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${style.color} text-white text-[9px] font-black uppercase tracking-wider mb-5 shadow-sm`}>
            {milestone.rarity} Milestone
          </div>

          <h3 className="text-xl font-black text-white tracking-wide mb-3">
            {milestone.name}
          </h3>

          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mb-6">
            {milestone.description}
          </p>

          <div className="w-full flex items-center justify-center gap-6 pt-5 border-t border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mb-1">XP Earned</span>
              <span className="text-lg font-black font-mono text-tm-primary">+{milestone.xpAward} XP</span>
            </div>
            
            <div className="h-6 w-[1px] bg-white/10" />

            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Identity Status</span>
              <span className={`text-xs font-bold uppercase ${style.text}`}>Unlocked</span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="mt-8 px-8 py-3.5 rounded-2xl bg-white text-[#060814] hover:bg-slate-200 active:scale-98 text-xs font-extrabold tracking-widest uppercase transition-all shadow-[0_10px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.25)] cursor-pointer"
        >
          Acknowledge & Continue
        </button>
      </div>

    </div>
  );
};
