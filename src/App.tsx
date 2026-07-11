import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Clock, 
  Sparkles, 
  History, 
  TrendingUp, 
  Trash2, 
  Database, 
  Sliders, 
  BookOpen, 
  AlertCircle, 
  CheckCircle,
  BarChart2,
  Calendar,
  Flame,
  Award,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Bell,
  BellOff
} from 'lucide-react';

// Subcomponents
import { CircularTimer } from './components/CircularTimer';
import { MilestoneCeremony } from './components/MilestoneCeremony';
import { MilestoneVault } from './components/MilestoneVault';
import { LegacyCardCenter } from './components/LegacyCardCenter';
import { ArcuateDeck } from './components/ArcuateDeck';
import { SettingsPanel } from './components/SettingsPanel';
import { AuthModal } from './components/AuthModal';
import { WeeklyBarChart } from './components/WeeklyBarChart';
import { SubjectPieChart } from './components/SubjectPieChart';
import { AmbientMixer } from './components/AmbientMixer';
import { ModeSelector } from './components/ModeSelector';
import { ImmersiveFocus } from './components/ImmersiveFocus';
import { BrandedDefs } from './components/BrandedIcons';
import { NotificationCenter } from './components/NotificationCenter';

// Custom Libs and Hooks
import { TimerraDB } from './lib/db';
import { playClick as basePlayClick, playTick as basePlayTick, playComplete, vibrateStart, vibratePause } from './lib/audio';
import { VaultManager } from './lib/vaultManager';
import { CapsuleDB } from './lib/capsuleDb';
import { NotificationManager } from './lib/notificationManager';
import { useFullscreen } from './hooks/useFullscreen';
import { useHotkeys } from './hooks/useHotkeys';
import { useHydrated } from './hooks/useHydrated';

// Types
import { TimerMode, TimerStatus, TimerSettings, Session, ThemeName, BackupPayload } from './types';

const defaultSettings: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoAdvance: true,
  tickSound: false,
  theme: 'blue',
  subject: 'Deep Work',
};

