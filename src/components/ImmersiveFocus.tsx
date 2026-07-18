import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw,
  SkipForward, 
  Minimize2, 
  Maximize2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Keyboard,
  SlidersHorizontal,
  Sparkles,
  Palette,
  Check,
  ChevronRight,
  Sliders,
  ChevronDown,
  Info,
  Square,
  Plus,
  Trash,
  Edit3
} from 'lucide-react';
import { TimerMode, TimerStatus, TimerSettings } from '../types';
import { MODES } from './ModeSelector';
import { playClick as basePlayClick } from '../lib/audio';

// --- Orb Customization Interfaces ---
export interface OrbConfig {
  size: 'small' | 'medium' | 'large' | 'xl';
  theme: 'glass' | 'crystal' | 'galaxy' | 'aurora' | 'neon' | 'minimal' | 'ocean' | 'fire' | 'forest' | 'moon';
  glow: 'off' | 'low' | 'medium' | 'high';
  colorType: 'picker' | 'preset' | 'gradient';
  customColor: string;
  presetPalette: 'cyan' | 'gold' | 'purple' | 'crimson' | 'emerald';
  border: 'soft' | 'bright' | 'animated' | 'static';
  speed: 'slow' | 'normal' | 'fast';
  transparency: number; // 0 to 100
  reflection: number; // 0 to 100
  shadow: 'off' | 'low' | 'medium' | 'high';
  particleDensity: 'off' | 'low' | 'medium' | 'high';
}

// --- Background Customization Interfaces ---
export interface BgConfig {
  blur: 'none' | 'low' | 'medium' | 'high' | 'ultra';
  brightness: number; // 0 to 100
  darkOverlay: number; // 0 to 100
  particleDensity: 'off' | 'low' | 'medium' | 'high';
  ambientGlow: 'off' | 'low' | 'medium' | 'high';
  bgOpacity: number; // 0 to 100
  disableParticles: boolean;
  reduceMotion: boolean;
}

const DEFAULT_ORB_CONFIG: OrbConfig = {
  size: 'large',
  theme: 'glass',
  glow: 'medium',
  colorType: 'preset',
  customColor: '#38bdf8',
  presetPalette: 'cyan',
  border: 'soft',
  speed: 'normal',
  transparency: 90,
  reflection: 80,
  shadow: 'medium',
  particleDensity: 'medium'
};

const DEFAULT_BG_CONFIG: BgConfig = {
  blur: 'high',
  brightness: 30,
  darkOverlay: 85,
  particleDensity: 'medium',
  ambientGlow: 'medium',
  bgOpacity: 100,
  disableParticles: false,
  reduceMotion: false
};

const hexToRgb = (hex: string): string => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '56, 189, 248';
};

interface ImmersiveFocusProps {
  mode: TimerMode;
  status: TimerStatus;
  remainingSec: number;
  elapsedSec: number;
  totalDurationSec: number;
  cycle: number;
  subject: string;
  settings: TimerSettings;
  todaySessionsCount: number;
  totalMinutesToday: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onStop: () => void;
  onSkip: () => void;
  onExit: () => void;
  onAdjustTime: (deltaMins: number) => void;
  isSilenceModeActive?: boolean;
  subjects?: string[];
  onAddSubject?: (sub: string) => Promise<void>;
  onRenameSubject?: (oldName: string, newName: string) => Promise<void>;
  onDeleteSubject?: (name: string) => Promise<void>;
  onSaveSettings?: (newSettings: TimerSettings) => Promise<void>;
  onModeChange?: (newMode: TimerMode) => Promise<void>;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedY: number;
  speedX: number;
  color: string;
}

// --- Custom Hook for Focus Transition ---
export function useFocusTransition(isActive: boolean, onExitCallback: () => void, durationMs: number = 1500) {
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsEntering(true);
      const timer = setTimeout(() => {
        setIsEntering(false);
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [isActive, durationMs]);

  const triggerExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onExitCallback();
    }, durationMs);
  };

  return {
    isEntering,
    isExiting,
    triggerExit,
  };
}

