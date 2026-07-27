"use client";

import { motion } from "framer-motion";

export function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const width = 500;
  const height = 200;
  const padding = 30;

  // Calculate points
  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (d.value * (height - padding * 2)) / maxVal;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ""
  );

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
        API Requests (Last 7 Days)
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded-full">Real-time</span>
      </h4>
      <div className="relative w-full aspect-[2.5/1]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
            const y = padding + r * (height - padding * 2);
            return (
              <line 
                key={idx} 
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                className="stroke-slate-100 dark:stroke-slate-800/60" 
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Fill */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            d={areaD}
            fill="url(#areaGrad)"
          />

          {/* Path Line */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            d={pathD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group/dot cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 stroke-2 hover:r-7 transition-all"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="10"
                className="fill-indigo-600/20 opacity-0 group-hover/dot:opacity-100 transition-opacity"
              />
            </g>
          ))}
        </svg>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-3 px-6 text-[10px] font-bold text-slate-400">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
        Daily Active Users
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded-full">Weekly</span>
      </h4>
      <div className="flex items-end justify-between h-40 gap-3 pt-6 px-2">
        {data.map((d, idx) => {
          const heightPct = `${(d.value / maxVal) * 100}%`;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
              <div className="relative w-full h-32 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: heightPct }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300 rounded-xl group-hover:brightness-110 transition-all shadow-md shadow-indigo-500/10"
                />
                {/* Tooltip */}
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {d.value}
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  let accumulatedAngle = 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
      <div>
        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4">Customer Distribution</h4>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {data.map((d, idx) => {
              const percentage = (d.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = 100 - accumulatedAngle;
              accumulatedAngle += percentage;

              return (
                <circle
                  key={idx}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={d.color}
                  strokeWidth="4.2"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:stroke-[5] cursor-pointer"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{total}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">Customers</span>
          </div>
        </div>
        
        {/* Legends */}
        <div className="flex-1 space-y-1.5 w-full">
          {data.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.label}</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200">{((d.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
