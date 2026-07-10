import { TimerMode, TimerSettings } from '../types';

export type MilestoneRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Celestial';

export interface Milestone {
  id: string;
  name: string;
  description: string;
  category: 'orb' | 'capsule' | 'mood' | 'legacy' | 'energy' | 'mind' | 'balance' | 'summit' | 'relic' | 'vault';
  rarity: MilestoneRarity;
  xpAward: number;
  unlockedAt?: number; // timestamp when unlocked, undefined if locked
  secret?: boolean; // if true, hide description/name until unlocked
  progressCurrent?: number;
  progressTarget?: number;
}

export interface UserVaultState {
  unlockedIds: { [id: string]: number }; // id -> timestamp
  pinnedIds: string[]; // up to 6 ids pinned in showcase
  totalXp: number;
  level: number;
  favoriteMoodsLog: { [mood: string]: number }; // mood -> seconds listened
  subjectsLogged: string[];
}

export interface LegacyCard {
  id: string; // e.g. "card-0001"
  cardNumberStr: string; // e.g. "#0001"
  createdAt: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodLabel: string; // e.g., "July 2026 Focus Season"
  title: string; // e.g., "The Silent Builder"
  rarity: MilestoneRarity;
  
  // Stats
  focusHours: number;
  completedSessions: number;
  completedTasks: number;
  avgSessionMinutes: number;
  longestSessionMinutes: number;
  bestStreakDays: number;
  currentStreakDays: number;
  breakMinutes: number;
  favoriteFocusTime: string; // e.g. "Evening (5 PM - 9 PM)"
  favoriteMood: string;
  favoriteOrb: string;
  favoriteBackground: string;
  favoriteMusic: string;
  capsulesCreated: number;
  capsulesRestored: number;
  milestonesUnlockedCount: number;
  currentLevel: number;
  xpEarned: number;
  
  // Scores
  productivityScore: number;
  consistencyScore: number;
  balanceScore: number;
  recoveryScore: number;
  
  // AI Insights
  insight: string;
  dnaPattern: string; // unique string visual representation
  
  // Visual Customizations
  themeColors: {
    from: string;
    via?: string;
    to: string;
    text: string;
    border: string;
    glow: string;
  };
  
  // Metadata
  isPinned?: boolean;
  isFavorited?: boolean;
  isArchived?: boolean;
  isProtected?: boolean;
  linkedCapsuleId?: string; // linked to Timerra Capsule
}
