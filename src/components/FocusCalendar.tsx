import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Flame, 
  Award,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Session } from '../types';

interface FocusCalendarProps {
  sessions: Session[];
}

export const FocusCalendar: React.FC<FocusCalendarProps> = ({ sessions }) => {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDate = today.getDate();

  // State for the calendar navigation
  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [viewMonth, setViewMonth] = useState<number>(currentMonth);

  // Hover state for tooltips
  const [activeTooltipDay, setActiveTooltipDay] = useState<number | null>(null);

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days of the week headers
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Reset to today
  const handleJumpToToday = () => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);
  };

  // Check if current view is different from today's month/year
  const isNavigatedAway = viewYear !== currentYear || viewMonth !== currentMonth;

  // Generate calendar days
  const calendarData = useMemo(() => {
    // First day of the week for the viewed month
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    // Total days in viewed month
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Days in previous month (for padding)
    const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dayNum: number;
      isCurrentMonth: boolean;
      dateKey: string;
      dateObject: Date;
    }> = [];

    // 1. Previous month buffer days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayVal = prevMonthTotalDays - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        dayNum: dayVal,
        isCurrentMonth: false,
        dateKey: `${prevYear}-${prevMonth}-${dayVal}`,
        dateObject: new Date(prevYear, prevMonth, dayVal)
      });
    }

    // 2. Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        dayNum: i,
        isCurrentMonth: true,
        dateKey: `${viewYear}-${viewMonth}-${i}`,
        dateObject: new Date(viewYear, viewMonth, i)
      });
    }

    // 3. Next month buffer days (pad to complete the final grid row, usually multiples of 7)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const nextMonthPadding = totalSlots - days.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        dayNum: i,
        isCurrentMonth: false,
        dateKey: `${nextYear}-${nextMonth}-${i}`,
        dateObject: new Date(nextYear, nextMonth, i)
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Group sessions by local date key to make lookups fast and reliable
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    
    sessions.forEach(s => {
      if (!s.completedAt) return;
      const date = new Date(s.completedAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(s);
    });

    return map;
  }, [sessions]);

  // Streak calculation for current month
  const statsForMonth = useMemo(() => {
    let completedDaysInViewMonth = 0;
    let totalViewMonthSessions = 0;
    
    // Find how many days of the viewed month have at least 1 completed session
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const key = `${viewYear}-${viewMonth}-${i}`;
      if (sessionsByDate[key] && sessionsByDate[key].length > 0) {
        completedDaysInViewMonth++;
        totalViewMonthSessions += sessionsByDate[key].length;
      }
    }

    return {
      completedDaysCount: completedDaysInViewMonth,
      totalSessionsCount: totalViewMonthSessions,
      completionRate: Math.round((completedDaysInViewMonth / daysInMonth) * 100)
    };
  }, [viewYear, viewMonth, sessionsByDate]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-5 relative overflow-hidden group">
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-tm-primary/5 rounded-full blur-[60px] pointer-events-none -mr-12 -mt-12 transition-all duration-1000 group-hover:bg-tm-primary/10" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-tm-accent/5 rounded-full blur-[50px] pointer-events-none -ml-10 -mb-10 transition-all duration-1000 group-hover:bg-tm-accent/10" />

      {/* Header section with navigation controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-tm-primary/10 text-tm-primary border border-tm-primary/15 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Focus Calendar</h4>
            <p className="text-[9px] text-slate-500 font-medium">Monthly streak tracker & contribution grid</p>
          </div>
        </div>

        {/* Navigation & Jump to Today controls */}
        <div className="flex items-center gap-2">
          {/* Jump to Today Button */}
          {isNavigatedAway && (
            <button
              onClick={handleJumpToToday}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-tm-primary/10 hover:bg-tm-primary/20 text-tm-primary hover:text-white border border-tm-primary/20 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer active:scale-95 animate-fade-in"
              title="Reset view to current month"
            >
              <RotateCcw className="w-3 h-3" />
              Jump to Today
            </button>
          )}

          {/* Month Selector Buttons */}
          <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-xl p-0.5 select-none">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300 min-w-[100px] text-center">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid display of days */}
      <div className="relative z-10">
        {/* Days of week titles */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {daysOfWeek.map(day => (
            <span key={day} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Days of month grid slots */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((item, index) => {
            const hasSessions = sessionsByDate[item.dateKey] && sessionsByDate[item.dateKey].length > 0;
            const sessionsOnDay = sessionsByDate[item.dateKey] || [];
            const isToday = item.isCurrentMonth && item.dayNum === currentDate && viewMonth === currentMonth && viewYear === currentYear;
            
            // Subtle color tier depending on number of sessions completed (like contributions map)
            let highlightClass = '';
            if (hasSessions) {
              const count = sessionsOnDay.length;
              if (count === 1) {
                highlightClass = 'bg-tm-primary/20 border-tm-primary/30 text-white font-bold shadow-[0_0_12px_rgba(var(--tm-primary-rgb),0.1)]';
              } else if (count === 2) {
                highlightClass = 'bg-tm-primary/35 border-tm-primary/50 text-white font-bold shadow-[0_0_15px_rgba(var(--tm-primary-rgb),0.2)]';
              } else {
                highlightClass = 'bg-tm-primary/55 border-tm-primary/80 text-white font-extrabold shadow-[0_0_18px_rgba(var(--tm-primary-rgb),0.3)]';
              }
            }

            return (
              <div
                key={`${item.dateKey}-${index}`}
                className="relative"
                onMouseEnter={() => hasSessions && setActiveTooltipDay(index)}
                onMouseLeave={() => setActiveTooltipDay(null)}
              >
                <button
                  disabled={!hasSessions}
                  className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl border transition-all text-[11px] select-none ${
                    !item.isCurrentMonth
                      ? 'text-slate-600/45 border-transparent bg-transparent pointer-events-none'
                      : isToday
                        ? 'border-tm-accent bg-tm-accent/10 font-bold text-tm-accent shadow-[0_0_10px_rgba(var(--tm-accent-rgb),0.2)]'
                        : hasSessions
                          ? `${highlightClass} hover:scale-[1.05] cursor-pointer`
                          : 'border-white/[0.03] bg-white/[0.01] text-slate-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>{item.dayNum}</span>
                  
                  {/* Subtle dot markers to indicate sessions */}
                  {hasSessions && (
                    <span className="flex gap-0.5 mt-0.5">
                      {sessionsOnDay.slice(0, 3).map((_, i) => (
                        <span key={i} className="w-1 h-1 rounded-full bg-white opacity-85 shadow-sm" />
                      ))}
                      {sessionsOnDay.length > 3 && (
                        <span className="text-[6px] font-black leading-none text-white opacity-90">+</span>
                      )}
                    </span>
                  )}
                </button>

                {/* Hover Tooltip listing study sessions completed */}
                {activeTooltipDay === index && hasSessions && (
                  <div className="absolute bottom-[115%] left-1/2 -translate-x-1/2 w-52 bg-[#0a0f24]/95 border border-white/10 rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-lg z-40 pointer-events-none animate-fade-in text-[10px]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2">
                      <span className="font-extrabold text-slate-200">
                        {monthNames[item.dateObject.getMonth()]} {item.dayNum}, {item.dateObject.getFullYear()}
                      </span>
                      <span className="flex items-center gap-0.5 bg-tm-primary/10 text-tm-primary px-1.5 py-0.5 rounded-md font-bold text-[8px] uppercase tracking-wider">
                        {sessionsOnDay.length} {sessionsOnDay.length === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>

                    {/* Total Daily Focus Minutes Summary */}
                    <div className="mb-2 flex items-center gap-1.5 bg-white/[0.03] px-2 py-1.5 rounded-lg border border-white/5">
                      <Clock className="w-3.5 h-3.5 text-tm-primary" />
                      <span className="text-slate-300 text-[9px]">
                        Total Focused: <strong className="text-white font-black text-xs">
                          {Math.round(sessionsOnDay.reduce((acc, curr) => acc + curr.durationSec, 0) / 60)}
                        </strong> mins
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {sessionsOnDay.map((s, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5 border-l-2 border-tm-accent/60 pl-2 py-0.5 bg-white/[0.01] rounded-r-md">
                          <span className="font-bold text-slate-200 truncate">{s.subject}</span>
                          <span className="text-[8px] text-slate-400 flex items-center gap-1">
                            <span>{Math.round(s.durationSec / 60)}m</span>
                            <span className="text-slate-600">•</span>
                            <span className="uppercase tracking-widest text-[7px] text-tm-primary/80 font-bold">{s.mode}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid footer / stats summary & legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5 relative z-10 text-[9px]">
        {/* Dynamic viewed month summary stats */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-slate-400">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-tm-primary" />
            <span>Active Days: <strong className="text-white font-semibold">{statsForMonth.completedDaysCount}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Month Consistency: <strong className="text-white font-semibold">{statsForMonth.completionRate}%</strong></span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-md bg-white/[0.01] border border-white/[0.03]" />
            Empty
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-md bg-tm-accent/15 border border-tm-accent" />
            Today
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-md bg-tm-primary/30 border border-tm-primary/50" />
            Completed
          </span>
        </div>
      </div>
    </div>
  );
};
