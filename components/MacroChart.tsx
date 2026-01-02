import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DailyLog, MacroKey, AVAILABLE_MACROS } from '../types';

interface MacroChartProps {
  data: DailyLog[];
  activeMacros: MacroKey[];
}

const MacroChart: React.FC<MacroChartProps> = ({ data, activeMacros }) => {
  // Process data for Recharts: flatten the 'totals' object into the root
  const chartData = data.map(log => ({
    date: log.date,
    ...log.totals
  })).slice(-7); // Show last 7 days by default

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted border border-dashed border-slate-300 rounded-xl bg-slate-50">
        <p>No data recorded yet. Start logging food!</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate} 
            stroke="#64748b" 
            tick={{ fontSize: 12 }}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#0f172a' }}
            labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          
          {activeMacros.map((key) => {
            const macroConfig = AVAILABLE_MACROS.find(m => m.key === key);
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={macroConfig?.label}
                stroke={macroConfig?.color}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 0, fill: macroConfig?.color }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MacroChart;