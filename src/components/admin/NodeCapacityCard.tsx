import React from 'react';
import { Activity, Cpu, MemoryStick, HardDrive } from 'lucide-react';

interface StatBarProps {
  label: string;
  used: number;
  total: number;
  usedLabel: string;
  totalLabel: string;
  color: string;
}

export function StatBar({ label, used, total, usedLabel, totalLabel, color }: StatBarProps) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isHigh = pct > 80;
  const isMid = pct > 60;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-end">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-bold ${isHigh ? 'text-red-400' : isMid ? 'text-amber-400' : 'text-slate-300'}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isHigh ? 'bg-red-500' : isMid ? 'bg-amber-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>Used: <span className="text-slate-300 font-medium">{usedLabel}</span></span>
        <span>Total: <span className="text-slate-300 font-medium">{totalLabel}</span></span>
      </div>
    </div>
  );
}

export function SectionCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface NodeCapacityCardProps {
  targetNode: string;
  nodeStatus: any;
  cpuModel: string;
  totalAllocatedCores: number;
  cpuUsagePct: number;
  totalCores: number;
  unallocatedCores: number;
  totalAllocatedRam: number;
  usedRamBytes: number;
  totalRamBytes: number;
  unallocatedRam: number;
  estimatedMaxNewVms: string | number;
  totalAllocatedDisk: number;
  usedDiskBytes: number;
  totalDiskBytes: number;
  unallocatedDisk: number;
  fmtUptime: (s: number) => string;
  fmtBytes: (b: number) => string;
}

export function NodeCapacityCard({
  targetNode, nodeStatus, cpuModel,
  totalAllocatedCores, cpuUsagePct, totalCores, unallocatedCores,
  totalAllocatedRam, usedRamBytes, totalRamBytes, unallocatedRam, estimatedMaxNewVms,
  totalAllocatedDisk, usedDiskBytes, totalDiskBytes, unallocatedDisk,
  fmtUptime, fmtBytes
}: NodeCapacityCardProps) {
  return (
    <SectionCard className="!overflow-visible">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-slate-800 rounded-xl">
              <Activity className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Live Node Capacity — <span className="text-blue-600 dark:text-cyan-400">{targetNode}</span></h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Uptime: <span className="text-slate-700 dark:text-slate-300 font-medium">{nodeStatus?.uptime ? fmtUptime(nodeStatus.uptime) : '—'}</span>
                &nbsp;·&nbsp; CPU Model: <span className="text-slate-700 dark:text-slate-300 font-medium">{cpuModel}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">CPU</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-amber-50 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-500 rounded-md border border-amber-200 dark:border-yellow-500/20">
                Allocated: {totalAllocatedCores}
              </span>
            </div>
            <StatBar
              label="Core Utilization"
              used={cpuUsagePct}
              total={100}
              usedLabel={`${cpuUsagePct.toFixed(1)}%`}
              totalLabel={`${totalCores} vCores`}
              color="bg-blue-500 dark:bg-cyan-500"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                <div className="text-lg font-bold text-amber-600 dark:text-yellow-400">{unallocatedCores}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Unallocated</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                <div className="text-lg font-bold text-slate-800 dark:text-cyan-300">{totalCores}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total Cores</div>
              </div>
            </div>
          </div>

          {/* RAM Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Memory (RAM)</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-amber-50 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-500 rounded-md border border-amber-200 dark:border-yellow-500/20">
                Allocated: {fmtBytes(totalAllocatedRam)}
              </span>
            </div>
            <StatBar
              label="Physical RAM Usage"
              used={usedRamBytes}
              total={totalRamBytes}
              usedLabel={fmtBytes(usedRamBytes)}
              totalLabel={fmtBytes(totalRamBytes)}
              color="bg-blue-600 dark:bg-blue-500"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                <div className="text-lg font-bold text-amber-600 dark:text-yellow-400">{fmtBytes(unallocatedRam)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Unallocated</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                <div className="text-lg font-bold text-slate-800 dark:text-blue-300">{estimatedMaxNewVms}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Free VM Slots</div>
              </div>
            </div>
          </div>

          {/* Storage Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Storage (Root FS)</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-amber-50 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-500 rounded-md border border-amber-200 dark:border-yellow-500/20">
                Allocated: {fmtBytes(totalAllocatedDisk)}
              </span>
            </div>
            <StatBar
              label="Physical Disk Usage"
              used={usedDiskBytes}
              total={totalDiskBytes}
              usedLabel={fmtBytes(usedDiskBytes)}
              totalLabel={fmtBytes(totalDiskBytes)}
              color="bg-sky-500"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                <div className="text-lg font-bold text-amber-600 dark:text-yellow-400">{fmtBytes(unallocatedDisk)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Unallocated</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                <div className="text-lg font-bold text-slate-800 dark:text-sky-300">{totalDiskBytes > 0 ? ((usedDiskBytes / totalDiskBytes) * 100).toFixed(0) : 0}%</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Used Physical</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
