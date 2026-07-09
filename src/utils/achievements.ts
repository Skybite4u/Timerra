import { StudyLog, Achievement } from '../types';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your very first focus session.',
    badgeEmoji: '🌱',
    category: 'sessions',
    requirementText: '1 Focus Session'
  },
  {
    id: 'deep_work',
    title: 'Deep Focus',
    description: 'Complete a focus session of 45 minutes or more.',
    badgeEmoji: '🧠',
    category: 'duration',
    requirementText: '45+ Min Session'
  },
  {
    id: 'half_day',
    title: 'Pomodoro Master',
    description: 'Complete 4 focus sessions in a single day.',
    badgeEmoji: '🎯',
    category: 'sessions',
    requirementText: '4 Focus Sessions in 1 Day'
  },
  {
    id: 'power_user',
    title: 'Unstoppable',
    description: 'Complete 8 focus sessions in a single day.',
    badgeEmoji: '⚡',
    category: 'sessions',
    requirementText: '8 Focus Sessions in 1 Day'
  },
  {
    id: 'consistency_3',
    title: 'Habit Builder',
    description: 'Maintain a consecutive focus streak of 3 days.',
    badgeEmoji: '🔥',
    category: 'streaks',
    requirementText: '3-Day Focus Streak'
  },
  {
    id: 'consistency_7',
    title: 'Zen Master',
    description: 'Maintain a consecutive focus streak of 7 days.',
    badgeEmoji: '👑',
    category: 'streaks',
    requirementText: '7-Day Focus Streak'
  },
  {
    id: 'centurion',
    title: 'Focus Scholar',
    description: 'Accumulate a total of 500 minutes of focus time.',
    badgeEmoji: '📚',
    category: 'duration',
    requirementText: '500 Total Minutes'
  },
  {
    id: 'cloud_sync',
    title: 'Cloud Anchor',
    description: 'Securely sync your workspace logs with Google Drive E2EE.',
    badgeEmoji: '☁️',
    category: 'sync',
    requirementText: 'First Google Drive Sync'
  }
];

export function calculateStreak(logs: StudyLog[]): number {
  const focusLogs = logs.filter(log => log.mode === 'focus');
  if (focusLogs.length === 0) return 0;

  // Extract unique dates of focus sessions (local time zone YYYY-MM-DD)
  const uniqueDates = Array.from(new Set(focusLogs.map(log => {
    const d = new Date(log.timestamp);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }))).sort().reverse(); // Sort descending (newest first)

  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // If the user has not studied today or yesterday, streak is broken
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let currentCheckDate = new Date(uniqueDates[0] + 'T00:00:00'); // Ensure local time parsing

  // Iterate to find consecutive days
  for (let i = 0; i < 365; i++) {
    const yyyy = currentCheckDate.getFullYear();
    const mm = String(currentCheckDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentCheckDate.getDate()).padStart(2, '0');
    const expectedStr = `${yyyy}-${mm}-${dd}`;

    if (uniqueDates.includes(expectedStr)) {
      streak++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function checkNewAchievements(
  logs: StudyLog[],
  currentlyEarned: string[],
  hasSynced: boolean
): string[] {
  const earned = new Set<string>(currentlyEarned);
  const focusLogs = logs.filter(log => log.mode === 'focus');

  // 1. First Step
  if (focusLogs.length >= 1) {
    earned.add('first_step');
  }

  // 2. Deep Focus
  const hasDeepSession = focusLogs.some(log => log.durationMinutes >= 45);
  if (hasDeepSession) {
    earned.add('deep_work');
  }

  // Group by date to count completed pomodoros per day
  const sessionsPerDay: { [key: string]: number } = {};
  focusLogs.forEach(log => {
    sessionsPerDay[log.date] = (sessionsPerDay[log.date] || 0) + 1;
  });

  const maxSessionsInADay = Object.values(sessionsPerDay).reduce((max, val) => Math.max(max, val), 0);

  // 3. Pomodoro Master (4 in a day)
  if (maxSessionsInADay >= 4) {
    earned.add('half_day');
  }

  // 4. Unstoppable (8 in a day)
  if (maxSessionsInADay >= 8) {
    earned.add('power_user');
  }

  // 5. Total duration (500 minutes)
  const totalMinutes = focusLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  if (totalMinutes >= 500) {
    earned.add('centurion');
  }

  // 6. Streaks
  const currentStreak = calculateStreak(logs);
  if (currentStreak >= 3) {
    earned.add('consistency_3');
  }
  if (currentStreak >= 7) {
    earned.add('consistency_7');
  }

  // 7. Cloud Sync (E2EE)
  if (hasSynced) {
    earned.add('cloud_sync');
  }

  return Array.from(earned);
}
