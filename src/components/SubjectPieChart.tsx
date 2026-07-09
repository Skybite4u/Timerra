import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { StudyLog } from '../types';
import { BookOpen, PieChart as ChartIcon } from 'lucide-react';

interface SubjectPieChartProps {
  logs: StudyLog[];
}

interface ChartDataItem {
  name: string;
  value: number; // minutes
}

const COLORS = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#14b8a6', // teal-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#8b5cf6', // violet-500
];

export const SubjectPieChart: React.FC<SubjectPieChartProps> = ({ logs }) => {
  // Extract and sum minutes by subject (for focus sessions)
  const subjectMap = logs
    .filter(log => log.mode === 'focus')
    .reduce((acc, log) => {
      const subject = log.subject || 'General Study';
      acc[subject] = (acc[subject] || 0) + log.durationMinutes;
      return acc;
    }, {} as Record<string, number>);

  const data: ChartDataItem[] = Object.keys(subjectMap)
    .map(name => ({ name, value: subjectMap[name] }))
    .sort((a, b) => b.value - a.value); // Sort descending

  const totalFocusMins = data.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltips with ambient blur/glass styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      const percentage = totalFocusMins > 0 ? ((dataItem.value / totalFocusMins) * 100).toFixed(1) : '0.0';
      return (
        <div className="bg-slate-950/90 border border-white/10 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl font-sans text-left">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
            Subject
          </p>
          <p className="text-xs text-white font-medium mt-0.5">
            {dataItem.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-blue-400 font-mono font-bold">
              {dataItem.value} mins
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({percentage}%)
            </span>
          </div>
        </div>
      );
    };
    return null;
  };

  // Custom Legend component for glossy aesthetic
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => {
          const percentage = totalFocusMins > 0 ? ((entry.payload.value / totalFocusMins) * 100).toFixed(0) : '0';
          return (
            <div key={`legend-${index}`} className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-slate-300">{entry.value}</span>
              <span className="text-slate-500 font-mono">({percentage}%)</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center select-none">
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl mb-3 text-slate-500">
          <BookOpen size={20} />
        </div>
        <p className="text-xs text-slate-400 font-medium">No Subject Data Recorded Yet</p>
        <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
          Start a Focus session with a subject selected to see your distribution!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="rgba(15, 23, 42, 0.8)" 
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label showing total focus minutes */}
        <div className="absolute top-[37%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total</span>
          <span className="text-xl font-bold text-white font-sans mt-0.5 leading-none">{totalFocusMins}</span>
          <span className="text-[8px] text-slate-400 uppercase tracking-widest font-mono mt-0.5 leading-none">mins</span>
        </div>
      </div>
    </div>
  );
};
