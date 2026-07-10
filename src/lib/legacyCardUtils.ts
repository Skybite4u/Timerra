import { Session, TimerSettings } from '../types';
import { LegacyCard, MilestoneRarity } from './vaultTypes';

export const LegacyCardUtils = {
  // Generate a fully computed card based on historical focus sessions
  generateCard(
    cardNumber: number,
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom',
    sessions: Session[],
    settings: TimerSettings,
    milestonesCount: number,
    level: number,
    totalXp: number,
    capsulesCreated: number,
    capsulesRestored: number
  ): LegacyCard {
    const id = `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cardNumberStr = `#${String(cardNumber).padStart(4, '0')}`;
    const completedAt = Date.now();

    // 1. Core aggregates
    const focusSessions = sessions.filter(s => ['focus', 'deepFocus', 'marathon', 'sprint'].includes(s.mode));
    const completedSessions = focusSessions.length;
    const focusSec = focusSessions.reduce((sum, s) => sum + s.durationSec, 0);
    const focusHours = parseFloat((focusSec / 3600).toFixed(1));
    const completedTasks = completedSessions; // mock complete tasks linked to sessions
    
    const breakSessions = sessions.filter(s => ['shortBreak', 'longBreak'].includes(s.mode));
    const breakMinutes = Math.floor(breakSessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);

    const avgSessionMinutes = completedSessions > 0 
      ? Math.floor((focusSec / completedSessions) / 60) 
      : 0;

    const longestSessionMinutes = sessions.length > 0 
      ? Math.floor(Math.max(...sessions.map(s => s.durationSec)) / 60) 
      : 0;

    // Streaks calculation
    const calculateStreak = (sess: Session[]) => {
      if (sess.length === 0) return 0;
      const days = sess.map(s => new Date(s.completedAt).toDateString());
      const uniqueDays = Array.from(new Set(days)).map(d => new Date(d).getTime());
      uniqueDays.sort((a, b) => b - a);
      
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
    const currentStreakDays = calculateStreak(sessions);
    const bestStreakDays = Math.max(currentStreakDays, 3); // minimum baseline for premium card simulation

    // Time of day calculation
    const timeOfDayCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    sessions.forEach(s => {
      const h = new Date(s.completedAt).getHours();
      if (h >= 5 && h < 12) timeOfDayCounts.morning++;
      else if (h >= 12 && h < 17) timeOfDayCounts.afternoon++;
      else if (h >= 17 && h < 22) timeOfDayCounts.evening++;
      else timeOfDayCounts.night++;
    });

    let favoriteFocusTime = 'Evening (5 PM - 9 PM)';
    let maxCount = timeOfDayCounts.evening;
    if (timeOfDayCounts.morning > maxCount) {
      favoriteFocusTime = 'Morning (5 AM - 12 PM)';
      maxCount = timeOfDayCounts.morning;
    }
    if (timeOfDayCounts.afternoon > maxCount) {
      favoriteFocusTime = 'Afternoon (12 PM - 5 PM)';
      maxCount = timeOfDayCounts.afternoon;
    }
    if (timeOfDayCounts.night > maxCount) {
      favoriteFocusTime = 'Midnight Hour (10 PM - 2 AM)';
      maxCount = timeOfDayCounts.night;
    }

    // Mood distribution
    const favoriteMood = settings.theme === 'midnight' ? 'Lo-fi Midnight' : 'Solar Calm';
    const favoriteOrb = settings.theme === 'cyber' ? 'Cyber Core' : 'Stellar Flame';
    const favoriteBackground = settings.theme === 'aurora' ? 'Northern Veil' : 'Deep Space';
    const favoriteMusic = 'Cosmic Wind';

    // 2. Score calculations (scale 0-100)
    const productivityScore = Math.min(100, Math.floor((focusHours * 3) + (completedSessions * 4) + 10));
    const consistencyScore = Math.min(100, Math.floor((currentStreakDays * 8) + (bestStreakDays * 4) + 30));
    const balanceScore = focusHours > 0 
      ? Math.min(100, Math.floor((breakMinutes / (focusHours * 60)) * 250 + 20)) 
      : 80;
    const recoveryScore = Math.min(100, Math.floor((breakMinutes * 1.5) + (breakSessions.length * 5) + 10));

    // 3. Determine custom Title based on habits
    let title = 'The Silent Builder';
    if (timeOfDayCounts.morning > 5) title = 'Morning Architect';
    else if (timeOfDayCounts.night > 5) title = 'Midnight Scholar';
    else if (longestSessionMinutes >= 90) title = 'Deep Thinker';
    else if (completedSessions >= 15 && breakMinutes >= 45) title = 'Balanced Mind';
    else if (currentStreakDays >= 10) title = 'Momentum Keeper';
    else if (focusHours >= 100) title = 'Orb Guardian';
    else if (longestSessionMinutes >= 180) title = 'Limit Breaker';
    else if (completedSessions >= 30) title = 'Focus Voyager';

    // 4. Evaluate card Rarity
    const rankScore = productivityScore + consistencyScore + balanceScore + recoveryScore;
    let rarity: MilestoneRarity = 'Common';
    if (rankScore >= 350) rarity = 'Celestial';
    else if (rankScore >= 280) rarity = 'Mythic';
    else if (rankScore >= 220) rarity = 'Legendary';
    else if (rankScore >= 150) rarity = 'Epic';
    else if (rankScore >= 80) rarity = 'Rare';

    // 5. Build personalized AI Insight Summary
    let insight = `This season, you built steady focus rhythm. Your sessions averaged ${avgSessionMinutes} minutes of deep work. Keep nurturing your balance between active hours and restorative intervals!`;
    if (title === 'Midnight Scholar') {
      insight = `Your productivity flourishes under the cover of night. You logged significant study segments during late hours. Remember to schedule recovery periods to safeguard your energetic focus flow.`;
    } else if (title === 'Morning Architect') {
      insight = `You are a pristine early-riser. Your morning hours represent your highest mental peak, executing complex tasks with zero lag. Establish this peak as your primary anchor.`;
    } else if (title === 'Deep Thinker' || title === 'Limit Breaker') {
      insight = `You possess immense cognitive endurance. Compounding sessions of over ${longestSessionMinutes} minutes means you can enter advanced levels of flow. Supplement this with structured breaks to prevent burnout.`;
    } else if (title === 'Balanced Mind') {
      insight = `Remarkable equilibrium. You have integrated focus intervals and mindful breaks at a pristine golden ratio. This healthy productivity style will sustain your mental fortress forever.`;
    }

    // 6. Theme colors mapping
    const themeColors = this.getThemeColors(rarity);

    // 7. Dynamic DNA Pattern String (points for polygonal canvas)
    // Points represent: [Prod, Consist, Balance, Recovery, Level, Milestones] normalized
    const dnaPoints = [
      Math.floor(productivityScore),
      Math.floor(consistencyScore),
      Math.floor(balanceScore),
      Math.floor(recoveryScore),
      Math.min(100, level * 5),
      Math.min(100, milestonesCount * 8)
    ];
    const dnaPattern = dnaPoints.join(',');

    const periodLabel = this.getPeriodLabel(period);

    return {
      id,
      cardNumberStr,
      createdAt: completedAt,
      period,
      periodLabel,
      title,
      rarity,
      focusHours,
      completedSessions,
      completedTasks,
      avgSessionMinutes,
      longestSessionMinutes,
      bestStreakDays,
      currentStreakDays,
      breakMinutes,
      favoriteFocusTime,
      favoriteMood,
      favoriteOrb,
      favoriteBackground,
      favoriteMusic,
      capsulesCreated,
      capsulesRestored,
      milestonesUnlockedCount: milestonesCount,
      currentLevel: level,
      xpEarned: completedSessions * 250,
      productivityScore,
      consistencyScore,
      balanceScore,
      recoveryScore,
      insight,
      dnaPattern,
      themeColors
    };
  },

  getPeriodLabel(period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'): string {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = months[d.getMonth()];
    const currentYear = d.getFullYear();

    switch (period) {
      case 'weekly':
        return `Week ${Math.ceil(d.getDate() / 7)} of ${currentMonth} Focus Season`;
      case 'monthly':
        return `${currentMonth} ${currentYear} Focus Cycle`;
      case 'quarterly':
        const q = Math.ceil((d.getMonth() + 1) / 3);
        return `Quarter Q${q} ${currentYear} Solstice Season`;
      case 'yearly':
        return `Yearly Chronology ${currentYear}`;
      case 'custom':
        return `Decentralized Snapshot Custom Session`;
    }
  },

  getThemeColors(rarity: MilestoneRarity) {
    switch (rarity) {
      case 'Common':
        return {
          from: 'from-slate-800',
          via: 'via-slate-900',
          to: 'to-slate-950',
          text: 'text-slate-400',
          border: 'border-slate-700/30',
          glow: 'rgba(100,116,139,0.15)'
        };
      case 'Rare':
        return {
          from: 'from-blue-900/90',
          via: 'via-indigo-950/90',
          to: 'to-black',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
          glow: 'rgba(59,130,246,0.25)'
        };
      case 'Epic':
        return {
          from: 'from-purple-900/90',
          via: 'via-fuchsia-950/95',
          to: 'to-black',
          text: 'text-purple-400',
          border: 'border-purple-500/25',
          glow: 'rgba(168,85,247,0.3)'
        };
      case 'Legendary':
        return {
          from: 'from-amber-900/85',
          via: 'via-[#261502]',
          to: 'to-black',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          glow: 'rgba(245,158,11,0.4)'
        };
      case 'Mythic':
        return {
          from: 'from-rose-950/90',
          via: 'via-[#200310]',
          to: 'to-black',
          text: 'text-rose-400',
          border: 'border-rose-500/35',
          glow: 'rgba(244,63,94,0.5)'
        };
      case 'Celestial':
        return {
          from: 'from-[#05283e]/90',
          via: 'via-[#0a071d]/95',
          to: 'to-[#010408]',
          text: 'text-cyan-300',
          border: 'border-cyan-400/40',
          glow: 'rgba(34,211,238,0.6)'
        };
    }
  }
};
