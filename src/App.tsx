import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  Settings, 
  Maximize2, 
  Minimize2, 
  SkipForward, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Wifi, 
  RefreshCw,
  Trophy,
  Volume2,
  Bell,
  BellOff
} from 'lucide-react';

// Subcomponents
import { DigitalTimer } from './components/DigitalTimer';
import { CircularTimer } from './components/CircularTimer';
import { FlipTimer } from './components/FlipTimer';
import { AmbientMixer } from './components/AmbientMixer';
import { AchievementsPanel } from './components/AchievementsPanel';
import { StatsPanel } from './components/StatsPanel';
import { AuthModal } from './components/AuthModal';
import { BackgroundSystem } from './components/BackgroundSystem';
import { TaskPanel } from './components/TaskPanel';
import { BackgroundSettingsPanel } from './components/BackgroundSettingsPanel';

// Vercel Speed Insights & Analytics
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

// Cryptography & API
import { encryptData, decryptData } from './utils/crypto';
import { saveToIndexedDB, getFromIndexedDB, clearIndexedDB } from './utils/db';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  findBackupFile, 
  downloadBackupFile, 
  createBackupFile, 
  updateBackupFile 
} from './lib/firebase';

// Achievements Utility
import { checkNewAchievements, calculateStreak, ACHIEVEMENTS_LIST } from './utils/achievements';

// Types
import { StudyLog, TimerMode, ClockStyle, TimerStatus, BackupData, Task, BackgroundConfig } from './types';

