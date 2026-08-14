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
        <div className="p-2.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Server className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Cluster Allocation Breakdown</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Resource partitioning across Docker Swarm and Generic Nodes</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Swarm Managers */}
        <div className="border border-indigo-100 dark:border-slate-700 bg-indigo-50/30 dark:bg-slate-800/50 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-indigo-100 dark:border-slate-700 pb-2">
            <span className="font-bold text-indigo-900 dark:text-indigo-400 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-500"/> Swarm Managers</span>
            <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">{mgrMetrics.count} VMs</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated CPU</span><span className="font-semibold text-slate-700 dark:text-slate-200">{mgrMetrics.cpu} Cores</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated RAM</span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmtBytes(mgrMetrics.ram)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated Disk</span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmtBytes(mgrMetrics.disk)}</span></div>
          </div>
        </div>

        {/* Swarm Workers */}
        <div className="border border-sky-100 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800/50 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-sky-100 dark:border-slate-700 pb-2">
            <span className="font-bold text-sky-900 dark:text-sky-400 text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-sky-600 dark:text-sky-500"/> Swarm Workers</span>
            <span className="text-xs font-bold bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md">{wkrMetrics.count} VMs</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated CPU</span><span className="font-semibold text-slate-700 dark:text-slate-200">{wkrMetrics.cpu} Cores</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated RAM</span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmtBytes(wkrMetrics.ram)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated Disk</span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmtBytes(wkrMetrics.disk)}</span></div>
          </div>
        </div>

        {/* Generic Nodes */}
        <div className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2"><HardDrive className="w-4 h-4 text-slate-500 dark:text-slate-400"/> Other / Generic</span>
            <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">{genMetrics.count} VMs</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated CPU</span><span className="font-semibold text-slate-700 dark:text-slate-200">{genMetrics.cpu} Cores</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated RAM</span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmtBytes(genMetrics.ram)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Allocated Disk</span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmtBytes(genMetrics.disk)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
