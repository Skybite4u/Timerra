import React, { useState } from 'react';
import { Plus, Check, Trash2, CalendarDays } from 'lucide-react';
import { Task } from '../types';

interface TaskPanelProps {
  tasks: Task[];
  onAddTask: (title: string, priority: 'high' | 'medium' | 'low') => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskPanel({ tasks, onAddTask, onToggleTask, onDeleteTask }: TaskPanelProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = taskTitle.trim();
    if (trimmed) {
      onAddTask(trimmed, priority);
      setTaskTitle('');
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="w-full flex flex-col p-6 rounded-3xl backdrop-blur-xl bg-slate-900/40 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.02)] transition-all duration-500 hover:border-white/15">
      {/* HEADER HUD */}
      <div className="flex items-center justify-between mb-4 select-none">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
            <CalendarDays size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Today's Focus Tasks</h3>
            <p className="text-[10px] text-slate-500">Track study objectives side-by-side</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          {completedCount}/{totalCount} Completed
        </span>
      </div>

      {/* COMPLETED PROGRESS BAR */}
      <div className="w-full mb-6">
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        {totalCount > 0 && (
          <div className="flex justify-end mt-1.5">
            <span className="text-[9px] font-mono font-bold text-pink-400 uppercase tracking-widest">
              {Math.round(completionPercent)}% Task Completion
            </span>
          </div>
        )}
      </div>

      {/* TASK ADDITION FORM */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          type="text"
          placeholder="What are you working on next?"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="flex-1 px-3.5 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/40 focus:bg-black/30 transition-all font-medium"
        />
        
        <div className="flex gap-2">
          {/* Priority selector */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-slate-400 focus:outline-none focus:border-pink-500/40 transition-colors font-medium cursor-pointer"
          >
            <option value="high" className="bg-slate-950 text-rose-400">High</option>
            <option value="medium" className="bg-slate-950 text-amber-400">Medium</option>
            <option value="low" className="bg-slate-950 text-sky-400">Low</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-pink-500 hover:bg-pink-400 text-slate-950 hover:scale-105 active:scale-95 border border-pink-500/25 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-pink-500/15"
          >
            <Plus size={14} className="stroke-[3]" /> Add
          </button>
        </div>
      </form>

      {/* TASK ITEMS LIST */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl select-none">
            <span className="text-lg mb-1">🌸</span>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No study goals added</p>
            <p className="text-[9px] text-slate-600 max-w-[190px] mt-0.5">Stay organized! Add items above to synchronize with your study loop.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.completed;
            const priorityStyle = {
              high: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
              medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              low: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
            }[task.priority];

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                  isCompleted
                    ? 'bg-white/[0.01] border-white/5 opacity-50'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  {/* Styled Checklist Circle */}
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-pink-500 text-slate-950 border border-pink-500 scale-95 shadow-[0_0_8px_rgba(236,72,153,0.3)] animate-pop'
                        : 'border-2 border-slate-600 hover:border-pink-500 bg-black/10'
                    }`}
                  >
                    {isCompleted && <Check size={12} className="stroke-[3]" />}
                  </button>

                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      onClick={() => onToggleTask(task.id)}
                      className={`text-[11.5px] font-semibold truncate leading-tight cursor-pointer ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 select-none">
                  {/* Priority Label */}
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider border ${priorityStyle}`}>
                    {task.priority}
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
