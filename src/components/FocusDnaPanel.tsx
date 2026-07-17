import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Info, Flame, Shield, Award, Sparkles, TrendingUp, HelpCircle, 
  Clock, Activity, Calendar, Zap, Compass, CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react';
import { Session } from '../types';
import { calculateFocusDna, DnaStage, DnaResonance, DnaTrait, DNA_STAGES, DNA_RESONANCES } from '../lib/focusDna';
import { playClick } from '../lib/audio';

interface FocusDnaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
}

export const FocusDnaPanel: React.FC<FocusDnaPanelProps> = ({ isOpen, onClose, sessions }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'resonance' | 'traits' | 'history'>('profile');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  
  // Real-life DNA Evolution states
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [evolutionIndex, setEvolutionIndex] = useState<number>(0);
  const [evolutionText, setEvolutionText] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Compute live DNA State
  const dnaState = calculateFocusDna(sessions);
  const { stage, score, resonance, traits, history, behaviors, recentProgressMsg, growthTrend } = dnaState;

  const handleTriggerEvolution = () => {
    setIsEvolving(true);
    setEvolutionIndex(0);
    playClick();

    const messages = [
      "Decompressing dormant focus potential...",
      "Mapping active study bio-metrics...",
      "Synthesizing cognitive crystal structures...",
      "Sustaining flow state homeostasis...",
      "Activating advanced habit-forming sequences...",
      "Transcending ordinary cognitive limits!"
    ];

    setEvolutionText(messages[0]);

    let step = 0;
    const maxStep = stage.level; // Evolve from level 1 up to their actual level
    const intervalId = setInterval(() => {
      step++;
      if (step < maxStep) {
        setEvolutionIndex(step);
        setEvolutionText(messages[Math.min(step, messages.length - 1)]);
        playClick();
      } else {
        clearInterval(intervalId);
        // Completed evolution ceremony
        setTimeout(() => {
          setIsEvolving(false);
        }, 1800);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  // Custom visual component for DNA Helix Animation
  const renderDnaHelix = (color: string) => (
    <div className="relative w-44 h-48 flex items-center justify-center overflow-visible">
      {/* Central rotating aura core glow */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute w-28 h-28 rounded-full opacity-25 filter blur-xl"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      />
      {/* 3D rotating double helix structure */}
      <svg className="w-36 h-44 overflow-visible relative z-10" viewBox="0 0 100 120">
        <defs>
          <radialGradient id="dnaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Ambient Glow */}
        <circle cx="50" cy="60" r="45" fill="url(#dnaGlow)" />
        
        {/* Base Pairs (Rungs) of DNA helix */}
        {[...Array(12)].map((_, i) => {
          const y = 10 + i * 9;
          // Sine wave offset to simulate rotation
          const delay = i * 0.15;
          return (
            <g key={i}>
              {/* Connecting rung line */}
              <motion.line
                x1="20"
                y1={y}
                x2="80"
                y2={y}
                stroke="white"
                strokeWidth="1.5"
                strokeOpacity="0.1"
                animate={{
                  x1: [30, 70, 30],
                  x2: [70, 30, 70],
                  strokeOpacity: [0.15, 0.4, 0.15]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay
                }}
              />
              
              {/* Strand A Node */}
              <motion.circle
                cx="50"
                cy={y}
                r="3.5"
                fill={color}
                animate={{
                  cx: [25, 75, 25],
                  scale: [0.8, 1.4, 0.8],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay
                }}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              />

              {/* Strand B Node */}
              <motion.circle
                cx="50"
                cy={y}
                r="3.5"
                fill="#f43f5e" // complementary rose-500 accent for the other strand
                animate={{
                  cx: [75, 25, 75],
                  scale: [1.4, 0.8, 1.4],
                  opacity: [1, 0.5, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay
                }}
                style={{ filter: 'drop-shadow(0 0 4px #f43f5e)' }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );

  // Suggested actionable improvements based on real behavioral telemetry
  const getSuggestedImprovements = () => {
    const suggestions = [];
    if (behaviors.completionRate < 0.75) {
      suggestions.push({
        icon: AlertCircle,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/15",
        text: "Your session completion rate is currently suppressed. Focus on choosing smaller, fully achievable intervals to rebuild core integrity."
      });
    }
    if (behaviors.breakRatio < 0.3) {
      suggestions.push({
        icon: Activity,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/15",
        text: "Strategic cognitive breaks are missing. Complete at least one Cloud Nest rest session for every two study blocks to unlock higher DNA efficiency."
      });
    }
    if (behaviors.streak < 2) {
      suggestions.push({
        icon: Flame,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/15",
        text: "The Spark streak is currently cold. Log just 10 minutes of Zen or Pomodoro focus today to re-ignite your kinetic DNA acceleration."
      });
    }
    if (behaviors.diversityScore < 3) {
      suggestions.push({
        icon: Sparkles,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/15",
        text: "Unexplored dimensions. Expand your experience by trying stopwatch, rocket sprint, deep focus, or infinite focus modes."
      });
    }

    if (suggestions.length === 0) {
      return [
        {
          icon: CheckCircle2,
          color: "text-tm-primary",
          bg: "bg-tm-primary/10",
          border: "border-tm-primary/15",
          text: "Phenomenal! Your behavioral biomarkers show stellar structure. Maintain your current rhythm to crystalize the next major DNA evolutionary leap."
        }
      ];
    }
    return suggestions;
  };

  return (
    <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl select-none overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-4xl h-[90vh] sm:h-[85vh] bg-[#090d1a]/95 border border-white/10 rounded-[32px] overflow-hidden flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.8)]"
      >
        {/* Dynamic header background gradient mirroring current stage color */}
        <div 
          className="absolute top-0 left-0 right-0 h-40 opacity-15 pointer-events-none transition-all duration-1000"
          style={{ background: `linear-gradient(180deg, ${stage.color} 0%, transparent 100%)` }}
        />

        {/* Modal Header */}
        <div className="p-6 sm:px-8 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
              <Sparkles className="w-5 h-5 text-tm-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">Focus DNA Core</h2>
                <button 
                  onClick={() => { playClick(); setShowTooltip(!showTooltip); }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="What is Focus DNA?"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Offline Long-Term Identity Analyzer</p>
            </div>
          </div>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* What is Focus DNA Tooltip Banner */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 sm:px-8 bg-tm-primary/10 border-b border-tm-primary/15 overflow-hidden text-xs text-slate-300 py-3 flex items-start gap-2.5 relative z-10"
            >
              <HelpCircle className="w-4 h-4 text-tm-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">What is Focus DNA?</strong> Unlike level or grind-heavy systems, Focus DNA analyzes consistency, completion safety, recover-to-work ratios, timer diversity, and streak stability. It is rare, evolves slow, and rewards true cognitive alignment. Previously unlocked stages are immortalized and can never be lost.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="px-6 sm:px-8 pt-4 flex gap-1 border-b border-white/5 overflow-x-auto scrollbar-none relative z-10">
          {[
            { id: 'profile', label: 'DNA Profile', icon: Sparkles },
            { id: 'resonance', label: 'Resonance', icon: Compass },
            { id: 'traits', label: 'Cognitive Traits', icon: Zap },
            { id: 'history', label: 'Evolution Log', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { playClick(); setActiveTab(tab.id as any); }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide transition-all border-t-2 border-x cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95
                ${activeTab === tab.id 
                  ? 'bg-white/[0.03] text-white border-tm-primary border-x-white/5' 
                  : 'text-slate-400 hover:text-slate-200 border-transparent border-x-transparent'}`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-tm-primary' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Container Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8 space-y-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Stage Hero Banner */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white/[0.01] border border-white/5 p-6 rounded-[28px] relative overflow-hidden">
                  {/* Top line indicator */}
                  <div 
                    className="absolute top-0 left-0 w-full h-[2px]" 
                    style={{ backgroundColor: stage.color }} 
                  />

                  {/* Left Column: DNA helix artwork */}
                  <div className="md:col-span-4 flex justify-center">
                    {renderDnaHelix(stage.color)}
                  </div>

                  {/* Right Column: Stage info */}
                  <div className="md:col-span-8 space-y-4 text-center md:text-left">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          DNA Stage {stage.level} / 8
                        </div>
                        <button
                          onClick={handleTriggerEvolution}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tm-primary/15 hover:bg-tm-primary/25 border border-tm-primary/20 hover:border-tm-primary/40 text-[9px] font-black uppercase tracking-widest text-tm-primary transition-all cursor-pointer animate-pulse"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Initiate Evolution
                        </button>
                      </div>
                      <h3 
                        className="text-2xl sm:text-3xl font-black tracking-tight"
                        style={{ color: stage.color }}
                      >
                        {stage.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      "{stage.identity}"
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {stage.description}
                    </p>

                    {/* Hidden growth message feedback - completely mysterious */}
                    <div className="pt-2 flex items-center justify-center md:justify-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/5">
                      <TrendingUp className="w-3.5 h-3.5 text-tm-primary animate-pulse" />
                      <span>{recentProgressMsg}</span>
                    </div>
                  </div>
                </div>

                {/* Grid 2 Columns: Resonance Briefing and Traits summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Active Resonance card */}
                  <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-tm-primary" />
                      Active Resonance Alignment
                    </h4>

                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${resonance.color} flex items-center justify-center text-3xl shadow-lg shadow-black/40`}>
                        {resonance.icon}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-white text-base tracking-wide">{resonance.name}</h5>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{behaviors.streak > 0 ? `${behaviors.streak}d streak active` : 'flexible schedule'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{resonance.philosophy}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {resonance.description}
                    </p>
                  </div>

                  {/* Active Personality Traits card */}
                  <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-tm-primary" />
                      Cognitive Focus Traits
                    </h4>

                    {traits.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-600 font-medium">
                        No focal biomarkers recorded yet. Keep studying to unfold specific behavioral traits.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {traits.map(t => (
                          <div key={t.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[9px] bg-tm-primary/10 text-tm-primary px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-widest border border-tm-primary/10">
                                {t.category}
                              </span>
                              <h5 className="font-extrabold text-white text-xs mt-1.5">{t.name}</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{t.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Behavioral Metrics Dashboard */}
                <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Behavioral Biomarker Matrix
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Completion</p>
                      <p className="text-lg font-black text-white">{Math.round(behaviors.completionRate * 100)}%</p>
                      <p className="text-[8px] text-slate-500">Completed vs Started</p>
                    </div>

                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Daily Streak</p>
                      <p className="text-lg font-black text-amber-400">{behaviors.streak} days</p>
                      <p className="text-[8px] text-slate-500">Current active days</p>
                    </div>

                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Break Ratio</p>
                      <p className="text-lg font-black text-emerald-400">{behaviors.breakRatio.toFixed(1)}x</p>
                      <p className="text-[8px] text-slate-500">Breaks per focus cycle</p>
                    </div>

                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Diversity</p>
                      <p className="text-lg font-black text-cyan-400">{behaviors.diversityScore} / 9</p>
                      <p className="text-[8px] text-slate-500">Distinct modes executed</p>
                    </div>
                  </div>
                </div>

                {/* Suggested Focus Improvements */}
                <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-tm-primary" />
                    Adaptive Growth Calibration
                  </h4>
                  
                  <div className="space-y-3">
                    {getSuggestedImprovements().map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-2xl border ${item.bg} ${item.border} flex gap-3 items-start`}
                        >
                          <IconComponent className={`w-5 h-5 ${item.color} shrink-0 mt-0.5`} />
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            {item.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'resonance' && (
              <motion.div
                key="resonance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
                  <span className="text-[9px] bg-tm-primary/10 text-tm-primary px-2 py-0.5 rounded-full border border-tm-primary/15 font-black uppercase tracking-widest">
                    Slow Specialization Engine
                  </span>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">DNA Resonance Alignments</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Resonance is automatically forged from consistent schedules and habits. It represents how you focus, evolving extremely slow over months of stable biometric patterns.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DNA_RESONANCES.map(res => {
                    const isCurrent = resonance.id === res.id;
                    return (
                      <div 
                        key={res.id} 
                        className={`p-5 bg-white/[0.01] border rounded-2xl space-y-3 transition-all relative overflow-hidden
                          ${isCurrent 
                            ? 'border-white/20 bg-gradient-to-b from-white/[0.02] to-transparent shadow-[0_0_20px_rgba(255,255,255,0.02)]' 
                            : 'border-white/5 opacity-60 hover:opacity-85'}`}
                      >
                        {isCurrent && (
                          <span className="absolute top-4 right-4 bg-tm-primary/10 text-tm-primary border border-tm-primary/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            Active Alignment
                          </span>
                        )}

                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${res.color} flex items-center justify-center text-2xl shadow-md`}>
                            {res.icon}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-white text-sm tracking-wide">{res.name}</h4>
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Resonance Path</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed italic pl-1">
                          "{res.philosophy}"
                        </p>

                        <div className="pt-2.5 border-t border-white/5 space-y-1 pl-1">
                          <p className="text-[10px] text-slate-400 font-medium">
                            {res.description}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            <strong className="text-slate-400">Prerequisite:</strong> {res.requirements}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'traits' && (
              <motion.div
                key="traits"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
                  <span className="text-[9px] bg-tm-primary/10 text-tm-primary px-2 py-0.5 rounded-full border border-tm-primary/15 font-black uppercase tracking-widest">
                    Dynamic Behavior Map
                  </span>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">Evolving Cognitive Focus Traits</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Your local study habits shape dynamic identity markers. These descriptive markers calibrate on your real study trends and milestones over time.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "night_scholar", name: "Night Scholar", desc: "You achieve high focal alignment after 8:00 PM, finding deep creativity in night's quiet.", cat: "Schedule" },
                    { id: "morning_builder", name: "Morning Builder", desc: "You trigger early sessions before noon, unlocking consistent fresh momentum.", cat: "Schedule" },
                    { id: "deep_thinker", name: "Deep Thinker", desc: "An alignment with strict Deep Focus channels, seeking deep distraction-free spaces.", cat: "Cognitive Style" },
                    { id: "balanced_worker", name: "Balanced Worker", desc: "Practices clean, structured work intervals with active cognitive breaks.", cat: "Structure" },
                    { id: "recovery_master", name: "Recovery Master", desc: "Understands that sustainable productivity depends directly on healthy, deep rest intervals.", cat: "Habit" },
                    { id: "disciplined_planner", name: "Disciplined Planner", desc: "Consistently details clear subject intentions and custom micro-goals before studying.", cat: "Intention" },
                    { id: "calm_performer", name: "Calm Performer", desc: "Enjoys organic, boundless concentration in Zen or Infinity Focus channels.", cat: "Cognitive Style" },
                    { id: "steady_climber", name: "Steady Climber", desc: "Completes study blocks relentlessly, resisting skip triggers.", cat: "Discipline" }
                  ].map(tr => {
                    const isUnlocked = traits.some(t => t.id === tr.id);
                    return (
                      <div 
                        key={tr.id} 
                        className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between
                          ${isUnlocked 
                            ? 'border-tm-primary/20 bg-tm-primary/[0.02]' 
                            : 'border-white/5 opacity-40 bg-white/[0.01]'}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] bg-white/5 text-slate-400 border border-white/5 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                              {tr.cat}
                            </span>
                            {isUnlocked && (
                              <span className="text-[8px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">
                                Unlocked
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-black tracking-wide ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                            {tr.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            {tr.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
                  <span className="text-[9px] bg-tm-primary/10 text-tm-primary px-2 py-0.5 rounded-full border border-tm-primary/15 font-black uppercase tracking-widest">
                    Evolution Log
                  </span>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">Timeline of Focus Evolutions</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Every stage unlocked in your Timerra Focus DNA journey is logged and archived permanently below.
                  </p>
                </div>

                {history.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-600 bg-white/[0.01] border border-white/5 rounded-3xl font-medium">
                    No evolutions logged yet. Evolve past Stage I to record your first timeline memory.
                  </div>
                ) : (
                  <div className="relative border-l border-white/5 pl-6 ml-4 space-y-6">
                    {history.map((record, index) => {
                      const matchedStage = DNA_STAGES.find(s => s.level === record.stageLevel);
                      return (
                        <div key={index} className="relative">
                          {/* Dot marker */}
                          <div 
                            className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center"
                            style={{ backgroundColor: matchedStage?.color || '#cbd5e1' }}
                          />
                          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold">
                              {new Date(record.unlockedAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <h4 
                              className="text-xs font-black tracking-wide"
                              style={{ color: matchedStage?.color || '#cbd5e1' }}
                            >
                              DNA Stage {record.stageLevel} — {record.stageName}
                            </h4>
                            <p className="text-[10px] text-slate-400 italic">
                              "{matchedStage?.identity || ''}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-[#04060c] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/5 text-slate-500 px-2 py-0.5 rounded font-black">LOCAL STORAGE SECURED</span>
            <span className="text-[9px] text-slate-500">Timerra Offline Sync Algorithm</span>
          </div>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="w-full sm:w-auto px-5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer active:scale-95 text-center"
          >
            Acknowledge Profile
          </button>
        </div>
      </motion.div>

      {/* Real-life DNA Evolution ceremony overlay */}
      <AnimatePresence>
        {isEvolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none animate-pulse" />

            <div className="space-y-6 max-w-md w-full relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase tracking-widest text-cyan-400 animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>GENETIC SYNTHESIS ACTIVE</span>
              </div>

              <div className="relative flex justify-center py-4">
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute w-44 h-44 rounded-full border border-dashed border-white/5"
                />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute w-52 h-52 rounded-full border border-dashed border-white/10"
                />
                
                {renderDnaHelix(DNA_STAGES[evolutionIndex]?.color || stage.color)}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-extrabold block">
                  Evolution Phase {evolutionIndex + 1} of {stage.level}
                </span>
                
                <motion.h3 
                  key={evolutionIndex}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-black uppercase tracking-wider"
                  style={{ color: DNA_STAGES[evolutionIndex]?.color || stage.color }}
                >
                  {DNA_STAGES[evolutionIndex]?.name || stage.name}
                </motion.h3>

                <p className="text-xs text-slate-300 italic h-12 flex items-center justify-center px-6 leading-relaxed">
                  "{evolutionText}"
                </p>
              </div>

              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-tm-primary to-tm-accent rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((evolutionIndex + 1) / stage.level) * 100}%` }}
                  transition={{ duration: 1.2 }}
                />
              </div>

              <div className="text-[10px] text-slate-500 font-mono tracking-widest">
                ALIGNING CHROMOSOMES // XP METRICS SYSTEM ACTIVE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