export default function App() {
  const isHydrated = useHydrated();

  // --- Settings & Metadata ---
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // --- Active Timer State Machine ---
  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSec, setRemainingSec] = useState<number>(25 * 60);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [totalDurationSec, setTotalDurationSec] = useState<number>(25 * 60);
  const [cycle, setCycle] = useState<number>(1);

  // --- Modal Open States ---
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showBackup, setShowBackup] = useState<boolean>(false);
  const [showMilestoneVault, setShowMilestoneVault] = useState<boolean>(false);
  const [showLegacyCardCenter, setShowLegacyCardCenter] = useState<boolean>(false);
  const [isImmersiveFocus, setIsImmersiveFocus] = useState<boolean>(false);

  // --- Milestone Ceremony Queue ---
  const [ceremonyQueue, setCeremonyQueue] = useState<any[]>([]);

  // --- Notification Center States ---
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);
  const [isFocusSilenceMode, setIsFocusSilenceMode] = useState<boolean>(false);
  const [unseenVaultCount, setUnseenVaultCount] = useState<number>(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  // Local silent-wrapped audio functions that obey Silence Mode
  const playClick = useCallback(() => {
    if (!isFocusSilenceMode) {
      basePlayClick();
    }
  }, [isFocusSilenceMode]);

  const playTick = useCallback(() => {
    if (!isFocusSilenceMode) {
      basePlayTick();
    }
  }, [isFocusSilenceMode]);

  // Synchronize Silence Mode with Immersive Focus
  useEffect(() => {
    setIsFocusSilenceMode(isImmersiveFocus);
    if (!isImmersiveFocus) {
      // Exiting immersive focus! Flush queued silent notifications and show them in Notification Center
      const flushed = NotificationManager.flushSilenceQueue();
      if (flushed.length > 0) {
        console.log(`Exited Immersive Focus. Released ${flushed.length} stored logs.`);
      }
    }
  }, [isImmersiveFocus]);

  // Synchronize counts/badges with local storage and Custom Events
  const refreshNotificationMetrics = useCallback(() => {
    setUnreadNotificationCount(NotificationManager.getUnreadCount());

    const vaultState = VaultManager.loadState();
    const lastOpenedStr = localStorage.getItem('timerra_last_vault_opened_time');
    const lastOpened = lastOpenedStr ? parseInt(lastOpenedStr) : 0;
    const count = Object.values(vaultState.unlockedIds).filter(timestamp => timestamp > lastOpened).length;
    setUnseenVaultCount(count);
  }, []);

  useEffect(() => {
    refreshNotificationMetrics();
    window.addEventListener('timerra_notifications_changed', refreshNotificationMetrics);
    window.addEventListener('timerra_vault_opened', refreshNotificationMetrics);
    return () => {
      window.removeEventListener('timerra_notifications_changed', refreshNotificationMetrics);
      window.removeEventListener('timerra_vault_opened', refreshNotificationMetrics);
    };
  }, [refreshNotificationMetrics]);

  // --- Fullscreen Handling ---
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // --- Unlogged Study Duration Tracking Ref ---
  const unloggedStudySecRef = useRef<number>(0);
  const lastWallTimeRef = useRef<number | null>(null);

  // Helper to commit accumulated study seconds to IndexedDB sessions history
  const commitUnloggedStudySec = useCallback(async (forceAll = false) => {
    const isStudyMode = mode === 'focus' || mode === 'deepFocus' || mode === 'sprint' || mode === 'marathon' || mode === 'zen' || mode === 'infinityFocus';
    if (!isStudyMode) return;

    let secondsToCommit = 0;
    if (forceAll) {
      secondsToCommit = unloggedStudySecRef.current;
    } else {
      // Periodic commit: save completed 1-minute blocks (60 seconds) in real-time
      if (unloggedStudySecRef.current >= 60) {
        secondsToCommit = Math.floor(unloggedStudySecRef.current / 60) * 60;
      }
    }

    if (secondsToCommit >= 5) {
      const newSession: Session = {
        mode: 'focus', // backwards compatible with Recharts/D3 stats dashboard
        subject: settings.subject,
        durationSec: Math.floor(secondsToCommit),
        completedAt: Date.now(),
      };
      await TimerraDB.addSession(newSession);
      const updatedSessions = await TimerraDB.allSessions();
      setSessions(updatedSessions);
      
      // Evaluate milestone triggers
      try {
        const numBackupExports = parseInt(localStorage.getItem('timerra_backup_exports_count') || '0');
        const numBackupRestores = parseInt(localStorage.getItem('timerra_backup_restores_count') || '0');
        const capsulesList = await CapsuleDB.getAll().catch(() => []);
        const capsulesCount = capsulesList ? capsulesList.length : 0;
        
        const checkResult = VaultManager.checkNewMilestones(
          updatedSessions,
          settings,
          capsulesCount,
          numBackupExports,
          numBackupRestores,
          {}
        );
        if (checkResult.newlyUnlocked.length > 0) {
          // Log each unlocked milestone to the central logs silently or actively
          checkResult.newlyUnlocked.forEach(m => {
            NotificationManager.addNotification(
              `Milestone Unlocked: ${m.name}`,
              `Congratulations! You've unlocked the "${m.name}" milestone in the "${m.category}" category and earned +${m.xpAward} XP.`,
              'Milestones',
              false,
              isFocusSilenceMode
            );
          });

          // Only queue for fullscreen ceremony if we are in Immersive Focus (which suppresses rendering till they exit)
          if (isImmersiveFocus) {
            setCeremonyQueue(prev => [...prev, ...checkResult.newlyUnlocked]);
          }
        }

        // Daily Focus Goal Reached Notification check
        const todaySessionsCount = updatedSessions.filter(s => {
          const sDate = new Date(s.completedAt).toISOString().split('T')[0];
          return sDate === new Date().toISOString().split('T')[0] && s.mode === 'focus';
        }).length;

        if (todaySessionsCount === settings.cyclesBeforeLongBreak) {
          NotificationManager.addNotification(
            'Daily Focus Goal Achieved! 🏆',
            `Outstanding work! You have successfully completed your daily target of ${settings.cyclesBeforeLongBreak} focus cycles today.`,
            'Focus Goals',
            false,
            isFocusSilenceMode
          );
        }
      } catch (e) {
        console.error('Milestone evaluation failed', e);
      }
      
      // Subtract the committed amount
      unloggedStudySecRef.current = Math.max(0, unloggedStudySecRef.current - secondsToCommit);
      
      // Persist the remaining fraction to localStorage
      const savedStateStr = localStorage.getItem('timerra_live_timer_state');
      if (savedStateStr) {
        try {
          const saved = JSON.parse(savedStateStr);
          saved.unloggedStudySec = unloggedStudySecRef.current;
          saved.lastSaved = Date.now();
          localStorage.setItem('timerra_live_timer_state', JSON.stringify(saved));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [mode, settings, setCeremonyQueue]);

  // Synchronize unlogged study seconds to localStorage on tab close / unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const savedStateStr = localStorage.getItem('timerra_live_timer_state');
      if (savedStateStr) {
        try {
          const saved = JSON.parse(savedStateStr);
          saved.unloggedStudySec = unloggedStudySecRef.current;
          saved.lastSaved = Date.now();
          localStorage.setItem('timerra_live_timer_state', JSON.stringify(saved));
        } catch (e) {
          // ignore
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Load state on mount from IndexedDB and LocalStorage
  useEffect(() => {
    const initApp = async () => {
      try {
        const loadedSettings = await TimerraDB.getSettings();
        if (loadedSettings) {
          setSettings(loadedSettings);
        } else {
          await TimerraDB.saveSettings(defaultSettings);
        }

        const loadedSubjects = await TimerraDB.allSubjects();
        setSubjects(loadedSubjects);

        const loadedSessions = await TimerraDB.allSessions();
        setSessions(loadedSessions);

        // Silent initial evaluation of milestones
        try {
          const numBackupExports = parseInt(localStorage.getItem('timerra_backup_exports_count') || '0');
          const numBackupRestores = parseInt(localStorage.getItem('timerra_backup_restores_count') || '0');
          const capsulesList = await CapsuleDB.getAll().catch(() => []);
          const capsulesCount = capsulesList ? capsulesList.length : 0;
          VaultManager.checkNewMilestones(
            loadedSessions,
            loadedSettings || defaultSettings,
            capsulesCount,
            numBackupExports,
            numBackupRestores,
            {}
          );
        } catch (e) {
          console.error('Milestone silent load check failed', e);
        }

        // Recover live active state if it exists (Pristine same IP / same browser state recovery)
        const savedStateStr = localStorage.getItem('timerra_live_timer_state');
        if (savedStateStr) {
          try {
            const saved = JSON.parse(savedStateStr);
            const secondsPassed = (Date.now() - saved.lastSaved) / 1000;

            // Restore unlogged study seconds
            unloggedStudySecRef.current = saved.unloggedStudySec || 0;

            if (saved.mode === 'stopwatch' || saved.mode === 'infinityFocus') {
              if (saved.status === 'running') {
                setElapsedSec(saved.elapsedSec + secondsPassed);
                if (saved.mode === 'infinityFocus') {
                  unloggedStudySecRef.current += secondsPassed;
                }
                setStatus('running');
              } else {
                setElapsedSec(saved.elapsedSec);
                setStatus(saved.status);
              }
              setMode(saved.mode);
            } else {
              // Countdown modes
              if (saved.status === 'running') {
                const newRemaining = Math.max(0, saved.remainingSec - secondsPassed);
                if (newRemaining <= 0) {
                  // Timer completed while away! Log it if it's a study mode
                  const isStudy = saved.mode === 'focus' || saved.mode === 'deepFocus' || saved.mode === 'sprint' || saved.mode === 'marathon' || saved.mode === 'zen';
                  if (isStudy) {
                    const remainingToLog = Math.round(saved.remainingSec + unloggedStudySecRef.current);
                    if (remainingToLog >= 5) {
                      const newSession: Session = {
                        mode: 'focus',
                        subject: saved.subject || loadedSettings?.subject || defaultSettings.subject,
                        durationSec: remainingToLog,
                        completedAt: Date.now(),
                      };
                      await TimerraDB.addSession(newSession);
                      const freshSessions = await TimerraDB.allSessions();
                      setSessions(freshSessions);
                    }
                  }
                  unloggedStudySecRef.current = 0;
                  
                  // Reset to idle focus
                  setMode('focus');
                  setStatus('idle');
                  setRemainingSec((loadedSettings || defaultSettings).focusMinutes * 60);
                  setTotalDurationSec((loadedSettings || defaultSettings).focusMinutes * 60);
                } else {
                  setRemainingSec(newRemaining);
                  setTotalDurationSec(saved.totalDurationSec);
                  unloggedStudySecRef.current += secondsPassed;
                  setStatus('running');
                  setMode(saved.mode);
                }
              } else {
                setRemainingSec(saved.remainingSec);
                setTotalDurationSec(saved.totalDurationSec);
                setStatus(saved.status);
                setMode(saved.mode);
              }
            }
            setCycle(saved.cycle || 1);
          } catch (e) {
            console.warn('Failed to parse live timer state, resetting to defaults', e);
            const focusMinutes = (loadedSettings || defaultSettings).focusMinutes;
            setMode('focus');
            setRemainingSec(focusMinutes * 60);
            setTotalDurationSec(focusMinutes * 60);
            setStatus('idle');
          }
        } else {
          // Default setup
          const focusMinutes = (loadedSettings || defaultSettings).focusMinutes;
          setMode('focus');
          setRemainingSec(focusMinutes * 60);
          setTotalDurationSec(focusMinutes * 60);
          setStatus('idle');
        }

        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to initialize Timerra database:', err);
        setIsLoaded(true); // render anyway with fallbacks
      }
    };
    initApp();
  }, []);

  // Write live running/paused timer state to localStorage continuously (saves work state securely)
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      mode,
      status,
      remainingSec,
      elapsedSec,
      totalDurationSec,
      cycle,
      subject: settings.subject,
      unloggedStudySec: unloggedStudySecRef.current,
      lastSaved: Date.now()
    };
    localStorage.setItem('timerra_live_timer_state', JSON.stringify(stateToSave));
  }, [mode, status, remainingSec, elapsedSec, totalDurationSec, cycle, settings.subject, isLoaded]);

  // --- Active Timer Thread (Tab Throttling proof RAF) ---
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Advance to next cycle phase
  const advancePhase = useCallback(async (isNaturalComplete = true) => {
    playComplete();

    const isStudyMode = mode === 'focus' || mode === 'deepFocus' || mode === 'sprint' || mode === 'marathon' || mode === 'zen';

    // Persist all accumulated study time up to this natural complete phase
    if (isStudyMode) {
      await commitUnloggedStudySec(true);
    }

    // Phase progression logic (focus/study -> shortBreak -> focus/study -> longBreak)
    let nextMode: TimerMode = 'focus';
    let nextCycle = cycle;

    const studyModes = ['focus', 'deepFocus', 'sprint', 'marathon', 'zen'];
    if (studyModes.includes(mode)) {
      if (cycle >= settings.cyclesBeforeLongBreak) {
        nextMode = 'longBreak';
        nextCycle = 1;
      } else {
        nextMode = 'shortBreak';
        nextCycle = cycle + 1;
      }
    } else {
      nextMode = 'focus';
    }

    setMode(nextMode);
    setCycle(nextCycle);

    // Compute duration for the advanced mode
    let nextDurSec = settings.focusMinutes * 60;
    if (nextMode === 'shortBreak') nextDurSec = settings.shortBreakMinutes * 60;
    else if (nextMode === 'longBreak') nextDurSec = settings.longBreakMinutes * 60;

    setRemainingSec(nextDurSec);
    setTotalDurationSec(nextDurSec);

    // Dispatch critical session progress notifications to central logs & trigger browser popups
    if (isNaturalComplete) {
      if (isStudyMode) {
        NotificationManager.addNotification(
          'Focus Session Completed! 🎉',
          `Well done! You have completed your "${settings.subject}" focus session. Time for a well-deserved recovery break.`,
          'Focus Goals',
          true, // Critical alert - bypasses silence storage
          isFocusSilenceMode
        );
      } else {
        NotificationManager.addNotification(
          'Break Finished! ⚡',
          `Your recovery break has ended. Let's return to focus and power up the next study cycle.`,
          'Focus Goals',
          true, // Critical alert - bypasses silence storage
          isFocusSilenceMode
        );
      }
    }

    if (settings.autoAdvance) {
      setStatus('running');
      vibrateStart();
    } else {
      setStatus('idle');
    }
  }, [mode, cycle, settings, isFocusSilenceMode]);

  useEffect(() => {
    if (status !== 'running') {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      lastWallTimeRef.current = null;
      return;
    }

    lastWallTimeRef.current = Date.now();

    const tick = () => {
      if (lastWallTimeRef.current === null) {
        lastWallTimeRef.current = Date.now();
        return;
      }
      const now = Date.now();
      const dt = (now - lastWallTimeRef.current) / 1000;
      if (dt <= 0) return;
      lastWallTimeRef.current = now;

      const isStudyMode = mode === 'focus' || mode === 'deepFocus' || mode === 'sprint' || mode === 'marathon' || mode === 'zen' || mode === 'infinityFocus';

      if (mode === 'stopwatch' || mode === 'infinityFocus') {
        setElapsedSec((prev) => {
          const next = prev + dt;
          if (mode === 'infinityFocus') {
            unloggedStudySecRef.current += dt;
            if (unloggedStudySecRef.current >= 60) {
              commitUnloggedStudySec(false);
            }
          }
          return next;
        });
      } else {
        setRemainingSec((prev) => {
          const next = prev - dt;
          if (isStudyMode) {
            unloggedStudySecRef.current += dt;
            if (unloggedStudySecRef.current >= 60) {
              commitUnloggedStudySec(false);
            }
          }
          if (next <= 0) {
            // Completed focus timer session
            setTimeout(() => {
              advancePhase();
            }, 0);
            return 0;
          }
          return next;
        });
      }
    };

    const loop = () => {
      tick();
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    // Fallback interval to keep updating timer when backgrounded/throttled
    const fallbackInterval = setInterval(() => {
      tick();
    }, 1000);

    // Visibility change listener for instant foreground synchronization
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      clearInterval(fallbackInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, mode, advancePhase, commitUnloggedStudySec]);

  // Metronome study ticking trigger
  const lastSecondRef = useRef<number>(-1);
  useEffect(() => {
    if (status === 'running' && settings.tickSound) {
      const currentSec = Math.floor(mode === 'stopwatch' || mode === 'infinityFocus' ? elapsedSec : remainingSec);
      if (currentSec !== lastSecondRef.current) {
        lastSecondRef.current = currentSec;
        playTick();
      }
    }
  }, [remainingSec, elapsedSec, status, settings.tickSound, mode]);

  // --- Event Handlers ---
  const handleTogglePlay = useCallback(async () => {
    playClick();
    if (status === 'running') {
      setStatus('paused');
      vibratePause();
      await commitUnloggedStudySec(true);
    } else {
      setStatus('running');
      vibrateStart();
    }
  }, [status, mode, commitUnloggedStudySec]);

  const handleReset = useCallback(async () => {
    playClick();
    const isStudyMode = mode === 'focus' || mode === 'deepFocus' || mode === 'sprint' || mode === 'marathon' || mode === 'zen' || mode === 'infinityFocus';
    
    if (isStudyMode) {
      await commitUnloggedStudySec(true);

      // Transition to next break mode automatically
      let nextMode: TimerMode = 'shortBreak';
      let nextCycle = cycle;

      if (cycle >= settings.cyclesBeforeLongBreak) {
        nextMode = 'longBreak';
        nextCycle = 1;
      } else {
        nextMode = 'shortBreak';
        nextCycle = cycle + 1;
      }

      setMode(nextMode);
      setCycle(nextCycle);

      let nextDurSec = settings.shortBreakMinutes * 60;
      if (nextMode === 'longBreak') {
        nextDurSec = settings.longBreakMinutes * 60;
      }

      setRemainingSec(nextDurSec);
      setTotalDurationSec(nextDurSec);
      setStatus('running'); // Start break immediately!
      vibrateStart();
    } else {
      // If already a break, reset to idle focus mode
      setStatus('idle');
      setMode('focus');
      const focusMinutes = settings.focusMinutes;
      setRemainingSec(focusMinutes * 60);
      setTotalDurationSec(focusMinutes * 60);
      unloggedStudySecRef.current = 0;
    }
  }, [mode, cycle, settings, commitUnloggedStudySec]);

  const handleSkip = useCallback(async () => {
    playClick();
    await commitUnloggedStudySec(true);
    advancePhase(false);
  }, [advancePhase, commitUnloggedStudySec]);

  // Fluid transition between modes (seamless morphing triggers)
  const handleModeChange = useCallback(async (newMode: TimerMode) => {
    playClick();
    await commitUnloggedStudySec(true);
    
    setMode(newMode);
    setStatus('idle');

    let duration = settings.focusMinutes * 60;
    if (newMode === 'focus') duration = settings.focusMinutes * 60;
    else if (newMode === 'deepFocus') duration = Math.max(settings.focusMinutes, 45) * 60;
    else if (newMode === 'shortBreak') duration = settings.shortBreakMinutes * 60;
    else if (newMode === 'longBreak') duration = settings.longBreakMinutes * 60;
    else if (newMode === 'sprint') duration = 10 * 60;
    else if (newMode === 'marathon') duration = 60 * 60;
    else if (newMode === 'zen') duration = 20 * 60;

    if (newMode === 'stopwatch' || newMode === 'infinityFocus') {
      setElapsedSec(0);
    } else {
      setRemainingSec(duration);
      setTotalDurationSec(duration);
    }
  }, [settings, commitUnloggedStudySec]);

  const handleToggleStopwatchMode = useCallback(() => {
    playClick();
    if (mode === 'stopwatch') {
      handleModeChange('focus');
    } else {
      handleModeChange('stopwatch');
    }
  }, [mode, handleModeChange]);

  const handleOpenSettings = useCallback(() => {
    playClick();
    setShowSettings(true);
  }, []);

  const handleOpenBackup = useCallback(() => {
    playClick();
    setShowBackup(true);
  }, []);

  const handleToggleFS = useCallback(() => {
    playClick();
    toggleFullscreen();
  }, [toggleFullscreen]);

  const handleAdjustTime = useCallback(async (minutesDelta: number) => {
    const deltaSec = minutesDelta * 60;
    
    if (mode !== 'stopwatch' && mode !== 'infinityFocus') {
      setRemainingSec((prev) => Math.max(10, prev + deltaSec));
      setTotalDurationSec((prev) => Math.max(10, prev + deltaSec));
    }
    
    let updatedField: keyof TimerSettings | null = null;
    if (mode === 'focus' || mode === 'deepFocus') updatedField = 'focusMinutes';
    else if (mode === 'shortBreak') updatedField = 'shortBreakMinutes';
    else if (mode === 'longBreak') updatedField = 'longBreakMinutes';
    
    if (updatedField) {
      const currentVal = settings[updatedField] as number;
      const newVal = Math.max(1, currentVal + minutesDelta);
      const newSettings = {
        ...settings,
        [updatedField]: newVal
      };
      setSettings(newSettings);
      await TimerraDB.saveSettings(newSettings);
    }
  }, [mode, settings]);

  // Bind keydown hotkeys
  useHotkeys({
    onTogglePlay: isImmersiveFocus ? () => {} : handleTogglePlay,
    onReset: isImmersiveFocus ? () => {} : handleReset,
    onToggleFullscreen: isImmersiveFocus ? () => {} : handleToggleFS,
    onToggleSettings: isImmersiveFocus ? () => {} : handleOpenSettings,
    onToggleStopwatchMode: isImmersiveFocus ? () => {} : handleToggleStopwatchMode,
  });

  // Save Config update handler
  const handleSaveSettings = async (newSettings: TimerSettings) => {
    playClick();
    setSettings(newSettings);
    
    // Save to DB
    await TimerraDB.saveSettings(newSettings);

    // If active mode matches configuration change, reset duration
    if (status === 'idle') {
      if (mode === 'focus') {
        setRemainingSec(newSettings.focusMinutes * 60);
        setTotalDurationSec(newSettings.focusMinutes * 60);
      } else if (mode === 'shortBreak') {
        setRemainingSec(newSettings.shortBreakMinutes * 60);
        setTotalDurationSec(newSettings.shortBreakMinutes * 60);
      } else if (mode === 'longBreak') {
        setRemainingSec(newSettings.longBreakMinutes * 60);
        setTotalDurationSec(newSettings.longBreakMinutes * 60);
      }
    }
  };

  const handleAddSubject = async (sub: string) => {
    await TimerraDB.addSubject(sub);
    const loadedSubjects = await TimerraDB.allSubjects();
    setSubjects(loadedSubjects);
  };

  const handleRenameSubject = async (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return;
    await TimerraDB.renameSubject(oldName, newName.trim());
    const loadedSubjects = await TimerraDB.allSubjects();
    setSubjects(loadedSubjects);
    if (settings.subject === oldName) {
      const updatedSettings = { ...settings, subject: newName.trim() };
      setSettings(updatedSettings);
      await TimerraDB.saveSettings(updatedSettings);
    }
  };

  const handleDeleteSubject = async (name: string) => {
    if (subjects.length <= 1) {
      alert("At least one subject must remain in your list.");
      return;
    }
    await TimerraDB.deleteSubject(name);
    const loadedSubjects = await TimerraDB.allSubjects();
    setSubjects(loadedSubjects);
    if (settings.subject === name) {
      const remaining = loadedSubjects.filter(s => s !== name);
      const updatedSettings = { ...settings, subject: remaining[0] || 'Deep Work' };
      setSettings(updatedSettings);
      await TimerraDB.saveSettings(updatedSettings);
    }
  };

  // Clear focus database log history
  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your local focus database? All history and configurations will be reset.')) {
      playClick();
      await TimerraDB.clearAll();
      setSettings(defaultSettings);
      setSubjects(['Deep Work', 'Coding', 'Research', 'Design', 'Reading', 'Writing']);
      setSessions([]);
      setRemainingSec(defaultSettings.focusMinutes * 60);
      setTotalDurationSec(defaultSettings.focusMinutes * 60);
      setMode('focus');
      setStatus('idle');
    }
  };

  const handleRemoveSingleSession = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Delete this focus session entry?')) {
      playClick();
      // Since our simple wrapper doesn't have a single-session delete method, we can filter the backup/restore list or rewrite all sessions. Let's rewrite sessions in IndexedDB:
      // A quick and extremely reliable way:
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      // Re-initialize DB sessions (we can clear the table and put back remaining sessions)
      try {
        const dbRequest = window.indexedDB.open('TimerraDB', 1);
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const tx = db.transaction('sessions', 'readwrite');
          const store = tx.objectStore('sessions');
          store.clear();
          updated.forEach(s => {
            const copy = { ...s };
            delete copy.id; // autoincrement will regenerate
            store.add(copy);
          });
        };
      } catch (err) {
        console.error('Failed to delete session', err);
      }
    }
  };

  // --- Cryp Backup Sync triggers ---
  const handleGetBackupPayload = async () => {
    return {
      app: 'Timerra' as const,
      version: 1 as const,
      exportedAt: Date.now(),
      settings,
      sessions,
      subjects,
    };
  };

  const handleImportPayload = async (payload: BackupPayload) => {
    // Save setting profile
    setSettings(payload.settings);
    await TimerraDB.saveSettings(payload.settings);

    // Save subjects list
    for (const sub of payload.subjects) {
      await TimerraDB.addSubject(sub);
    }
    const finalSubjects = await TimerraDB.allSubjects();
    setSubjects(finalSubjects);

    // Additive merging of sessions list
    const currentList = await TimerraDB.allSessions();
    const existingTimes = new Set(currentList.map(s => s.completedAt));

    for (const s of payload.sessions) {
      if (!existingTimes.has(s.completedAt)) {
        await TimerraDB.addSession(s);
      }
    }

    const finalSessions = await TimerraDB.allSessions();
    setSessions(finalSessions);

    // Update local variables
    setRemainingSec(payload.settings.focusMinutes * 60);
    setTotalDurationSec(payload.settings.focusMinutes * 60);
    setMode('focus');
    setStatus('idle');
  };

  // --- Statistical Metric Calcs ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => {
    const sDate = new Date(s.completedAt).toISOString().split('T')[0];
    return sDate === todayStr && s.mode === 'focus';
  });

  const liveCurrentSessionMinutes = (status === 'running')
    ? ((mode === 'stopwatch' || mode === 'infinityFocus')
      ? elapsedSec / 60
      : (['focus', 'deepFocus', 'sprint', 'marathon', 'zen'].includes(mode)
        ? (totalDurationSec - remainingSec) / 60
        : 0))
    : 0;

  const totalMinutesToday = Math.round(
    todaySessions.reduce((sum, s) => sum + (s.durationSec / 60), 0) + liveCurrentSessionMinutes
  );
  const focusGoalPercent = Math.min(100, Math.round((todaySessions.length / settings.cyclesBeforeLongBreak) * 100));

  // Study Streak Days
  const calculateStreak = (allSessions: Session[]): number => {
    const focusSess = allSessions.filter(s => s.mode === 'focus');
    if (focusSess.length === 0) return 0;

    const uniqueDates = Array.from(new Set(
      focusSess.map(s => new Date(s.completedAt).toISOString().split('T')[0])
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const expectedStr = new Date().toISOString().split('T')[0];
    const prevDay = new Date();
    prevDay.setDate(prevDay.getDate() - 1);
    const prevStr = prevDay.toISOString().split('T')[0];

    if (uniqueDates[0] !== expectedStr && uniqueDates[0] !== prevStr) {
      return 0;
    }

    let streak = 0;
    const tracker = new Date(uniqueDates[0]);

    for (let i = 0; i < uniqueDates.length; i++) {
      const uStr = uniqueDates[i];
      const matchStr = tracker.toISOString().split('T')[0];
      if (uStr === matchStr) {
        streak++;
        tracker.setDate(tracker.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streakDays = calculateStreak(sessions);
  const totalOverallFocusHours = (sessions.filter(s => s.mode === 'focus').reduce((sum, s) => sum + (s.durationSec / 3600), 0)).toFixed(1);

  if (!isHydrated || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#060814] flex flex-col items-center justify-center font-sans text-white">
        <div className="w-10 h-10 border-2 border-t-blue-500 border-white/5 rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-widest font-bold uppercase text-slate-400">
          Loading Environment...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen theme-${settings.theme} bg-gradient-to-b from-tm-bg-from to-tm-bg-to text-white font-sans transition-all duration-700 ease-in-out`}>
      
      {/* Branded Defs Gradients */}
      <BrandedDefs />
      
      {/* HEADER NAVBAR */}
      {!isFullscreen && (
        <header className="px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/[0.03] max-w-7xl mx-auto animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-tm-primary to-tm-accent flex items-center justify-center shadow-[0_0_15px_-2px_var(--tm-glow)]">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-mono text-base font-extrabold tracking-[0.25em] text-white uppercase">
                TIME<span className="text-tm-primary">RRA</span>
              </span>
              <span className="hidden xs:inline-block text-[8px] bg-white/5 text-slate-400 font-bold px-1.5 py-0.5 rounded ml-2 border border-white/5">v1.1</span>
            </div>
          </div>

          {/* Subjects board Selector widget in Navbar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Vault Milestone button */}
            <button
              onClick={() => { playClick(); setShowMilestoneVault(true); }}
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all cursor-pointer relative"
              title="Milestone Vault"
            >
              <Award className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline font-bold">Vault</span>
              {unseenVaultCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#060814] animate-pulse" />
              )}
            </button>

            {/* Legacy Cards button */}
            <button
              onClick={() => { playClick(); setShowLegacyCardCenter(true); }}
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Legacy Cards"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-bold">Legacy Cards</span>
            </button>

            {/* Logs Notification Center Button */}
            <button
              onClick={() => { playClick(); setShowNotificationCenter(true); }}
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all cursor-pointer relative"
              title="Workspace Logs"
            >
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline font-bold">Logs</span>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center border border-[#060814]">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Immersive Focus button */}
            <button
              onClick={() => { playClick(); setIsImmersiveFocus(true); }}
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all cursor-pointer animate-pulse"
              title="Immersive Focus"
            >
              <Eye className="w-3.5 h-3.5 text-tm-primary" />
              <span className="hidden sm:inline font-bold text-white">Immersive</span>
            </button>

            <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-1.5 text-xs text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-tm-primary" />
              <span className="font-bold">Subject:</span>
              <select
                value={settings.subject}
                onChange={(e) => handleSaveSettings({ ...settings, subject: e.target.value })}
                className="bg-transparent border-none text-white focus:outline-none focus:ring-0 font-medium ml-1 cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s} value={s} className="bg-[#0b1020] text-white">{s}</option>
                ))}
              </select>
            </div>
          </div>
        </header>
      )}

      {/* CENTRAL TIMER GRID */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center w-full transition-all duration-500 ${isFullscreen ? 'justify-center min-h-screen py-12' : 'py-6 sm:py-12'}`}>
        
        {/* Dynamic 9-Mode Navigation Dock */}
        <ModeSelector activeMode={mode} onChangeMode={handleModeChange} />

        {/* Progress Summary at a Glance */}
        {!isFullscreen && (
          <div className="flex items-center gap-6 mt-6 mb-4 sm:mb-8 bg-white/[0.01] border border-white/5 rounded-3xl px-6 py-3 text-xs leading-none animate-fade-in">
            <div className="flex items-center gap-2 border-r border-white/5 pr-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400 font-medium">Daily Goal:</span>
              <span className="text-white font-bold font-mono">{todaySessions.length}/{settings.cyclesBeforeLongBreak}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-tm-primary" />
              <span className="text-slate-400 font-medium">Focused:</span>
              <span className="text-white font-bold font-mono">{totalMinutesToday} mins</span>
            </div>
          </div>
        )}

        {/* 3D Glass Orb Timer Display */}
        <CircularTimer
          mode={mode}
          status={status}
          remainingSec={remainingSec}
          elapsedSec={elapsedSec}
          totalDurationSec={totalDurationSec}
          cycle={cycle}
          subject={settings.subject}
          isFullscreen={isFullscreen}
        />

        {/* Curved Buttons Deck */}
        {!isFullscreen ? (
          <ArcuateDeck
            status={status}
            mode={mode}
            isFullscreen={isFullscreen}
            onTogglePlay={handleTogglePlay}
            onReset={handleReset}
            onSkip={handleSkip}
            onOpenSettings={handleOpenSettings}
            onOpenBackup={handleOpenBackup}
            onToggleFullscreen={handleToggleFS}
          />
        ) : (
          /* Minimalist Fullscreen Floating Control Panel (highly elegant, glassmorphic, zero distractions) */
          <div className="fixed bottom-8 flex items-center gap-4 bg-black/45 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 transition-all duration-300 hover:scale-105">
            <button
              onClick={handleTogglePlay}
              className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer active:scale-95"
              title={status === 'running' ? 'Pause' : 'Play'}
            >
              {status === 'running' ? <Pause className="w-5 h-5 text-tm-primary animate-pulse" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer active:scale-95"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleToggleFS}
              className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer active:scale-95"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5 text-tm-accent" />
            </button>
          </div>
        )}

        {/* STATIONS & STATISTICS DIVISION ROW */}
        {!isFullscreen && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 animate-fade-in">
          
          {/* Column 1: Multi-track audio ambient mixer */}
          <div className="lg:col-span-1">
            <AmbientMixer 
              timerStatus={status}
              timerMode={mode}
            />
          </div>

          {/* Columns 2-3: Performance analysis dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl tm-glass space-y-6">
              
              {/* Stats title bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-tm-primary/10 text-tm-primary border border-tm-primary/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Metrics & Insights</h3>
                    <p className="text-[10px] text-slate-500">Offline Study Intelligence Analyzer</p>
                  </div>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer self-start sm:self-auto flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Stats
                </button>
              </div>

              {/* High-level metrics blocks */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-tm-primary/5 rounded-full blur-xl" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-tm-primary" />
                    Today Mins
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-2">{totalMinutesToday}</span>
                  <span className="text-[9px] text-slate-400 mt-1">{focusGoalPercent}% of goal completed</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-tm-accent/5 rounded-full blur-xl" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-tm-accent" />
                    Focus Streak
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-2">
                    {streakDays} <span className="text-[10px] font-sans font-semibold text-slate-400">days</span>
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1">keep streak active!</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-purple-500/5 rounded-full blur-xl" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
                    <Award className="w-3 h-3 text-purple-400" />
                    Total Hours
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-2">
                    {totalOverallFocusHours} <span className="text-[10px] font-sans font-semibold text-slate-400">hrs</span>
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1">{sessions.filter(s => s.mode === 'focus').length} Focus cycles total</span>
                </div>
              </div>

              {/* Side-by-side Recharts displays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 pl-0.5">
                    <BarChart2 className="w-3.5 h-3.5 text-tm-primary" />
                    Weekly Focus Frequency
                  </h4>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <WeeklyBarChart sessions={sessions} />
                  </div>
                </div>

                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 pl-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-tm-primary" />
                    Subjects Concentration
                  </h4>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <SubjectPieChart sessions={sessions} />
                  </div>
                </div>
              </div>

              {/* Focus Completion history list */}
              <div className="space-y-3 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 pl-0.5">
                  <History className="w-3.5 h-3.5 text-tm-primary" />
                  Recent Study Sessions
                </h4>
                
                {sessions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-white/[0.01] border border-white/5 rounded-2xl">
                    No focus sessions logged in this device yet. Start your first session above!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {sessions.slice().reverse().slice(0, 10).map((s) => (
                      <div 
                        key={s.id || s.completedAt}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-tm-primary" />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">{s.subject}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                              {new Date(s.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {Math.round(s.durationSec / 60)} mins
                          </span>
                          <button
                            onClick={() => handleRemoveSingleSession(s.id)}
                            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
        )}

      </main>

      {/* FOOTER STRAPLINE */}
      {!isFullscreen && (
        <footer className="w-full text-center py-10 mt-16 border-t border-white/[0.03] select-none text-[10px] text-slate-500 uppercase font-semibold tracking-[0.2em] max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <span>Timerra — Advanced End-to-End Encrypted Offline Sync</span>
          <span>Secure Local Client • PBKDF2 + AES-GCM</span>
        </footer>
      )}

      {/* CONFIGURATION MODAL */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          subjects={subjects}
          onSaveSettings={handleSaveSettings}
          onAddSubject={handleAddSubject}
          onRenameSubject={handleRenameSubject}
          onDeleteSubject={handleDeleteSubject}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* BACKUP CENTER MODAL */}
      {showBackup && (
        <AuthModal
          onClose={() => setShowBackup(false)}
          onGetBackupPayload={handleGetBackupPayload}
          onImportPayload={handleImportPayload}
        />
      )}

      {/* MILESTONE VAULT MODAL */}
      {showMilestoneVault && (
        <MilestoneVault
          onClose={() => setShowMilestoneVault(false)}
          sessions={sessions}
          streakDays={streakDays}
          totalFocusHours={totalOverallFocusHours}
        />
      )}

      {/* LEGACY CARDS CENTER MODAL */}
      {showLegacyCardCenter && (
        <LegacyCardCenter
          onClose={() => setShowLegacyCardCenter(false)}
          sessions={sessions}
          streakDays={streakDays}
          totalFocusHours={totalOverallFocusHours}
        />
      )}

      {/* CINEMATIC CEREMONY OVERLAY */}
      {ceremonyQueue.length > 0 && !isImmersiveFocus && (
        <MilestoneCeremony
          milestone={ceremonyQueue[0]}
          onClose={() => setCeremonyQueue(prev => prev.slice(1))}
        />
      )}

      {/* IMMERSIVE FOCUS STUDY ENVIRONMENT */}
      {isImmersiveFocus && (
        <ImmersiveFocus
          mode={mode}
          status={status}
          remainingSec={remainingSec}
          elapsedSec={elapsedSec}
          totalDurationSec={totalDurationSec}
          cycle={cycle}
          subject={settings.subject}
          settings={settings}
          todaySessionsCount={todaySessions.length}
          totalMinutesToday={totalMinutesToday}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          onSkip={handleSkip}
          onAdjustTime={handleAdjustTime}
          onExit={() => setIsImmersiveFocus(false)}
          isSilenceModeActive={isFocusSilenceMode}
        />
      )}

      {/* CENTRAL LOGS NOTIFICATION CENTER */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        isSilenceModeActive={isFocusSilenceMode}
        onToggleSilenceMode={() => setIsFocusSilenceMode(p => !p)}
      />

    </div>
  );
}
