import React, { useState } from 'react';
import { X, Search, Archive, RotateCcw, Trash2, Award, ArrowUpRight } from 'lucide-react';

interface CompletedSubjectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  completedSubjects: string[];
  onRestoreSubject: (sub: string) => void;
  onDeleteSubject: (sub: string) => void;
}

export const CompletedSubjectsPanel: React.FC<CompletedSubjectsPanelProps> = ({
  isOpen,
  onClose,
  completedSubjects,
  onRestoreSubject,
  onDeleteSubject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = completedSubjects.filter(sub =>
    sub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#0a0d1e]/90 border border-emerald-500/20 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col max-h-[85vh] tm-glass-dense animate-scale-up">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
              <Archive className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">Completed Subjects</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Archive of your successfully achieved focus subjects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Stats Bar */}
          <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">Total Completed Objectives</span>
            </div>
            <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-lg">
              {completedSubjects.length}
            </span>
          </div>

          {/* Search Box */}
          {completedSubjects.length > 0 && (
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-500" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search completed subjects..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          )}

          {/* Subjects List */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {filtered.length > 0 ? (
              filtered.map(sub => (
                <div
                  key={sub}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] hover:border-emerald-500/10 transition-all group"
                >
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-xs font-bold text-slate-200 line-through decoration-emerald-500/50">{sub}</span>
                    <span className="text-[9px] text-emerald-500 mt-0.5 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Finished & Saved
                    </span>
                  </div>

                  <div className="flex items-center gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onRestoreSubject(sub)}
                      className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/10 cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold"
                      title="Restore to Active"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Deselect</span>
                    </button>
                    <button
                      onClick={() => onDeleteSubject(sub)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 cursor-pointer transition-all"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto text-slate-500">
                  <Archive className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400">
                    {completedSubjects.length === 0 ? "No Completed Subjects Yet" : "No Match Found"}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {completedSubjects.length === 0
                      ? "Finish some active subjects in your focus hub to start building your legacy!"
                      : "Try checking your spelling or search for another term."}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
