export type TimerMode = 
  | "focus"          // Timerra Pomodoro (Solar Orb)
  | "stopwatch"      // Infinity Pulse (Endless)
  | "deepFocus"      // Crystal Core (Calm)
  | "infinityFocus"  // Galaxy Core (Stars)
  | "shortBreak"     // Cloud Nest (Relaxing)
  | "longBreak"      // Moon Core (Night)
  | "sprint"         // Rocket Engine (Fast)
  | "marathon"       // Ancient Library (Warm)
  | "zen";           // Japanese Zen Garden (Peaceful)
export type TimerStatus = "idle" | "running" | "paused" | "completed";
export type ThemeName = "blue" | "purple" | "emerald" | "orange" | "red" | "cyber" | "midnight" | "aurora" | "custom";

export interface TimerSettings {
  focusMinutes: number;          // default 25
  shortBreakMinutes: number;     // default 5
  longBreakMinutes: number;      // default 15
  cyclesBeforeLongBreak: number; // default 4
  autoAdvance: boolean;          // default true
  tickSound: boolean;            // default false
  tickVolume?: number;           // default 0.5 (Ambient Tick Intensity)
  theme: ThemeName;              // default "blue"
  subject: string;               // default "Deep Work"
  autoDim?: boolean;             // default true
  syncWithSystem?: boolean;      // default false
  dailyGoalHours?: number;       // default 4
  focusReminderTime?: string;    // default undefined / None
  customTheme?: {
    primary: string;
    accent: string;
    bgFrom: string;
    bgTo: string;
  };
}

export interface Session {
  id?: number;
  mode: TimerMode;
  subject: string;
  durationSec: number;
  completedAt: number; // epoch ms
  
  // Expanded Session History fields
  startTime?: number; // epoch ms
  endTime?: number; // epoch ms
  actualDurationSec?: number;
  plannedDurationSec?: number;
  completed?: boolean;
  skipped?: boolean;
  stopped?: boolean;
  cancelled?: boolean;
  goal?: string;
  notes?: string;
  mood?: 'Focused' | 'Calm' | 'Tired' | 'Distracted' | 'Energetic' | string;
  orbTheme?: string;
  device?: string;
  date?: string; // YYYY-MM-DD
  week?: string; // e.g., "Week 28"
  month?: string; // e.g., "July"
}

export interface BackupPayload {
  app: "Timerra";
  version: 1;
  exportedAt: number;
  settings: TimerSettings;
  sessions: Session[];
  subjects: string[];
}

export interface EncryptedBackupFile {
  app: "Timerra";
  version: 1;
  encrypted: true;
  algo: "AES-GCM";
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string; // all base64
}
