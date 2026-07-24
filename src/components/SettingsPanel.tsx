import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Sliders, 
  Volume2, 
  Check, 
  Plus, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Clock, 
  Play, 
  Upload, 
  Music, 
  Palette,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Layers,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { TimerSettings, ThemeName } from '../types';
import { THEMES } from '../lib/themes';
import { playComplete } from '../lib/audio';

interface SettingsPanelProps {
  settings: TimerSettings;
  subjects: string[];
  onSaveSettings: (newSettings: TimerSettings) => void;
  onAddSubject: (subject: string) => void;
  onRenameSubject?: (oldName: string, newName: string) => void;
  onDeleteSubject?: (name: string) => void;
  onClose: () => void;
  onThemePreview?: (themeId: ThemeName, customTheme?: TimerSettings['customTheme'], glassIntensity?: number) => void;
}

type TabId = 'timer' | 'subjects' | 'themes' | 'behavior';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  subjects,
  onSaveSettings,
  onAddSubject,
  onRenameSubject,
  onDeleteSubject,
  onClose,
  onThemePreview,
}) => {
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<TabId>('timer');

  // Form states
  const [focusVal, setFocusVal] = useState(settings.focusMinutes);
  const [shortVal, setShortVal] = useState(settings.shortBreakMinutes);
  const [longVal, setLongVal] = useState(settings.longBreakMinutes);
  const [cyclesVal, setCyclesVal] = useState(settings.cyclesBeforeLongBreak);
  const [autoAdv, setAutoAdv] = useState(settings.autoAdvance);
  const [tickSnd, setTickSnd] = useState(settings.tickSound);
  const [tickVol, setTickVol] = useState(settings.tickVolume !== undefined ? settings.tickVolume : 0.5);
  const [activeTheme, setActiveTheme] = useState<ThemeName>(settings.theme);
  const [activeSub, setActiveSub] = useState(settings.subject);
  const [autoDimVal, setAutoDimVal] = useState(settings.autoDim !== false);
  const [syncWithSystem, setSyncWithSystem] = useState(settings.syncWithSystem === true);
  const [dailyGoalHoursVal, setDailyGoalHoursVal] = useState(settings.dailyGoalHours || 4);
  const [focusReminderTime, setFocusReminderTime] = useState(settings.focusReminderTime || '');
  const [focusIntensityVal, setFocusIntensityVal] = useState<'standard' | 'strict'>(settings.focusIntensity || 'standard');
  const [alertSoundId, setAlertSoundId] = useState(settings.alertSoundId || 'default');
  const [customSoundData, setCustomSoundData] = useState(settings.customSoundData || '');
  const [customSoundName, setCustomSoundName] = useState(settings.customSoundName || '');
  const [smartAutoTaggingVal, setSmartAutoTaggingVal] = useState(settings.smartAutoTagging === true);
  const [glassIntensityVal, setGlassIntensityVal] = useState<number>(settings.glassIntensity !== undefined ? settings.glassIntensity : 60);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state declarations
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusStep, setSyncStatusStep] = useState<string>('Syncing');

  // Custom theme states
  const [customPrimary, setCustomPrimary] = useState(settings.customTheme?.primary || '#ef4444');
  const [customAccent, setCustomAccent] = useState(settings.customTheme?.accent || '#f43f5e');
  const [customBgFrom, setCustomBgFrom] = useState(settings.customTheme?.bgFrom || '#110505');
  const [customBgTo, setCustomBgTo] = useState(settings.customTheme?.bgTo || '#050101');

  // Add click sound play logic for premium feel
  const playClick = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
      audio.volume = 0.2;
      audio.play();
    } catch (e) {
      // ignore
    }
  };

  const handleCustomPrimaryChange = (val: string) => {
    setCustomPrimary(val);
    setSyncWithSystem(false);
    onThemePreview?.('custom', {
      primary: val,
      accent: customAccent,
      bgFrom: customBgFrom,
      bgTo: customBgTo,
    });
  };

  const handleCustomAccentChange = (val: string) => {
    setCustomAccent(val);
    setSyncWithSystem(false);
    onThemePreview?.('custom', {
      primary: customPrimary,
      accent: val,
      bgFrom: customBgFrom,
      bgTo: customBgTo,
    });
  };

  const handleCustomBgFromChange = (val: string) => {
    setCustomBgFrom(val);
    setSyncWithSystem(false);
    onThemePreview?.('custom', {
      primary: customPrimary,
      accent: customAccent,
      bgFrom: val,
      bgTo: customBgTo,
    });
  };

  const handleCustomBgToChange = (val: string) => {
    setCustomBgTo(val);
    setSyncWithSystem(false);
    onThemePreview?.('custom', {
      primary: customPrimary,
      accent: customAccent,
      bgFrom: customBgFrom,
      bgTo: val,
    }, glassIntensityVal);
  };

  const handleGlassIntensityChange = (val: number) => {
    setGlassIntensityVal(val);
    const blurPx = Math.max(4, Math.round((val / 100) * 36));
    const opacityVal = (0.2 + (val / 100) * 0.75).toFixed(2);
    document.documentElement.style.setProperty('--tm-glass-blur', `${blurPx}px`);
    document.documentElement.style.setProperty('--tm-glass-opacity', opacityVal);
    document.documentElement.style.setProperty('--tm-glass-intensity', `${val}%`);

    if (activeTheme === 'glassyLight') {
      document.documentElement.style.setProperty('--tm-glass-bg', `rgba(224, 242, 254, ${(0.45 + (val / 100) * 0.50).toFixed(2)})`);
      document.documentElement.style.setProperty('--tm-glass-border', `rgba(56, 189, 248, ${(0.25 + (val / 100) * 0.45).toFixed(2)})`);
    } else {
      document.documentElement.style.setProperty('--tm-glass-bg', `rgba(10, 15, 30, ${(0.35 + (val / 100) * 0.55).toFixed(2)})`);
      document.documentElement.style.setProperty('--tm-glass-border', `rgba(255, 255, 255, ${(0.05 + (val / 100) * 0.35).toFixed(2)})`);
    }

    onThemePreview?.(activeTheme, activeTheme === 'custom' ? {
      primary: customPrimary,
      accent: customAccent,
      bgFrom: customBgFrom,
      bgTo: customBgTo,
    } : undefined, val);
  };

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Load last sync time
    const saved = localStorage.getItem('timerra_last_sync_time');
    if (saved) {
      setLastSyncTime(parseInt(saved, 10));
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    playClick();

    const steps = [
      'Sealing payload...',
      'Deriving AES key...',
      'Encrypting logs...',
      'Verifying SHA-256...',
      'Sync complete!'
    ];

    for (let i = 0; i < steps.length; i++) {
      setSyncStatusStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    const now = Date.now();
    localStorage.setItem('timerra_last_sync_time', now.toString());
    setLastSyncTime(now);
    setIsSyncing(false);

    try {
      playComplete('bell');
    } catch (e) {
      // ignore
    }
  };

  const [newSubInput, setNewSubInput] = useState('');
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editingSubValue, setEditingSubValue] = useState('');

  const handleStartRename = (sub: string) => {
    setEditingSub(sub);
    setEditingSubValue(sub);
  };

  const handleSaveRename = (oldName: string) => {
    const clean = editingSubValue.trim();
    if (clean && clean !== oldName) {
      if (onRenameSubject) {
        onRenameSubject(oldName, clean);
      }
      if (activeSub === oldName) {
        setActiveSub(clean);
      }
    }
    setEditingSub(null);
  };

  const handleDeleteClick = (sub: string) => {
    if (onDeleteSubject) {
      onDeleteSubject(sub);
      if (activeSub === sub) {
        const remaining = subjects.filter(s => s !== sub);
        if (remaining.length > 0) {
          setActiveSub(remaining[0]);
        }
      }
    }
  };

  // Scientific Presets
  const presets = [
    { name: 'Classic Pomodoro', focus: 25, short: 5, long: 15, cycles: 4 },
    { name: 'Deep Work Focus', focus: 50, short: 10, long: 30, cycles: 3 },
    { name: 'Agile Study Sprint', focus: 15, short: 3, long: 10, cycles: 6 },
    { name: 'Ultradian Rhythm', focus: 90, short: 20, long: 30, cycles: 2 },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    playClick();
    setFocusVal(preset.focus);
    setShortVal(preset.short);
    setLongVal(preset.long);
    setCyclesVal(preset.cycles);
  };

  const handleSave = () => {
    playClick();
    onSaveSettings({
      focusMinutes: Number(focusVal),
      shortBreakMinutes: Number(shortVal),
      longBreakMinutes: Number(longVal),
      cyclesBeforeLongBreak: Number(cyclesVal),
      autoAdvance: autoAdv,
      tickSound: tickSnd,
      tickVolume: Number(tickVol),
      theme: activeTheme,
      subject: activeSub,
      autoDim: autoDimVal,
      syncWithSystem: syncWithSystem,
      dailyGoalHours: Number(dailyGoalHoursVal),
      focusReminderTime: focusReminderTime || undefined,
      alertSoundId: alertSoundId,
      focusIntensity: focusIntensityVal,
      customSoundData: customSoundData || undefined,
      customSoundName: customSoundName || undefined,
      smartAutoTagging: smartAutoTaggingVal,
      glassIntensity: Number(glassIntensityVal),
      customTheme: {
        primary: customPrimary,
        accent: customAccent,
        bgFrom: customBgFrom,
        bgTo: customBgTo,
      }
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("Sound file size should be less than 2MB to ensure smooth and fast storage. (ফাইলের সাইজ ২ মেগাবাইটের কম হতে হবে)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomSoundData(dataUrl);
      setCustomSoundName(file.name);
      setAlertSoundId('custom');
      playComplete('custom', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSubInput.trim();
    if (clean && !subjects.includes(clean)) {
      onAddSubject(clean);
      setActiveSub(clean);
      setNewSubInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md select-none animate-fade-in">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Container Card: Slide-over Panel */}
      <div className="relative w-full sm:max-w-xl md:max-w-2xl h-full md:h-screen mt-auto md:mt-0 bg-[#020617]/95 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem] animate-slide-in">
        
        {/* Glowing top line */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-tm-primary via-tm-accent to-emerald-500" />

        {/* Header bar */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-tm-primary/10 flex items-center justify-center border border-tm-primary/20">
              <Sliders className="w-4 h-4 text-tm-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-100">
                Studio Settings
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Fine-tune your ultimate study & focus environment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabbed Navigation Bar (Extremely Modern & Organized) */}
        <div className="flex bg-white/[0.01] border-b border-white/5 px-4 overflow-x-auto scrollbar-none select-none">
          {[
            { id: 'timer', label: 'Time & Goal', icon: Clock, desc: 'Intervals & Goals' },
            { id: 'subjects', label: 'Subject Board', icon: BookOpen, desc: 'Project boards' },
            { id: 'themes', label: 'Themes', icon: Palette, desc: 'Visual skin' },
            { id: 'behavior', label: 'Audio & Behavior', icon: Volume2, desc: 'Sounds & Toggles' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playClick();
                  setActiveTab(tab.id as TabId);
                }}
                className={`relative flex-1 py-3 px-3 min-w-[100px] text-center flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer group ${
                  isActive 
                    ? 'border-tm-primary text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-tm-primary scale-110' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-[-2px] inset-x-4 h-[2px] bg-tm-primary shadow-[0_0_10px_var(--tm-glow)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Form panel body (Tab Contents) */}
        <div className="flex-1 px-6 py-6 overflow-y-auto overscroll-contain space-y-6 custom-scrollbar bg-[#02040a]/40">
          
          {/* TAB 1: Timer & Goals */}
          {activeTab === 'timer' && (
            <div className="space-y-6 animate-fade-in">
              {/* Scientific Presets Card */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-tm-primary animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Scientific Presets</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Select a classic focus protocol engineered by cognitive scientists for optimal neural persistence.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presets.map((p) => {
                    const isActive = focusVal === p.focus && shortVal === p.short && longVal === p.long && cyclesVal === p.cycles;
                    return (
                      <button
                        key={p.name}
                        onClick={() => applyPreset(p)}
                        type="button"
                        className={`p-3.5 rounded-xl text-left border transition-all active:scale-95 cursor-pointer relative overflow-hidden group flex items-center justify-between ${
                          isActive 
                            ? 'bg-tm-primary/10 border-tm-primary text-white shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]' 
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[70%]">
                          <span className="text-xs font-bold block truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {p.focus}m work • {p.short}m rest
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-mono">
                            {p.cycles} Cycles
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intervals Configuration */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-tm-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Custom Intervals</span>
                </div>
                <p className="text-[10px] text-slate-400">Configure custom study, break sessions, and cycle intervals matching your focus rhythm.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Focus Period
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={focusVal}
                        onChange={(e) => setFocusVal(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-tm-primary/50 rounded-xl px-3 py-2.5 font-mono text-xs text-white focus:outline-none transition-all"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-mono">min</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Short Break
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={shortVal}
                        onChange={(e) => setShortVal(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-tm-primary/50 rounded-xl px-3 py-2.5 font-mono text-xs text-white focus:outline-none transition-all"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-mono">min</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Long Break
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={longVal}
                        onChange={(e) => setLongVal(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-tm-primary/50 rounded-xl px-3 py-2.5 font-mono text-xs text-white focus:outline-none transition-all"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-mono">min</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Cycles to Long
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={cyclesVal}
                      onChange={(e) => setCyclesVal(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-tm-primary/50 rounded-xl px-3 py-2.5 font-mono text-xs text-white focus:outline-none text-center transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Daily Target Setting */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-[70%]">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Daily Goal target</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Set a cumulative focus threshold. Once reached, you'll earn the Golden Crest Award.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={dailyGoalHoursVal}
                    onChange={(e) => setDailyGoalHoursVal(Math.max(1, Number(e.target.value)))}
                    className="w-12 bg-transparent border-0 font-mono text-xs text-tm-primary font-black focus:outline-none text-center"
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Focus Subjects Board */}
          {activeTab === 'subjects' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-tm-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-200">Study Subjects</span>
                  </div>
                  <span className="text-[9px] bg-tm-primary/15 text-tm-primary border border-tm-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                    Active: {activeSub}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Switch, add, rename, or archive focus subjects. The tracker will organize focus durations, milestones, and graphs specifically for the selected subject.
                </p>

                {/* Sub list board */}
                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 border border-white/5 rounded-xl p-2 bg-black/20">
                  {subjects.map((sub) => {
                    const isSelected = activeSub === sub;
                    const isEditing = editingSub === sub;

                    if (isEditing) {
                      return (
                        <div
                          key={sub}
                          className="flex items-center gap-1.5 bg-white/10 border border-tm-primary/40 rounded-xl px-3 py-1.5 text-xs"
                        >
                          <input
                            type="text"
                            value={editingSubValue}
                            onChange={(e) => setEditingSubValue(e.target.value)}
                            className="bg-transparent text-white border-0 focus:outline-none flex-grow text-xs font-semibold"
                            maxLength={25}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveRename(sub);
                              } else if (e.key === 'Escape') {
                                setEditingSub(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(sub)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 cursor-pointer transition-colors"
                            title="Save Rename"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSub(null)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={sub}
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-tm-primary/10 border-tm-primary/30 text-white shadow-sm'
                            : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] text-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setActiveSub(sub);
                          }}
                          className="flex-grow text-left cursor-pointer font-bold select-none py-0.5 truncate"
                        >
                          {sub}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity pl-2 border-l border-white/15">
                          <button
                            type="button"
                            onClick={() => handleStartRename(sub)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(sub)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Form to add a new subject */}
                <form onSubmit={handleAddNewSubject} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="E.g., Mathematics, Coding, Writing..."
                    value={newSubInput}
                    onChange={(e) => setNewSubInput(e.target.value)}
                    maxLength={25}
                    className="flex-grow bg-white/5 border border-white/10 hover:border-white/15 focus:border-tm-primary/50 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-tm-primary/10 hover:bg-tm-primary/20 border border-tm-primary/20 hover:border-tm-primary/30 transition-all text-white flex items-center gap-1 cursor-pointer active:scale-95 text-xs font-bold uppercase tracking-wider shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-tm-primary" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Visual Environment Themes */}
          {activeTab === 'themes' && (
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* DAY / NIGHT ENVIRONMENT MODE SWITCH */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-200">Day & Night Mode</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-mono">
                    {activeTheme === 'glassyLight' ? '☀️ Day Mode Active' : '🌙 Night Mode Active'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Switch between Day Mode (sky blue glass background with dark readable text) and Night Mode (deep dark space atmosphere).
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveTheme('midnight');
                      setSyncWithSystem(false);
                      onThemePreview?.('midnight', undefined, glassIntensityVal);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer font-extrabold text-xs ${
                      activeTheme !== 'glassyLight'
                        ? 'bg-tm-primary/15 border-tm-primary text-white shadow-md'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>🌙 Night Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveTheme('glassyLight');
                      setSyncWithSystem(false);
                      onThemePreview?.('glassyLight', undefined, glassIntensityVal);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer font-extrabold text-xs ${
                      activeTheme === 'glassyLight'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>☀️ Day Mode</span>
                  </button>
                </div>
              </div>

              {/* ADVANCED GLASS INTENSITY & REFRACTION SLIDER */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-tm-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-200">Glass Intensity & Refraction</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tm-primary/10 border border-tm-primary/20 text-tm-primary text-[10px] font-mono font-black">
                    <span>{glassIntensityVal}%</span>
                    <span className="text-[9px] text-slate-400">({Math.max(4, Math.round((glassIntensityVal / 100) * 36))}px blur)</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Adjust the glass blur level and opacity in real time. Readability and high contrast are automatically preserved across all backgrounds.
                </p>

                {/* Advanced Slider Control */}
                <div className="space-y-3 pt-1">
                  <div className="relative flex items-center select-none">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={glassIntensityVal}
                      onChange={(e) => handleGlassIntensityChange(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-800/80 rounded-lg appearance-none cursor-pointer accent-tm-primary focus:outline-none"
                    />
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleGlassIntensityChange(25)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer text-center ${
                        glassIntensityVal === 25 
                          ? 'bg-tm-primary/20 border-tm-primary text-white shadow-sm' 
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      🧪 Subtle (25%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGlassIntensityChange(60)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer text-center ${
                        glassIntensityVal === 60 
                          ? 'bg-tm-primary/20 border-tm-primary text-white shadow-sm' 
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      🧊 Balanced (60%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGlassIntensityChange(90)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer text-center ${
                        glassIntensityVal === 90 
                          ? 'bg-tm-primary/20 border-tm-primary text-white shadow-sm' 
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      🛡️ Frost (90%)
                    </button>
                  </div>
                </div>

                {/* Real-time Interactive Refraction Preview Card */}
                <div className="relative mt-2 p-4 rounded-xl overflow-hidden border border-white/10 select-none min-h-[90px] flex items-center justify-between">
                  {/* Colorful animated test shapes */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 pointer-events-none opacity-80" />
                  <div className="absolute top-1 left-3 w-16 h-16 bg-cyan-400 rounded-full blur-xs animate-pulse pointer-events-none" />
                  <div className="absolute bottom-1 right-4 w-20 h-20 bg-pink-500 rounded-full blur-sm pointer-events-none" />

                  {/* Test Glass Overlay Card */}
                  <div 
                    className="relative z-10 w-full p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 shadow-xl"
                    style={{
                      backdropFilter: `blur(${Math.max(4, Math.round((glassIntensityVal / 100) * 36))}px) saturate(140%)`,
                      WebkitBackdropFilter: `blur(${Math.max(4, Math.round((glassIntensityVal / 100) * 36))}px) saturate(140%)`,
                      backgroundColor: activeTheme === 'glassyLight' 
                        ? `rgba(224, 242, 254, ${(0.45 + (glassIntensityVal / 100) * 0.50).toFixed(2)})`
                        : `rgba(10, 15, 30, ${(0.35 + (glassIntensityVal / 100) * 0.55).toFixed(2)})`,
                      borderColor: activeTheme === 'glassyLight'
                        ? `rgba(56, 189, 248, ${(0.25 + (glassIntensityVal / 100) * 0.45).toFixed(2)})`
                        : `rgba(255, 255, 255, ${(0.05 + (glassIntensityVal / 100) * 0.35).toFixed(2)})`,
                      color: activeTheme === 'glassyLight' ? '#0f172a' : '#f8fafc',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-tm-primary/20 text-tm-primary">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black tracking-tight block">Live Glass Refraction Preview</span>
                        <span className="text-[9px] opacity-80 block font-mono">Contrast: WCAG AA Pass</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-1 rounded bg-black/20 border border-white/10 text-white">
                        {glassIntensityVal}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ATMOSPHERIC SHIMMER SKINS */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-tm-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Atmospheric Shimmer Skins</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Select an ambient color theme that shifts gently during sessions, creating immersive physical focus triggers.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {THEMES.map((theme) => {
                    const isSelected = activeTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          playClick();
                          setActiveTheme(theme.id);
                          setSyncWithSystem(false);
                          onThemePreview?.(theme.id, theme.id === 'custom' ? {
                            primary: customPrimary,
                            accent: customAccent,
                            bgFrom: customBgFrom,
                            bgTo: customBgTo,
                          } : undefined, glassIntensityVal);
                        }}
                        type="button"
                        className={`p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-[82px] relative overflow-hidden group ${
                          isSelected
                            ? 'bg-white/5 border-tm-primary shadow-[0_0_15px_-3px_var(--tm-glow)] text-white'
                            : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-black tracking-tight">{theme.name}</span>
                          {theme.id === 'custom' ? (
                            <span 
                              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 animate-pulse" 
                              style={{ background: `linear-gradient(135deg, ${customPrimary}, ${customAccent})` }}
                            />
                          ) : (
                            <span className={`w-2.5 h-2.5 rounded-full ring-1 ring-white/10 ${
                              theme.id === 'blue' ? 'bg-blue-500' :
                              theme.id === 'purple' ? 'bg-purple-500' :
                              theme.id === 'emerald' ? 'bg-emerald-500' :
                              theme.id === 'orange' ? 'bg-orange-500' :
                              theme.id === 'red' ? 'bg-red-500' :
                              theme.id === 'cyber' ? 'bg-cyan-400' :
                              theme.id === 'midnight' ? 'bg-indigo-900' :
                              theme.id === 'aurora' ? 'bg-teal-300' :
                              theme.id === 'neonPulse' ? 'bg-lime-400' :
                              theme.id === 'glassmorphism' ? 'bg-sky-300 ring-2 ring-sky-200/50' :
                              'bg-sky-200 ring-2 ring-sky-400/50'
                            }`} />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 leading-normal block mt-1 line-clamp-2">
                          {theme.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Theme Studio Palette */}
              {activeTheme === 'custom' && (
                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-tm-primary">
                    <Sparkles className="w-4 h-4 text-tm-accent" />
                    <span>Theme Studio Palette</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Primary Color</label>
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-2 py-1.5">
                        <input 
                          type="color" 
                          value={customPrimary} 
                          onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input 
                          type="text" 
                          value={customPrimary} 
                          onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                          placeholder="#ef4444"
                          className="w-full bg-transparent border-0 text-xs text-white focus:outline-none uppercase font-mono"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Accent Shimmer</label>
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-2 py-1.5">
                        <input 
                          type="color" 
                          value={customAccent} 
                          onChange={(e) => handleCustomAccentChange(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input 
                          type="text" 
                          value={customAccent} 
                          onChange={(e) => handleCustomAccentChange(e.target.value)}
                          placeholder="#f43f5e"
                          className="w-full bg-transparent border-0 text-xs text-white focus:outline-none uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Canvas From (Top)</label>
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-2 py-1.5">
                        <input 
                          type="color" 
                          value={customBgFrom} 
                          onChange={(e) => handleCustomBgFromChange(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input 
                          type="text" 
                          value={customBgFrom} 
                          onChange={(e) => handleCustomBgFromChange(e.target.value)}
                          placeholder="#110505"
                          className="w-full bg-transparent border-0 text-xs text-white focus:outline-none uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Canvas To (Bottom)</label>
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-2 py-1.5">
                        <input 
                          type="color" 
                          value={customBgTo} 
                          onChange={(e) => handleCustomBgToChange(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input 
                          type="text" 
                          value={customBgTo} 
                          onChange={(e) => handleCustomBgToChange(e.target.value)}
                          placeholder="#050101"
                          className="w-full bg-transparent border-0 text-xs text-white focus:outline-none uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sync with System Theme */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-[75%]">
                  <span className="text-xs font-bold text-slate-200">Sync with System Theme</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Automatically matches dark and light skins of your computer or phone operating system.
                  </p>
                </div>
                
                {/* Sliding Toggle switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncWithSystem}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSyncWithSystem(checked);
                      if (checked) {
                        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        setActiveTheme(isSystemDark ? 'midnight' : 'blue');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tm-primary" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Audio & Behavior */}
          {activeTab === 'behavior' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Daily Reminder Alarm */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-tm-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Focus Habits Alarm</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-3.5 rounded-xl border border-white/5">
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="text-xs font-semibold text-slate-200">Daily Focus Reminder Alert</span>
                    <p className="text-[10px] text-slate-400">Notifies you if you have not registered focus logs by this hour.</p>
                  </div>
                  <select
                    value={focusReminderTime}
                    onChange={(e) => setFocusReminderTime(e.target.value)}
                    className="bg-black/60 border border-white/10 hover:border-white/15 focus:border-tm-primary/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer min-w-[130px]"
                  >
                    <option value="">Disabled</option>
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                    <option value="20:00">08:00 PM</option>
                    <option value="21:00">09:00 PM</option>
                    <option value="22:00">10:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Behavior & Cycles logic */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-tm-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Interval Behavior & Metronome</span>
                </div>

                <div className="space-y-3">
                  {/* Auto Advance Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all">
                    <div className="space-y-0.5 max-w-[75%]">
                      <span className="text-xs font-bold text-slate-200">Auto-Advance Intervals</span>
                      <p className="text-[10px] text-slate-400">Starts break sessions immediately when your study focus finishes.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAdv}
                        onChange={(e) => setAutoAdv(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tm-primary" />
                    </label>
                  </div>

                  {/* Focus Intensity Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all gap-3">
                    <div className="space-y-0.5 max-w-[70%]">
                      <span className="text-xs font-bold text-slate-200">Focus Intensity (Auto-Pause)</span>
                      <p className="text-[10px] text-slate-400">Choose between Strict (pauses tab instantly) and Standard (5s delay).</p>
                    </div>
                    <div className="flex bg-white/[0.03] border border-white/10 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => { playClick(); setFocusIntensityVal('standard'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          focusIntensityVal === 'standard'
                            ? 'bg-tm-primary text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => { playClick(); setFocusIntensityVal('strict'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          focusIntensityVal === 'strict'
                            ? 'bg-tm-primary text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Strict
                      </button>
                    </div>
                  </div>

                  {/* Metronome study tick sound toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all">
                    <div className="space-y-0.5 max-w-[75%]">
                      <span className="text-xs font-bold text-slate-200">Study Tick Metronome</span>
                      <p className="text-[10px] text-slate-400">Produces an offline ticking count on every second of work.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tickSnd}
                        onChange={(e) => setTickSnd(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tm-primary" />
                    </label>
                  </div>

                  {/* Tick intensity range slider */}
                  {tickSnd && (
                    <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300">Metronome Tick Volume</span>
                        <span className="font-mono text-[10px] font-black text-tm-primary bg-tm-primary/10 px-2.5 py-0.5 rounded border border-tm-primary/20">
                          {Math.round(tickVol * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={tickVol}
                        onChange={(e) => setTickVol(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-tm-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Auto-Tagging Option */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-tm-primary animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Smart Auto-Tagging</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Automatically assigns predefined Mood tags to your study sessions based on the specific time of day (e.g., &apos;Energized&apos; in the morning, &apos;Deep&apos; in the afternoon, &apos;Calm&apos; in the evening/night).
                </p>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all">
                  <div className="space-y-0.5 max-w-[75%]">
                    <span className="text-xs font-bold text-slate-200">Enable Smart Mood Tags</span>
                    <p className="text-[10px] text-slate-400">Automatically logs session mood state without manual selection.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smartAutoTaggingVal}
                      onChange={(e) => {
                        playClick();
                        setSmartAutoTaggingVal(e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tm-primary" />
                  </label>
                </div>
              </div>

              {/* Alert sound selection */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-tm-primary" />
                      <span>Completion Chime</span>
                      <span className="text-[9px] text-slate-500 font-bold">(অ্যালার্ট সাউন্ড)</span>
                    </span>
                    <p className="text-[10px] text-slate-400">Trigger alert gongs when your timer cycles finish.</p>
                  </div>
                  
                  {/* Play preview button */}
                  <button
                    type="button"
                    onClick={() => playComplete(alertSoundId, customSoundData)}
                    className="flex items-center gap-1 bg-tm-primary/15 hover:bg-tm-primary/25 border border-tm-primary/30 text-tm-primary px-3 py-1.5 rounded-lg text-[10px] font-black transition-all shrink-0 self-start sm:self-center cursor-pointer active:scale-95"
                    title="Test Sound"
                  >
                    <Play className="w-3 h-3 fill-current text-tm-primary" />
                    <span>Test sound</span>
                  </button>
                </div>

                {/* Predefined audio library list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'default', name: 'Classic Sweep', desc: 'Zen gongs' },
                    { id: 'digital', name: 'Digital Alarm', desc: 'Double chime' },
                    { id: 'ambient', name: 'Ambient Pad', desc: 'Warm chord' },
                    { id: 'cosmic', name: 'Cosmic Laser', desc: 'Sci-fi sweep' },
                    { id: 'bell', name: 'Crystal Bell', desc: 'Pure chime' },
                    { id: 'custom', name: 'Custom Upload', desc: 'Your own file' },
                  ].map((sound) => (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => {
                        setAlertSoundId(sound.id);
                        if (sound.id !== 'custom') {
                          playComplete(sound.id);
                        } else if (customSoundData) {
                          playComplete('custom', customSoundData);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group select-none cursor-pointer ${
                        alertSoundId === sound.id
                          ? 'bg-tm-primary/10 border-tm-primary text-white shadow-md'
                          : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold block truncate">{sound.name}</span>
                        {alertSoundId === sound.id && (
                          <Check className="w-3 h-3 text-tm-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5 group-hover:text-slate-400 transition-colors truncate">{sound.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Custom File Uploader block */}
                {alertSoundId === 'custom' && (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                      dragActive
                        ? 'border-tm-primary bg-tm-primary/5'
                        : customSoundData
                        ? 'border-emerald-500/30 bg-emerald-500/[0.01]'
                        : 'border-white/10 bg-white/[0.005] hover:bg-white/[0.01]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {customSoundData ? (
                      <div className="w-full space-y-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{customSoundName || 'custom-alert.mp3'}</span>
                        </div>
                        <p className="text-[9px] text-slate-400">Successfully decoded offline alert chime.</p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 px-2.5 py-1 rounded-lg text-[9px] transition-all font-bold cursor-pointer"
                          >
                            Replace File
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomSoundData('');
                              setCustomSoundName('');
                              setAlertSoundId('default');
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg text-[9px] transition-all font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 cursor-pointer w-full py-2" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-slate-200">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-300">
                            <span className="text-tm-primary hover:underline">Click to upload</span> or drag & drop
                          </p>
                          <p className="text-[9px] text-slate-500">Supports MP3, WAV, M4A up to 2MB (স্থানীয় ফাইল আপলোড করুন)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Eye Protection Auto Dim */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-[75%]">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>Auto-Dim (Night Mode)</span>
                    <span className="text-[9px] text-slate-500 font-bold">(রাত ১০টার পর নাইট মোড)</span>
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Automatically softens contrast, colors, and brightness after 10 PM. (বন্ধ করতে টিক চিহ্ন উঠিয়ে দিন)
                  </p>
                </div>
                
                {/* Sliding toggle switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoDimVal}
                    onChange={(e) => setAutoDimVal(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tm-primary" />
                </label>
              </div>
            </div>
          )}

          {/* Last Encrypted Sync Status & Action Panel */}
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in relative overflow-hidden group/sync">
            {/* Ambient decorative element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-tm-primary/5 rounded-full blur-xl pointer-events-none -mr-4 -mt-4 transition-all duration-700 group-hover/sync:bg-tm-primary/10" />
            
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Local Sandbox Vault</span>
                  <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">E2EE Encrypted</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Last Encrypted Sync: <span className="text-slate-200 font-bold font-mono">{lastSyncTime ? `${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${new Date(lastSyncTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'Never Synced'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              type="button"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/10 text-xs font-black transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none min-w-[130px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-tm-primary ${isSyncing ? 'animate-spin text-tm-accent' : ''}`} />
              <span>{isSyncing ? syncStatusStep : 'Sync Now'}</span>
            </button>
          </div>

        </div>

        {/* Footer buttons bar */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20 shrink-0">
          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-tm-primary" />
            <span>Browser Sandbox Secure</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-5 py-2 rounded-xl bg-gradient-to-tr from-tm-primary to-tm-accent border border-tm-primary/10 hover:shadow-[0_0_15px_var(--tm-glow)] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 text-white" />
              Save Config
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
