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

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ sessions }) => {
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

  return (
    <div className="w-full h-48 select-none" id="weekly-recharts-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="todayBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--tm-primary)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="var(--tm-accent)" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="otherBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" stopOpacity={0.6} />
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
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isToday ? "url(#todayBarGrad)" : "url(#otherBarGrad)"}
                stroke={entry.isToday ? "var(--tm-primary)" : "rgba(255,255,255,0.05)"}
                strokeWidth={1}
                className="transition-all duration-300 hover:opacity-90"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
