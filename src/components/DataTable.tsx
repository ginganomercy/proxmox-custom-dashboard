'use client';

import { useState, useRef } from 'react';
import { Play, Square, HardDrive, Terminal, X, Power, PowerOff, Settings, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConsoleViewer } from './ConsoleViewer';
import InstanceManageModal from './InstanceManageModal';
import { VMConfigModal } from './VMConfigModal';
import { MetricsModal } from './MetricsModal';

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
}

interface DataTableProps {
  data: VM[];
  isLoading?: boolean;
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
        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ip}</span>
      ) : (
        <button onClick={fetchIp} disabled={loading || vm.status !== 'running'} className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Fetching...' : 'Reveal IP'}
        </button>
      )}
    </div>
  );
}

export function DataTable({ data, isLoading, nodeName = 'Capybara' }: DataTableProps & { nodeName?: string }) {
  const [activeConsole, setActiveConsole] = useState<VM | null>(null);
  const [activeManage, setActiveManage] = useState<VM | null>(null);
  const [activeConfig, setActiveConfig] = useState<VM | null>(null);
  const [activeMetrics, setActiveMetrics] = useState<VM | null>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const consoleModalRef = useRef<HTMLDivElement>(null);

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
    return <div className="p-8 text-center text-slate-400 font-medium">Loading instances...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400 font-medium">No instances found.</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-200/50">
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">ID</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">Name</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">Status</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">CPU</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">Memory</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">Disk Usage</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((vm, index) => (
            <tr 
              key={vm.vmid} 
              className={cn(
                "transition-colors hover:bg-slate-50/50",
                index !== data.length - 1 ? "border-b border-slate-100" : ""
              )}
            >
              <td className="py-4 px-2 text-slate-600 font-medium">#{vm.vmid}</td>
              <td className="py-4 px-2 text-slate-800 font-medium">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      vm.type === 'lxc' ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-blue-100 text-blue-700 border border-blue-200"
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
                    "pill inline-flex items-center gap-1.5 shadow-sm",
                    vm.status === 'running' 
                      ? "bg-blue-50 text-blue-700 shadow-blue-200/50" 
                      : "bg-red-50 text-red-700 shadow-red-200/50"
                  )}>
                    {vm.status === 'running' ? <Play className="w-3 h-3 fill-current" /> : <Square className="w-3 h-3 fill-current" />}
                    {vm.status}
                  </span>
                  {vm.status === 'running' && vm.uptime && (
                    <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      Up: {formatUptime(vm.uptime)}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-slate-600 font-medium">
                {((vm.cpu || 0) * 100).toFixed(1)}%
              </td>
              <td className="py-4 px-2 text-slate-600">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={cn("h-full rounded-full transition-all", vm.status === 'running' ? "bg-blue-400" : "bg-slate-300")}
                        style={{ width: `${Math.min(100, ((vm.mem || 0) / (vm.maxmem || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    {formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}
                  </span>
                </div>
              </td>
              <td className="py-4 px-2 text-slate-600">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={cn("h-full rounded-full transition-all", vm.status === 'running' ? "bg-amber-400" : "bg-slate-300")}
                        style={{ width: `${Math.min(100, ((vm.disk || 0) / (vm.maxdisk || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    {formatBytes(vm.disk || 0)} / {formatBytes(vm.maxdisk || 0)}
                  </span>
                </div>
              </td>
              <td className="py-4 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handlePowerAction(vm, 'start')}
                    disabled={vm.status === 'running' || isProcessing === vm.vmid}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Start VM"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Start
                  </button>
                  <button
                    onClick={() => handlePowerAction(vm, 'shutdown')}
                    disabled={vm.status !== 'running' || isProcessing === vm.vmid}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Graceful Shutdown"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    Shutdown
                  </button>
                  <button
                    onClick={() => setActiveConsole(vm)}
                    disabled={vm.status !== 'running'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Open Web Console"
                  >
                    <Terminal className="w-3.5 h-3.5 text-blue-500" />
                    Console
                  </button>
                  <button
                    onClick={() => setActiveMetrics(vm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-all"
                    title="View Performance Metrics"
                  >
                    <svg className="w-3.5 h-3.5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    Metrics
                  </button>
                  <button
                    onClick={() => setActiveConfig(vm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all"
                    title="Hardware & Cloud-Init"
                  >
                    <Settings className="w-3.5 h-3.5 text-purple-600" />
                    Config
                  </button>
                  <button
                    onClick={() => setActiveManage(vm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                    title="Manage VPS Settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-blue-600" />
                    Manage
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Console Modal — near-fullscreen by default, native Fullscreen API on demand */}
      {activeConsole && (
        <div
          ref={consoleModalRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80 backdrop-blur-sm"
        >
          {/* 97vw × 97vh so the console uses almost the entire viewport */}
          <div
            className="flex flex-col bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden"
            style={{ width: '97vw', height: '97vh' }}
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
