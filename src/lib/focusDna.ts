import { Session, TimerMode } from '../types';
import { VaultManager } from './vaultManager';

export interface DnaStage {
  level: number;
  name: string;
  minScore: number;
  color: string;
  accentColor: string;
  glowClass: string;
  orbTheme: string;
  sound: string;
  identity: string;
  description: string;
}

export interface DnaResonance {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  requirements: string;
  philosophy: string;
}

export interface DnaTrait {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface EvolutionRecord {
  stageLevel: number;
  stageName: string;
  unlockedAt: number;
}

export interface FocusDnaState {
  score: number;
  stage: DnaStage;
  maxStageReached: number;
  resonance: DnaResonance;
  traits: DnaTrait[];
  history: EvolutionRecord[];
  growthTrend: 'surging' | 'stable' | 'crystallizing' | 'dormant' | 'dampened';
  recentProgressMsg: string;
  behaviors: {
    totalSessions: number;
    completionRate: number;
    morningRatio: number;
    nightRatio: number;
    streak: number;
    breakRatio: number;
    diversityScore: number;
  };
}

export interface StarPoint {
  id: string;
  name: string;
  category: 'core' | 'temporal' | 'discipline' | 'habit' | 'achievement';
  x: number; // 0 to 1000 coordinate
  y: number; // 0 to 1000 coordinate
  unlockCondition: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  description: string;
  relatedMilestone?: string;
  relatedResonance?: string;
}

export interface SkyConnection {
  fromId: string;
  toId: string;
  active: boolean;
  pathStyle: string;
}

// Stages Data
export const DNA_STAGES: DnaStage[] = [
  {
    level: 1,
    name: "Dormant Core",
    minScore: 0,
    color: "#64748b", // slate-500
    accentColor: "#475569",
    glowClass: "shadow-[0_0_20px_rgba(148,163,184,0.3)]",
    orbTheme: "Carbon Noir",
    sound: "soft_click",
    identity: "A quiet spark waiting within the stillness.",
    description: "The baseline focus frequency. The core sits in serene, unmanifest potential, pulsing silently as the first thoughts gather."
  },
  {
    level: 2,
    name: "Awakened Core",
    minScore: 12,
    color: "#38bdf8", // sky-400
    accentColor: "#0284c7",
    glowClass: "shadow-[0_0_35px_rgba(56,189,248,0.5)]",
    orbTheme: "Cosmic Blue",
    sound: "crystal_ring",
    identity: "An active pulse indicating structured intention.",
    description: "The spark ignites. The core is receptive to focus patterns and emits a stable, rhythmic light field."
  },
  {
    level: 3,
    name: "Focused Mind",
    minScore: 35,
    color: "#6366f1", // indigo-500
    accentColor: "#4f46e5",
    glowClass: "shadow-[0_0_50px_rgba(99,102,241,0.6)]",
    orbTheme: "Royal Violet",
    sound: "ambient_chime",
    identity: "Deep, concentrated clarity taking root.",
    description: "Conscious efforts begin to stabilize. Scattered energies compile into a singular flow vector, cutting through noise."
  },
  {
    level: 4,
    name: "Resonant Mind",
    minScore: 75,
    color: "#14b8a6", // teal-500
    accentColor: "#0d9488",
    glowClass: "shadow-[0_0_60px_rgba(20,184,166,0.6)]",
    orbTheme: "Boreal Glow",
    sound: "tibetan_singing",
    identity: "Harmonious resonance between work and restorative rest.",
    description: "Focus becomes effortless. The mind naturally aligns with the rhythm of deep work, flowing and recovering in perfect sync."
  },
  {
    level: 5,
    name: "Crystal Discipline",
    minScore: 140,
    color: "#d946ef", // fuchsia-500
    accentColor: "#c026d3",
    glowClass: "shadow-[0_0_75px_rgba(217,70,239,0.7)]",
    orbTheme: "Sunset Flare",
    sound: "cosmic_warp",
    identity: "Solidified habit structures that resist outer turbulence.",
    description: "Like a perfectly aligned lattice, your discipline is dense and crystalline. Interruptions slide off without fracturing your flow."
  },
  {
    level: 6,
    name: "Astral Focus",
    minScore: 240,
    color: "#3b82f6", // blue-500
    accentColor: "#1d4ed8",
    glowClass: "shadow-[0_0_90px_rgba(59,130,246,0.75)]",
    orbTheme: "Deep Midnight",
    sound: "celestial_gong",
    identity: "Elevated, detached focus acting as its own ecosystem.",
    description: "The work environment fades completely. You study from a higher astral plane, observing concepts with absolute detachment and ease."
  },
  {
    level: 7,
    name: "Nova Consciousness",
    minScore: 380,
    color: "#f97316", // orange-500
    accentColor: "#c2410c",
    glowClass: "shadow-[0_0_110px_rgba(249,115,22,0.8)]",
    orbTheme: "Solar Flare",
    sound: "energy_ignition",
    identity: "High-intensity bursts of brilliant problem-solving energy.",
    description: "A radiant state of absolute momentum. Ideas ignite and synthesize instantly. Your concentration is brilliant, warm, and highly generative."
  },
  {
    level: 8,
    name: "Eclipse Mind",
    minScore: 560,
    color: "#fbbf24", // amber-400
    accentColor: "#b45309",
    glowClass: "shadow-[0_0_130px_rgba(251,191,36,0.85)]",
    orbTheme: "Ruby Core",
    sound: "shadow_ripple",
    identity: "Deep, impenetrable focus of obsidian weight.",
    description: "The apex of silence. Total exclusion of the outer world. Like a perfect eclipse, you sit in the majestic dark ring of absolute concentration."
  },
  {
    level: 9,
    name: "Infinity Mind",
    minScore: 800,
    color: "#22d3ee", // cyan-400
    accentColor: "#0891b2",
    glowClass: "shadow-[0_0_150px_rgba(34,211,238,0.9)]",
    orbTheme: "Hyper Cyber",
    sound: "quantum_symphony",
    identity: "Boundless intellectual processing across multiple domains.",
    description: "Time dilates. Hours of study feel like seconds. You weave complicated logic streams seamlessly into an integrated lattice of knowledge."
  },
  {
    level: 10,
    name: "Singularity",
    minScore: 1100,
    color: "#ffffff", // white
    accentColor: "#cbd5e1",
    glowClass: "shadow-[0_0_200px_rgba(255,255,255,1)]",
    orbTheme: "Stellar Horizon",
    sound: "absolute_silence",
    identity: "The absolute convergence of will, mind, and reality.",
    description: "You and the focus are one. There is no effort, no time, no worker—only the pure act of creation itself. The core is fully compressed."
  }
];

// Resonances Data
export const DNA_RESONANCES: DnaResonance[] = [
  {
    id: "solar",
    name: "Solar Resonance",
    icon: "🌅",
    color: "from-amber-400 via-orange-500 to-red-500",
    description: "Users who consistently study in the morning, channeling the rising sun's vitality.",
    requirements: "Complete at least 45% of focus sessions between 5:00 AM and 12:00 PM.",
    philosophy: "To rise before the noise of the world, dedicating the day's first pristine energy to growth and creation."
  },
  {
    id: "lunar",
    name: "Lunar Resonance",
    icon: "🌙",
    color: "from-indigo-400 via-purple-500 to-slate-800",
    description: "Users who naturally perform best in the quiet of the night.",
    requirements: "Complete at least 45% of focus sessions between 8:00 PM and 4:00 AM.",
    philosophy: "Embracing the profound stillness of the night, when the world sleeps, to delve deep into the mysteries of study."
  },
  {
    id: "ocean",
    name: "Ocean Resonance",
    icon: "🌊",
    color: "from-cyan-400 via-blue-500 to-indigo-600",
    description: "Steady, calm, and highly consistent learners with high completion rates.",
    requirements: "Session completion rate over 90% with average sessions exceeding 35 minutes.",
    philosophy: "The relentless force of the ocean. Quiet, deep, and steady—eroding obstacles through tireless consistency."
  },
  {
    id: "storm",
    name: "Storm Resonance",
    icon: "⚡",
    color: "from-teal-400 via-cyan-500 to-rose-500",
    description: "Short but extremely intense, high-output sprint sessions.",
    requirements: "Frequent sprint/stopwatch sessions (avg < 20m) with high weekly frequency.",
    philosophy: "A localized storm. Striking fast and bright, releasing massive energy in targeted bursts to spark immediate results."
  },
  {
    id: "forest",
    name: "Forest Resonance",
    icon: "🌲",
    color: "from-emerald-400 via-green-500 to-teal-700",
    description: "Balanced focus patterns that integrate healthy restoration.",
    requirements: "High ratio of completed break modes to focus modes (at least 1 break per 2 focus sessions).",
    philosophy: "The ecosystem of balance. Recognizing that deep roots require both the active rain of study and the quiet soil of rest."
  },
  {
    id: "ember",
    name: "Ember Resonance",
    icon: "🔥",
    color: "from-red-500 via-orange-500 to-amber-500",
    description: "Strong, persistent daily focus momentum over extended periods.",
    requirements: "Maintain a study streak of at least 5 days or 15 sessions in the last 14 days.",
    philosophy: "A fire that never goes out. Rekindling the determination day after day, keeping the flame of passion burning bright."
  },
  {
    id: "cosmic",
    name: "Cosmic Resonance",
    icon: "🌌",
    color: "from-purple-500 via-indigo-500 to-cyan-500",
    description: "Exceptional long-term consistency and comprehensive system usage.",
    requirements: "Total focus sessions exceeding 100, or active days exceeding 30.",
    philosophy: "Expanding like the cosmos. Translating minor daily achievements into a grand, cohesive, interstellar habit galaxy."
  },
  {
    id: "compass",
    name: "Compass Resonance",
    icon: "🧭",
    color: "from-slate-400 via-slate-200 to-slate-500",
    description: "Flexible focus habits that adapt perfectly across different schedules.",
    requirements: "Sessions distributed evenly across multiple different subjects and hours of day.",
    philosophy: "The adaptable voyager. Navigating any time, any terrain, showing that true discipline is fluid and universal."
  }
];

// Helper to determine active resonance
export function determineResonance(sessions: Session[]): DnaResonance {
  if (sessions.length < 5) {
    return DNA_RESONANCES.find(r => r.id === 'compass') || DNA_RESONANCES[7];
  }

  // 1. Solar & Lunar (Morning vs Night)
  let morningCount = 0;
  let nightCount = 0;
  let focusCount = 0;
  let totalMinutes = 0;
  let completedCount = 0;
  let totalInitiated = 0;

  // Track modes used
  const modeCounts: { [m: string]: number } = {};

  sessions.forEach(s => {
    const isBreak = ['shortBreak', 'longBreak'].includes(s.mode);
    if (!isBreak) {
      totalInitiated++;
      if (s.completed !== false) {
        completedCount++;
      }
    }

    modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1;

    if (!isBreak && s.completedAt) {
      const date = new Date(s.completedAt);
      const hour = date.getHours();
      if (hour >= 5 && hour < 12) morningCount++;
      if (hour >= 20 || hour < 4) nightCount++;
      focusCount++;
      totalMinutes += s.durationSec / 60;
    }
  });

  const completionRate = totalInitiated > 0 ? completedCount / totalInitiated : 0;
  const avgDurationMins = focusCount > 0 ? totalMinutes / focusCount : 0;

  // Ember Check
  const days = sessions.map(s => new Date(s.completedAt).toDateString());
  const uniqueDays = Array.from(new Set(days)).map(d => new Date(d).getTime());
  uniqueDays.sort((a, b) => b - a);
  let streak = 0;
  if (uniqueDays.length > 0) {
    const todayMs = new Date(new Date().toDateString()).getTime();
    const yesterdayMs = todayMs - 86400000;
    if (uniqueDays[0] === todayMs || uniqueDays[0] === yesterdayMs) {
      streak = 1;
      let expected = uniqueDays[0];
      for (let i = 1; i < uniqueDays.length; i++) {
        expected -= 86400000;
        if (uniqueDays[i] === expected) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const breakCount = (modeCounts['shortBreak'] || 0) + (modeCounts['longBreak'] || 0);
  const breakRatio = focusCount > 0 ? breakCount / focusCount : 0;

  // 1. Cosmic check
  if (focusCount >= 100 || uniqueDays.length >= 30) {
    return DNA_RESONANCES.find(r => r.id === 'cosmic')!;
  }
  // 2. Ember check
  if (streak >= 5 || sessions.filter(s => s.completedAt > Date.now() - 14 * 86400000).length >= 15) {
    return DNA_RESONANCES.find(r => r.id === 'ember')!;
  }
  // 3. Ocean check
  if (completionRate >= 0.9 && avgDurationMins >= 35 && focusCount >= 8) {
    return DNA_RESONANCES.find(r => r.id === 'ocean')!;
  }
  // 4. Forest check
  if (breakRatio >= 0.5 && focusCount >= 6) {
    return DNA_RESONANCES.find(r => r.id === 'forest')!;
  }
  // 5. Morning / Solar
  if (focusCount > 0 && (morningCount / focusCount) >= 0.45) {
    return DNA_RESONANCES.find(r => r.id === 'solar')!;
  }
  // 6. Night / Lunar
  if (focusCount > 0 && (nightCount / focusCount) >= 0.45) {
    return DNA_RESONANCES.find(r => r.id === 'lunar')!;
  }
  // 7. Storm check
  if (avgDurationMins <= 20 && focusCount >= 8) {
    return DNA_RESONANCES.find(r => r.id === 'storm')!;
  }

  return DNA_RESONANCES.find(r => r.id === 'compass')!;
}

// Generate active traits
export function generateTraits(sessions: Session[]): DnaTrait[] {
  const traits: DnaTrait[] = [];
  if (sessions.length === 0) return [];

  let morningCount = 0;
  let nightCount = 0;
  let focusCount = 0;
  let totalMinutes = 0;
  let deepFocusCount = 0;
  let pomodoroCount = 0;
  let zenCount = 0;
  let completedCount = 0;
  let totalInitiated = 0;

  const subjectCounts: { [s: string]: number } = {};
  const goalCount = sessions.filter(s => s.goal && s.goal.trim().length > 0).length;

  sessions.forEach(s => {
    const isBreak = ['shortBreak', 'longBreak'].includes(s.mode);
    if (!isBreak) {
      totalInitiated++;
      if (s.completed !== false) completedCount++;
      focusCount++;
      totalMinutes += s.durationSec / 60;
      if (s.mode === 'deepFocus') deepFocusCount++;
      if (s.mode === 'focus') pomodoroCount++;
      if (s.mode === 'zen' || s.mode === 'infinityFocus') zenCount++;

      subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
    }

    if (s.completedAt && !isBreak) {
      const hour = new Date(s.completedAt).getHours();
      if (hour >= 5 && hour < 12) morningCount++;
      if (hour >= 20 || hour < 4) nightCount++;
    }
  });

  const breakCount = sessions.filter(s => ['shortBreak', 'longBreak'].includes(s.mode)).length;
  const breakRatio = focusCount > 0 ? breakCount / focusCount : 0;
  const completionRate = totalInitiated > 0 ? completedCount / totalInitiated : 0;

  if (nightCount >= 4) {
    traits.push({
      id: "night_scholar",
      name: "Night Scholar",
      description: "Thrives in the tranquil shadows of the late night hours.",
      category: "Schedule"
    });
  }
  if (morningCount >= 4) {
    traits.push({
      id: "morning_builder",
      name: "Morning Builder",
      description: "Secures focus momentum early before the world stirs.",
      category: "Schedule"
    });
  }
  if (deepFocusCount >= 3) {
    traits.push({
      id: "deep_thinker",
      name: "Deep Thinker",
      description: "Shows a clear affinity for distraction-free Crystal Core sessions.",
      category: "Cognitive Style"
    });
  }
  if (pomodoroCount >= 5 && breakRatio >= 0.3) {
    traits.push({
      id: "balanced_worker",
      name: "Balanced Worker",
      description: "Practices Pomodoro methodology with structured breaks.",
      category: "Structure"
    });
  }
  if (breakRatio >= 0.5) {
    traits.push({
      id: "recovery_master",
      name: "Recovery Master",
      description: "Understands the premium cognitive returns of strategic rest.",
      category: "Habit"
    });
  }
  if (goalCount >= 3) {
    traits.push({
      id: "disciplined_planner",
      name: "Disciplined Planner",
      description: "Sets clear intentions and logs targeted milestones before studying.",
      category: "Intention"
    });
  }
  if (zenCount >= 3) {
    traits.push({
      id: "calm_performer",
      name: "Calm Performer",
      description: "Finds peace in boundless, untimed Zen or Infinity Focus channels.",
      category: "Cognitive Style"
    });
  }
  if (completionRate >= 0.95 && focusCount >= 6) {
    traits.push({
      id: "steady_climber",
      name: "Steady Climber",
      description: "Rarely drops an active core, marching steadily to completion.",
      category: "Discipline"
    });
  }

  // Ensure we always have at least one trait if they studied at all
  if (traits.length === 0 && focusCount > 0) {
    traits.push({
      id: "steady_climber",
      name: "Steady Climber",
      description: "Patiently developing foundational habits in the Timerra ecosystem.",
      category: "Discipline"
    });
  }

  return traits.slice(0, 4); // limit to max 4 traits
}

// Main Focus DNA state calculator
export function calculateFocusDna(sessions: Session[]): FocusDnaState {
  // 1. Calculate historical behaviors
  let completedCount = 0;
  let totalInitiated = 0;
  let focusSec = 0;
  let morningCount = 0;
  let nightCount = 0;
  let focusCount = 0;

  const activeModes = new Set<string>();
  const activeDays = new Set<string>();

  sessions.forEach(s => {
    const isBreak = ['shortBreak', 'longBreak'].includes(s.mode);
    if (!isBreak) {
      totalInitiated++;
      activeModes.add(s.mode);
      if (s.completedAt) {
        activeDays.add(new Date(s.completedAt).toDateString());
      }
      if (s.completed !== false) {
        completedCount++;
        focusSec += s.durationSec;
      }
    }
    if (s.completedAt && !isBreak) {
      const hour = new Date(s.completedAt).getHours();
      if (hour >= 5 && hour < 12) morningCount++;
      if (hour >= 20 || hour < 4) nightCount++;
      focusCount++;
    }
  });

  const completionRate = totalInitiated > 0 ? completedCount / totalInitiated : 0;
  const breakCount = sessions.filter(s => ['shortBreak', 'longBreak'].includes(s.mode)).length;
  const breakRatio = focusCount > 0 ? breakCount / focusCount : 0;

  // Streak Calculation
  const uniqueDays = Array.from(activeDays).map(d => new Date(d).getTime());
  uniqueDays.sort((a, b) => b - a);
  let streak = 0;
  if (uniqueDays.length > 0) {
    const todayMs = new Date(new Date().toDateString()).getTime();
    const yesterdayMs = todayMs - 86400000;
    if (uniqueDays[0] === todayMs || uniqueDays[0] === yesterdayMs) {
      streak = 1;
      let expected = uniqueDays[0];
      for (let i = 1; i < uniqueDays.length; i++) {
        expected -= 86400000;
        if (uniqueDays[i] === expected) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  // --- HIDDEN WEIGHTED EVOLUTION SCORE ---
  let score = 0;

  // 1. Daily consistency: distinct active days (up to 60 days)
  const distinctDaysCount = activeDays.size;
  score += Math.min(60, distinctDaysCount) * 2.0;

  // 2. Streak stability:
  score += Math.min(20, streak) * 2.5;

  // 3. Completion quality:
  if (totalInitiated >= 5) {
    if (completionRate >= 0.9) score += 35;
    else if (completionRate >= 0.75) score += 15;
    else if (completionRate < 0.5) score -= 10; // penalty but can't lower max stage unlocked
  }

  // 4. Hours spent focused: (max 200 points, non-grindable curve)
  const totalHours = focusSec / 3600;
  score += Math.min(180, totalHours * 1.5);

  // 5. Mode diversity:
  score += activeModes.size * 6;

  // 6. Healthy Break Habits:
  score += Math.min(40, breakCount * 1.2);

  // 7. Milestone bonuses:
  try {
    const vaultState = VaultManager.loadState();
    const unlockedMilestonesCount = Object.keys(vaultState.unlockedIds || {}).length;
    score += Math.min(100, unlockedMilestonesCount * 5.0);
  } catch {}

  // 8. Legacy Cards bonuses:
  try {
    const legacyCardsCount = VaultManager.loadLegacyCards().length;
    score += Math.min(80, legacyCardsCount * 10.0);
  } catch {}

  // 9. Inactivity dampening:
  let inactivityDays = 0;
  if (uniqueDays.length > 0) {
    const diffMs = Date.now() - uniqueDays[0];
    inactivityDays = Math.floor(diffMs / 86400000);
    if (inactivityDays > 3) {
      const penalty = Math.min(50, (inactivityDays - 3) * 3);
      score -= penalty;
    }
  }

  // Ensure score is non-negative
  score = Math.max(0, Math.floor(score));

  // Determine current active stage based on current score
  let currentStage = DNA_STAGES[0];
  for (const st of DNA_STAGES) {
    if (score >= st.minScore) {
      currentStage = st;
    }
  }

  // Handle maxStageReached locally so stages are NEVER lost
  const savedDnaStr = localStorage.getItem('timerra_focus_dna_history');
  let maxStage = currentStage.level;
  let historyList: EvolutionRecord[] = [];

  if (savedDnaStr) {
    try {
      const parsed = JSON.parse(savedDnaStr);
      if (parsed.maxStageReached) maxStage = Math.max(maxStage, parsed.maxStageReached);
      if (parsed.history) historyList = parsed.history;
    } catch {}
  }

  // If our current calculated stage is lower than the max stage reached,
  // we cap the display stage at max stage reached OR allow it to look locked.
  // Wait, the requirement says "Previously unlocked DNA stages must NEVER be lost."
  // So the display stage level should be the MAXIMUM stage the user ever reached.
  if (currentStage.level < maxStage) {
    currentStage = DNA_STAGES.find(s => s.level === maxStage) || currentStage;
  }

  // Trigger history logging if new stage reached
  if (maxStage < currentStage.level || historyList.length === 0) {
    const alreadyLogged = historyList.some(h => h.stageLevel === currentStage.level);
    if (!alreadyLogged) {
      historyList.push({
        stageLevel: currentStage.level,
        stageName: currentStage.name,
        unlockedAt: Date.now()
      });
      maxStage = Math.max(maxStage, currentStage.level);
      
      // Save it
      localStorage.setItem('timerra_focus_dna_history', JSON.stringify({
        maxStageReached: maxStage,
        history: historyList
      }));
    }
  }

  // Growth Trend State
  let trend: 'surging' | 'stable' | 'crystallizing' | 'dormant' | 'dampened' = 'stable';
  let trendMsg = "Your Focus DNA is becoming more stable.";

  if (inactivityDays > 3) {
    trend = 'dampened';
    trendMsg = "The core is cold. Revitalize focus to restore kinetic speed.";
  } else if (streak >= 4) {
    trend = 'surging';
    trendMsg = "The Core is resonating with vibrant daily energy.";
  } else if (completionRate >= 0.9 && focusCount >= 3) {
    trend = 'crystallizing';
    trendMsg = "Your discipline has strengthened into high crystal precision.";
  } else if (focusCount === 0) {
    trend = 'dormant';
    trendMsg = "The Core is resting, waiting for the first alignment.";
  }

  const resonance = determineResonance(sessions);
  const traits = generateTraits(sessions);

  return {
    score,
    stage: currentStage,
    maxStageReached: maxStage,
    resonance,
    traits,
    history: historyList.sort((a, b) => b.unlockedAt - a.unlockedAt),
    growthTrend: trend,
    recentProgressMsg: trendMsg,
    behaviors: {
      totalSessions: totalInitiated,
      completionRate,
      morningRatio: focusCount > 0 ? morningCount / focusCount : 0,
      nightRatio: focusCount > 0 ? nightCount / focusCount : 0,
      streak,
      breakRatio,
      diversityScore: activeModes.size
    }
  };
}

// --- FOCUS CONSTELLATION STARS DATA ---
export const CONSTELLATION_STARS: Omit<StarPoint, 'isUnlocked'>[] = [
  {
    id: "star_core",
    name: "Alpha Core",
    category: "core",
    x: 500,
    y: 500,
    unlockCondition: "The foundational point of study.",
    description: "Your focus voyage begins here. This primary star anchors the cosmic sky, reflecting your initial pledge to offline discipline.",
  },
  {
    id: "star_dawn",
    name: "Solar Dawn",
    category: "temporal",
    x: 400,
    y: 350,
    unlockCondition: "Active Morning Habits (>= 2 sessions before noon).",
    description: "Sheds amber energy across the left quadrant, unlocked by morning discipline when the world's distraction is dormant.",
  },
  {
    id: "star_lunar",
    name: "Lunar Beacon",
    category: "temporal",
    x: 600,
    y: 350,
    unlockCondition: "Active Night Habits (>= 2 sessions after 8 PM).",
    description: "A cool silver star anchoring night studies. Shimmers when you consistently delve into concentration during abyssal hours.",
  },
  {
    id: "star_pristine",
    name: "Pristine Core",
    category: "discipline",
    x: 500,
    y: 650,
    unlockCondition: "First fully completed study session.",
    description: "Represents absolute execution. Unlocked upon completing your first entire Pomodoro or Focus mode without stopping.",
  },
  {
    id: "star_calm",
    name: "Calm Horizon",
    category: "habit",
    x: 320,
    y: 500,
    unlockCondition: "Unlock the Zen or Infinity Focus channels (>= 2 sessions).",
    description: "Pulsing in deep ocean cyan, this star records your affinity for boundless, timeless, and stress-free focus pathways.",
  },
  {
    id: "star_marathon",
    name: "Marathon Pillar",
    category: "habit",
    x: 680,
    y: 500,
    unlockCondition: "Complete a single session exceeding 45 minutes.",
    description: "A dense, massive star celebrating deep intellectual stamina. Unlocked through prolonged, uninterrupted concentration spans.",
  },
  {
    id: "star_ember",
    name: "Ember Spark",
    category: "discipline",
    x: 350,
    y: 680,
    unlockCondition: "Achieve a Focus Streak of 3 or more days.",
    description: "Glows with a warm orange ember pulse, commemorating consecutive daily alignments within the Timerra system.",
  },
  {
    id: "star_rest",
    name: "Oasis Beacon",
    category: "habit",
    x: 650,
    y: 680,
    unlockCondition: "Complete at least 3 restful break sessions.",
    description: "A soothing emerald-green star honoring cognitive rejuvenation and healthy self-care recovery intervals.",
  },
  {
    id: "star_legacy",
    name: "Legacy Apex",
    category: "achievement",
    x: 350,
    y: 220,
    unlockCondition: "Earn or generate your first collectible Legacy Card.",
    description: "Unlocks an exquisite violet region in the upper-left sky, marking the permanent sealing of your focus history into local memories.",
  },
  {
    id: "star_vault",
    name: "Vault Keystone",
    category: "achievement",
    x: 650,
    y: 220,
    unlockCondition: "Unlock 3 or more milestones in the Milestone Vault.",
    description: "A bright golden star honoring exceptional versatile accomplishments logged inside the secure offline vault.",
  },
  {
    id: "star_abyss",
    name: "Abyssal Focus",
    category: "discipline",
    x: 500,
    y: 320,
    unlockCondition: "Complete at least 2 rigorous Deep Focus study sessions.",
    description: "An incredibly deep, focused navy blue point, verifying your capacity to withstand extreme, quiet isolation work.",
  },
  {
    id: "star_singularity",
    name: "The Singularity",
    category: "core",
    x: 500,
    y: 150,
    unlockCondition: "Reach Focus DNA Stage V (Crystal Discipline).",
    description: "The ultimate peak of the central constellation spine. Blazing in pure crystal white light, reflecting absolute mastery.",
  },
  {
    id: "star_zenith",
    name: "Cosmic Zenith",
    category: "discipline",
    x: 500,
    y: 820,
    unlockCondition: "Accumulate 10 or more total focused study hours.",
    description: "The cosmic ground star anchoring the entire constellation sky. A brilliant giant star representing cumulative hard work.",
  }
];

// Connection lines layout
export const SKY_CONNECTIONS: Omit<SkyConnection, 'active'>[] = [
  { fromId: "star_core", toId: "star_dawn", pathStyle: "stroke-amber-500/35" },
  { fromId: "star_core", toId: "star_lunar", pathStyle: "stroke-purple-500/35" },
  { fromId: "star_core", toId: "star_pristine", pathStyle: "stroke-sky-400/35" },
  { fromId: "star_pristine", toId: "star_ember", pathStyle: "stroke-orange-500/35" },
  { fromId: "star_pristine", toId: "star_rest", pathStyle: "stroke-emerald-500/35" },
  { fromId: "star_dawn", toId: "star_legacy", pathStyle: "stroke-purple-500/30" },
  { fromId: "star_lunar", toId: "star_vault", pathStyle: "stroke-amber-500/30" },
  { fromId: "star_core", toId: "star_calm", pathStyle: "stroke-cyan-400/30" },
  { fromId: "star_core", toId: "star_marathon", pathStyle: "stroke-teal-400/30" },
  { fromId: "star_legacy", toId: "star_abyss", pathStyle: "stroke-sky-400/30" },
  { fromId: "star_vault", toId: "star_abyss", pathStyle: "stroke-indigo-400/30" },
  { fromId: "star_abyss", toId: "star_singularity", pathStyle: "stroke-white/40" },
  { fromId: "star_core", toId: "star_abyss", pathStyle: "stroke-blue-400/30" },
  { fromId: "star_ember", toId: "star_zenith", pathStyle: "stroke-orange-500/30" },
  { fromId: "star_rest", toId: "star_zenith", pathStyle: "stroke-emerald-500/30" },
];

// Constellation state resolver
export function getConstellationState(sessions: Session[], dnaState: FocusDnaState): { stars: StarPoint[]; connections: SkyConnection[] } {
  // Compute star unlock status
  let morningCount = 0;
  let nightCount = 0;
  let focusCount = 0;
  let totalMinutes = 0;
  let deepFocusCount = 0;
  let pomodoroCount = 0;
  let zenCount = 0;
  let breakCount = 0;
  let longestSession = 0;

  sessions.forEach(s => {
    const isBreak = ['shortBreak', 'longBreak'].includes(s.mode);
    if (!isBreak) {
      focusCount++;
      totalMinutes += s.durationSec / 60;
      if (s.durationSec > longestSession) longestSession = s.durationSec;
      if (s.mode === 'deepFocus') deepFocusCount++;
      if (s.mode === 'focus') pomodoroCount++;
      if (s.mode === 'zen' || s.mode === 'infinityFocus') zenCount++;
    } else {
      breakCount++;
    }

    if (s.completedAt && !isBreak) {
      const hour = new Date(s.completedAt).getHours();
      if (hour >= 5 && hour < 12) morningCount++;
      if (hour >= 20 || hour < 4) nightCount++;
    }
  });

  const milestonesCount = (() => {
    try {
      return Object.keys(VaultManager.loadState().unlockedIds || {}).length;
    } catch {
      return 0;
    }
  })();

  const cardsCount = (() => {
    try {
      return VaultManager.loadLegacyCards().length;
    } catch {
      return 0;
    }
  })();

  const totalFocusHours = (sessions.filter(s => !['shortBreak', 'longBreak'].includes(s.mode)).reduce((sum, s) => sum + s.durationSec, 0)) / 3600;

  // Resolve conditions
  const stars: StarPoint[] = CONSTELLATION_STARS.map(st => {
    let unlocked = false;
    switch (st.id) {
      case "star_core":
        unlocked = true; // Alpha star unlocked by default
        break;
      case "star_dawn":
        unlocked = morningCount >= 2 || dnaState.resonance.id === 'solar';
        break;
      case "star_lunar":
        unlocked = nightCount >= 2 || dnaState.resonance.id === 'lunar';
        break;
      case "star_pristine":
        unlocked = focusCount >= 1;
        break;
      case "star_calm":
        unlocked = zenCount >= 2 || dnaState.resonance.id === 'ocean' || dnaState.resonance.id === 'storm';
        break;
      case "star_marathon":
        unlocked = longestSession >= 45 * 60;
        break;
      case "star_ember":
        unlocked = dnaState.behaviors.streak >= 3 || dnaState.resonance.id === 'ember';
        break;
      case "star_rest":
        unlocked = breakCount >= 3 || dnaState.resonance.id === 'forest';
        break;
      case "star_legacy":
        unlocked = cardsCount >= 1;
        break;
      case "star_vault":
        unlocked = milestonesCount >= 3;
        break;
      case "star_abyss":
        unlocked = deepFocusCount >= 2;
        break;
      case "star_singularity":
        unlocked = dnaState.stage.level >= 5;
        break;
      case "star_zenith":
        unlocked = totalFocusHours >= 10;
        break;
    }

    return {
      ...st,
      isUnlocked: unlocked,
      unlockedAt: unlocked ? Date.now() - 3600000 : undefined // simulated unlock timestamp if unlocked
    };
  });

  // Resolve active connections
  const starMap = new Map<string, boolean>();
  stars.forEach(s => starMap.set(s.id, s.isUnlocked));

  const connections: SkyConnection[] = SKY_CONNECTIONS.map(conn => {
    const fromUnlocked = starMap.get(conn.fromId) || false;
    const toUnlocked = starMap.get(conn.toId) || false;
    return {
      ...conn,
      active: fromUnlocked && toUnlocked
    };
  });

  return { stars, connections };
}
