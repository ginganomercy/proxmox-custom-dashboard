'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MetricChartProps {
  title: string;
  value: number; // Percentage 0-100
  color: string;
}

export function MetricChart({ title, value, color }: MetricChartProps) {
  const data = [
    { name: 'Used', value: Math.max(0, value) },
    { name: 'Free', value: Math.max(0, 100 - value) },
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      <h3 className="text-slate-600 font-medium mb-2">{title}</h3>
      <div className="relative w-32 h-32">
        <PieChart width={128} height={128}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            cornerRadius={4}
          >
            <Cell key="cell-0" fill={color} />
            <Cell key="cell-1" fill="#E2E8F0" />
          </Pie>
          <Tooltip 
            formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']} 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-slate-800">{value.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