export default function App() {
  // --- User Profile & Subject Tracker States ---
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Siyam');
  const [activeSubject, setActiveSubject] = useState<string>('General Study');
  const [subjectsList, setSubjectsList] = useState<string[]>(['Math', 'Physics', 'Chemistry', 'Coding', 'English', 'Biology']);
  const [subjectColors, setSubjectColors] = useState<Record<string, string>>({
    'Math': '#f43f5e',
    'Physics': '#0ea5e9',
    'Chemistry': '#10b981',
    'Coding': '#a855f7',
    'English': '#f59e0b',
    'Biology': '#22c55e',
    'General Study': '#3b82f6',
  });
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');
  const [customColorInput, setCustomColorInput] = useState<string>('#3b82f6');

  // --- Core Timer Configurations (m) ---
  const [focusLength, setFocusLength] = useState<number>(25);
  const [shortBreakLength, setShortBreakLength] = useState<number>(5);
  const [longBreakLength, setLongBreakLength] = useState<number>(15);
  const [pomodoroGoal, setPomodoroGoal] = useState<number>(4);

  // --- Live Timer States ---
  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [clockStyle, setClockStyle] = useState<ClockStyle>('minimalist');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [completedToday, setCompletedToday] = useState<number>(0);

  // --- Setting Modal Toggle ---
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // --- Logging States ---
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);

  // --- Sync & Auth States ---
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncPassword, setSyncPassword] = useState<string>('MySecretFocus123'); // Custom encryption key
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  // --- Task Checklist & Custom Ambient Background States ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    type: 'gradient',
    presetId: 'solid-graphite',
    opacity: 100,
    blur: 0,
    brightness: 100,
    darkOverlay: 35,
    zoom: 100,
    position: 'center',
    animationSpeed: 1,
    loop: true,
    muted: true,
  });


  const handleAddSubject = (name: string, color?: string) => {
    const trimmed = name.trim();
    if (trimmed && !subjectsList.includes(trimmed)) {
      const nextList = [...subjectsList, trimmed];
      setSubjectsList(nextList);
      setActiveSubject(trimmed);
      if (color) {
        setSubjectColors((prev) => ({
          ...prev,
          [trimmed]: color,
        }));
      }
    }
  };

  // --- Task Checklist Handlers ---
  const handleAddTask = (title: string, priority: 'high' | 'medium' | 'low') => {
    const newTask: Task = {
      id: 'task_' + Date.now(),
      title,
      completed: false,
      priority,
      createdAt: Date.now(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetBackground = () => {
    setBackgroundConfig({
      type: 'gradient',
      presetId: 'solid-graphite',
      opacity: 100,
      blur: 0,
      brightness: 100,
      darkOverlay: 35,
      zoom: 100,
      position: 'center',
      animationSpeed: 1,
      loop: true,
      muted: true,
    });
  };

  const handlePrevSubject = () => {
    if (subjectsList.length === 0) return;
    const currentIndex = subjectsList.indexOf(activeSubject);
    const prevIndex = (currentIndex - 1 + subjectsList.length) % subjectsList.length;
    setActiveSubject(subjectsList[prevIndex]);
  };

  const handleNextSubject = () => {
    if (subjectsList.length === 0) return;
    const currentIndex = subjectsList.indexOf(activeSubject);
    const nextIndex = (currentIndex + 1) % subjectsList.length;
    setActiveSubject(subjectsList[nextIndex]);
  };



  // --- Google Drive Token Verification helper ---
  const ensureAccessToken = async (): Promise<string | null> => {
    if (accessToken) return accessToken;
    
    setIsLoggingIn(true);
    setSyncFeedback('Requesting Google Drive authorization...');
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        return result.accessToken;
      }
    } catch (err: any) {
      console.error('Google Drive authorization failed', err);
      const errorMsg = err?.message || err?.code || JSON.stringify(err) || 'Popup closed or permission denied';
      setSyncFeedback(`Authorization failed: ${errorMsg}. Please click sign-in to grant access.`);
    } finally {
      setIsLoggingIn(false);
    }
    return null;
  };

  // Audio Completion Sound Trigger
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ref to track interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Initial Mounting & Cache Loader (Dual-Layer IndexedDB + LocalStorage) ---
  useEffect(() => {
    const loadState = async () => {
      // 1. Get from localStorage
      let localLogs: StudyLog[] = [];
      try {
        const saved = localStorage.getItem('focus_logs');
        if (saved) localLogs = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing local storage logs', e);
      }

      let localAchievements: string[] = [];
      try {
        const saved = localStorage.getItem('earned_achievements');
        if (saved) localAchievements = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing local storage achievements', e);
      }

      // 2. Get from IndexedDB
      let idbLogs: StudyLog[] | null = await getFromIndexedDB<StudyLog[]>('focus_logs');
      let idbAchievements: string[] | null = await getFromIndexedDB<string[]>('earned_achievements');

      // 3. Dual-Layer Auto-Heal: Resolve logs
      let resolvedLogs = localLogs;
      if (!idbLogs) {
        idbLogs = localLogs;
        if (localLogs.length > 0) {
          await saveToIndexedDB('focus_logs', localLogs);
        }
      } else if (idbLogs.length > localLogs.length) {
        // IndexedDB had more logs than localStorage (localStorage got cleared!)
        resolvedLogs = idbLogs;
        localStorage.setItem('focus_logs', JSON.stringify(idbLogs));
        console.log(`Auto-healed: Restored ${idbLogs.length - localLogs.length} logs from IndexedDB!`);
      } else if (localLogs.length > idbLogs.length) {
        // LocalStorage had more logs, sync to IndexedDB
        await saveToIndexedDB('focus_logs', localLogs);
      }
      setLogs(resolvedLogs);

      // Resolve achievements
      let resolvedAchievements = localAchievements;
      if (!idbAchievements) {
        idbAchievements = localAchievements;
        if (localAchievements.length > 0) {
          await saveToIndexedDB('earned_achievements', localAchievements);
        }
      } else if (idbAchievements.length > localAchievements.length) {
        resolvedAchievements = idbAchievements;
        localStorage.setItem('earned_achievements', JSON.stringify(idbAchievements));
        console.log('Auto-healed: Restored achievements from IndexedDB!');
      } else if (localAchievements.length > idbAchievements.length) {
        await saveToIndexedDB('earned_achievements', localAchievements);
      }
      setEarnedAchievements(resolvedAchievements);

      // Helper for config variables
      const getVal = async (key: string, localVal: string | null, defaultVal: any) => {
        const idbVal = await getFromIndexedDB<any>(key);
        if (localVal !== null) {
          const parsedLocal = parseConfigValue(key, localVal);
          if (idbVal === null) await saveToIndexedDB(key, parsedLocal);
          return parsedLocal;
        } else if (idbVal !== null) {
          localStorage.setItem(key, idbVal.toString());
          return idbVal;
        }
        return defaultVal;
      };

      const parseConfigValue = (key: string, valStr: string) => {
        if (key === 'focus_len' || key === 'short_len' || key === 'long_len' || key === 'pomodoro_goal') {
          return parseInt(valStr, 10);
        }
        if (key === 'auto_sync') {
          return valStr === 'true';
        }
        return valStr;
      };

      const focus = await getVal('focus_len', localStorage.getItem('focus_len'), 25);
      const short = await getVal('short_len', localStorage.getItem('short_len'), 5);
      const long = await getVal('long_len', localStorage.getItem('long_len'), 15);
      const goal = await getVal('pomodoro_goal', localStorage.getItem('pomodoro_goal'), 4);
      const style = await getVal('clock_style', localStorage.getItem('clock_style'), 'minimalist');
      const passwd = await getVal('sync_password', localStorage.getItem('sync_password'), 'MySecretFocus123');
      const autos = await getVal('auto_sync', localStorage.getItem('auto_sync'), true);
      const username = await getVal('user_name', localStorage.getItem('user_name'), 'Siyam');
      const activeSubj = await getVal('active_subject', localStorage.getItem('active_subject'), 'General Study');
      
      let subjs: string[] = ['Math', 'Physics', 'Chemistry', 'Coding', 'English', 'Biology'];
      const localSubjs = localStorage.getItem('subjects_list');
      if (localSubjs) {
        try { subjs = JSON.parse(localSubjs); } catch (e) { console.error(e); }
      }
      const idbSubjs = await getFromIndexedDB<string[]>('subjects_list');
      if (idbSubjs) subjs = idbSubjs;

      setFocusLength(focus);
      setShortBreakLength(short);
      setLongBreakLength(long);
      setPomodoroGoal(goal);
      setClockStyle(style as ClockStyle);
      setSyncPassword(passwd);
      setAutoSync(autos);
      setUserName(username);
      setActiveSubject(activeSubj);
      setSubjectsList(subjs);

      const idbLastSync = await getFromIndexedDB<number>('last_synced');
      if (idbLastSync !== null) {
        setLastSyncTime(idbLastSync);
      } else {
        const localLastSync = localStorage.getItem('last_synced');
        if (localLastSync) {
          const parsed = parseInt(localLastSync, 10);
          setLastSyncTime(parsed);
          await saveToIndexedDB('last_synced', parsed);
        }
      }

      // Load tasks checklist from IndexedDB / LocalStorage
      let resolvedTasks: Task[] = [];
      const idbTasks = await getFromIndexedDB<Task[]>('tasks_data');
      if (idbTasks) {
        resolvedTasks = idbTasks;
      } else {
        const savedTasks = localStorage.getItem('tasks_data');
        if (savedTasks) {
          try { resolvedTasks = JSON.parse(savedTasks); } catch (e) { console.error(e); }
        }
      }
      setTasks(resolvedTasks);

      // Load custom background configuration from IndexedDB
      const idbBg = await getFromIndexedDB<BackgroundConfig>('background_config');
      if (idbBg) {
        setBackgroundConfig(idbBg);
      }

      // Load custom subject colors from IndexedDB / LocalStorage
      let colors: Record<string, string> = {
        'Math': '#f43f5e',
        'Physics': '#0ea5e9',
        'Chemistry': '#10b981',
        'Coding': '#a855f7',
        'English': '#f59e0b',
        'Biology': '#22c55e',
        'General Study': '#3b82f6',
      };
      const localColors = localStorage.getItem('subject_colors');
      if (localColors) {
        try { colors = JSON.parse(localColors); } catch (e) { console.error('Error parsing local colors:', e); }
      }
      const idbColors = await getFromIndexedDB<Record<string, string>>('subject_colors');
      if (idbColors) colors = idbColors;
      setSubjectColors(colors);

      if ('Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }

      // Mark load state as completed to enable persistence saving safely without race conditions
      setIsLoaded(true);
    };

    loadState();
  }, []);

  // --- Time Synchronization on Configurations edit ---
  useEffect(() => {
    if (status === 'idle') {
      const mins = mode === 'focus' ? focusLength : mode === 'short_break' ? shortBreakLength : longBreakLength;
      setTimeLeft(mins * 60);
    }
  }, [focusLength, shortBreakLength, longBreakLength, mode, status]);

  // Save Configs to local storage and IndexedDB
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('focus_len', focusLength.toString());
    localStorage.setItem('short_len', shortBreakLength.toString());
    localStorage.setItem('long_len', longBreakLength.toString());
    localStorage.setItem('pomodoro_goal', pomodoroGoal.toString());
    localStorage.setItem('clock_style', clockStyle);
    localStorage.setItem('sync_password', syncPassword);
    localStorage.setItem('auto_sync', autoSync.toString());

    // Dual-write configs to IndexedDB for offline resilience
    saveToIndexedDB('focus_len', focusLength);
    saveToIndexedDB('short_len', shortBreakLength);
    saveToIndexedDB('long_len', longBreakLength);
    saveToIndexedDB('pomodoro_goal', pomodoroGoal);
    saveToIndexedDB('clock_style', clockStyle);
    saveToIndexedDB('sync_password', syncPassword);
    saveToIndexedDB('auto_sync', autoSync);
  }, [focusLength, shortBreakLength, longBreakLength, pomodoroGoal, clockStyle, syncPassword, autoSync, isLoaded]);

  // Save User profile and subject configs to localStorage & IndexedDB
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('user_name', userName);
    localStorage.setItem('active_subject', activeSubject);
    localStorage.setItem('subjects_list', JSON.stringify(subjectsList));

    saveToIndexedDB('user_name', userName);
    saveToIndexedDB('active_subject', activeSubject);
    saveToIndexedDB('subjects_list', subjectsList);
  }, [userName, activeSubject, subjectsList, isLoaded]);

  // Save custom subject colors to localStorage & IndexedDB
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('subject_colors', JSON.stringify(subjectColors));
    saveToIndexedDB('subject_colors', subjectColors);
  }, [subjectColors, isLoaded]);

  // Save tasks and background configuration to LocalStorage and IndexedDB
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('tasks_data', JSON.stringify(tasks));
    saveToIndexedDB('tasks_data', tasks);
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToIndexedDB('background_config', backgroundConfig);
  }, [backgroundConfig, isLoaded]);

  // Keep completedToday computed count accurate
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const finishedToday = logs.filter(log => log.date === todayStr && log.mode === 'focus').length;
    setCompletedToday(finishedToday);
  }, [logs]);

  // --- Global Keydown Event Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in inputs, textareas, or contentEditable elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Prevent default page scroll on Spacebar
        handleStartPause();
      } else if (key === 'r') {
        e.preventDefault();
        handleReset();
      } else if (key === 'f') {
        e.preventDefault();
        setIsFullscreen(prev => {
          const nextVal = !prev;
          if (nextVal) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          }
          return nextVal;
        });
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [status, mode, focusLength, shortBreakLength, longBreakLength]);

  // Run achievement checks on logs or sync changes
  useEffect(() => {
    const hasSynced = !!lastSyncTime;
    const nextEarned = checkNewAchievements(logs, earnedAchievements, hasSynced);
    
    // Only update if there is an actual change
    if (nextEarned.length !== earnedAchievements.length) {
      setEarnedAchievements(nextEarned);
      localStorage.setItem('earned_achievements', JSON.stringify(nextEarned));
      saveToIndexedDB('earned_achievements', nextEarned);
      
      // Notify the user about newly earned achievements
      const newlyEarned = nextEarned.filter(id => !earnedAchievements.includes(id));
      if (newlyEarned.length > 0 && logs.length > 0) {
        const firstId = newlyEarned[0];
        const detail = ACHIEVEMENTS_LIST.find(a => a.id === firstId);
        if (detail) {
          setSyncFeedback(`🏆 Achievement Unlocked: ${detail.badgeEmoji} ${detail.title}! ${detail.description}`);
        }
      }

      // If user is authenticated, back up immediately!
      if (user && accessToken && autoSync) {
        syncDataToDrive(accessToken, logs, nextEarned);
      }
    }
  }, [logs, lastSyncTime]);

  // --- Sound Synthesizer (Zero asset depend) ---
  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Pleasant Uplifting Arpeggio)
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.5);
      });
    } catch (err) {
      console.warn('Audio synthesis warning:', err);
    }
  };

  const playNotificationSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Two elegant, crystalline chime tones: E6 and G6
      playTone(1318.51, now, 0.8, 0.15); // E6
      playTone(1567.98, now + 0.12, 1.2, 0.12); // G6
    } catch (err) {
      console.warn('Notification sound synthesis warning:', err);
    }
  };

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/1164/1164620.png',
        });
      } catch (e) {
        console.warn('Notification construction failed', e);
      }
    }
    playNotificationSound();
  };

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      setSyncFeedback('⚠️ System notifications are not supported by this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      setSyncFeedback('🔔 System notifications are already enabled!');
      setNotificationsEnabled(true);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setSyncFeedback('🎉 System notifications enabled successfully!');
        new Notification('Zenith Focus Enabled 🌸', {
          body: 'You will receive native alerts when your study sessions or breaks complete.',
          icon: 'https://cdn-icons-png.flaticon.com/512/1164/1164620.png',
        });
        playNotificationSound();
      } else {
        setNotificationsEnabled(false);
        setSyncFeedback('⚠️ Notification permission denied. Please allow notifications in your browser settings.');
      }
    } catch (err) {
      console.error('Error requesting notification permission', err);
      setSyncFeedback('⚠️ Failed to request notification permission.');
    }
  };

  // --- Primary Timer Engine ---
  const handleStartPause = () => {
    // Resume audio context if locked
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (status === 'running') {
      setStatus('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setStatus('running');
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // --- Automated Offline Local Backups ---
  const triggerAutoDownloadBackup = (currentLogs: StudyLog[]) => {
    try {
      const now = Date.now();
      const payload: BackupData = {
        logs: currentLogs,
        pomodoroGoal,
        completedToday: currentLogs.filter(l => l.date === new Date().toISOString().split('T')[0] && l.mode === 'focus').length,
        updatedAt: now,
        earnedAchievements: earnedAchievements,
        streak: calculateStreak(currentLogs)
      };

      const plainText = JSON.stringify(payload, null, 2);
      let fileContent = plainText;
      let filename = `zenith_focus_autobackup_${new Date().toISOString().split('T')[0]}.json`;
      
      if (syncPassword) {
        fileContent = encryptData(plainText, syncPassword);
        filename = `zenith_focus_encrypted_autobackup_${new Date().toISOString().split('T')[0]}.json`;
      }

      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setLastSyncTime(now);
      localStorage.setItem('last_synced', now.toString());
      saveToIndexedDB('last_synced', now);

      setSyncFeedback('🔄 Auto-backup file downloaded safely to protection!');
    } catch (err) {
      console.error('Auto-backup export failed', err);
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    const mins = mode === 'focus' ? focusLength : mode === 'short_break' ? shortBreakLength : longBreakLength;
    setTimeLeft(mins * 60);
  };

  const handleTimerComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    
    // Trigger notification and gentle chime!
    if (mode === 'focus') {
      sendNotification('Focus Session Completed! 🎯', `Incredible job! You completed a ${focusLength} mins session on ${activeSubject}. Time for a break!`);
    } else if (mode === 'short_break') {
      sendNotification('Short Break Completed! 🌸', "Time to focus again! Let's get back to work.");
    } else if (mode === 'long_break') {
      sendNotification('Long Break Completed! 🧘', 'Ready to conquer your next deep focus session?');
    }

    // 1. Calculate duration minutes
    const initialMins = mode === 'focus' ? focusLength : mode === 'short_break' ? shortBreakLength : longBreakLength;
    
    // 2. Append study log
    const newLog: StudyLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      userId: 'offline-user',
      durationMinutes: initialMins,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      mode: mode,
      subject: activeSubject,
      notes: `Completed: ${activeSubject}`
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('focus_logs', JSON.stringify(updatedLogs));
    saveToIndexedDB('focus_logs', updatedLogs);

    // 3. Switch Mode Auto-pilot
    let nextMode: TimerMode = 'focus';
    if (mode === 'focus') {
      // If we finished a focus, check if we need short or long break (e.g. every 4th completed Pomodoro is a long break)
      const finishedFocusToday = updatedLogs.filter(log => log.date === newLog.date && log.mode === 'focus').length;
      if (finishedFocusToday > 0 && finishedFocusToday % 4 === 0) {
        nextMode = 'long_break';
      } else {
        nextMode = 'short_break';
      }
    } else {
      nextMode = 'focus';
    }

    setMode(nextMode);
    const nextMins = nextMode === 'focus' ? focusLength : nextMode === 'short_break' ? shortBreakLength : longBreakLength;
    setTimeLeft(nextMins * 60);

    // 4. Auto-backup trigger after every 5 completed Pomodoro sessions
    const completedFocusCount = updatedLogs.filter(l => l.mode === 'focus').length;
    if (autoSync && completedFocusCount > 0 && completedFocusCount % 5 === 0) {
      triggerAutoDownloadBackup(updatedLogs);
    }

    // If user is authenticated, back up immediately!
    if (user && accessToken && autoSync) {
      syncDataToDrive(accessToken, updatedLogs, earnedAchievements);
    }
  };

  const handleManualComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    // Calculate actual elapsed minutes (rounded to nearest minute, minimum 1 min)
    const totalSeconds = mode === 'focus' ? focusLength * 60 : mode === 'short_break' ? shortBreakLength * 60 : longBreakLength * 60;
    const elapsedSeconds = totalSeconds - timeLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    // Trigger notification and gentle chime!
    if (mode === 'focus') {
      sendNotification('Focus Session Logged! 🎯', `Manually logged ${elapsedMinutes} minutes of focus on ${activeSubject}. Keep up the great work!`);
    } else {
      sendNotification('Break Completed! 🧘', 'Break has been successfully completed.');
    }

    // Append study log
    const newLog: StudyLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      userId: 'offline-user',
      durationMinutes: elapsedMinutes,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      mode: mode,
      subject: activeSubject,
      notes: `Manually completed: ${activeSubject}`
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('focus_logs', JSON.stringify(updatedLogs));
    saveToIndexedDB('focus_logs', updatedLogs);

    // Reset current timer
    setTimeLeft(totalSeconds);

    setSyncFeedback(`🎉 Successfully logged ${elapsedMinutes} minutes of ${activeSubject} focus!`);

    // Switch Mode Auto-pilot
    let nextMode: TimerMode = 'focus';
    if (mode === 'focus') {
      const finishedFocusToday = updatedLogs.filter(log => log.date === newLog.date && log.mode === 'focus').length;
      if (finishedFocusToday > 0 && finishedFocusToday % 4 === 0) {
        nextMode = 'long_break';
      } else {
        nextMode = 'short_break';
      }
    } else {
      nextMode = 'focus';
    }

    setMode(nextMode);
    const nextMins = nextMode === 'focus' ? focusLength : nextMode === 'short_break' ? shortBreakLength : longBreakLength;
    setTimeLeft(nextMins * 60);

    // If user is authenticated, back up immediately!
    if (user && accessToken && autoSync) {
      syncDataToDrive(accessToken, updatedLogs, earnedAchievements);
    }
  };

  const handleManualAddLog = (durationMinutes: number, subject: string, notes?: string, dateStr?: string) => {
    const finalDateStr = dateStr || new Date().toISOString().split('T')[0];
    const newLog: StudyLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      userId: 'offline-user',
      durationMinutes,
      timestamp: dateStr ? new Date(dateStr + 'T12:00:00').getTime() : Date.now(),
      date: finalDateStr,
      mode: 'focus',
      subject,
      notes: notes || `Retroactive Log: ${subject}`
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('focus_logs', JSON.stringify(updatedLogs));
    saveToIndexedDB('focus_logs', updatedLogs);

    setSyncFeedback(`🎉 Successfully logged retroactive ${durationMinutes} mins of ${subject}!`);

    // If user is authenticated, back up immediately!
    if (user && accessToken && autoSync) {
      syncDataToDrive(accessToken, updatedLogs, earnedAchievements);
    }
  };

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    
    // Toggle modes simply
    let nextMode: TimerMode = 'focus';
    if (mode === 'focus') {
      nextMode = 'short_break';
    } else if (mode === 'short_break') {
      nextMode = 'long_break';
    } else {
      nextMode = 'focus';
    }

    setMode(nextMode);
    const nextMins = nextMode === 'focus' ? focusLength : nextMode === 'short_break' ? shortBreakLength : longBreakLength;
    setTimeLeft(nextMins * 60);
  };

  // --- Google Auth Actions ---
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setSyncFeedback(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        triggerLoadAndSync(result.accessToken, result.user);
      }
    } catch (err: any) {
      console.error('Google Auth Login Failed', err);
      const errorMsg = err?.message || err?.code || JSON.stringify(err) || 'Popup closed or origin not whitelisted';
      setSyncFeedback(`Auth connection failed: ${errorMsg}. Please try again.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setSyncFeedback('Disconnected successfully.');
  };

  // --- Google Drive Backup / Sync Operations ---
  const triggerLoadAndSync = async (token: string, currentUser: User) => {
    setIsSyncing(true);
    setSyncFeedback('Checking Google Drive for existing study logs...');
    try {
      const fileId = await findBackupFile(token);
      if (fileId) {
        const encryptedContent = await downloadBackupFile(token, fileId);
        
        try {
          // Decrypt downloaded data
          const decryptedJson = decryptData(encryptedContent, syncPassword);
          const data: BackupData = JSON.parse(decryptedJson);

          if (data && Array.isArray(data.logs)) {
            // Merge downloaded logs with local logs (de-duplicate)
            const localLogs = [...logs];
            let mergedCount = 0;
            data.logs.forEach((cloudLog) => {
              if (!localLogs.some(local => local.id === cloudLog.id)) {
                localLogs.push(cloudLog);
                mergedCount++;
              }
            });

            setLogs(localLogs);
            localStorage.setItem('focus_logs', JSON.stringify(localLogs));

            // Restore / merge earned achievements
            if (data.earnedAchievements && Array.isArray(data.earnedAchievements)) {
              setEarnedAchievements((prev) => {
                const merged = Array.from(new Set([...prev, ...data.earnedAchievements!]));
                localStorage.setItem('earned_achievements', JSON.stringify(merged));
                return merged;
              });
            }

            // Restore / merge tasks checklist
            if (data.tasks && Array.isArray(data.tasks)) {
              setTasks((prev) => {
                const merged = [...prev];
                data.tasks!.forEach((t) => {
                  if (!merged.some((m) => m.id === t.id)) {
                    merged.push(t);
                  }
                });
                return merged;
              });
            }

            // Restore custom background configuration
            if (data.backgroundConfig) {
              setBackgroundConfig(data.backgroundConfig);
            }

            setLastSyncTime(data.updatedAt || Date.now());
            setSyncFeedback(mergedCount > 0 
              ? `Synced: Successfully downloaded and merged ${mergedCount} new sessions!`
              : 'Synced: Local and Google Drive study logs are already up to date.'
            );
          }
        } catch (decryptionError) {
          console.warn('Decryption failed, might be wrong key or plain json', decryptionError);
          setSyncFeedback('Conflict: Could not decrypt file on Google Drive. Verify Encryption Key.');
        }
      } else {
        // No backup file yet, upload current local logs
        await syncDataToDrive(token, logs, earnedAchievements);
      }
    } catch (err: any) {
      console.error('Initial sync trigger failed', err);
      if (err?.message === 'UNAUTHORIZED_DRIVE_TOKEN') {
        setAccessToken(null);
        setSyncFeedback('Your Google Drive token expired. Re-authorization required.');
      } else {
        setSyncFeedback('Sync failed: Could not access Google Drive.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const syncDataToDrive = async (token: string, logsToSync: StudyLog[], achievementsToSync?: string[]) => {
    setIsSyncing(true);
    setSyncFeedback('Encrypting and backing up focus logs to Google Drive...');
    try {
      const payload: BackupData = {
        logs: logsToSync,
        pomodoroGoal,
        completedToday,
        updatedAt: Date.now(),
        earnedAchievements: achievementsToSync || earnedAchievements,
        streak: calculateStreak(logsToSync),
        tasks,
        backgroundConfig
      };

      const plainText = JSON.stringify(payload);
      // Encrypt with password
      const encryptedString = encryptData(plainText, syncPassword);

      const fileId = await findBackupFile(token);
      if (fileId) {
        // Overwrite confirmation is automatic here for standard sync
        await updateBackupFile(token, fileId, encryptedString);
      } else {
        await createBackupFile(token, encryptedString);
      }

      setLastSyncTime(Date.now());
      setSyncFeedback('Backup successful! Your data is protected by E2EE.');
    } catch (err: any) {
      console.error('Backup to Drive Failed', err);
      if (err?.message === 'UNAUTHORIZED_DRIVE_TOKEN') {
        setAccessToken(null);
        setSyncFeedback('Your Google Drive token expired. Re-authorization required.');
      } else {
        setSyncFeedback('Backup failed. Check internet and retry.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualBackup = async () => {
    const token = await ensureAccessToken();
    if (!token) return;

    const confirmed = window.confirm('Overwrite backup on Google Drive with your current local study logs?');
    if (confirmed) {
      syncDataToDrive(token, logs, earnedAchievements);
    }
  };

  const handleManualRestore = async () => {
    const token = await ensureAccessToken();
    if (!token) return;

    const confirmed = window.confirm('Merge your Google Drive backup with your local logs? This will download any missing sessions.');
    if (confirmed) {
      triggerLoadAndSync(token, user!);
    }
  };

  // --- Local JSON File Backup / Restore fallbacks ---
  const handleLocalExport = () => {
    try {
      const now = Date.now();
      const payload: BackupData = {
        logs: logs,
        pomodoroGoal,
        completedToday,
        updatedAt: now,
        earnedAchievements: earnedAchievements,
        streak: calculateStreak(logs),
        tasks,
        backgroundConfig
      };

      const plainText = JSON.stringify(payload, null, 2);
      let fileContent = plainText;
      let filename = 'zenithfocus_backup.json';
      
      if (syncPassword) {
        fileContent = encryptData(plainText, syncPassword);
        filename = 'zenithfocus_encrypted_backup.json';
      }

      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLastSyncTime(now);
      localStorage.setItem('last_synced', now.toString());
      saveToIndexedDB('last_synced', now);

      setSyncFeedback('Local backup file exported successfully!');
    } catch (err: any) {
      console.error('Failed to export local backup', err);
      setSyncFeedback('Failed to export backup file.');
    }
  };

  const handleLocalImport = (fileContent: string) => {
    try {
      const data: BackupData = JSON.parse(fileContent);
      if (!data || !Array.isArray(data.logs)) {
        throw new Error('Invalid backup file structure: missing focus logs');
      }

      setLogs(data.logs);
      localStorage.setItem('focus_logs', JSON.stringify(data.logs));
      saveToIndexedDB('focus_logs', data.logs);

      if (data.earnedAchievements && Array.isArray(data.earnedAchievements)) {
        setEarnedAchievements(data.earnedAchievements);
        localStorage.setItem('earned_achievements', JSON.stringify(data.earnedAchievements));
        saveToIndexedDB('earned_achievements', data.earnedAchievements);
      }

      if (data.pomodoroGoal) {
        setPomodoroGoal(data.pomodoroGoal);
        localStorage.setItem('pomodoro_goal', data.pomodoroGoal.toString());
        saveToIndexedDB('pomodoro_goal', data.pomodoroGoal);
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        localStorage.setItem('tasks_data', JSON.stringify(data.tasks));
        saveToIndexedDB('tasks_data', data.tasks);
      }

      if (data.backgroundConfig) {
        setBackgroundConfig(data.backgroundConfig);
        saveToIndexedDB('background_config', data.backgroundConfig);
      }

      const now = Date.now();
      setLastSyncTime(now);
      localStorage.setItem('last_synced', now.toString());
      saveToIndexedDB('last_synced', now);

      setSyncFeedback('🎉 Import Successful! Local database updated and synchronized.');
    } catch (err: any) {
      console.error('Failed to import backup', err);
      setSyncFeedback('Error: Invalid backup file format or corrupt data.');
    }
  };

  const handleClearLogs = async () => {
    const confirmed = window.confirm('Are you sure you want to delete ALL local study session logs and achievements? This cannot be undone.');
    if (confirmed) {
      setLogs([]);
      setEarnedAchievements([]);
      localStorage.removeItem('focus_logs');
      localStorage.removeItem('earned_achievements');
      await clearIndexedDB();
      setSyncFeedback('🚨 Local database and backup history cleared completely.');
    }
  };

  // Convert minutes & seconds for Display
  const currentTotalSeconds = mode === 'focus' ? focusLength * 60 : mode === 'short_break' ? shortBreakLength * 60 : longBreakLength * 60;
  const progressPercent = ((currentTotalSeconds - timeLeft) / currentTotalSeconds) * 100;

  const displayMin = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const displaySec = (timeLeft % 60).toString().padStart(2, '0');

  // Trigger page title update
  useEffect(() => {
    const activeEmoji = mode === 'focus' ? '🔴' : mode === 'short_break' ? '🟢' : '🔵';
    const statusLabel = status === 'running' ? `${displayMin}:${displaySec}` : 'Timerra';
    document.title = `${activeEmoji} ${statusLabel}`;
  }, [timeLeft, mode, status]);

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col relative transition-all duration-500 overflow-x-hidden selection:bg-pink-500/30 selection:text-white">
      {/* Dynamic Animated Ambient Background Layer */}
      <BackgroundSystem config={backgroundConfig} />
      <SpeedInsights />
      <Analytics />

      {/* --- HEADER --- */}
      {!isFullscreen && (
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-20">
          <div className="flex items-center gap-4 select-none">
            <div className="text-2xl font-black tracking-tight text-white font-futuristic">
              TIME<span className="text-pink-500 neon-glow-pink">RRA</span>
            </div>
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <div className={`w-2 h-2 rounded-full ${user ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]' : 'bg-slate-600'}`}></div>
              <span>{user ? 'Cloud Synced: Drive' : 'Local Workspace'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Clock styles Selector */}
            <div className="flex bg-white/[0.02] p-1 border border-white/5 rounded-xl text-xs font-semibold text-slate-400">
              <button
                id="btn-style-min"
                onClick={() => setClockStyle('minimalist')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${clockStyle === 'minimalist' ? 'bg-white/10 text-white shadow-md' : 'hover:text-slate-200'}`}
              >
                Minimal
              </button>
              <button
                id="btn-style-circ"
                onClick={() => setClockStyle('circular')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${clockStyle === 'circular' ? 'bg-white/10 text-white shadow-md' : 'hover:text-slate-200'}`}
              >
                Ring
              </button>
              <button
                id="btn-style-flip"
                onClick={() => setClockStyle('flip')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${clockStyle === 'flip' ? 'bg-white/10 text-white shadow-md' : 'hover:text-slate-200'}`}
              >
                Flip
              </button>
            </div>

            {/* Config, Notification & Fullscreen buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-notifications-toggle"
                onClick={handleToggleNotifications}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  notificationsEnabled 
                    ? 'bg-pink-500/15 text-pink-400 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
                title={notificationsEnabled ? "System Notifications Enabled" : "Enable System Notifications"}
              >
                {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
              </button>

              <button
                id="btn-settings-toggle"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${showSettings ? 'bg-pink-500/15 text-pink-400 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]' : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white'}`}
                title="Configurations"
              >
                <Settings size={18} />
              </button>

              <button
                id="btn-fullscreen-enter"
                onClick={() => setIsFullscreen(true)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-all text-slate-400 active:scale-95 cursor-pointer"
                title="Fullscreen Mode"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Profile / Goal Indicator */}
            <div className="flex items-center gap-3 select-none">
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Goal Progress</div>
                <div className="text-xs font-semibold text-slate-300">{completedToday} / {pomodoroGoal} Pomodoros</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/10 text-white" title={userName}>
                {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* --- LIVE STATS / SYNC UPDATE FEEDBACK --- */}
      {!isFullscreen && syncFeedback && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 relative z-10">
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-300 rounded-xl flex items-center justify-between gap-4 backdrop-blur-sm shadow-md animate-fade-in">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-400 animate-pulse" />
              {syncFeedback}
            </span>
            <button 
              id="btn-feedback-dismiss"
              className="text-[10px] text-blue-400 hover:text-blue-200 font-bold transition-colors uppercase tracking-wider cursor-pointer"
              onClick={() => setSyncFeedback(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN MAIN WRAPPER --- */}
      <main className="flex-1 flex flex-col justify-center py-6 px-4 sm:px-6 relative z-10 max-w-7xl mx-auto w-full">
        {isFullscreen ? (
          /* ==========================================================================
             IMMERSIBLE FULLSCREEN MODE (DISTRACTION-FREE)
             ========================================================================== */
          <div className="flex-1 flex flex-col items-center justify-between py-12 px-4 transition-all duration-700 animate-fade-in relative">
            {/* Quick exiting controls floating top right */}
            <div className="absolute top-4 right-4 flex items-center gap-3">
              <button
                id="btn-fullscreen-exit"
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all backdrop-blur-md active:scale-95 cursor-pointer"
              >
                <Minimize2 size={14} />
                Exit Fullscreen
              </button>
            </div>

            {/* Title / Status bar */}
            <div className="flex flex-col items-center gap-2 mt-4 text-center select-none">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border bg-white/[0.02] border-white/5 ${
                mode === 'focus' ? 'text-blue-400' : mode === 'short_break' ? 'text-emerald-400' : 'text-indigo-400'
              }`}>
                {mode === 'focus' ? 'Focusing...' : mode === 'short_break' ? 'Short Break Active' : 'Long Break Active'}
              </span>
              <p className="text-xs text-slate-500 font-mono">Pomodoros completed today: {completedToday} / {pomodoroGoal}</p>
            </div>

            {/* Active Clock component based on selection */}
            <div className="my-8 scale-110 sm:scale-125 md:scale-135 transition-transform duration-500">
              {clockStyle === 'minimalist' && (
                <DigitalTimer
                  minutes={displayMin}
                  seconds={displaySec}
                  status={status}
                  mode={mode}
                  onStartPause={handleStartPause}
                  onReset={handleReset}
                  subject={activeSubject}
                />
              )}
              {clockStyle === 'circular' && (
                <CircularTimer
                  minutes={displayMin}
                  seconds={displaySec}
                  status={status}
                  mode={mode}
                  progress={progressPercent}
                  onStartPause={handleStartPause}
                  onReset={handleReset}
                  subject={activeSubject}
                  subjectColor={subjectColors[activeSubject] || '#3b82f6'}
                  onSkip={handleSkip}
                  onPrevSubject={handlePrevSubject}
                  onNextSubject={handleNextSubject}
                  cycleInfo={`${completedToday + 1}/${pomodoroGoal}`}
                  onSettings={() => setShowSettings(true)}
                />
              )}
              {clockStyle === 'flip' && (
                <FlipTimer
                  minutes={displayMin}
                  seconds={displaySec}
                  status={status}
                  mode={mode}
                  onStartPause={handleStartPause}
                  onReset={handleReset}
                  subject={activeSubject}
                />
              )}
            </div>

            {/* Bottom Controls / Quick Skip & Ambient Player embedded */}
            <div className="w-full max-w-xl flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  id="btn-skip-fs"
                  onClick={handleSkip}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Skip Current Mode"
                >
                  <SkipForward size={14} /> Skip Session
                </button>
              </div>

              {/* Customizable Ambient Soundscapes Multi-Track Mixer */}
              <div className="w-full scale-95 opacity-80 hover:opacity-100 transition-opacity">
                <AmbientMixer timerStatus={status} timerMode={mode} />
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================================================
             STANDARD DASHBOARD LAYOUT (GRID SPLIT)
             ========================================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: ACTIVE CLOCK & AUDIO EMBED (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6 w-full">
              {/* --- PREMIUM USER PROFILE & ACTIVE TASK TRACKER --- */}
              <div className="w-full flex flex-col p-5 rounded-3xl glossy-panel glossy-panel-hover relative overflow-hidden animate-fade-in select-none">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  {/* Name Input Section */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Focusing Workspace for</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="text-lg font-bold text-white bg-transparent border-b border-dashed border-white/10 hover:border-white/30 focus:border-blue-500 focus:outline-none pb-0.5 max-w-[180px] transition-colors"
                        placeholder="Your name..."
                      />
                      <span className="text-[9px] text-slate-500 font-medium bg-white/5 px-2 py-0.5 rounded-full uppercase">Click to Edit Name</span>
                    </div>
                  </div>

                  {/* Manual Complete Session Action */}
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-manual-complete"
                      onClick={handleManualComplete}
                      disabled={status === 'idle'}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 shadow-md border ${
                        status !== 'idle'
                          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-300 border-emerald-500/25 hover:from-emerald-500/20 hover:to-teal-500/20 hover:border-emerald-500/40 cursor-pointer active:scale-95'
                          : 'bg-white/[0.01] border-white/5 text-slate-600 cursor-not-allowed'
                      }`}
                      title="Instantly complete session and save active duration to history"
                    >
                      <span className="flex h-1.5 w-1.5 relative">
                        {status !== 'idle' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status !== 'idle' ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                      </span>
                      Complete & Log Session
                    </button>
                  </div>
                </div>

                {/* Subject/Task Selector Section */}
                <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
                      Select Subject / Active Task
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] text-blue-400 font-mono">
                      <span>Active: <strong className="font-bold text-white">{activeSubject}</strong></span>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="color"
                          value={subjectColors[activeSubject] || '#3b82f6'}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setSubjectColors((prev) => ({
                              ...prev,
                              [activeSubject]: newColor,
                            }));
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          title="Change Color"
                        />
                        <div 
                          className="w-3 h-3 rounded-full border border-white/20 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm"
                          style={{ backgroundColor: subjectColors[activeSubject] || '#3b82f6' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pre-configured chips with dynamic colors */}
                  <div className="flex flex-wrap gap-1.5">
                    {subjectsList.map((subject) => {
                      const isSelected = activeSubject === subject;
                      const color = subjectColors[subject] || '#3b82f6';
                      return (
                        <button
                          key={subject}
                          onClick={() => setActiveSubject(subject)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-medium border transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'font-semibold'
                              : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${color}15`,
                                  color: color,
                                  borderColor: `${color}35`,
                                  boxShadow: `0 0 10px ${color}20`,
                                }
                              : {}
                          }
                        >
                          <span 
                            className="w-1.5 h-1.5 rounded-full transition-colors" 
                            style={{ backgroundColor: color }}
                          />
                          {subject}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Subject with Custom Color Picker */}
                  <div className="flex gap-1.5 mt-1 items-center">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="color"
                        value={customColorInput}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title="Pick Subject Color"
                      />
                      <button
                        type="button"
                        className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center transition-all hover:scale-105 hover:border-white/20 cursor-pointer"
                        style={{ backgroundColor: customColorInput }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 mix-blend-difference" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Add custom subject (e.g., Organic Chemistry, UI Design)..."
                      value={newSubjectInput}
                      onChange={(e) => setNewSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSubject(newSubjectInput, customColorInput);
                          setNewSubjectInput('');
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-black/20 border border-white/5 rounded-xl text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/30 transition-colors"
                    />
                    <button
                      onClick={() => {
                        handleAddSubject(newSubjectInput, customColorInput);
                        setNewSubjectInput('');
                      }}
                      className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 hover:border-blue-500/30 rounded-xl text-[9px] font-bold transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Live ticker indicating elapsed focus time */}
                {status === 'running' && (
                  <div className="mt-3.5 p-2 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[9.5px] text-blue-300/90 leading-relaxed font-mono flex items-center gap-1.5 animate-pulse">
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                    <span>
                      Live Study Ticker: You have been focusing on <strong className="text-white font-bold">{activeSubject}</strong> for {Math.max(0, Math.floor(((mode === 'focus' ? focusLength * 60 : mode === 'short_break' ? shortBreakLength * 60 : longBreakLength * 60) - timeLeft) / 60))} minute(s) so far. Click "Complete & Log Session" to save!
                    </span>
                  </div>
                )}
              </div>

              {/* Main clock container card */}
              <div className="relative">
                {/* Active Clock component */}
                {clockStyle === 'minimalist' && (
                  <DigitalTimer
                    minutes={displayMin}
                    seconds={displaySec}
                    status={status}
                    mode={mode}
                    onStartPause={handleStartPause}
                    onReset={handleReset}
                    subject={activeSubject}
                  />
                )}
                {clockStyle === 'circular' && (
                  <CircularTimer
                    minutes={displayMin}
                    seconds={displaySec}
                    status={status}
                    mode={mode}
                    progress={progressPercent}
                    onStartPause={handleStartPause}
                    onReset={handleReset}
                    subject={activeSubject}
                    subjectColor={subjectColors[activeSubject] || '#3b82f6'}
                    onSkip={handleSkip}
                    onPrevSubject={handlePrevSubject}
                    onNextSubject={handleNextSubject}
                    cycleInfo={`${completedToday + 1}/${pomodoroGoal}`}
                    onSettings={() => setShowSettings(true)}
                  />
                )}
                {clockStyle === 'flip' && (
                  <FlipTimer
                    minutes={displayMin}
                    seconds={displaySec}
                    status={status}
                    mode={mode}
                    onStartPause={handleStartPause}
                    onReset={handleReset}
                    subject={activeSubject}
                  />
                )}

                {/* Floating Skip Action on clock card */}
                <button
                  id="btn-skip-std"
                  onClick={handleSkip}
                  className="absolute bottom-8 right-8 px-5 py-2.5 rounded-xl glass-card hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer z-20"
                  title="Skip Session"
                >
                  <SkipForward size={14} /> Skip Session
                </button>
              </div>

              {/* Task Checklist Panel */}
              <TaskPanel
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />

              {/* Configurations Panel (Collapsible Drawer / Panel) */}
              {showSettings && (
                <div className="p-5 rounded-3xl glass-card flex flex-col gap-4 animate-fade-in relative overflow-hidden">
                  <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-500/5 blur-2xl pointer-events-none" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 relative z-10">
                    <Settings size={14} className="text-blue-400" />
                    Configure Focus Lengths (Minutes)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                    {/* Focus */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Focus</label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={focusLength}
                        onChange={(e) => setFocusLength(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {/* Short break */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Short Break</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={shortBreakLength}
                        onChange={(e) => setShortBreakLength(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {/* Long break */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Long Break</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={longBreakLength}
                        onChange={(e) => setLongBreakLength(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {/* Goal */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Daily Goal</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={pomodoroGoal}
                        onChange={(e) => setPomodoroGoal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-2 relative z-10">
                    <button
                      id="btn-settings-close"
                      onClick={() => setShowSettings(false)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md shadow-blue-600/10"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              )}

              {/* Customizable Ambient Soundscapes Multi-Track Mixer */}
              <AmbientMixer timerStatus={status} timerMode={mode} />
            </div>

            {/* RIGHT COLUMN: SYNC & ANALYTICS PANELS (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6 w-full">
              {/* Dynamic Animated Ambient Media Controller */}
              <BackgroundSettingsPanel
                config={backgroundConfig}
                onChange={setBackgroundConfig}
                onReset={handleResetBackground}
              />

              {/* Cloud Synchronization Panel */}
              <AuthModal
                logs={logs}
                earnedAchievements={earnedAchievements}
                pomodoroGoal={pomodoroGoal}
                syncPassword={syncPassword}
                autoSync={autoSync}
                onSetSyncPassword={setSyncPassword}
                onToggleAutoSync={setAutoSync}
                onLocalExport={handleLocalExport}
                onLocalImport={handleLocalImport}
                onClearLogs={handleClearLogs}
              />

              {/* Gamification: Achievements and Badges */}
              <AchievementsPanel logs={logs} earnedIds={earnedAchievements} />

              {/* Study Statistics & Session Log History */}
              <StatsPanel
                logs={logs}
                pomodoroGoal={pomodoroGoal}
                lastSyncTime={lastSyncTime}
                onClearLogs={handleClearLogs}
                subjectsList={subjectsList}
                onAddManualSession={handleManualAddLog}
              />
            </div>
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      {!isFullscreen && (
        <footer className="w-full py-6 text-center border-t border-white/5 mt-auto relative z-20 select-none">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
            Zenith Focus — Advanced End-to-End Encrypted Offline Sync
          </p>
        </footer>
      )}
    </div>
  );
}
