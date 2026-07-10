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
export type ThemeName = "blue" | "purple" | "emerald" | "orange" | "red" | "cyber" | "midnight" | "aurora";

export interface TimerSettings {
  focusMinutes: number;          // default 25
  shortBreakMinutes: number;     // default 5
  longBreakMinutes: number;      // default 15
  cyclesBeforeLongBreak: number; // default 4
  autoAdvance: boolean;          // default true
  tickSound: boolean;            // default false
  theme: ThemeName;              // default "blue"
  subject: string;               // default "Deep Work"
}

export interface Session {
  id?: number;
  mode: TimerMode;
  subject: string;
  durationSec: number;
  completedAt: number; // epoch ms
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
