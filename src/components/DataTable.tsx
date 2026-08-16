'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Square, HardDrive, Terminal, X, Power, PowerOff, Settings, Maximize2, MoreVertical, Activity } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ConsoleViewer } from './ConsoleViewer';
import InstanceManageModal from './InstanceManageModal';
import { VMConfigModal } from './VMConfigModal';
import { MetricsModal } from './MetricsModal';

/**
 * Represents a Proxmox Virtual Machine data structure.
 */
interface VM {
  vmid: number;
  name: string;
  status: string; // 'running' | 'stopped'
  cpu: number;
  maxmem: number;
  mem: number;
  type?: string; // e.g. 'qemu' or 'lxc'
  disk?: number;
  maxdisk?: number;
  uptime?: number;
  netin?: number;
  netout?: number;
  diskread?: number;
  diskwrite?: number;
}

/**
 * Props for the DataTable component.
 */
interface DataTableProps {
  /** Array of VM data from Proxmox */
  data: VM[];
  /** Loading state indicator */
  isLoading?: boolean;
  /** Active node name (e.g., 'pve') */
  nodeName?: string;
  /** Callback fired upon successful VM deletion */
  onDeleteSuccess?: () => void;
}

function IPBadge({ nodeName, vm }: { nodeName: string, vm: VM }) {
  const [ip, setIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIp = async () => {
    setLoading(true);
    try {
      const { default: api } = await import('@/lib/api');
      const res = await api.get(`/proxmox/nodes/${nodeName}/${vm.type || 'qemu'}/${vm.vmid}/ip`);
      setIp(res.data.ip);
    } catch (e) {
      setIp('N/A');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center mt-1">
      {ip ? (
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{ip}</span>
      ) : (
        <button onClick={fetchIp} disabled={loading || vm.status !== 'running'} className="text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Fetching...' : 'Reveal IP'}
        </button>
      )}
    </div>
  );
}

export function DataTable({ data, isLoading, nodeName = 'Capybara', onDeleteSuccess }: DataTableProps & { nodeName?: string }) {
  const [activeConsole, setActiveConsole] = useState<VM | null>(null);
  const [activeManage, setActiveManage] = useState<VM | null>(null);
  const [activeConfig, setActiveConfig] = useState<VM | null>(null);
  const [activeMetrics, setActiveMetrics] = useState<VM | null>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const consoleModalRef = useRef<HTMLDivElement>(null);

  // Rate Calculation State
  interface VMRates {
    netinRate: number;
    netoutRate: number;
    diskIoRate: number;
  }
  const [rates, setRates] = useState<Record<number, VMRates>>({});
  const prevDataRef = useRef<Record<number, VM>>({});
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const elapsedSeconds = lastUpdateRef.current === 0 ? 0 : (now - lastUpdateRef.current) / 1000;
    
    // Only calculate if interval is reasonable (e.g. not the first render, and not after sleep)
    if (elapsedSeconds > 0 && elapsedSeconds < 300) {
      const newRates: Record<number, VMRates> = {};
      const prevData = prevDataRef.current;
      
      data.forEach(vm => {
        const prev = prevData[vm.vmid];
        if (prev) {
          const netinDiff = Math.max(0, (vm.netin || 0) - (prev.netin || 0));
          const netoutDiff = Math.max(0, (vm.netout || 0) - (prev.netout || 0));
          
          const currentDiskIo = (vm.diskread || 0) + (vm.diskwrite || 0);
          const prevDiskIo = (prev.diskread || 0) + (prev.diskwrite || 0);
          const diskioDiff = Math.max(0, currentDiskIo - prevDiskIo);
          
          newRates[vm.vmid] = {
            netinRate: netinDiff / elapsedSeconds,
            netoutRate: netoutDiff / elapsedSeconds,
            diskIoRate: diskioDiff / elapsedSeconds,
          };
        }
      });
      setRates(prevRates => ({ ...prevRates, ...newRates }));
    }
    
    // Update refs for next cycle
    lastUpdateRef.current = now;
    const newPrev: Record<number, VM> = {};
    data.forEach(vm => newPrev[vm.vmid] = vm);
    prevDataRef.current = newPrev;
  }, [data]);

  const handlePowerAction = async (vm: VM, action: 'start' | 'stop') => {
    setIsProcessing(vm.vmid);
    const type = vm.type || 'qemu';
    try {
      const { default: api } = await import('@/lib/api');
      // Backend expects POST /proxmox/nodes/:node/qemu/:vmid/power with body { "action": "start" }
      await api.post(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/power`, { action });
      alert(`${action.toUpperCase()} command sent to ${vm.name}. Click 'Refresh' to see status changes.`);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || "Unknown error";
      alert(`Failed to ${action} ${vm.name}: ${errMsg}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '';
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">Loading instances...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">No instances found.</div>;
  }

  return (
    <Tooltip.Provider>
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm">ID</th>
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm">Name</th>
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm">Status</th>
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm">CPU</th>
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm">Memory</th>
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm">Disk Usage</th>
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm">Network & I/O</th>
            <th className="py-4 px-2 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((vm, index) => (
            <tr 
              key={vm.vmid} 
              className={cn(
                "transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50",
                index !== data.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""
              )}
            >
              <td className="py-4 px-2 text-slate-600 dark:text-slate-300 font-medium">#{vm.vmid}</td>
              <td className="py-4 px-2 text-slate-800 dark:text-slate-100 font-medium">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      vm.type === 'lxc' ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    )}>
                      {vm.type ? vm.type.toUpperCase() : 'VM'}
                    </span>
                    <HardDrive className="w-4 h-4 text-slate-400" />
                    {vm.name}
                  </div>
                  <IPBadge nodeName={nodeName} vm={vm} />
                </div>
              </td>
              <td className="py-4 px-2">
                <div className="flex flex-col items-start gap-1">
                  <span className={cn(
                    "pill inline-flex items-center gap-1.5 shadow-sm border",
                    vm.status === 'running' 
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-blue-200/50 dark:shadow-blue-900/20 border-blue-100 dark:border-blue-800/50" 
                      : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-red-200/50 dark:shadow-red-900/20 border-red-100 dark:border-red-800/50"
                  )}>
                    {vm.status === 'running' ? <Play className="w-3 h-3 fill-current" /> : <Square className="w-3 h-3 fill-current" />}
                    {vm.status}
                  </span>
                  {vm.status === 'running' && vm.uptime && (
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Up: {formatUptime(vm.uptime)}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-slate-600 dark:text-slate-300 font-medium">
                {((vm.cpu || 0) * 100).toFixed(1)}%
              </td>
              <td className="py-4 px-2 text-slate-600 dark:text-slate-300">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner dark:shadow-black/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((vm.mem || 0) / (vm.maxmem || 1)) * 100)}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className={cn("h-full rounded-full", vm.status === 'running' ? "bg-blue-400 dark:bg-blue-500" : "bg-slate-300 dark:bg-slate-700")}
                      />
                    </div>
                  </div>
                  
                  <Tooltip.Root delayDuration={200}>
                    <Tooltip.Trigger asChild>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 cursor-help border-b border-dashed border-slate-400 dark:border-slate-600 w-max">
                        {formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl z-50" sideOffset={5}>
                        Memory Load: {vm.maxmem ? ((vm.mem / vm.maxmem) * 100).toFixed(1) : 0}%
                        <Tooltip.Arrow className="fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              </td>
              <td className="py-4 px-2 text-slate-600 dark:text-slate-300">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner dark:shadow-black/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((vm.disk || 0) / (vm.maxdisk || 1)) * 100)}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className={cn("h-full rounded-full", vm.status === 'running' ? "bg-amber-400 dark:bg-amber-500" : "bg-slate-300 dark:bg-slate-700")}
                      />
                    </div>
                  </div>
                  <Tooltip.Root delayDuration={200}>
                    <Tooltip.Trigger asChild>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 cursor-help border-b border-dashed border-slate-400 dark:border-slate-600 w-max">
                        {vm.disk ? `${formatBytes(vm.disk)} / ${formatBytes(vm.maxdisk || 0)}` : `Allocated: ${formatBytes(vm.maxdisk || 0)}`}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl z-50" sideOffset={5}>
                        Disk Usage: {vm.maxdisk ? (((vm.disk || 0) / vm.maxdisk) * 100).toFixed(1) : 0}%
                        <Tooltip.Arrow className="fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              </td>
              <td className="py-4 px-2 text-slate-600 dark:text-slate-300">
                <div className="flex flex-col gap-1.5 text-[10.5px] font-mono">
                  {rates[vm.vmid] ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 min-w-[70px]">
                          <span className={`font-bold ${rates[vm.vmid].netinRate > 0 ? 'text-emerald-500 animate-pulse' : 'text-emerald-500/50'}`}>▼</span> 
                          <span className="text-slate-600 dark:text-slate-400">{formatBytes(rates[vm.vmid].netinRate)}/s</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-[70px]">
                          <span className={`font-bold ${rates[vm.vmid].netoutRate > 0 ? 'text-sky-500 animate-pulse' : 'text-sky-500/50'}`}>▲</span> 
                          <span className="text-slate-600 dark:text-slate-400">{formatBytes(rates[vm.vmid].netoutRate)}/s</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="text-slate-400 dark:text-slate-500">Disk I/O:</span> 
                        <span className={`${rates[vm.vmid].diskIoRate > 0 ? 'text-indigo-500 dark:text-indigo-400 font-medium animate-pulse' : 'text-slate-500 dark:text-slate-400'}`}>
                          {formatBytes(rates[vm.vmid].diskIoRate)}/s
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 dark:text-slate-500 italic">Calculating...</div>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-right">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="min-w-[180px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 flex flex-col gap-1 z-50 origin-top-right"
                      sideOffset={5}
                      align="end"
                      asChild
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      >
                        {/* Start */}
                        <DropdownMenu.Item asChild>
                          <button
                            onClick={() => handlePowerAction(vm, 'start')}
                            disabled={vm.status === 'running' || isProcessing === vm.vmid}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed w-full"
                          >
                            <Power className="w-4 h-4" /> Start
                          </button>
                        </DropdownMenu.Item>
                        
                        {/* Shutdown */}
                        <DropdownMenu.Item asChild>
                          <button
                            onClick={() => handlePowerAction(vm, 'shutdown')}
                            disabled={vm.status !== 'running' || isProcessing === vm.vmid}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed w-full"
                          >
                            <PowerOff className="w-4 h-4" /> Shutdown
                          </button>
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator className="h-px bg-slate-200 dark:bg-slate-800 my-1 mx-2" />

                        {/* Console */}
                        <DropdownMenu.Item asChild>
                          <button
                            onClick={() => setActiveConsole(vm)}
                            disabled={vm.status !== 'running'}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed w-full"
                          >
                            <Terminal className="w-4 h-4 text-blue-500" /> Console
                          </button>
                        </DropdownMenu.Item>

                        {/* Metrics */}
                        <DropdownMenu.Item asChild>
                          <button
                            onClick={() => setActiveMetrics(vm)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors cursor-pointer outline-none w-full"
                          >
                            <Activity className="w-4 h-4 text-teal-600" /> Metrics
                          </button>
                        </DropdownMenu.Item>

                        {/* Config */}
                        <DropdownMenu.Item asChild>
                          <button
                            onClick={() => setActiveConfig(vm)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors cursor-pointer outline-none w-full"
                          >
                            <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Config
                          </button>
                        </DropdownMenu.Item>

                        {/* Manage */}
                        <DropdownMenu.Item asChild>
                          <button
                            onClick={() => setActiveManage(vm)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer outline-none w-full"
                          >
                            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Manage
                          </button>
                        </DropdownMenu.Item>
                      </motion.div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Console Modal — beautifully proportioned desktop window by default, native Fullscreen API on demand */}
      {activeConsole && (
        <div
          ref={consoleModalRef}
          className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-slate-900/100 sm:bg-slate-900/80 backdrop-blur-sm"
        >
          {/* Ergonomic framing matching premium cPanel Jupiter dimensions (calibrated to 1024x768 4:3 ratio) */}
          <div
            className="flex flex-col bg-slate-900 sm:border border-slate-700 shadow-2xl sm:rounded-2xl overflow-hidden w-full max-w-5xl h-full sm:h-[85vh] lg:h-[70vh] sm:max-h-[768px] sm:min-h-[550px]"
          >
            {/* Modal title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a2035] border-b border-slate-700 flex-shrink-0">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 font-medium">Console:</span>
                {activeConsole.name}
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded ml-1">
                  {activeConsole.type?.toUpperCase() || 'QEMU'} #{activeConsole.vmid}
                </span>
              </h2>
              <div className="flex items-center gap-1">
                {/* Native browser fullscreen */}
                <button
                  onClick={() => {
                    const el = consoleModalRef.current;
                    if (!el) return;
                    if (!document.fullscreenElement) {
                      el.requestFullscreen();
                    } else {
                      document.exitFullscreen();
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Toggle native browser fullscreen (F11 alternative)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveConsole(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Close console"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* ConsoleViewer fills the remaining space with NO padding */}
            <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              <ConsoleViewer
                node={nodeName}
                type={activeConsole.type || 'qemu'}
                vmid={activeConsole.vmid}
                vmName={activeConsole.name}
              />
            </div>
          </div>
        </div>
      )}
      {/* Manage Modal */}
      {activeManage && (
        <InstanceManageModal
          vm={activeManage}
          nodeName={nodeName}
          onClose={() => setActiveManage(null)}
          onDeleteSuccess={onDeleteSuccess}
        />
      )}
      {activeConfig && (
        <VMConfigModal
          node={nodeName}
          vmid={activeConfig.vmid}
          isOpen={true}
          onClose={() => setActiveConfig(null)}
        />
      )}
      {activeMetrics && (
        <MetricsModal
          isOpen={true}
          onClose={() => setActiveMetrics(null)}
          node={nodeName}
          vmid={activeMetrics.vmid}
          type={activeMetrics.type || 'qemu'}
          vmName={activeMetrics.name}
        />
      )}
    </div>
  );
}
