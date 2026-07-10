import { Session, TimerSettings } from '../types';
import { Milestone, UserVaultState, LegacyCard } from './vaultTypes';
import { INITIAL_MILESTONES } from './vaultData';

const LOCAL_STORAGE_KEY = 'timerra_vault_state_v1';
const CARDS_LOCAL_STORAGE_KEY = 'timerra_legacy_cards_v1';

const defaultVaultState: UserVaultState = {
  unlockedIds: {},
  pinnedIds: [],
  totalXp: 0,
  level: 1,
  favoriteMoodsLog: {},
  subjectsLogged: []
};

export const VaultManager = {
  loadState(): UserVaultState {
    if (typeof window === 'undefined') return defaultVaultState;
    const str = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!str) return defaultVaultState;
    try {
      const parsed = JSON.parse(str);
      return { ...defaultVaultState, ...parsed };
    } catch {
      return defaultVaultState;
    }
  },

  saveState(state: UserVaultState) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  },

  calculateLevelAndXp(totalXp: number) {
    let level = 1;
    let tempXp = totalXp;
    let xpNeeded = level * 500;
    
    while (tempXp >= xpNeeded && level < 100) {
      tempXp -= xpNeeded;
      level++;
      xpNeeded = level * 500;
    }
    
    return {
      level,
      xpInLevel: Math.floor(tempXp),
      xpNeededForNext: xpNeeded,
      percent: Math.min(100, Math.floor((tempXp / xpNeeded) * 100))
    };
  },

  // Check and unlock milestones based on current historical statistics.
  // Returns any newly unlocked milestones that were NOT previously unlocked.
  checkNewMilestones(
    sessions: Session[],
    settings: TimerSettings,
    capsulesCount: number,
    numBackupExports: number,
    numBackupRestores: number,
    moodStats: { [mood: string]: number }
  ): { newlyUnlocked: Milestone[]; updatedState: UserVaultState } {
    const state = this.loadState();
    const newlyUnlocked: Milestone[] = [];
    const now = Date.now();

    // 1. Compute common statistics for checks
    const totalSessionsCount = sessions.length;
    const focusSessions = sessions.filter(s => s.mode === 'focus');
    const completedFocusCount = focusSessions.length;
    const totalFocusSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
    const totalFocusHours = totalFocusSec / 3600;
    const totalBreakSec = sessions.filter(s => ['shortBreak', 'longBreak'].includes(s.mode)).reduce((sum, s) => sum + s.durationSec, 0);

    // Calculate longest single session
    const longestSessionMinutes = sessions.length > 0 
      ? Math.max(...sessions.map(s => s.durationSec)) / 60 
      : 0;

    // Subjects custom count
    const uniqueSubjects = Array.from(new Set(sessions.map(s => s.subject)));
    const customSubjectsCount = uniqueSubjects.filter(sub => !['Deep Work', 'Coding', 'Research', 'Design', 'Reading', 'Writing'].includes(sub)).length;

    // Streaks calculation
    const calculateStreak = (sess: Session[]) => {
      if (sess.length === 0) return 0;
      const days = sess.map(s => new Date(s.completedAt).toDateString());
      const uniqueDays = Array.from(new Set(days)).map(d => new Date(d).getTime());
      uniqueDays.sort((a, b) => b - a); // descending order
      
      let streak = 0;
      const todayMs = new Date(new Date().toDateString()).getTime();
      const yesterdayMs = todayMs - 86400000;
      
      if (uniqueDays[0] !== todayMs && uniqueDays[0] !== yesterdayMs) return 0;
      
      let currentExpected = uniqueDays[0];
      for (let i = 0; i < uniqueDays.length; i++) {
        if (uniqueDays[i] === currentExpected) {
          streak++;
          currentExpected -= 86400000;
        } else {
          break;
        }
      }
      return streak;
    };
    const currentStreak = calculateStreak(sessions);

    // Check each milestone
    INITIAL_MILESTONES.forEach(m => {
      // If already unlocked, skip
      if (state.unlockedIds[m.id]) return;

      let isEligible = false;
      let progress = 0;

      switch (m.id) {
        // --- Orb Journey ---
        case 'orb_awakening':
          isEligible = completedFocusCount >= 1;
          progress = completedFocusCount;
          break;
        case 'orb_resonance':
          isEligible = completedFocusCount >= 10;
          progress = completedFocusCount;
          break;
        case 'orb_harmony':
          isEligible = completedFocusCount >= 25;
          progress = completedFocusCount;
          break;
        case 'orb_ascension':
          isEligible = completedFocusCount >= 50;
          progress = completedFocusCount;
          break;
        case 'orb_fusion':
          isEligible = completedFocusCount >= 100;
          progress = completedFocusCount;
          break;
        case 'orb_nova':
          isEligible = totalFocusHours >= 100;
          progress = Math.floor(totalFocusHours);
          break;
        case 'orb_eclipse':
          isEligible = totalFocusHours >= 250;
          progress = Math.floor(totalFocusHours);
          break;
        case 'orb_infinity':
          isEligible = totalFocusHours >= 500;
          progress = Math.floor(totalFocusHours);
          break;
        case 'orb_singularity':
          isEligible = totalFocusHours >= 1000;
          progress = Math.floor(totalFocusHours);
          break;

        // --- Capsule Mastery ---
        case 'capsule_first':
          isEligible = capsulesCount >= 1 || numBackupExports >= 1;
          progress = capsulesCount + numBackupExports;
          break;
        case 'capsule_export':
          isEligible = numBackupExports >= 1;
          progress = numBackupExports;
          break;
        case 'capsule_restore':
          isEligible = numBackupRestores >= 1;
          progress = numBackupRestores;
          break;
        case 'capsule_integrity':
          isEligible = numBackupRestores >= 1 || numBackupExports >= 1; // simulation of integrity check
          progress = 1;
          break;
        case 'capsule_cross_device':
          isEligible = numBackupRestores >= 1;
          progress = numBackupRestores;
          break;
        case 'capsule_archivist':
          isEligible = capsulesCount >= 5;
          progress = capsulesCount;
          break;
        case 'capsule_guardian':
          isEligible = capsulesCount >= 1 && totalSessionsCount >= 10; // saved files active
          progress = totalSessionsCount;
          break;
        case 'capsule_architect':
          isEligible = capsulesCount >= 10;
          progress = capsulesCount;
          break;
        case 'capsule_master':
          isEligible = capsulesCount >= 25;
          progress = capsulesCount;
          break;

        // --- Mood Explorer ---
        case 'mood_first':
          const totalMoodMin = Object.values(moodStats).reduce((sum, v) => sum + v, 0) / 60;
          isEligible = totalMoodMin >= 15;
          progress = Math.floor(totalMoodMin);
          break;
        case 'mood_rain':
          const rainMin = (moodStats['rain'] || 0) / 60;
          isEligible = rainMin >= 120;
          progress = Math.floor(rainMin);
          break;
        case 'mood_galaxy':
          const cosmicMin = (moodStats['cosmic'] || 0) / 60;
          isEligible = cosmicMin >= 120;
          progress = Math.floor(cosmicMin);
          break;
        case 'mood_ocean':
          const wavesMin = (moodStats['waves'] || 0) / 60;
          isEligible = wavesMin >= 120;
          progress = Math.floor(wavesMin);
          break;
        case 'mood_forest':
          const birdsMin = (moodStats['birds'] || 0) / 60;
          isEligible = birdsMin >= 120;
          progress = Math.floor(birdsMin);
          break;
        case 'mood_aurora':
          const auroraMin = (moodStats['aurora'] || 0) / 60;
          isEligible = auroraMin >= 120;
          progress = Math.floor(auroraMin);
          break;
        case 'mood_cyber':
          const loFiMin = (moodStats['lofi'] || 0) / 60;
          isEligible = loFiMin >= 300;
          progress = Math.floor(loFiMin);
          break;
        case 'mood_zen':
          const zenMin = (moodStats['zen'] || 0) / 60;
          isEligible = zenMin >= 300;
          progress = Math.floor(zenMin);
          break;
        case 'mood_campfire':
          const fireMin = (moodStats['fire'] || 0) / 60;
          isEligible = fireMin >= 300;
          progress = Math.floor(fireMin);
          break;
        case 'mood_moonlight':
          const nightMin = (moodStats['night'] || 0) / 60;
          isEligible = nightMin >= 600;
          progress = Math.floor(nightMin);
          break;
        case 'mood_master':
          const distinctMoodsUsed = Object.keys(moodStats).filter(k => moodStats[k] > 60).length; // at least 1 min
          isEligible = distinctMoodsUsed >= 9;
          progress = distinctMoodsUsed;
          break;

        // --- Focus Legacy ---
        case 'legacy_step':
          isEligible = totalFocusSec >= 300; // 5 mins
          progress = Math.floor(totalFocusSec / 60);
          break;
        case 'legacy_momentum':
          // Check if there's any calendar day with >= 4 sessions
          const sessionsPerDay: { [date: string]: number } = {};
          sessions.forEach(s => {
            const dateStr = new Date(s.completedAt).toDateString();
            sessionsPerDay[dateStr] = (sessionsPerDay[dateStr] || 0) + 1;
          });
          const maxSessionsInADay = Object.keys(sessionsPerDay).length > 0 ? Math.max(...Object.values(sessionsPerDay)) : 0;
          isEligible = maxSessionsInADay >= 4;
          progress = maxSessionsInADay;
          break;
        case 'legacy_flow':
          isEligible = longestSessionMinutes >= 25;
          progress = Math.floor(longestSessionMinutes);
          break;
        case 'legacy_current':
          const deepFocusSec = sessions.filter(s => s.mode === 'deepFocus').reduce((sum, s) => sum + s.durationSec, 0);
          isEligible = deepFocusSec >= 10800; // 3 hours
          progress = Math.floor(deepFocusSec / 60);
          break;
        case 'legacy_silent':
          isEligible = settings.tickSound && completedFocusCount >= 1;
          progress = settings.tickSound ? 1 : 0;
          break;
        case 'legacy_endurance':
          const marathonSessions = sessions.filter(s => s.mode === 'marathon' && s.durationSec >= 3600);
          isEligible = marathonSessions.length >= 1;
          progress = marathonSessions.length;
          break;
        case 'legacy_limit_break':
          isEligible = longestSessionMinutes >= 240; // 4 hours
          progress = Math.floor(longestSessionMinutes);
          break;
        case 'legacy_focus':
          isEligible = completedFocusCount >= 100;
          progress = completedFocusCount;
          break;
        case 'legacy_living_legend':
          isEligible = completedFocusCount >= 500;
          progress = completedFocusCount;
          break;
        case 'legacy_beyond_time':
          isEligible = completedFocusCount >= 1000;
          progress = completedFocusCount;
          break;

        // --- Energy Flow ---
        case 'energy_morning':
          isEligible = sessions.some(s => {
            const hour = new Date(s.completedAt).getHours();
            return hour >= 5 && hour < 9;
          });
          progress = isEligible ? 1 : 0;
          break;
        case 'energy_evening':
          isEligible = sessions.some(s => {
            const hour = new Date(s.completedAt).getHours();
            return hour >= 17 && hour < 21;
          });
          progress = isEligible ? 1 : 0;
          break;
        case 'energy_night':
          isEligible = sessions.some(s => {
            const hour = new Date(s.completedAt).getHours();
            return hour >= 22 || hour < 2;
          });
          progress = isEligible ? 1 : 0;
          break;
        case 'energy_weekend':
          const weekendSessions = sessions.filter(s => {
            const day = new Date(s.completedAt).getDay();
            return day === 0 || day === 6; // Sun = 0, Sat = 6
          });
          isEligible = weekendSessions.length >= 5;
          progress = weekendSessions.length;
          break;
        case 'energy_recovery':
          const breakCount = sessions.filter(s => s.mode === 'shortBreak').length;
          isEligible = breakCount >= 10;
          progress = breakCount;
          break;
        case 'energy_rhythm':
          // Check if any single day has >= 4 focus and >= 4 break sessions
          const countsPerDay: { [date: string]: { f: number; b: number } } = {};
          sessions.forEach(s => {
            const d = new Date(s.completedAt).toDateString();
            if (!countsPerDay[d]) countsPerDay[d] = { f: 0, b: 0 };
            if (s.mode === 'focus' || s.mode === 'deepFocus') countsPerDay[d].f++;
            else if (s.mode === 'shortBreak' || s.mode === 'longBreak') countsPerDay[d].b++;
          });
          isEligible = Object.values(countsPerDay).some(day => day.f >= 4 && day.b >= 4);
          progress = isEligible ? 1 : 0;
          break;

        // --- Mind Evolution ---
        case 'mind_zero_distraction':
          isEligible = completedFocusCount >= 1; // standard focus completed without manual cancellation
          progress = completedFocusCount;
          break;
        case 'mind_perfect_week':
          isEligible = currentStreak >= 7;
          progress = currentStreak;
          break;
        case 'mind_consistent':
          const distinctDays = new Set(sessions.map(s => new Date(s.completedAt).toDateString())).size;
          isEligible = distinctDays >= 15;
          progress = distinctDays;
          break;
        case 'mind_fortress':
          // Sessions within the current calendar week
          const nowMs = Date.now();
          const oneWeekAgoMs = nowMs - 7 * 86400000;
          const weeklySessions = sessions.filter(s => s.completedAt >= oneWeekAgoMs);
          isEligible = weeklySessions.length >= 10;
          progress = weeklySessions.length;
          break;
        case 'mind_calm_focus':
          const oneWeekAgoMs2 = Date.now() - 7 * 86400000;
          const weeklyHours = sessions.filter(s => s.completedAt >= oneWeekAgoMs2 && s.mode === 'focus').reduce((sum, s) => sum + s.durationSec, 0) / 3600;
          isEligible = weeklyHours >= 15;
          progress = Math.floor(weeklyHours);
          break;
        case 'mind_discipline':
          isEligible = currentStreak >= 30;
          progress = currentStreak;
          break;

        // --- Balance Path ---
        case 'balance_healthy':
          const shortBreaks = sessions.filter(s => s.mode === 'shortBreak').length;
          isEligible = shortBreaks >= 1;
          progress = shortBreaks;
          break;
        case 'balance_no_burnout':
          const longBreaks = sessions.filter(s => s.mode === 'longBreak').length;
          isEligible = longBreaks >= 1;
          progress = longBreaks;
          break;
        case 'balance_perfect_ratio':
          const activeRatio = totalFocusSec > 0 ? (totalBreakSec / totalFocusSec) : 0;
          isEligible = activeRatio >= 0.25 && totalFocusSec >= 7200; // at least 2 hours of focus and 25% breaks
          progress = isEligible ? 1 : 0;
          break;
        case 'balance_recovery_complete':
          const totalBreakMins = totalBreakSec / 60;
          isEligible = totalBreakMins >= 15;
          progress = Math.floor(totalBreakMins);
          break;
        case 'balance_well_rested':
          const oneWeekAgoMs3 = Date.now() - 7 * 86400000;
          const weeklyLongBreaks = sessions.filter(s => s.completedAt >= oneWeekAgoMs3 && s.mode === 'longBreak').length;
          isEligible = weeklyLongBreaks >= 3;
          progress = weeklyLongBreaks;
          break;
        case 'balance_refresh':
          const breakHours = totalBreakSec / 3600;
          isEligible = breakHours >= 5;
          progress = Math.floor(breakHours);
          break;

        // --- Summit Journey ---
        case 'summit_base_camp':
          isEligible = settings.cyclesBeforeLongBreak > 0;
          progress = 1;
          break;
        case 'summit_camp_one':
          isEligible = totalFocusHours >= 5;
          progress = Math.floor(totalFocusHours);
          break;
        case 'summit_camp_two':
          isEligible = totalFocusHours >= 15;
          progress = Math.floor(totalFocusHours);
          break;
        case 'summit_camp_three':
          isEligible = totalFocusHours >= 30;
          progress = Math.floor(totalFocusHours);
          break;
        case 'summit_push':
          // Focus 3 hours in a single day
          const focusPerDay: { [date: string]: number } = {};
          sessions.forEach(s => {
            if (s.mode === 'focus' || s.mode === 'deepFocus') {
              const dStr = new Date(s.completedAt).toDateString();
              focusPerDay[dStr] = (focusPerDay[dStr] || 0) + s.durationSec;
            }
          });
          const maxSecInDay = Object.keys(focusPerDay).length > 0 ? Math.max(...Object.values(focusPerDay)) : 0;
          isEligible = maxSecInDay >= 10800; // 3 hours
          progress = Math.floor(maxSecInDay / 60);
          break;
        case 'summit_reached':
          isEligible = totalFocusHours >= 50;
          progress = Math.floor(totalFocusHours);
          break;
        case 'summit_above_clouds':
          isEligible = totalFocusHours >= 150;
          progress = Math.floor(totalFocusHours);
          break;

        // --- Hidden Relics ---
        case 'relic_unknown':
          isEligible = customSubjectsCount >= 1;
          progress = customSubjectsCount;
          break;
        case 'relic_silent':
          // simulation of focus with volume slider = 0 or muted
          isEligible = false; // secret, will trigger on user action
          break;
        case 'relic_ghost':
          isEligible = sessions.some(s => {
            const h = new Date(s.completedAt).getHours();
            return h >= 2 && h < 4;
          });
          progress = isEligible ? 1 : 0;
          break;
        case 'relic_midnight':
          isEligible = sessions.some(s => {
            const date = new Date(s.completedAt);
            const h = date.getHours();
            const m = date.getMinutes();
            return (h === 23 && m >= 55) || (h === 0 && m <= 5);
          });
          progress = isEligible ? 1 : 0;
          break;
        case 'relic_hidden_capsule':
          isEligible = false; // secret, will trigger on specific capsule actions
          break;
        case 'relic_wanderer':
          isEligible = false; // secret, will trigger in App.tsx mode switches
          break;
        case 'relic_lost_freq':
          isEligible = false; // secret
          break;
        case 'relic_infinity_walker':
          isEligible = longestSessionMinutes >= 180 && sessions.some(s => s.mode === 'infinityFocus' || s.mode === 'stopwatch');
          progress = Math.floor(longestSessionMinutes);
          break;

        // --- Legendary Vault ---
        case 'vault_keeper':
          isEligible = state.level >= 20;
          progress = state.level;
          break;
        case 'vault_legend':
          isEligible = numBackupExports >= 10;
          progress = numBackupExports;
          break;
        case 'vault_emperor':
          isEligible = state.level >= 50;
          progress = state.level;
          break;
        case 'vault_architect':
          isEligible = uniqueSubjects.length >= 10;
          progress = uniqueSubjects.length;
          break;
        case 'vault_guardian':
          isEligible = totalFocusHours >= 100 && sessions.length >= 30; // mock consecutive active
          progress = sessions.length;
          break;
        case 'vault_last_milestone':
          isEligible = state.level >= 100;
          progress = state.level;
          break;
      }

      if (isEligible) {
        state.unlockedIds[m.id] = now;
        state.totalXp += m.xpAward;
        
        // Form a copy of unlocked milestone with actual unlocked timestamp
        const unlockedMilestone = { ...m, unlockedAt: now };
        newlyUnlocked.push(unlockedMilestone);
      }
    });

    // Re-calculate user level
    const levelStats = this.calculateLevelAndXp(state.totalXp);
    state.level = levelStats.level;

    this.saveState(state);

    return {
      newlyUnlocked,
      updatedState: state
    };
  },

  // Manual trigger for a specific milestone (for events like Secret achievements)
  triggerUnlock(milestoneId: string): { unlocked: Milestone | null; updatedState: UserVaultState } {
    const state = this.loadState();
    if (state.unlockedIds[milestoneId]) {
      return { unlocked: null, updatedState: state };
    }

    const milestone = INITIAL_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone) {
      return { unlocked: null, updatedState: state };
    }

    const now = Date.now();
    state.unlockedIds[milestoneId] = now;
    state.totalXp += milestone.xpAward;
    
    const levelStats = this.calculateLevelAndXp(state.totalXp);
    state.level = levelStats.level;

    this.saveState(state);

    return {
      unlocked: { ...milestone, unlockedAt: now },
      updatedState: state
    };
  },

  // Pin a milestone in showcase
  pinMilestone(id: string): UserVaultState {
    const state = this.loadState();
    if (!state.unlockedIds[id]) return state; // can't pin locked milestones
    if (state.pinnedIds.includes(id)) return state; // already pinned

    // Max 6 pinned
    if (state.pinnedIds.length >= 6) {
      state.pinnedIds = [...state.pinnedIds.slice(1), id];
    } else {
      state.pinnedIds.push(id);
    }

    this.saveState(state);
    return state;
  },

  // Unpin a milestone
  unpinMilestone(id: string): UserVaultState {
    const state = this.loadState();
    state.pinnedIds = state.pinnedIds.filter(pid => pid !== id);
    this.saveState(state);
    return state;
  },

  // Add custom reward XP manually
  awardCustomXp(xp: number, reason: string): { xpAwarded: number; leveledUp: boolean; updatedState: UserVaultState } {
    const state = this.loadState();
    const oldLevel = state.level;
    
    state.totalXp += xp;
    
    const levelStats = this.calculateLevelAndXp(state.totalXp);
    state.level = levelStats.level;
    
    this.saveState(state);
    
    return {
      xpAwarded: xp,
      leveledUp: state.level > oldLevel,
      updatedState: state
    };
  },

  // --- LEGACY CARDS STORAGE AND HANDLING ---
  loadLegacyCards(): LegacyCard[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(CARDS_LOCAL_STORAGE_KEY);
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  },

  saveLegacyCards(cards: LegacyCard[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CARDS_LOCAL_STORAGE_KEY, JSON.stringify(cards));
  },

  addLegacyCard(card: LegacyCard) {
    const cards = this.loadLegacyCards();
    // Prevent duplicate IDs
    const filtered = cards.filter(c => c.id !== card.id);
    filtered.push(card);
    this.saveLegacyCards(filtered);
  },

  deleteLegacyCard(id: string) {
    const cards = this.loadLegacyCards();
    const filtered = cards.filter(c => c.id !== id || c.isProtected); // protect flag prevents deletion
    this.saveLegacyCards(filtered);
  },

  toggleFavoriteCard(id: string): LegacyCard[] {
    const cards = this.loadLegacyCards();
    const updated = cards.map(c => c.id === id ? { ...c, isFavorited: !c.isFavorited } : c);
    this.saveLegacyCards(updated);
    return updated;
  },

  togglePinCard(id: string): LegacyCard[] {
    const cards = this.loadLegacyCards();
    const updated = cards.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c);
    this.saveLegacyCards(updated);
    return updated;
  },

  toggleProtectCard(id: string): LegacyCard[] {
    const cards = this.loadLegacyCards();
    const updated = cards.map(c => c.id === id ? { ...c, isProtected: !c.isProtected } : c);
    this.saveLegacyCards(updated);
    return updated;
  },

  linkCardToCapsule(id: string, capsuleId: string): LegacyCard[] {
    const cards = this.loadLegacyCards();
    const updated = cards.map(c => c.id === id ? { ...c, linkedCapsuleId: capsuleId } : c);
    this.saveLegacyCards(updated);
    return updated;
  }
};
