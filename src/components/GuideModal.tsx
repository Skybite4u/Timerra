import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, BookOpen, Search, Info, HelpCircle, Cpu, History, Settings, Key, 
  Database, Shield, Flame, Sliders, ChevronRight, Play, Award, Sparkles, AlertTriangle, Clock
} from 'lucide-react';
import { playClick } from '../lib/audio';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  category: 'core' | 'features' | 'technical' | 'support';
  content: React.ReactNode;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('getting-started');

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const sections: GuideSection[] = useMemo(() => [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      category: 'core',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Welcome to <strong className="text-tm-primary">Timerra</strong>, an advanced, secure local offline-sync focus workspace. Timerra is designed to optimize your cognitive flow, protect your attention span, and securely record your learning journey using localized client-side databases.
          </p>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-tm-primary" />
              Core Philosophy
            </h4>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 pl-1 leading-relaxed">
              <li><strong className="text-slate-200">Zero Online Overlord:</strong> All session stats, history, and notes live in your browser's private offline IndexedDB. No third-party servers track you.</li>
              <li><strong className="text-slate-200">Attention Isolation:</strong> The Immersive Focus mode isolates your brain from distractions, silencing unneeded notifications and alerts.</li>
              <li><strong className="text-slate-200">Zero Data Loss:</strong> Use localized backup "Capsules" securely encrypted with PBKDF2 + AES-GCM to export/sync your history.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'pomodoro',
      title: 'Pomodoro Technique',
      icon: Play,
      category: 'core',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            The standard Pomodoro method is deeply integrated into Timerra's DNA, powered by the <strong className="text-amber-400">Solar Orb</strong> theme.
          </p>
          <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
            <p>
              By default, a standard study block comprises <strong className="text-slate-200">25 minutes of high-intensity focus</strong>, followed by a <strong className="text-slate-200">5-minute short break</strong>. Repeat this cycle 4 times, and you'll be prompted to take a longer, rejuvenating <strong className="text-slate-200">15-minute break</strong>.
            </p>
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px]">
                You can customize these interval durations and cycles inside the <strong className="text-slate-200">Settings Panel</strong> to match your personal energy levels.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch Mode',
      icon: Clock,
      category: 'core',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Stopwatch mode represents <strong className="text-indigo-400">Infinity Pulse</strong>, an endless upward-ticking tracker.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Use this mode when you want to dive deep into a task without the psychological pressure of a ticking countdown clock. Press play to start counting upwards; pause or stop whenever you finish your flow state. Your active seconds will be committed directly to your Session History.
          </p>
        </div>
      )
    },
    {
      id: 'deep-focus',
      title: 'Deep Focus',
      icon: Flame,
      category: 'core',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Deep Focus activates the <strong className="text-rose-400">Crystal Core</strong> theme—a strict, unforgiving environment for absolute concentration.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            In standard focus modes, you may pause or adjust times, but in Deep Focus, the interface encourages long, uninterrupted stretches. Pausing triggers subtle audio-visual reminders of your commitment to keep you on track.
          </p>
        </div>
      )
    },
    {
      id: 'infinity-focus',
      title: 'Infinity Focus',
      icon: Flame,
      category: 'core',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Infinity Focus activates the <strong className="text-violet-400">Galaxy Core</strong> theme—a quiet, star-filled visualization designed for creative writing, planning, or long reading sessions.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            This mode has no countdown limits. It acts as an open-ended companion, tracking your focus hours gently in the background while surrounding you with drift particles and stellar orbits.
          </p>
        </div>
      )
    },
    {
      id: 'immersive-focus',
      title: 'Immersive Focus',
      icon: Sliders,
      category: 'core',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Enter <strong className="text-tm-primary">Immersive Focus</strong> to experience a cinematic, full-screen distraction-free workspace.
          </p>
          <div className="text-xs text-slate-400 space-y-3 leading-relaxed">
            <h5 className="font-bold text-slate-200">Auto Hide Controls:</h5>
            <p>
              When entering, the app monitors user activity. After 4 seconds of silence (no cursor movement, mouse clicks, or touch), all UI controls, navigation bars, bottom footers, and cursors <strong className="text-slate-200">smoothly fade out</strong>, leaving only your breathing Orb, the digital countdown, and your current session title. Just move the mouse or touch your screen to bring them back.
            </p>
            <h5 className="font-bold text-slate-200">Absolute Silence Mode:</h5>
            <p>
              All non-critical in-app notifications, tips, milestone congratulations, and update banners are automatically suppressed and queued silently into the <strong className="text-slate-200">Focus Feed</strong>. Critical events like 'Timer Finished' or save failures bypass the silence guard to protect your schedule.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'orb',
      title: 'The Focus Orb',
      icon: Cpu,
      category: 'features',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            The centerpiece of Timerra is the <strong className="text-tm-primary">Breathing Orb</strong>, a highly reactive SVG-rendered core that pulses slowly to guide your breathing rate (inhale for 4 seconds, exhale for 4 seconds).
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Using the customization panel (<kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">C</kbd>), you can fine-tune the Orb's size, theme palette (Glass, Crystal, Galaxy, Neon, Fire, Ocean, Forest, etc.), glowing shadow depth, particle density, and transparency to construct your ideal visual retreat.
          </p>
        </div>
      )
    },
    {
      id: 'capsule',
      title: 'The Capsule Vault',
      icon: Database,
      category: 'features',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            A <strong className="text-teal-400">Capsule</strong> is a self-contained, end-to-end encrypted backup file of your focus metadata.
          </p>
          <div className="text-xs text-slate-400 space-y-2.5 leading-relaxed">
            <p>
              Your data never touches central servers. To sync across machines (e.g., home and work):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Open the <strong className="text-slate-200">Capsule Portal</strong>.</li>
              <li>Input a custom master passcode (used to derive an AES-GCM 256-bit key via PBKDF2 with 100,000 iterations).</li>
              <li>Export your Capsule (.json file).</li>
              <li>Transfer the file to your secondary device, input the same password, and restore your history seamlessly.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'focus-feed',
      title: 'Focus Feed',
      icon: Flame,
      category: 'features',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            The <strong className="text-tm-primary">Focus Feed</strong> serves as Timerra's centralized timeline.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instead of bothering you with frequent popup interruptions, achievements, milestones, or app updates, Timerra logs everything quietly onto your Focus Feed timeline. You can open the feed anytime via the header "Feed" button or footer links. Notifications are grouped clearly by <strong className="text-slate-200">Today, Yesterday, and This Week</strong>.
          </p>
        </div>
      )
    },
    {
      id: 'milestone-vault',
      title: 'Milestone Vault',
      icon: Award,
      category: 'features',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Earn experience (XP) and unlock badges as you form healthy habits!
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Milestone Vault contains achievements across categories like Focus Time, Streak Length, Capsule Exports, and Subject Diversity. Each milestone yields XP and is celebrated with a full-screen, high-fidelity overlay ceremony when achieved during standard modes (or queued silently for your attention when inside Immersive Focus).
          </p>
        </div>
      )
    },
    {
      id: 'legacy-card',
      title: 'Legacy Cards',
      icon: Sparkles,
      category: 'features',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Immortalize your major milestones inside your personal <strong className="text-purple-400">Legacy Deck</strong>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            When you reach milestones or complete deep cycles, the system spawns beautiful, collectible 3D glass cards with parallax glare effects. You can hover, flip, and view detailed cryptographic timestamps proving your study accomplishments.
          </p>
        </div>
      )
    },
    {
      id: 'insight-engine',
      title: 'Insight Engine',
      icon: Cpu,
      category: 'features',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            The <strong className="text-teal-400">Insight Engine</strong> compiles your session statistics locally.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            It looks for trends in your focus habits—such as your most productive hour of the day, your preferred study modes, and cycle completion rates—providing contextual productivity tips and highlights directly in your feed or stats panels.
          </p>
        </div>
      )
    },
    {
      id: 'history',
      title: 'Session History',
      icon: History,
      category: 'features',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            The <strong className="text-tm-primary">Advanced History Hub</strong> lets you review and audit your historical study logs.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every focus session is written with complete context: exact start and end times, planned vs actual duration, cycle status (Completed, Stopped, or Skipped), device info, focus goals, and custom notes. You can search, filter by mode or status, sort, view aggregate statistics, and download your entire history as a CSV or JSON file.
          </p>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Workspace Settings',
      icon: Settings,
      category: 'technical',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Tune the application behavior to align perfectly with your workflows.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure default study durations, breaks, cycle goals, active focus subjects, sound effects, auto-advance phases, and fluid device layouts.
          </p>
        </div>
      )
    },
    {
      id: 'backup-restore',
      title: 'Backup & Restore',
      icon: Database,
      category: 'technical',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Timerra supports full-fidelity manual backup options outside of our secure Capsule system.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inside the Capsule portal, you can perform standard unencrypted data exports. This generates a standard JSON backup of all settings and study histories which you can store securely or import back into any other browser.
          </p>
        </div>
      )
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      icon: Key,
      category: 'technical',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Boost your interaction speed by leveraging our native keyboard commands:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">Play/Pause Timer</span>
              <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-white text-[10px]">Space</kbd>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">Restart Timer</span>
              <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-white text-[10px]">R</kbd>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">Stop & Save Session</span>
              <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-white text-[10px]">S</kbd>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">Skip to Next Phase</span>
              <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-white text-[10px]">N</kbd>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">Immersive Customization</span>
              <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-white text-[10px]">C</kbd>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">Toggle Fullscreen</span>
              <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-white text-[10px]">F</kbd>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between col-span-2">
              <span className="text-slate-400">Close Panel / Exit Immersive</span>
              <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-white text-[10px]">ESC</kbd>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: AlertTriangle,
      category: 'support',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Encountering performance spikes or synchronization lags? Follow these steps:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-2 pl-1 leading-relaxed">
            <li><strong className="text-slate-200">Tab Throttling:</strong> If the timer lags in background tabs, enable browser-level audio feedback (Tick sound) or run the page in its own dedicated window.</li>
            <li><strong className="text-slate-200">Database Corruptions:</strong> If database errors pop up, export your encrypted Capsule immediately, clear your browser cookies/cache for Timerra, and restore the Capsule to re-index all sessions cleanly.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: HelpCircle,
      category: 'support',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Frequently Asked Questions:
          </p>
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
              <h5 className="font-bold text-slate-200">Does Timerra send my data to Google?</h5>
              <p className="text-slate-400 mt-1">No. Timerra is designed to run completely offline. All data remains inside your browser's sandboxed storage.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
              <h5 className="font-bold text-slate-200">Can I import my data on a phone?</h5>
              <p className="text-slate-400 mt-1">Yes, simply export an encrypted Capsule (.json) on your computer, transfer it via secure messaging or cloud share, and restore it inside your phone's browser.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: Shield,
      category: 'support',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Timerra operates under a strict <strong className="text-emerald-400">Zero-Knowledge Offline Privacy Guarantee</strong>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            We do not collect telemetry, trackers, cookies, analytic events, or usage metrics. Your study history, passwords, capsule encryption keys, and active projects never touch the internet or third-party servers. Your focus data belongs exclusively to you.
          </p>
        </div>
      )
    }
  ], []);

  const filteredSections = useMemo(() => {
    return sections.filter(sec => {
      if (!searchQuery.trim()) return true;
      const term = searchQuery.toLowerCase();
      const matchesTitle = sec.title.toLowerCase().includes(term);
      return matchesTitle;
    });
  }, [sections, searchQuery]);

  const activeSection = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId) || sections[0];
  }, [sections, selectedSectionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main glass card container */}
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[750px] bg-[#070b1a]/95 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Subtle decorative glow lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-tm-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-tm-accent/5 rounded-full blur-[120px] pointer-events-none" />

        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-tm-primary" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-[0.25em] uppercase text-white">
                Official User Guide
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Timerra Core Documentation & Interactive Troubleshooting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Dismiss Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BAR (SHRINKABLE) */}
        <div className="px-6 py-3 bg-white/[0.01] border-b border-white/5 relative z-10 flex items-center gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation sections (e.g. Capsule, Shortcuts)..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-tm-primary placeholder-slate-500"
            />
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* LEFT INDEX COLUMN */}
          <div className="w-full md:w-64 border-r border-white/5 bg-black/20 overflow-y-auto overscroll-contain p-4 flex flex-row md:flex-col gap-2 shrink-0 md:h-full no-scrollbar">
            {filteredSections.map(sec => {
              const SecIcon = sec.icon;
              const isSelected = sec.id === selectedSectionId;
              return (
                <button
                  key={sec.id}
                  onClick={() => { playClick(); setSelectedSectionId(sec.id); }}
                  className={`w-auto md:w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-3 shrink-0 border ${
                    isSelected 
                      ? 'bg-tm-primary/10 border-tm-primary/20 text-white shadow-[0_4px_15px_rgba(var(--tm-primary-rgb),0.1)]' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SecIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-tm-primary' : 'text-slate-500'}`} />
                    <span className="truncate max-w-[120px] md:max-w-none">{sec.title}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 hidden md:block transition-transform ${isSelected ? 'text-tm-primary translate-x-0.5' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          {/* RIGHT DETAIL SECTION CONTAINER */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-tm-primary bg-tm-primary/5 border border-tm-primary/15 px-2.5 py-0.5 rounded">
                  {activeSection.category}
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">
                {activeSection.title}
              </h3>
            </div>

            <div className="border-t border-white/5 pt-6">
              {activeSection.content}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