export const ImmersiveFocus: React.FC<ImmersiveFocusProps> = ({
  mode,
  status,
  remainingSec,
  elapsedSec,
  totalDurationSec,
  cycle,
  subject,
  settings,
  todaySessionsCount,
  totalMinutesToday,
  onTogglePlay,
  onReset,
  onStop,
  onSkip,
  onExit,
  onAdjustTime,
  isSilenceModeActive = false,
  subjects = ['Deep Work', 'Coding', 'Research', 'Design', 'Reading', 'Writing'],
  onAddSubject,
  onRenameSubject,
  onDeleteSubject,
  onSaveSettings,
  onModeChange,
}) => {
  // --- Focus transition setup (1.5s CSS transition) ---
  const { isEntering, isExiting, triggerExit } = useFocusTransition(true, onExit, 1500);

  // Silence clicks during silence mode
  const playClick = () => {
    if (!isSilenceModeActive) {
      basePlayClick();
    }
  };
  // --- Orb & Background Customization State Hooks ---
  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState<'orb' | 'bg'>('orb');

  const [orbConfig, setOrbConfig] = useState<OrbConfig>(() => {
    const saved = localStorage.getItem('timerra_orb_config');
    if (saved) {
      try {
        return { ...DEFAULT_ORB_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_ORB_CONFIG;
      }
    }
    return DEFAULT_ORB_CONFIG;
  });

  const [bgConfig, setBgConfig] = useState<BgConfig>(() => {
    const saved = localStorage.getItem('timerra_bg_config');
    if (saved) {
      try {
        return { ...DEFAULT_BG_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_BG_CONFIG;
      }
    }
    return DEFAULT_BG_CONFIG;
  });

  // Save changes locally
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isRenamingSubject, setIsRenamingSubject] = useState(false);
  const [renameSubjectName, setRenameSubjectName] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    localStorage.setItem('timerra_orb_config', JSON.stringify(orbConfig));
  }, [orbConfig]);

  useEffect(() => {
    localStorage.setItem('timerra_bg_config', JSON.stringify(bgConfig));
  }, [bgConfig]);

  // --- Cursor and Controls Visibility ---
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  const stateRef = useRef({
    showConfig,
    showShortcuts,
    isAddingSubject,
    isRenamingSubject,
  });

  useEffect(() => {
    stateRef.current = {
      showConfig,
      showShortcuts,
      isAddingSubject,
      isRenamingSubject,
    };
  }, [showConfig, showShortcuts, isAddingSubject, isRenamingSubject]);

  // Handle activity detection (Mouse movement, pointer move, click, touch, key, and scroll)
  const handleActivity = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }

    const { showConfig: currentShowConfig, showShortcuts: currentShowShortcuts, isAddingSubject: currentIsAddingSubject, isRenamingSubject: currentIsRenamingSubject } = stateRef.current;
    
    // Check if any input element is active/focused
    const isInputFocused = document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA' || 
      document.activeElement.tagName === 'SELECT'
    );

    if (currentShowConfig || currentShowShortcuts || isInputFocused || currentIsAddingSubject || currentIsRenamingSubject) {
      // Do not auto-hide controls while configuring or typing
      return;
    }

    controlsTimeoutRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    handleActivity();
  }, [showConfig, showShortcuts, isAddingSubject, isRenamingSubject]);

  useEffect(() => {
    // Initial activity trigger
    handleActivity();

    const events = ['mousemove', 'pointermove', 'touchstart', 'click', 'keydown', 'wheel'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    window.addEventListener('focus', handleActivity, true);
    window.addEventListener('blur', handleActivity, true);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('focus', handleActivity, true);
      window.removeEventListener('blur', handleActivity, true);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // --- Mobile detection & landscape helpers ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Clock Settings ---
  const [showClock, setShowClock] = useState(() => {
    return localStorage.getItem('timerra_immersive_clock') !== 'false';
  });
  const [currentTime, setCurrentTime] = useState('');

  // --- Dynamic Particles (HTML5 Canvas Ref for high-performance 60fps) ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Golden completion glow state ---
  const [goldenBlast, setGoldenBlast] = useState(false);
  const prevRemainingSecRef = useRef(remainingSec);

  // --- Fullscreen State ---
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Safe ref to avoid stale closures in listeners
  const latestRef = useRef({ isFullscreen, status });
  useEffect(() => {
    latestRef.current = { isFullscreen, status };
  }, [isFullscreen, status]);

  // Handle activity timeout trigger on fullscreen changes
  useEffect(() => {
    handleActivity();
  }, [isFullscreen]);



  // Update Clock continuously
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync clock preference
  useEffect(() => {
    localStorage.setItem('timerra_immersive_clock', String(showClock));
  }, [showClock]);

  // Generate background cinematic floating particles directly on canvas (bypasses React state updates for 60 FPS performance)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let width = canvas.width = canvas.clientWidth;
    let height = canvas.height = canvas.clientHeight;

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = canvas.clientWidth;
        height = canvas.height = canvas.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    let pCount = 30;
    if (bgConfig.disableParticles || bgConfig.particleDensity === 'off') {
      pCount = 0;
    } else if (bgConfig.particleDensity === 'low') {
      pCount = 12;
    } else if (bgConfig.particleDensity === 'high') {
      pCount = 55;
    }

    if (pCount === 0) {
      ctx.clearRect(0, 0, width, height);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    const particlesList = Array.from({ length: pCount }).map((_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height + height, // Start below or randomly within the height
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      speedY: (Math.random() * 0.8 + 0.2) * (bgConfig.reduceMotion ? 0.2 : 1),
      speedX: ((Math.random() - 0.5) * 0.3) * (bgConfig.reduceMotion ? 0.2 : 1),
      color: idx % 3 === 0 ? 'rgba(251, 191, 36, ' : idx % 3 === 1 ? 'rgba(34, 211, 238, ' : 'rgba(255, 255, 255, ', // Prefix for dynamic alpha
    }));

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, width, height);

      particlesList.forEach(p => {
        // Move particle
        p.y -= p.speedY;
        p.x += p.speedX;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.x = Math.random() * width;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.opacity + ')';
        ctx.fill();

        // Optional shadow/glow effect for larger particles
        if (p.size > 2) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color + '0.5)';
        } else {
          ctx.shadowBlur = 0;
        }
      });

      animFrame = requestAnimationFrame(updateAndDraw);
    };

    animFrame = requestAnimationFrame(updateAndDraw);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [bgConfig.disableParticles, bgConfig.particleDensity, bgConfig.reduceMotion]);

  // Monitor session completion trigger for Golden Energy Burst
  useEffect(() => {
    const prev = prevRemainingSecRef.current;
    // When count reaches zero from positive count
    if (prev > 0 && remainingSec === 0 && (mode === 'focus' || mode === 'deepFocus' || mode === 'sprint' || mode === 'marathon' || mode === 'zen')) {
      setGoldenBlast(true);
      const timer = setTimeout(() => setGoldenBlast(false), 5000);
      return () => clearTimeout(timer);
    }
    prevRemainingSecRef.current = remainingSec;
  }, [remainingSec, mode]);



  // Screen orientation helper for mobile
  const handleToggleOrientation = () => {
    try {
      playClick();
      const orientation = screen.orientation as any;
      if (window.innerHeight > window.innerWidth) {
        // currently portrait, request landscape
        if (orientation && orientation.lock) {
          orientation.lock('landscape').catch((err: any) => {
            console.log("Orientation lock failed:", err);
          });
        }
      } else {
        // currently landscape, unlock
        if (orientation && orientation.unlock) {
          orientation.unlock();
        }
      }
    } catch (err) {
      console.warn("Screen orientation not fully supported:", err);
    }
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Handle local keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Space bar: Play/Pause
          e.preventDefault();
          onTogglePlay();
          handleActivity();
          break;
        case 'r': // Restart/Reset
          e.preventDefault();
          onReset();
          handleActivity();
          break;
        case 's': // Stop
          e.preventDefault();
          onStop();
          handleActivity();
          break;
        case 'n': // Next Session (Skip)
          e.preventDefault();
          onSkip();
          handleActivity();
          break;
        case 'f': // Toggle Fullscreen
          e.preventDefault();
          toggleFullscreen();
          handleActivity();
          break;
        case 'c': // Toggle customization config
          e.preventDefault();
          playClick();
          setShowConfig(prev => !prev);
          handleActivity();
          break;
        case 'h':
        case '?':
          e.preventDefault();
          playClick();
          setShowShortcuts(prev => !prev);
          handleActivity();
          break;
        case 'escape': // Exit Immersive or Close Shortcuts/Config
          e.preventDefault();
          if (showShortcuts) {
            playClick();
            setShowShortcuts(false);
          } else if (showConfig) {
            playClick();
            setShowConfig(false);
          } else {
            triggerExit();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onReset, onStop, onSkip, triggerExit, showShortcuts, showConfig]);

  // Compute fill ratio
  let fillLevel = 0;
  if (mode === 'stopwatch' || mode === 'infinityFocus') {
    fillLevel = Math.min(1, elapsedSec / 3600);
  } else if (totalDurationSec > 0) {
    fillLevel = Math.max(0, Math.min(1, remainingSec / totalDurationSec));
  }

  // Wave position
  const waveY = 92 - fillLevel * 84;

  // Formatting Stopwatch Time (HH:MM:SS.MS)
  const renderStopwatch = () => {
    const totalMs = Math.floor(elapsedSec * 1000);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
      <div className="flex items-baseline justify-center font-mono select-none cursor-default tabular-nums text-[7.5vw] md:text-[5vw] lg:text-[4.5vw] font-black tracking-tight leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        {h > 0 && (
          <>
            <span>{pad(h)}</span>
            <span className="text-[5vw] md:text-[3.5vw] font-medium mx-1 text-white/50">:</span>
          </>
        )}
        <span>{pad(m)}</span>
        <span className="text-[5vw] md:text-[3.5vw] font-medium mx-1 text-white/50">:</span>
        <span>{pad(s)}</span>
        <span className="text-[5vw] md:text-[3.5vw] font-medium mx-0.5 text-tm-primary">.</span>
        <span className="text-[5.5vw] md:text-[3.8vw] font-extrabold text-tm-primary/80">{pad(ms)}</span>
      </div>
    );
  };

  // Formatting Countdown Timer (MM:SS)
  const renderStandardTime = () => {
    const displaySecs = mode === 'infinityFocus' ? elapsedSec : remainingSec;
    const totalSeconds = Math.ceil(displaySecs);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
      <div 
        className="font-mono font-black select-none cursor-default tabular-nums text-[10vw] sm:text-[8vw] md:text-[6.5vw] lg:text-[6vw] leading-none text-white transition-all duration-300"
        style={{ textShadow: '0 4px 30px rgba(0, 0, 0, 0.7), 0 0 24px var(--tm-glow)' }}
      >
        {h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
      </div>
    );
  };

  const getBlurClass = () => {
    switch (bgConfig.blur) {
      case 'none': return 'backdrop-blur-none';
      case 'low': return 'backdrop-blur-sm';
      case 'medium': return 'backdrop-blur-md';
      case 'high': return 'backdrop-blur-xl';
      case 'ultra': return 'backdrop-blur-3xl';
      default: return 'backdrop-blur-xl';
    }
  };

  const blurClass = getBlurClass();

  const getOrbBorderClass = () => {
    switch (orbConfig.border) {
      case 'soft': return 'border-white/10';
      case 'bright': return 'border-white/30';
      case 'animated': return 'border-white/20 animate-pulse-border';
      case 'static': return 'border-white/20';
      default: return 'border-white/10';
    }
  };

  const getOrbThemeStyles = () => {
    const opacity = orbConfig.transparency / 100;

    let baseBg = '';
    let glowShadow = '';
    let animSpeed = orbConfig.speed === 'slow' ? '12s' : orbConfig.speed === 'fast' ? '4s' : '7s';
    
    // Determine base glow color
    let glowColor = 'var(--tm-primary)';
    if (orbConfig.colorType === 'picker') {
      glowColor = orbConfig.customColor;
    } else if (orbConfig.colorType === 'preset') {
      switch (orbConfig.presetPalette) {
        case 'gold': glowColor = '#f59e0b'; break;
        case 'cyan': glowColor = '#06b6d4'; break;
        case 'purple': glowColor = '#a855f7'; break;
        case 'crimson': glowColor = '#ef4444'; break;
        case 'emerald': glowColor = '#10b981'; break;
        default: glowColor = 'var(--tm-primary)';
      }
    } else if (orbConfig.colorType === 'gradient') {
      glowColor = 'var(--tm-accent)';
    }

    // Glow intensity multiplier
    let glowRadius = '45px';
    let glowOpacity = 0.15;
    if (orbConfig.glow === 'off') {
      glowRadius = '0px';
      glowOpacity = 0;
    } else if (orbConfig.glow === 'low') {
      glowRadius = '22px';
      glowOpacity = 0.08;
    } else if (orbConfig.glow === 'high') {
      glowRadius = '70px';
      glowOpacity = 0.28;
    }

    const rgbStr = glowColor.startsWith('#') ? hexToRgb(glowColor) : '245, 158, 11';
    glowShadow = `0 0 ${glowRadius} rgba(${rgbStr}, ${glowOpacity}), 0 0 calc(${glowRadius} * 2) rgba(${rgbStr}, ${glowOpacity * 0.45}), 0 12px 40px rgba(0, 0, 0, 0.45), inset 0 0 25px rgba(255, 255, 255, 0.06), inset 0 0 15px rgba(${rgbStr}, ${glowOpacity * 0.6})`;

    switch (orbConfig.theme) {
      case 'glass':
        baseBg = `radial-gradient(circle at 35% 35%, rgba(255,255,255,${0.14 * opacity}) 0%, rgba(255,255,255,${0.03 * opacity}) 50%, rgba(10,12,24,${0.92 * opacity}) 100%)`;
        break;
      case 'crystal':
        baseBg = `radial-gradient(circle at 25% 25%, rgba(255,255,255,${0.3 * opacity}) 0%, rgba(186,230,253,${0.08 * opacity}) 30%, rgba(3,4,14,${0.96 * opacity}) 100%)`;
        break;
      case 'galaxy':
        baseBg = `radial-gradient(circle at 35% 35%, rgba(168,85,247,${0.2 * opacity}) 0%, rgba(79,70,229,${0.1 * opacity}) 40%, rgba(3,1,12,${0.98 * opacity}) 100%)`;
        break;
      case 'aurora':
        baseBg = `radial-gradient(circle at 35% 35%, rgba(52,211,153,${0.18 * opacity}) 0%, rgba(139,92,246,${0.12 * opacity}) 50%, rgba(2,2,10,${0.96 * opacity}) 100%)`;
        break;
      case 'neon':
        baseBg = `radial-gradient(circle at center, rgba(${glowColor.startsWith('#') ? hexToRgb(glowColor) : '34, 211, 238'}, ${0.08 * opacity}) 0%, rgba(3,7,18,${0.97 * opacity}) 100%)`;
        break;
      case 'minimal':
        baseBg = `rgba(15, 23, 42, ${0.45 * opacity})`;
        break;
      case 'ocean':
        baseBg = `radial-gradient(circle at 35% 35%, rgba(56,189,248,${0.18 * opacity}) 0%, rgba(14,165,233,${0.08 * opacity}) 50%, rgba(1,10,26,${0.96 * opacity}) 100%)`;
        break;
      case 'fire':
        baseBg = `radial-gradient(circle at 35% 35%, rgba(248,113,113,${0.2 * opacity}) 0%, rgba(220,38,38,${0.08 * opacity}) 50%, rgba(12,1,1,${0.98 * opacity}) 100%)`;
        break;
      case 'forest':
        baseBg = `radial-gradient(circle at 35% 35%, rgba(52,211,153,${0.15 * opacity}) 0%, rgba(5,150,105,${0.06 * opacity}) 60%, rgba(1,5,3,${0.97 * opacity}) 100%)`;
        break;
      case 'moon':
        baseBg = `radial-gradient(circle at 35% 35%, rgba(241,245,249,${0.12 * opacity}) 0%, rgba(148,163,184,${0.04 * opacity}) 50%, rgba(4,6,12,${0.96 * opacity}) 100%)`;
        break;
      default:
        baseBg = `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.14) 0%, rgba(2,3,10,0.92) 100%)`;
    }

    return { baseBg, glowShadow, animSpeed, glowColor };
  };

  const getModeLabel = () => {
    const match = MODES.find(m => m.id === mode);
    return match ? match.themeName : 'Study Period';
  };

  const getOrbSizeMultiplier = () => {
    switch (orbConfig.size) {
      case 'small': return 0.8;
      case 'medium': return 0.95;
      case 'large': return 1.15;
      case 'xl': return 1.35;
      default: return 1.15;
    }
  };

  const { baseBg, glowShadow, animSpeed, glowColor } = getOrbThemeStyles();
  const borderClass = getOrbBorderClass();
  const isReducedMotion = bgConfig.reduceMotion;
  const sizeMultiplier = getOrbSizeMultiplier();

  // Premium responsive dynamic sizing using CSS clamping
  const orbSizeStyle = {
    width: `clamp(184px, calc(var(--orb-base-size, 46vw) * ${sizeMultiplier}), calc(var(--orb-max-size, 410px) * ${sizeMultiplier}))`,
    height: `clamp(184px, calc(var(--orb-base-size, 46vw) * ${sizeMultiplier}), calc(var(--orb-max-size, 410px) * ${sizeMultiplier}))`,
  };

  return (
    <div 
      className={`fixed inset-0 theme-${settings.theme} bg-gradient-to-b from-tm-bg-from to-tm-bg-to z-50 overflow-hidden flex flex-col items-center justify-between py-6 sm:py-10 px-4 sm:px-6 transition-all duration-[1500ms] ease-in-out ${
        (isEntering || isExiting) ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      } ${
        controlsVisible ? '' : 'cursor-none'
      }`}
      style={{
        '--orb-base-size': '45vw',
        '--orb-max-size': '480px',
        fontFamily: 'var(--font-sans)',
      } as any}
    >
      {/* Dynamic landscape and responsive adjustments */}
      <style>{`
        @media (max-height: 540px) and (orientation: landscape) {
          .adaptive-workspace {
            flex-direction: row !important;
            gap: 2.5rem !important;
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .immersive-orb-area {
            --orb-base-size: 42vh !important;
            --orb-max-size: 260px !important;
          }
          .controls-panel-container {
            margin-top: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .immersive-orb-area {
            --orb-base-size: 72vw !important;
            --orb-max-size: 310px !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .immersive-orb-area {
            --orb-base-size: 56vw !important;
            --orb-max-size: 410px !important;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes pulse-border-slow {
          0%, 100% { border-color: rgba(255, 255, 255, 0.12); box-shadow: 0 0 10px rgba(255, 255, 255, 0.02); }
          50% { border-color: ${glowColor}; box-shadow: 0 0 25px rgba(${hexToRgb(glowColor)}, 0.25); }
        }
        .animate-pulse-border {
          animation: pulse-border-slow 4s ease-in-out infinite;
        }
        @keyframes fire-ember-up {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-130px) scale(0.3); opacity: 0; }
        }
        .animate-fire-ember {
          animation: fire-ember-up 3s ease-out infinite;
        }
      `}</style>

      {/* 1. AMBIENT RADIAL GLOWING LIGHTS (Drawn first so backdrop-blur can soften them) */}
      {bgConfig.ambientGlow !== 'off' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
          <div 
            className="absolute rounded-full transition-all duration-[8000ms] ease-in-out"
            style={{
              width: '80vw',
              height: '80vw',
              filter: bgConfig.ambientGlow === 'high' ? 'blur(200px)' : bgConfig.ambientGlow === 'low' ? 'blur(100px)' : 'blur(150px)',
              opacity: bgConfig.ambientGlow === 'high' ? 0.35 : bgConfig.ambientGlow === 'low' ? 0.12 : 0.22,
              background: mode.includes('Break')
                ? 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(3, 7, 18, 0) 70%)'
                : 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(3, 7, 18, 0) 70%)',
              left: status === 'running' ? '15%' : '50%',
              top: '25%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div 
            className="absolute rounded-full transition-all duration-[9000ms] ease-in-out"
            style={{
              width: '70vw',
              height: '70vw',
              filter: bgConfig.ambientGlow === 'high' ? 'blur(180px)' : bgConfig.ambientGlow === 'low' ? 'blur(80px)' : 'blur(130px)',
              opacity: bgConfig.ambientGlow === 'high' ? 0.28 : bgConfig.ambientGlow === 'low' ? 0.1 : 0.18,
              background: mode.includes('Break')
                ? 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, rgba(3, 7, 18, 0) 75%)'
                : 'radial-gradient(circle, rgba(236, 72, 153, 0.24) 0%, rgba(3, 7, 18, 0) 75%)',
              right: status === 'running' ? '20%' : '40%',
              bottom: '15%',
              transform: 'translate(50%, 50%)',
            }}
          />
        </div>
      )}

      {/* 2. CINEMATIC GRADIENT LIGHTING BACKGROUND (Enhances theme gradient with backdrop-blur overlay on top of ambient lights) */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-[1500ms] ease-in-out"
        style={{ 
          backdropFilter: (isEntering || isExiting) ? 'blur(2px)' : 'blur(20px)',
          WebkitBackdropFilter: (isEntering || isExiting) ? 'blur(2px)' : 'blur(20px)',
          background: `radial-gradient(circle at center, rgba(4, 5, 13, ${(bgConfig.darkOverlay / 100) * 0.45}) 0%, rgba(4, 5, 13, ${bgConfig.darkOverlay / 100}) 100%)`,
          opacity: bgConfig.bgOpacity / 100,
          filter: `brightness(${bgConfig.brightness}%)`
        }}
      />

      {/* 3. GENTLE VIGNETTE EFFECT (Smoothly darkens edges to focus attention on the central timer) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-[1500ms] ease-in-out" 
        style={{
          background: (isEntering || isExiting)
            ? 'radial-gradient(circle at center, rgba(0,0,0,0) 80%, rgba(4,5,13,0.15) 100%)'
            : 'radial-gradient(circle at center, rgba(0,0,0,0) 25%, rgba(4,5,13,0.85) 100%)'
        }}
      />

      {/* Slow Breathing Ambient Background Animation */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_100%)] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />

      {/* 2. SOFT DRIFTING PARTICLES CANVAS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-hidden"
      />

      {/* 3. TOP META PANEL (Clock, Subject, Goal, Back, toggles) */}
      <div 
        className={`w-full max-w-5xl flex items-center justify-between z-10 transition-all duration-[1500ms] ease-in-out ${
          (controlsVisible && !isEntering && !isExiting) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={triggerExit}
            className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-4 h-11 rounded-2xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Minimize2 className="w-4 h-4 text-tm-primary" />
            <span className="hidden xs:inline">Exit Immersive</span>
          </button>
          
          {/* Active Goal widget */}
          <div className="hidden xs:flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 h-11 rounded-2xl text-xs text-slate-400 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-500">Goal:</span>
            <span className="text-white font-mono font-bold">{todaySessionsCount}/{settings.cyclesBeforeLongBreak}</span>
          </div>
        </div>

        {/* Center Title branding info */}
        <div className="text-center select-none">
          <span className="font-mono text-xs font-extrabold tracking-[0.4em] text-white/40 uppercase">
            TIME<span className="text-tm-primary/50">RRA</span>
          </span>
        </div>

        {/* Right Corner Control Panel */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Optional Clock toggle */}
          {showClock && (
            <div className="hidden sm:flex bg-white/[0.02] border border-white/5 px-4 h-11 rounded-2xl text-xs font-bold font-mono tracking-wider text-slate-300 items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-tm-primary" />
              <span>{currentTime}</span>
            </div>
          )}

          <button
            onClick={() => { playClick(); setShowConfig(!showConfig); }}
            className={`w-11 h-11 flex items-center justify-center border rounded-2xl transition-all cursor-pointer ${
              showConfig ? 'border-tm-primary bg-tm-primary/10 text-white shadow-[0_0_12px_var(--tm-primary)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Customization Panel (C)"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowClock(!showClock)}
            className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={showClock ? "Hide Clock" : "Show Clock"}
          >
            {showClock ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { playClick(); setShowShortcuts(true); }}
            className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Keyboard Shortcuts (H or ?)"
          >
            <Keyboard className="w-4 h-4 text-tm-primary" />
          </button>

          {isMobile && (
            <button
              onClick={handleToggleOrientation}
              className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Rotate Screen"
            >
              <RotateCw className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4. MAIN RESPONSIVE ADAPTIVE WORKSPACE */}
      <div className="flex-1 w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-14 z-10 px-4 py-4 overflow-y-auto no-scrollbar max-h-[82vh] adaptive-workspace">
        
        {/* Left Area: Hero Orb */}
        <div 
          className={`relative flex flex-col items-center justify-center immersive-orb-area transition-all duration-[1500ms] ease-in-out ${
            (isEntering || isExiting) 
              ? 'scale-[0.65] opacity-0' 
              : (!controlsVisible ? 'scale-110 sm:scale-120' : 'scale-100')
          }`}
        >
          {/* Cinematic double orbital orbits surrounding the core (responsive sizing) */}
          <div 
            className={`absolute rounded-full border border-dashed border-tm-primary/10 pointer-events-none ${isReducedMotion ? '' : 'animate-ring-1'}`}
            style={{
              width: `calc(${orbSizeStyle.width} * 1.35)`,
              height: `calc(${orbSizeStyle.height} * 1.35)`,
              transform: 'rotateX(72deg) translateZ(0)',
            }}
          />
          <div 
            className={`absolute rounded-full border-2 border-dotted border-tm-accent/10 pointer-events-none ${isReducedMotion ? '' : 'animate-ring-2'}`}
            style={{
              width: `calc(${orbSizeStyle.width} * 1.48)`,
              height: `calc(${orbSizeStyle.height} * 1.48)`,
              transform: 'rotateX(60deg) rotateY(15deg) translateZ(0)',
            }}
          />

          {/* Subtle, thin circular progress indicator around the Orb */}
          <svg 
            className={`absolute pointer-events-none z-10 transform -rotate-90 select-none ${isReducedMotion ? '' : 'animate-breathe'}`}
            style={{
              width: `calc(${orbSizeStyle.width} + 24px)`,
              height: `calc(${orbSizeStyle.height} + 24px)`,
              minWidth: '208px',
              minHeight: '208px',
              animationDuration: '7s'
            }}
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="immProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--tm-primary)" />
                <stop offset="100%" stopColor="var(--tm-accent)" />
              </linearGradient>
              <filter id="immProgressGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Subtle outer track */}
            <circle 
              cx="50" 
              cy="50" 
              r="47.5" 
              className="stroke-white/[0.03] fill-none" 
              strokeWidth="1" 
            />
            {/* Active progress arc */}
            <circle 
              cx="50" 
              cy="50" 
              r="47.5" 
              className="fill-none transition-all duration-[1000ms] ease-out" 
              stroke="url(#immProgressGrad)"
              strokeWidth="1.5" 
              strokeDasharray={2 * Math.PI * 47.5}
              strokeDashoffset={2 * Math.PI * 47.5 * (1 - fillLevel)}
              strokeLinecap="round"
              filter="url(#immProgressGlow)"
            />
          </svg>

          {/* THE IMMERSIVE RESPONSIVE ORB CORE */}
          <div 
            className={`rounded-full relative flex flex-col items-center justify-center border transition-all duration-[1200ms] ${
              isReducedMotion ? '' : 'animate-breathe'
            } ${borderClass}`}
            style={{
              ...orbSizeStyle,
              animationDuration: animSpeed,
              boxShadow: glowShadow,
              background: baseBg
            }}
          >
            {/* Glass specular sweep highlight */}
            {orbConfig.reflection > 0 && (
              <>
                <div 
                  className="absolute top-2 left-[15%] w-[70%] h-[24%] bg-gradient-to-b from-white/25 via-white/5 to-transparent rounded-[50%] blur-[1px] z-10 pointer-events-none"
                  style={{ opacity: (orbConfig.reflection / 100) * 1.2 }}
                />
                <div 
                  className="absolute bottom-2 right-[20%] w-[30%] h-[10%] bg-white/5 rounded-full blur-[3px] z-10 pointer-events-none"
                  style={{ opacity: (orbConfig.reflection / 100) * 0.5 }}
                />
                <div 
                  className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-10"
                  style={{
                    background: 'radial-gradient(circle at 75% 75%, rgba(255,255,255,0.04) 0%, transparent 60%)',
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.08)'
                  }}
                />
              </>
            )}

            {/* Dynamic Wave levels Inside Orb */}
            {(mode === 'stopwatch' || mode === 'shortBreak' || mode === 'zen' || mode === 'focus') && (
              <div 
                className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none transition-all duration-[1200ms] ease-in-out z-0 overflow-hidden rounded-full"
                style={{ transform: `translateY(${waveY}%)` }}
              >
                <div className={`absolute inset-0 w-[200%] h-full animate-wave-a opacity-15 ${
                  mode === 'focus' ? 'text-orange-500' :
                  mode === 'shortBreak' ? 'text-sky-400' :
                  mode === 'zen' ? 'text-teal-400' : 'text-blue-500'
                }`}>
                  <svg className="w-full h-full fill-current" viewBox="0 0 576 400" preserveAspectRatio="none">
                    <path d="M 0 15 Q 72 0, 144 15 T 288 15 T 432 15 T 576 15 L 576 400 L 0 400 Z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Theme Decoration Layers */}
            {orbConfig.theme === 'galaxy' && (
              <div className="absolute inset-0 z-0 pointer-events-none animate-spin" style={{ animationDuration: '35s' }}>
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-1 h-1 rounded-full bg-white animate-pulse" 
                    style={{
                      top: `${20 + (i * 12) % 60}%`,
                      left: `${15 + (i * 17) % 70}%`,
                      animationDelay: `${i * 0.5}s`,
                      boxShadow: '0 0 4px #fff'
                    }}
                  />
                ))}
              </div>
            )}

            {orbConfig.theme === 'fire' && (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-full">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-1 h-1 rounded-full bg-amber-400 animate-fire-ember opacity-60" 
                    style={{
                      bottom: '15%',
                      left: `${18 + i * 15}%`,
                      animationDelay: `${i * 0.6}s`,
                      animationDuration: `${2.2 + Math.random() * 1.5}s`
                    }}
                  />
                ))}
              </div>
            )}

            {orbConfig.theme === 'crystal' && (
              <div className="absolute inset-0 z-0 pointer-events-none border border-white/5 rotate-45 scale-[0.85] opacity-20 rounded-lg" />
            )}

            {orbConfig.theme === 'moon' && (
              <div className="absolute top-4 right-6 w-12 h-12 rounded-full border-r-2 border-slate-300/10 filter blur-[0.5px] pointer-events-none z-0" />
            )}

            {/* Inside-Orb Information Block */}
            <div className={`flex flex-col items-center justify-center text-center px-4 relative z-10 select-text transition-all duration-[1500ms] ease-in-out ${
              (isEntering || isExiting) ? 'opacity-0 scale-[0.85]' : 'opacity-100 scale-100'
            }`}>
              {/* Minimalist Subject */}
              <span className={`text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase mb-1.5 px-3 py-1 rounded-full transition-all duration-[1500ms] truncate max-w-[150px] sm:max-w-[200px] ${
                status === 'running'
                  ? 'text-tm-primary bg-tm-primary/5 border border-tm-primary/15'
                  : 'text-white/40 bg-white/[0.01]'
              } ${controlsVisible ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                {subject || 'Silent Focus'}
              </span>

              {/* HIGH-READABILITY DYNAMIC RESPONSIVE TIMER READOUT */}
              <div className={`min-h-[44px] sm:min-h-[64px] flex items-center justify-center w-full transition-all duration-[1500ms] ${
                controlsVisible ? 'scale-100' : 'scale-110 sm:scale-115'
              }`}>
                {mode === 'stopwatch' ? renderStopwatch() : renderStandardTime()}
              </div>

              {/* Dynamic Live Minute/Remaining Time Counter */}
              {mode !== 'stopwatch' && mode !== 'infinityFocus' && (
                <div className={`text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-tm-primary/90 mt-0.5 animate-pulse transition-all duration-[1500ms] ${
                  controlsVisible ? 'opacity-100' : 'opacity-60'
                }`}>
                  Remaining: {Math.floor(remainingSec / 60)}m {Math.floor(remainingSec % 60)}s
                </div>
              )}

              {/* Active Period Label */}
              <span className={`text-[9px] font-bold tracking-[0.25em] uppercase text-white/50 mt-1.5 flex items-center gap-1.5 justify-center transition-all duration-[1500ms] ${
                controlsVisible ? 'opacity-100' : 'opacity-40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'running' ? 'bg-tm-primary animate-pulse shadow-[0_0_8px_var(--tm-primary)]' : 'bg-white/20'
                }`} />
                {getModeLabel()}
              </span>

              {/* Cycle and duration estimate details */}
              {mode !== 'stopwatch' && mode !== 'infinityFocus' && (
                <span className={`text-[8px] text-white/30 uppercase tracking-[0.18em] mt-1 transition-all duration-[1500ms] ${
                  controlsVisible ? 'opacity-100 max-h-[20px]' : 'opacity-0 max-h-0 overflow-hidden mt-0'
                }`}>
                  Cycle {cycle} • {settings.cyclesBeforeLongBreak - (cycle % settings.cyclesBeforeLongBreak || settings.cyclesBeforeLongBreak)} Left
                </span>
              )}
            </div>

            {/* 5. IMMERSIVE GOLDEN ENERGY Burst Overlay on Completion */}
            {goldenBlast && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden rounded-full">
                <div className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-yellow-300/40 via-amber-400/50 to-orange-400/40 animate-explosion" style={{ animationDuration: '2.5s' }} />
                <div className="absolute w-44 h-44 rounded-full border-2 border-yellow-400/30 animate-explosion" style={{ animationDuration: '3.5s', animationDelay: '0.2s' }} />
                {[...Array(8)].map((_, idx) => {
                  const angle = `${idx * (360 / 8)}deg`;
                  const dist = `${60 + Math.random() * 60}px`;
                  return (
                    <span 
                      key={idx}
                      className="absolute w-2 h-2 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-500 shadow-[0_0_10px_#f59e0b] opacity-80"
                      style={{
                        '--angle': angle,
                        '--dist': dist,
                        animation: 'particle-drift 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                        animationDelay: `${idx * 0.08}s`
                      } as any}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Controls & Quick Action Panel */}
        <div className={`flex flex-col items-center md:items-start text-center md:text-left gap-3.5 max-w-sm sm:max-w-md w-full controls-panel-container transition-all duration-[1500ms] ease-in-out ${
          (controlsVisible && !isEntering && !isExiting) 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-12 scale-90 pointer-events-none max-h-0 md:max-w-0 md:h-0 overflow-hidden p-0 m-0 border-0'
        }`}>
          {/* Interactive Inline Control Center */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[28px] w-full text-left flex flex-col gap-3.5 shadow-xl backdrop-blur-md select-none">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-tm-primary font-bold">
                Control Center
              </span>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold bg-white/5 px-2 py-0.5 rounded-full">
                Active Settings
              </span>
            </div>

            {/* SUBJECT MANAGEMENT SECTION */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Subject</span>
                <div className="flex items-center gap-1">
                  {!isAddingSubject && !isRenamingSubject && (
                    <>
                      <button
                        onClick={() => {
                          playClick();
                          setRenameSubjectName(settings.subject);
                          setIsRenamingSubject(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer border border-white/5 active:scale-90"
                        title="Rename Current Subject"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                      <button
                        onClick={() => {
                          playClick();
                          setIsAddingSubject(true);
                          setNewSubjectName('');
                        }}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer border border-white/5 active:scale-90"
                        title="Add New Subject"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                      <button
                        onClick={async () => {
                          playClick();
                          if (subjects.length <= 1) {
                            alert("At least one subject must remain.");
                            return;
                          }
                          if (window.confirm(`Delete subject "${settings.subject}"?`)) {
                            if (onDeleteSubject) {
                              await onDeleteSubject(settings.subject);
                            }
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer border border-white/5 active:scale-90 group"
                        title="Delete Current Subject"
                      >
                        <Trash className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Add Subject Inline Form */}
              {isAddingSubject ? (
                <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full px-2"
                    placeholder="New subject..."
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        if (newSubjectName.trim() && onAddSubject) {
                          await onAddSubject(newSubjectName.trim());
                          await onSaveSettings?.({ ...settings, subject: newSubjectName.trim() });
                          setNewSubjectName('');
                        }
                        setIsAddingSubject(false);
                      } else if (e.key === 'Escape') {
                        setIsAddingSubject(false);
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      playClick();
                      if (newSubjectName.trim() && onAddSubject) {
                        await onAddSubject(newSubjectName.trim());
                        await onSaveSettings?.({ ...settings, subject: newSubjectName.trim() });
                        setNewSubjectName('');
                      }
                      setIsAddingSubject(false);
                    }}
                    className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center text-emerald-400 border border-emerald-500/30 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { playClick(); setIsAddingSubject(false); }}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 border border-white/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : isRenamingSubject ? (
                /* Rename Subject Inline Form */
                <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
                  <input
                    type="text"
                    value={renameSubjectName}
                    onChange={(e) => setRenameSubjectName(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full px-2"
                    placeholder="Rename to..."
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        if (renameSubjectName.trim() && onRenameSubject) {
                          await onRenameSubject(settings.subject, renameSubjectName.trim());
                        }
                        setIsRenamingSubject(false);
                      } else if (e.key === 'Escape') {
                        setIsRenamingSubject(false);
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      playClick();
                      if (renameSubjectName.trim() && onRenameSubject) {
                        await onRenameSubject(settings.subject, renameSubjectName.trim());
                      }
                      setIsRenamingSubject(false);
                    }}
                    className="w-7 h-7 rounded-lg bg-tm-primary/20 hover:bg-tm-primary/30 flex items-center justify-center text-tm-primary border border-tm-primary/30 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { playClick(); setIsRenamingSubject(false); }}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 border border-white/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Subject Select Dropdown */
                <select
                  value={settings.subject}
                  onChange={(e) => {
                    playClick();
                    onSaveSettings?.({ ...settings, subject: e.target.value });
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer transition-all shadow-inner"
                >
                  {subjects.map((sub) => (
                    <option key={sub} value={sub} className="bg-[#0c0f19] text-white">
                      {sub}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* TIMER MODE SECTION */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Timer Mode</span>
              <select
                value={mode}
                onChange={(e) => {
                  playClick();
                  onModeChange?.(e.target.value as TimerMode);
                }}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer transition-all"
              >
                {MODES.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0c0f19] text-white">
                    {m.themeName} ({m.name})
                  </option>
                ))}
              </select>
            </div>

            {/* DURATION CONFIGURATION ROW */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-white/5 pt-3">
              {/* Pomodoro Focus Minutes */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">
                  Focus Period
                </span>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-1 h-9">
                  <button
                    onClick={() => {
                      playClick();
                      onSaveSettings?.({ ...settings, focusMinutes: Math.max(1, settings.focusMinutes - 1) });
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-xs text-slate-300 font-bold active:scale-90"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-white px-1">
                    {settings.focusMinutes}m
                  </span>
                  <button
                    onClick={() => {
                      playClick();
                      onSaveSettings?.({ ...settings, focusMinutes: Math.min(180, settings.focusMinutes + 1) });
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-xs text-slate-300 font-bold active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Short Break Minutes */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">
                  Break Period
                </span>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-1 h-9">
                  <button
                    onClick={() => {
                      playClick();
                      onSaveSettings?.({ ...settings, shortBreakMinutes: Math.max(1, settings.shortBreakMinutes - 1) });
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-xs text-slate-300 font-bold active:scale-90"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-white px-1">
                    {settings.shortBreakMinutes}m
                  </span>
                  <button
                    onClick={() => {
                      playClick();
                      onSaveSettings?.({ ...settings, shortBreakMinutes: Math.min(60, settings.shortBreakMinutes + 1) });
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-xs text-slate-300 font-bold active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Time Adjuster */}
          {mode !== 'stopwatch' && mode !== 'infinityFocus' && (
            <div className="flex items-center gap-1 bg-white/[0.03] backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/5 shadow-xl text-[10px] select-none uppercase tracking-wider text-slate-300 w-full justify-between">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { playClick(); onAdjustTime(-5); }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer font-bold text-xs bg-white/[0.02] border border-white/5"
                  title="Subtract 5 minutes"
                >
                  -5m
                </button>
                <button 
                  onClick={() => { playClick(); onAdjustTime(-1); }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer font-bold text-xs bg-white/[0.02] border border-white/5"
                  title="Subtract 1 minute"
                >
                  -1m
                </button>
              </div>
              <span className="font-sans font-extrabold text-tm-primary px-2 select-none tracking-[0.15em] text-[10px] text-center">
                Adjust Timer
              </span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { playClick(); onAdjustTime(1); }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer font-bold text-xs bg-white/[0.02] border border-white/5"
                  title="Add 1 minute"
                >
                  +1m
                </button>
                <button 
                  onClick={() => { playClick(); onAdjustTime(5); }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer font-bold text-xs bg-white/[0.02] border border-white/5"
                  title="Add 5 minutes"
                >
                  +5m
                </button>
              </div>
            </div>
          )}

          {/* Minimal controls tray */}
          <div className="flex items-center justify-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-full border border-white/5 shadow-2xl transition-all duration-300 w-full max-w-[320px] mx-auto md:mx-0">
            <button
              onClick={onReset}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
              title="Restart Session (R)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={onStop}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-all cursor-pointer active:scale-90"
              title="Stop Focus Session & Save (S)"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-tm-primary hover:scale-105 active:scale-95 text-white transition-all cursor-pointer shadow-[0_0_15px_var(--tm-primary)]"
              title={status === 'running' ? 'Pause (Space)' : 'Play (Space)'}
            >
              {status === 'running' ? (
                <Pause className="w-6 h-6 fill-current text-white animate-pulse" />
              ) : (
                <Play className="w-6 h-6 fill-current text-white ml-0.5" />
              )}
            </button>

            <button
              onClick={onSkip}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
              title="Next Session (N)"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Keyboard shortcut guide */}
          <div className="hidden sm:block text-[8px] text-slate-500 font-bold tracking-wider uppercase mt-1 w-full text-center md:text-left select-none">
            [Space] Play/Pause • [R] Restart • [S] Stop • [N] Skip • [C] Customizer
          </div>
        </div>
      </div>

      {/* 5. MINIMAL CONTROLS TRAY TRANSITIONED HEADER/FOOTER METRICS */}
      <div 
        className={`w-full max-w-5xl flex items-center justify-center z-10 transition-all duration-[1500ms] ease-in-out pb-4 ${
          (controlsVisible && !isEntering && !isExiting) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <p className="text-[9px] text-slate-500/80 font-medium tracking-widest uppercase text-center select-none">
          TIMERRA IMMERSIVE MODE • FOCUS WITH INTENT
        </p>
      </div>

      {/* 6. GLASSMORPHIC ORB & BACKGROUND CUSTOMIZER DRAWER PANEL */}
      {showConfig && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setShowConfig(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border-l border-white/10 h-full flex flex-col shadow-2xl relative transform transition-all duration-300 animate-slide-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-tm-primary/10 border border-tm-primary/20 text-tm-primary">
                  <Palette className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="font-sans font-bold text-white text-sm tracking-wide">
                    Theme Customizer
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                    Live Dashboard Preview
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { playClick(); setShowConfig(false); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close settings panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customizer Tabs */}
            <div className="flex border-b border-white/[0.05] bg-slate-950/20 px-6 py-1">
              <button
                onClick={() => { playClick(); setConfigTab('orb'); }}
                className={`flex-1 py-3 text-center text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                  configTab === 'orb' 
                    ? 'border-tm-primary text-white font-black' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Orb Customizer
              </button>
              <button
                onClick={() => { playClick(); setConfigTab('bg'); }}
                className={`flex-1 py-3 text-center text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                  configTab === 'bg' 
                    ? 'border-tm-primary text-white font-black' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Immersive Background
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {configTab === 'orb' ? (
                <>
                  {/* Category: Theme */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-tm-primary" />
                      <span>Orb Aesthetic Theme</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'glass', name: 'Frosted Glass' },
                        { id: 'crystal', name: 'Hex Crystal' },
                        { id: 'galaxy', name: 'Space Galaxy' },
                        { id: 'aurora', name: 'Northern Lights' },
                        { id: 'neon', name: 'Vibrant Neon' },
                        { id: 'minimal', name: 'Thin Minimal' },
                        { id: 'ocean', name: 'Ocean Aqua' },
                        { id: 'fire', name: 'Ember Fire' },
                        { id: 'forest', name: 'Emerald Forest' },
                        { id: 'moon', name: 'Luna Lunar' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { playClick(); setOrbConfig(p => ({ ...p, theme: t.id as any })); }}
                          className={`px-4 py-3 rounded-2xl text-left border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            orbConfig.theme === t.id 
                              ? 'border-tm-primary bg-tm-primary/10 text-white shadow-[0_0_8px_rgba(var(--tm-primary-rgb),0.2)]' 
                              : 'border-white/5 bg-white/[0.01] text-slate-300 hover:bg-white/[0.03]'
                          }`}
                        >
                          <span>{t.name}</span>
                          {orbConfig.theme === t.id && <Check className="w-3.5 h-3.5 text-tm-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Size */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Orb Size Scaling
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'small', label: 'S' },
                        { id: 'medium', label: 'M' },
                        { id: 'large', label: 'L' },
                        { id: 'xl', label: 'XL' },
                      ].map((sz) => (
                        <button
                          key={sz.id}
                          onClick={() => { playClick(); setOrbConfig(p => ({ ...p, size: sz.id as any })); }}
                          className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                            orbConfig.size === sz.id 
                              ? 'border-tm-primary bg-tm-primary/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Color customization */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Color Palette & Glow Color
                    </label>
                    <div className="flex border border-white/5 rounded-xl overflow-hidden bg-white/[0.01] p-0.5">
                      {[
                        { id: 'preset', label: 'Preset' },
                        { id: 'picker', label: 'Custom' },
                      ].map((col) => (
                        <button
                          key={col.id}
                          onClick={() => { playClick(); setOrbConfig(p => ({ ...p, colorType: col.id as any })); }}
                          className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            orbConfig.colorType === col.id 
                              ? 'bg-white/10 text-white' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>

                    {orbConfig.colorType === 'preset' ? (
                      <div className="flex items-center justify-between gap-1.5 pt-1.5">
                        {[
                          { id: 'cyan', hex: '#06b6d4', name: 'Cyan' },
                          { id: 'gold', hex: '#f59e0b', name: 'Gold' },
                          { id: 'purple', hex: '#a855f7', name: 'Violet' },
                          { id: 'crimson', hex: '#ef4444', name: 'Crimson' },
                          { id: 'emerald', hex: '#10b981', name: 'Emerald' },
                        ].map((pal) => (
                          <button
                            key={pal.id}
                            onClick={() => { playClick(); setOrbConfig(p => ({ ...p, presetPalette: pal.id as any })); }}
                            className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                              orbConfig.presetPalette === pal.id ? 'border-white scale-110' : 'border-transparent scale-95'
                            }`}
                            style={{ backgroundColor: pal.hex }}
                            title={pal.name}
                          >
                            {orbConfig.presetPalette === pal.id && <Check className="w-4 h-4 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]" />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 pt-1.5">
                        <input 
                          type="color" 
                          value={orbConfig.customColor} 
                          onChange={(e) => setOrbConfig(p => ({ ...p, customColor: e.target.value }))}
                          className="w-10 h-10 rounded-xl bg-transparent border border-white/10 cursor-pointer p-0.5"
                        />
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase select-all">
                          {orbConfig.customColor}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category: Glow strength */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Glow Intensity
                      </label>
                      <span className="text-[10px] font-bold text-tm-primary uppercase tracking-wider">
                        {orbConfig.glow}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['off', 'low', 'medium', 'high'].map((g) => (
                        <button
                          key={g}
                          onClick={() => { playClick(); setOrbConfig(p => ({ ...p, glow: g as any })); }}
                          className={`py-2 rounded-lg border text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            orbConfig.glow === g 
                              ? 'border-tm-primary bg-tm-primary/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Border */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Orb Frame / Border style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'soft', name: 'Minimal Soft' },
                        { id: 'bright', name: 'Bright Solid' },
                        { id: 'animated', name: 'Luminous Glow' },
                        { id: 'static', name: 'Classic Static' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { playClick(); setOrbConfig(p => ({ ...p, border: b.id as any })); }}
                          className={`py-2 px-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            orbConfig.border === b.id 
                              ? 'border-tm-primary bg-tm-primary/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{b.name}</span>
                          {orbConfig.border === b.id && <Check className="w-3 h-3 text-tm-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Animation speed */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Breathing Cycle Speed
                      </label>
                      <span className="text-[10px] font-bold text-tm-primary uppercase tracking-wider">
                        {orbConfig.speed}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['slow', 'normal', 'fast'].map((s) => (
                        <button
                          key={s}
                          onClick={() => { playClick(); setOrbConfig(p => ({ ...p, speed: s as any })); }}
                          className={`py-2 rounded-lg border text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            orbConfig.speed === s 
                              ? 'border-tm-primary bg-tm-primary/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider Category: Transparency */}
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Glass Transparency
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {orbConfig.transparency}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="100" 
                      value={orbConfig.transparency} 
                      onChange={(e) => setOrbConfig(p => ({ ...p, transparency: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-tm-primary"
                    />
                  </div>

                  {/* Slider Category: Reflection */}
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Specular Mirror Reflection
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {orbConfig.reflection}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={orbConfig.reflection} 
                      onChange={(e) => setOrbConfig(p => ({ ...p, reflection: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-tm-primary"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Category: Blur settings */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Background Backdrop Blur
                      </label>
                      <span className="text-[10px] font-bold text-tm-primary uppercase tracking-wider">
                        {bgConfig.blur}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['none', 'low', 'medium', 'high', 'ultra'].map((b) => (
                        <button
                          key={b}
                          onClick={() => { playClick(); setBgConfig(p => ({ ...p, blur: b as any })); }}
                          className={`py-2 rounded-lg border text-center text-[9px] font-bold uppercase transition-all cursor-pointer ${
                            bgConfig.blur === b 
                              ? 'border-tm-primary bg-tm-primary/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider: Brightness */}
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Cinematic Background Brightness
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {bgConfig.brightness}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={bgConfig.brightness} 
                      onChange={(e) => setBgConfig(p => ({ ...p, brightness: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-tm-primary"
                    />
                  </div>

                  {/* Slider: Dark Overlay */}
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Vignette & Dark Overlay Tint
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {bgConfig.darkOverlay}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="30" 
                      max="100" 
                      value={bgConfig.darkOverlay} 
                      onChange={(e) => setBgConfig(p => ({ ...p, darkOverlay: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-tm-primary"
                    />
                  </div>

                  {/* Category: Particle Density */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Cinematic Floating Particles
                      </label>
                      <span className="text-[10px] font-bold text-tm-primary uppercase tracking-wider">
                        {bgConfig.particleDensity}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['off', 'low', 'medium', 'high'].map((d) => (
                        <button
                          key={d}
                          onClick={() => { playClick(); setBgConfig(p => ({ ...p, particleDensity: d as any })); }}
                          className={`py-2 rounded-lg border text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            bgConfig.particleDensity === d 
                              ? 'border-tm-primary bg-tm-primary/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Ambient Glow strength */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Ambient Radial Lighting Glow
                      </label>
                      <span className="text-[10px] font-bold text-tm-primary uppercase tracking-wider">
                        {bgConfig.ambientGlow}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['off', 'low', 'medium', 'high'].map((g) => (
                        <button
                          key={g}
                          onClick={() => { playClick(); setBgConfig(p => ({ ...p, ambientGlow: g as any })); }}
                          className={`py-2 rounded-lg border text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            bgConfig.ambientGlow === g 
                              ? 'border-tm-primary bg-tm-primary/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles: Disable particles and Reduce Motion */}
                  <div className="space-y-4 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={bgConfig.disableParticles}
                        onChange={(e) => setBgConfig(p => ({ ...p, disableParticles: e.target.checked }))}
                        className="rounded border-white/10 bg-slate-950 text-tm-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors block">Disable Particles completely</span>
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">For clean focus aesthetic & slow machines</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={bgConfig.reduceMotion}
                        onChange={(e) => setBgConfig(p => ({ ...p, reduceMotion: e.target.checked }))}
                        className="rounded border-white/10 bg-slate-950 text-tm-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors block">Reduce Application Motion</span>
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Stops high-energy spins & breathing loops</span>
                      </div>
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 bg-slate-950/60 border-t border-white/[0.05] flex items-center justify-between">
              <button
                onClick={() => {
                  playClick();
                  if (configTab === 'orb') {
                    setOrbConfig(DEFAULT_ORB_CONFIG);
                  } else {
                    setBgConfig(DEFAULT_BG_CONFIG);
                  }
                }}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-3 py-2 rounded-2xl text-[10px] font-bold transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Tab</span>
              </button>

              <button
                onClick={() => { playClick(); setShowConfig(false); }}
                className="bg-tm-primary text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-2xl hover:bg-opacity-90 transition-all cursor-pointer active:scale-95 shadow-lg"
              >
                Apply Live Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. GLASSMORPHIC KEYBOARD SHORTCUTS REFERENCE CARD OVERLAY */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative transform transition-all duration-300 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-tm-primary">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-sans font-bold text-white text-sm tracking-wide">
                    Timerra Shortcuts
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                    Quick Control Guide
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { playClick(); setShowShortcuts(false); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close shortcuts panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shortcut Grid */}
            <div className="p-6 space-y-4">
              {[
                { label: 'Play / Pause Session', keys: ['Space'] },
                { label: 'Restart Current Session', keys: ['R'] },
                { label: 'Skip to Next Phase', keys: ['N'] },
                { label: 'Toggle Fullscreen Mode', keys: ['F'] },
                { label: 'Theme Customizer Drawer', keys: ['C'] },
                { label: 'Toggle Shortcuts Panel', keys: ['H', '?'] },
                { label: 'Exit Immersive Focus', keys: ['ESC'] },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0 pb-3 last:pb-0">
                  <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    {item.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span className="text-[10px] text-slate-500 font-bold">or</span>}
                        <kbd className="min-w-[32px] h-6 px-2 bg-white/5 hover:bg-white/10 border-b-2 border-white/20 rounded font-mono text-[10px] text-white font-bold flex items-center justify-center shadow-inner tracking-widest uppercase">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950/40 border-t border-white/[0.05] text-center">
              <p className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">
                Press H, ?, ESC or Click Outside to Dismiss
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Keyframes injected safely */}
      <style>{`
        @keyframes breathe-gentle {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 1; }
        }
        .animate-breathe {
          animation: breathe-gentle 7s ease-in-out infinite;
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
};
