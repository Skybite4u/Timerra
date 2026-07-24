import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bell, History, Settings, Award, 
  Dna, Sparkles, Database, HelpCircle, SlidersHorizontal, ChevronRight
} from 'lucide-react';

interface ControlDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotificationCenter: () => void;
  onOpenHistoryPanel: () => void;
  onOpenSettings: () => void;
  onOpenMilestoneVault: () => void;
  unseenVaultCount: number;
  onOpenFocusDna: () => void;
  onOpenLegacyCards: () => void;
  onOpenBackup: () => void;
  onOpenGuide: () => void;
  unreadNotificationCount: number;
  playClick?: () => void;
}

export const ControlDrawer: React.FC<ControlDrawerProps> = ({
  isOpen,
  onClose,
  onOpenNotificationCenter,
  onOpenHistoryPanel,
  onOpenSettings,
  onOpenMilestoneVault,
  unseenVaultCount,
  onOpenFocusDna,
  onOpenLegacyCards,
  onOpenBackup,
  onOpenGuide,
  unreadNotificationCount,
  playClick,
}) => {
  const handleItemClick = (action: () => void) => {
    if (playClick) playClick();
    action();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (playClick) playClick();
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#060814]/95 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 flex flex-col justify-between overflow-y-auto"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#060814]/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-tm-primary/10 border border-tm-primary/20 flex items-center justify-center text-tm-primary">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">Control Hub</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Quick actions & workspace triggers</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (playClick) playClick();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close Control Hub"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Sections */}
            <div className="p-5 space-y-6 flex-1">
              
              {/* Core Actions */}
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-slate-400 px-1 mb-2.5 block">
                  Workspace Core
                </span>
                <div className="space-y-1.5">
                  {/* Notifications / Logs */}
                  <button
                    onClick={() => handleItemClick(onOpenNotificationCenter)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform relative">
                        <Bell className="w-4 h-4" />
                        {unreadNotificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center border border-[#060814]">
                            {unreadNotificationCount}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-2">
                          <span>Workspace Logs</span>
                          {unreadNotificationCount > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded-full font-mono">
                              {unreadNotificationCount} new
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">Activity feeds & audit logs</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* History */}
                  <button
                    onClick={() => handleItemClick(onOpenHistoryPanel)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <History className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">Session History</div>
                        <div className="text-[10px] text-slate-400">Past focus cycles & reflection notes</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => handleItemClick(onOpenSettings)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">Preferences & Settings</div>
                        <div className="text-[10px] text-slate-400">Timer durations, audio & custom themes</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>

              {/* Focus Environment */}
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-slate-400 px-1 mb-2.5 block">
                  Focus Environment
                </span>
                <div className="space-y-1.5">
                  {/* Milestone Vault */}
                  <button
                    onClick={() => handleItemClick(onOpenMilestoneVault)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform relative">
                        <Award className="w-4 h-4" />
                        {unseenVaultCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse border border-[#060814]" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">Milestone Vault</div>
                        <div className="text-[10px] text-slate-400">Achievements & level unlocks</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Focus DNA */}
                  <button
                    onClick={() => handleItemClick(onOpenFocusDna)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                        <Dna className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">Focus DNA Profile</div>
                        <div className="text-[10px] text-slate-400">Productivity archetype & statistics</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>

              {/* Tools & Relics */}
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-slate-400 px-1 mb-2.5 block">
                  Tools & Vault
                </span>
                <div className="space-y-1.5">
                  {/* Legacy Cards */}
                  <button
                    onClick={() => handleItemClick(onOpenLegacyCards)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">Legacy Collectibles</div>
                        <div className="text-[10px] text-slate-400">Rare focus cards & relics</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Capsule & Backup */}
                  <button
                    onClick={() => handleItemClick(onOpenBackup)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">Timerra Capsule & Sync</div>
                        <div className="text-[10px] text-slate-400">Local export, import & cloud sync</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Guide */}
                  <button
                    onClick={() => handleItemClick(onOpenGuide)}
                    className="w-full p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">User Guide & Info</div>
                        <div className="text-[10px] text-slate-400">Keyboard shortcuts & feature breakdown</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-white/[0.01] text-center">
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                TIMERRA v1.1 • Pure Focus Space
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
