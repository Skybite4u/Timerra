import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Sliders, Volume2, Check, Plus, AlertCircle, Edit2, Trash2, Clock } from 'lucide-react';
import { TimerSettings, ThemeName } from '../types';
import { THEMES } from '../lib/themes';

interface SettingsPanelProps {
  settings: TimerSettings;
  subjects: string[];
  onSaveSettings: (newSettings: TimerSettings) => void;
  onAddSubject: (subject: string) => void;
  onRenameSubject?: (oldName: string, newName: string) => void;
  onDeleteSubject?: (name: string) => void;
  onClose: () => void;
  onThemePreview?: (themeId: ThemeName, customTheme?: TimerSettings['customTheme']) => void;
}

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

  const [customPrimary, setCustomPrimary] = useState(settings.customTheme?.primary || '#ef4444');
  const [customAccent, setCustomAccent] = useState(settings.customTheme?.accent || '#f43f5e');
  const [customBgFrom, setCustomBgFrom] = useState(settings.customTheme?.bgFrom || '#110505');
  const [customBgTo, setCustomBgTo] = useState(settings.customTheme?.bgTo || '#050101');

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
    });
  };

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

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

  // Built-in professional presets (Section 13)
  const presets = [
    { name: 'Classic Pomodoro', focus: 25, short: 5, long: 15, cycles: 4 },
    { name: 'Deep Work Focus', focus: 50, short: 10, long: 30, cycles: 3 },
    { name: 'Agile Study Sprint', focus: 15, short: 3, long: 10, cycles: 6 },
    { name: 'Ultradian Rhythm', focus: 90, short: 20, long: 30, cycles: 2 },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setFocusVal(preset.focus);
    setShortVal(preset.short);
    setLongVal(preset.long);
    setCyclesVal(preset.cycles);
  };

  const handleSave = () => {
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
      customTheme: {
        primary: customPrimary,
        accent: customAccent,
        bgFrom: customBgFrom,
        bgTo: customBgTo,
      }
    });
    onClose();
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md select-none">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Container Card: Slide-over on Desktop, Bottom Sheet on Mobile */}
      <div className="relative w-full md:max-w-2xl h-full md:h-screen mt-auto md:mt-0 bg-[#030712]/75 backdrop-blur-[24px] border-t md:border-t-0 md:border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden rounded-t-[2.5rem] md:rounded-t-none md:rounded-l-[2.5rem] animate-slide-in">
        
        {/* Glowing atmospheric header glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-tm-primary to-tm-accent" />

        {/* Header bar */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-tm-primary" />
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-200">
              Configurations
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form panel body */}
        <div className="flex-1 px-6 py-6 overflow-y-auto overscroll-contain space-y-7 custom-scrollbar">
          
          {/* Preset buttons */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-tm-primary" />
              Scientific Focus Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((p) => {
                const isActive = focusVal === p.focus && shortVal === p.short && longVal === p.long && cyclesVal === p.cycles;
                return (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    type="button"
                    className={`p-3 rounded-2xl text-left border transition-all active:scale-95 text-xs font-medium cursor-pointer ${
                      isActive 
                        ? 'bg-tm-primary/10 border-tm-primary text-white shadow-md' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold mb-1 truncate text-xs">{p.name.split(' ')[0]} Preset</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.focus}m / {p.short}m / {p.cycles}c
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time configurations */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Custom Intervals (Minutes)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Focus Period
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={focusVal}
                  onChange={(e) => setFocusVal(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 font-mono text-sm focus:border-tm-primary/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Short Break
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shortVal}
                  onChange={(e) => setShortVal(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 font-mono text-sm focus:border-tm-primary/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Long Break
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={longVal}
                  onChange={(e) => setLongVal(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 font-mono text-sm focus:border-tm-primary/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Cycles to Long
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={cyclesVal}
                  onChange={(e) => setCyclesVal(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 font-mono text-sm focus:border-tm-primary/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Daily Goal (Hrs)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={dailyGoalHoursVal}
                  onChange={(e) => setDailyGoalHoursVal(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 font-mono text-sm focus:border-tm-primary/50 focus:outline-none text-tm-primary font-bold"
                />
              </div>
            </div>
          </div>

          {/* Subjects Board */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-tm-primary" />
              Focus Subjects Board
            </h3>
            
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/[0.01] border border-white/5">
              {subjects.map((sub) => {
                const isSelected = activeSub === sub;
                const isEditing = editingSub === sub;

                if (isEditing) {
                  return (
                    <div
                      key={sub}
                      className="flex items-center gap-1.5 bg-white/10 border border-tm-primary/50 rounded-xl px-2 py-1 text-xs"
                    >
                      <input
                        type="text"
                        value={editingSubValue}
                        onChange={(e) => setEditingSubValue(e.target.value)}
                        className="bg-transparent text-white border-none focus:outline-none w-28 text-xs font-medium"
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
                        className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 cursor-pointer transition-colors"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSub(null)}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
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
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-tm-primary text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSub(sub)}
                      className="cursor-pointer font-semibold text-left"
                    >
                      {sub}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-1 pl-1 border-l border-white/10">
                      <button
                        type="button"
                        onClick={() => handleStartRename(sub)}
                        className={`p-0.5 rounded hover:bg-white/10 cursor-pointer ${
                          isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(sub)}
                        className={`p-0.5 rounded hover:bg-white/10 cursor-pointer ${
                          isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-400'
                        }`}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form to add a new subject */}
            <form onSubmit={handleAddNewSubject} className="flex gap-2">
              <input
                type="text"
                placeholder="Type new subject (e.g. Mathematics, Figma)..."
                value={newSubInput}
                onChange={(e) => setNewSubInput(e.target.value)}
                maxLength={25}
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:border-tm-primary/50 focus:outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider hidden xs:inline">Add</span>
              </button>
            </form>
          </div>

          {/* Themes presets selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Visual Environment Shimmer Themes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEMES.map((theme) => {
                const isSelected = activeTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setActiveTheme(theme.id);
                      setSyncWithSystem(false);
                      onThemePreview?.(theme.id, theme.id === 'custom' ? {
                        primary: customPrimary,
                        accent: customAccent,
                        bgFrom: customBgFrom,
                        bgTo: customBgTo,
                      } : undefined);
                    }}
                    type="button"
                    className={`p-3 rounded-2xl text-left border transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-[80px] tm-3d-bar-shadow ${
                      isSelected
                        ? 'bg-white/5 border-tm-primary shadow-[0_0_15px_-3px_var(--tm-glow)] text-white'
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold">{theme.name}</span>
                      {theme.id === 'custom' ? (
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ background: `linear-gradient(135deg, ${customPrimary}, ${customAccent})` }}
                        />
                      ) : (
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          theme.id === 'blue' ? 'bg-blue-500' :
                          theme.id === 'purple' ? 'bg-purple-500' :
                          theme.id === 'emerald' ? 'bg-emerald-500' :
                          theme.id === 'orange' ? 'bg-orange-500' :
                          theme.id === 'red' ? 'bg-red-500' :
                          theme.id === 'cyber' ? 'bg-cyan-400' :
                          theme.id === 'midnight' ? 'bg-indigo-900' :
                          'bg-teal-300'
                        }`} />
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 leading-tight block line-clamp-2 mt-1">
                      {theme.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Theme Creator Options */}
            {activeTheme === 'custom' && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 mt-2 animate-fadeIn text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-tm-primary">
                  <Sparkles className="w-4 h-4 text-tm-accent" />
                  <span>Custom Theme Studio Palette</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Primary Color</label>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
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
                  
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Accent Shimmer</label>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
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

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Canvas Core (From)</label>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
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

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Canvas Deep (To)</label>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
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

            {/* Sync with System toggle */}
            <div className="pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                <div className="flex flex-col pr-4">
                  <span className="text-xs font-semibold">Sync with System Theme</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Automatically switch theme depending on operating system light/dark mode preference</span>
                </div>
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
                  className="w-4 h-4 rounded text-tm-primary bg-white/10 border-white/5 focus:ring-tm-primary focus:ring-offset-0"
                />
              </label>
            </div>
          </div>

          {/* Consistent Focus Habits */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-tm-primary" />
              Consistent Focus Habits
            </h3>
            <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">Daily Focus Reminder Alert</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Triggers a notification if you haven't started any focus sessions by this time of day</span>
                </div>
                <select
                  value={focusReminderTime}
                  onChange={(e) => setFocusReminderTime(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-tm-primary/50 cursor-pointer min-w-[140px]"
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
          </div>

          {/* Core Toggles */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-tm-primary" />
              Soundscapes & Cycle Logic
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Auto Advance toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                <div className="flex flex-col pr-4">
                  <span className="text-xs font-semibold">Auto-Advance Intervals</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Start break immediately when focus expires</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoAdv}
                  onChange={(e) => setAutoAdv(e.target.checked)}
                  className="w-4 h-4 rounded text-tm-primary bg-white/10 border-white/5 focus:ring-tm-primary focus:ring-offset-0"
                />
              </label>

              {/* Tick Metronome sound toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                <div className="flex flex-col pr-4">
                  <span className="text-xs font-semibold">Study Tick Metronome</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Metronome ticking on every second</span>
                </div>
                <input
                  type="checkbox"
                  checked={tickSnd}
                  onChange={(e) => setTickSnd(e.target.checked)}
                  className="w-4 h-4 rounded text-tm-primary bg-white/10 border-white/5 focus:ring-tm-primary focus:ring-offset-0"
                />
              </label>

              {/* Tick Metronome Volume/Intensity Slider */}
              {tickSnd && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">Ambient Tick Intensity</span>
                      <span className="text-[10px] text-slate-400">Set the volume of the metronome tick sound relative to background music</span>
                    </div>
                    <span className="font-mono text-xs font-black text-tm-primary bg-tm-primary/10 px-2 py-0.5 rounded-lg border border-tm-primary/20">
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

              {/* Auto-Dim late night toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all cursor-pointer sm:col-span-2">
                <div className="flex flex-col pr-4">
                  <span className="text-xs font-semibold">Auto-Dim (Night Mode)</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Automatically softens colors, brightness, and contrast after 10 PM to protect your eyes</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoDimVal}
                  onChange={(e) => setAutoDimVal(e.target.checked)}
                  className="w-4 h-4 rounded text-tm-primary bg-white/10 border-white/5 focus:ring-tm-primary focus:ring-offset-0"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer buttons bar */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-tm-primary" />
            Saved directly to browser offline space
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-tr from-tm-primary to-tm-accent border border-tm-primary/10 hover:shadow-[0_0_15px_var(--tm-glow)] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save Config
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
