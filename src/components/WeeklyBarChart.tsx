import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Session } from '../types';

interface WeeklyBarChartProps {
  sessions: Session[];
}

interface ChartDataItem {
  date: string;
  name: string; // Day of week (e.g., 'Mon')
  minutes: number;
  isToday: boolean;
}

export const WeeklyBarChart = React.memo<WeeklyBarChartProps>(({ sessions }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calculate Monday of the current week in local time
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  // Generate dataset for Monday through Sunday of the current week
  const chartData: ChartDataItem[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayOfMonth}`;

    // Filter focus sessions completed on this specific date
    const daySessions = sessions.filter(s => {
      const sDate = new Date(s.completedAt).toISOString().split('T')[0];
      return sDate === dateStr && s.mode === 'focus';
    });
    
    const totalMinutes = Math.round(daySessions.reduce((sum, s) => sum + (s.durationSec / 60), 0));
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    return {
      date: dateStr,
      name: dayLabel,
      minutes: totalMinutes,
      isToday: dateStr === todayStr,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/90 border border-white/10 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl font-sans text-left">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
            {new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-tm-primary font-mono font-bold mt-1">
            {data.minutes} <span className="text-[10px] font-sans font-normal text-slate-400">mins focused</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getGradientId = (minutes: number, isToday: boolean) => {
    if (minutes === 0) return isToday ? 'intensityTodayLow' : 'intensityLow';
    if (minutes < 15) return isToday ? 'intensityTodayLow' : 'intensityLow';
    if (minutes < 45) return isToday ? 'intensityTodayMedium' : 'intensityMedium';
    if (minutes < 90) return isToday ? 'intensityTodayHigh' : 'intensityHigh';
    return isToday ? 'intensityTodayEpic' : 'intensityEpic';
  };

  const getStrokeOpacity = (minutes: number, isToday: boolean) => {
    if (minutes === 0) return 0.05;
    if (isToday) return 0.9;
    if (minutes < 15) return 0.2;
    if (minutes < 45) return 0.45;
    if (minutes < 90) return 0.7;
    return 0.95;
  };

  return (
    <div className="w-full space-y-4" id="weekly-recharts-wrapper">
      <div className="w-full h-44 select-none" id="weekly-recharts-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              {/* Low Intensity: < 15 mins */}
              <linearGradient id="intensityLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--tm-primary)" stopOpacity={0.08} />
              </linearGradient>
              
              {/* Medium Intensity: 15 - 44 mins */}
              <linearGradient id="intensityMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.25} />
              </linearGradient>
              
              {/* High Intensity: 45 - 89 mins */}
              <linearGradient id="intensityHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={0.8} />
                <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.45} />
              </linearGradient>
              
              {/* Epic Intensity: >= 90 mins */}
              <linearGradient id="intensityEpic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={1.0} />
                <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.8} />
              </linearGradient>

              {/* Special Today Highlight variants with extra vibrancy */}
              <linearGradient id="intensityTodayLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="intensityTodayMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id="intensityTodayHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.55} />
              </linearGradient>
              <linearGradient id="intensityTodayEpic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={1.0} />
                <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255, 255, 255, 0.02)" 
            />

            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontFamily: 'monospace' }}
              dy={8}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255, 255, 255, 0.2)', fontSize: 9, fontFamily: 'monospace' }}
              allowDecimals={false}
            />

            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'rgba(255, 255, 255, 0.01)', radius: 8 }}
            />

            <Bar 
              dataKey="minutes" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={32}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => {
                const gradId = getGradientId(entry.minutes, entry.isToday);
                const strokeOpacity = getStrokeOpacity(entry.minutes, entry.isToday);
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#${gradId})`}
                    stroke={entry.isToday ? "var(--tm-primary)" : "var(--tm-accent)"}
                    strokeOpacity={strokeOpacity}
                    strokeWidth={entry.isToday ? 1.5 : 1}
                    className="transition-all duration-300 hover:opacity-95 cursor-pointer"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Visual Work Intensity Legend */}
      <div className="flex items-center justify-center gap-4 text-[9px] uppercase tracking-wider font-semibold text-slate-500 pt-1.5 border-t border-white/[0.03]">
        <span className="text-[8px] font-bold text-slate-600">Intensity:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded bg-tm-primary/20 border border-tm-primary/10" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded bg-tm-primary/50 border border-tm-accent/20" />
          <span>Med</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded bg-tm-primary/80 border border-tm-accent/45" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded bg-tm-primary border border-tm-accent" />
          <span>Epic</span>
        </div>
      </div>
    </div>
  );
});

WeeklyBarChart.displayName = 'WeeklyBarChart';
