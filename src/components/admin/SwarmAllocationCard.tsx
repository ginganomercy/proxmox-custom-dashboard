import React from 'react';
import { Server, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

interface Metrics {
  count: number;
  cpu: number;
  ram: number;
  disk: number;
}

interface SwarmAllocationCardProps {
  mgrMetrics: Metrics;
  wkrMetrics: Metrics;
  genMetrics: Metrics;
  fmtBytes: (bytes: number) => string;
}

export function SwarmAllocationCard({ mgrMetrics, wkrMetrics, genMetrics, fmtBytes }: SwarmAllocationCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 rounded-xl">
          <Server className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Cluster Allocation Breakdown</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Resource partitioning across Docker Swarm and Generic Nodes</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Swarm Managers */}
        <div className="border border-indigo-100 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-800/80 dark:to-indigo-900/20 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10">
          <div className="flex items-center justify-between mb-4 border-b border-indigo-100 dark:border-indigo-500/20 pb-3">
            <span className="font-extrabold text-indigo-900 dark:text-indigo-300 text-sm flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400"/> Swarm Managers</span>
            <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30 shadow-sm">{mgrMetrics.count} VMs</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated CPU</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{mgrMetrics.cpu} Cores</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated RAM</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{fmtBytes(mgrMetrics.ram)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated Disk</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{fmtBytes(mgrMetrics.disk)}</span></div>
          </div>
        </div>

        {/* Swarm Workers */}
        <div className="border border-sky-100 dark:border-sky-500/20 bg-gradient-to-br from-sky-50/50 to-blue-50/50 dark:from-slate-800/80 dark:to-sky-900/20 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10">
          <div className="flex items-center justify-between mb-4 border-b border-sky-100 dark:border-sky-500/20 pb-3">
            <span className="font-extrabold text-sky-900 dark:text-sky-300 text-sm flex items-center gap-2"><Cpu className="w-5 h-5 text-sky-500 dark:text-sky-400"/> Swarm Workers</span>
            <span className="text-xs font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-500/30 shadow-sm">{wkrMetrics.count} VMs</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated CPU</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{wkrMetrics.cpu} Cores</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated RAM</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{fmtBytes(wkrMetrics.ram)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated Disk</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{fmtBytes(wkrMetrics.disk)}</span></div>
          </div>
        </div>

        {/* Generic Nodes */}
        <div className="border border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-800/50 dark:to-slate-800/30 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-500/5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2"><HardDrive className="w-5 h-5 text-slate-400 dark:text-slate-500"/> Other / Generic</span>
            <span className="text-xs font-bold bg-slate-200/70 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-300/50 dark:border-slate-600/50 shadow-sm">{genMetrics.count} VMs</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated CPU</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{genMetrics.cpu} Cores</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated RAM</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{fmtBytes(genMetrics.ram)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-medium">Allocated Disk</span><span className="font-bold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{fmtBytes(genMetrics.disk)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
