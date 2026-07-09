export type TimerMode = 'focus' | 'short_break' | 'long_break';
export type ClockStyle = 'minimalist' | 'circular' | 'flip';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface StudyLog {
  id: string;
  userId: string;
  durationMinutes: number;
  timestamp: number;
  date: string; // format: YYYY-MM-DD
  mode: TimerMode;
  notes?: string;
  subject?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeEmoji: string;
  category: 'sessions' | 'duration' | 'streaks' | 'sync';
  requirementText: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
}

export interface BackgroundConfig {
  type: 'gradient' | 'aurora' | 'particles' | 'rain' | 'snow' | 'sakura' | 'stars' | 'galaxy' | 'clouds' | 'fireflies' | 'shapes' | 'image' | 'video';
  presetId: string;
  opacity: number; // 0 to 100
  blur: number; // 0 to 24 (px)
  brightness: number; // 0 to 100
  darkOverlay: number; // 0 to 100 (opacity %)
  zoom: number; // 100 to 150
  position: string; // 'center' | 'top' | 'bottom' | 'left' | 'right'
  animationSpeed: number; // 0.1 to 3
  loop: boolean;
  muted: boolean;
  customFileBase64?: string; // Stored in DB
  customFileName?: string;
  customFileType?: string;
}

export interface BackupData {
  logs: StudyLog[];
  pomodoroGoal: number;
  completedToday: number;
  updatedAt: number;
  earnedAchievements?: string[];
  streak?: number;
  tasks?: Task[];
  backgroundConfig?: BackgroundConfig;
}
