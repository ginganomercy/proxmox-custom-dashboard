'use client';

import { useState, useRef } from 'react';
import { Play, Square, HardDrive, Terminal, X, Power, PowerOff, Settings, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConsoleViewer } from './ConsoleViewer';
import InstanceManageModal from './InstanceManageModal';
import { VMConfigModal } from './VMConfigModal';

interface VM {
  vmid: number;
  name: string;
  status: string; // 'running' | 'stopped'
  cpu: number;
  maxmem: number;
  mem: number;
  type?: string; // e.g. 'qemu' or 'lxc'
}

interface DataTableProps {
  data: VM[];
  isLoading?: boolean;
}

export function DataTable({ data, isLoading, nodeName = 'Capybara' }: DataTableProps & { nodeName?: string }) {
  const [activeConsole, setActiveConsole] = useState<VM | null>(null);
  const [activeManage, setActiveManage] = useState<VM | null>(null);
  const [activeConfig, setActiveConfig] = useState<VM | null>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const consoleModalRef = useRef<HTMLDivElement>(null);

  const handlePowerAction = async (vm: VM, action: 'start' | 'stop') => {
    setIsProcessing(vm.vmid);
    const type = vm.type || 'qemu';
    try {
      const { default: api } = await import('@/lib/api');
      await api.post(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/status/${action}`);
      alert(`${action.toUpperCase()} command sent to ${vm.name}. Click 'Refresh' to see status changes.`);
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} ${vm.name}`);
    } finally {
      setIsProcessing(null);
    }
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
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/50">
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">ID</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">Name</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">Status</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">CPU</th>
            <th className="py-4 px-2 font-semibold text-slate-500 text-sm">Memory Usage</th>
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
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  {vm.name}
                </div>
              </td>
              <td className="py-4 px-2">
                <span className={cn(
                  "pill inline-flex items-center gap-1.5 shadow-sm",
                  vm.status === 'running' 
                    ? "bg-blue-50 text-blue-700 shadow-blue-200/50" 
                    : "bg-red-50 text-red-700 shadow-red-200/50"
                )}>
                  {vm.status === 'running' ? <Play className="w-3 h-3 fill-current" /> : <Square className="w-3 h-3 fill-current" />}
                  {vm.status}
                </span>
              </td>
              <td className="py-4 px-2 text-slate-600 font-medium">
                {((vm.cpu || 0) * 100).toFixed(1)}%
              </td>
              <td className="py-4 px-2 text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        vm.status === 'running' ? "bg-blue-400" : "bg-slate-300"
                      )}
                      style={{ width: `${Math.min(100, ((vm.mem || 0) / (vm.maxmem || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}
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
                    onClick={() => handlePowerAction(vm, 'stop')}
                    disabled={vm.status !== 'running' || isProcessing === vm.vmid}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Stop VM"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    Stop
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
    </div>
  );
}
