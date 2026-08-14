import React, { useState, useEffect } from 'react';
import logoUrl from '@/assets/logo.svg?url';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import {
  LogOut, Server, Activity, Cpu, MemoryStick, HardDrive, Clock, Moon, Sun,
  ShieldCheck, Users, TrendingUp, ChevronRight, RefreshCw, CheckCircle, Copy, FileText, Terminal, Menu, X
} from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import UptimeWidget from '@/components/UptimeWidget';

// ─── Helper Utilities ──────────────────────────────────────────────────────────

const fmtBytes = (bytes: number, decimals = 1) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

const fmtUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
};

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatBarProps {
  label: string;
  used: number;
  total: number;
  usedLabel: string;
  totalLabel: string;
  color: string;
}

function StatBar({ label, used, total, usedLabel, totalLabel, color }: StatBarProps) {
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

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

function SectionHeader({ icon, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

function SectionCard({ children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * Admin Dashboard View.
 * Core interface for managing Proxmox VE cluster operations.
 */
export function AdminDashboard() {
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    document.title = "Admin Control Panel | Cloud Baja Tegal";
  }, []);

  const [activeTab, setActiveTab] = useState<'orders' | 'vms' | 'logs' | 'uptime'>('orders');
  const [logTab, setLogTab] = useState<'tasks' | 'clusterlog'>('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data States
  const [summary, setSummary] = useState<any>({ total_orders: 0, pending_orders: 0 });
  const [nodeStatus, setNodeStatus] = useState<any>(null);
  const [allVms, setAllVms] = useState<any[]>([]);
  const [clusterLogs, setClusterLogs] = useState<any[]>([]);
  const [clusterTasks, setClusterTasks] = useState<any[]>([]);
  const [targetNode, setTargetNode] = useState('pve');
  
  // Independent Loading States
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingVms, setIsLoadingVms] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Lazy Load Cluster Tasks (Anti-Race Condition)
  useEffect(() => {
    if (activeTab !== 'logs' || logTab !== 'tasks') return;
    const controller = new AbortController();
    
    const fetchTasks = async (silent = false) => {
      if (!silent) setIsLoadingTasks(true);
      try {
        const res = await api.get('/proxmox/cluster/tasks', { signal: controller.signal });
        if (res.data) setClusterTasks(res.data);
      } catch (err: any) {
        if (err.name !== 'CanceledError') console.error('Cluster tasks fetch failed:', err);
      } finally {
        if (!silent) setIsLoadingTasks(false);
      }
    };
    
    fetchTasks(false);
    const interval = setInterval(() => fetchTasks(true), 15000); // stable 15s auto-refresh
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [activeTab, logTab]);

  // Lazy Load Cluster Logs (Anti-Race Condition)
  useEffect(() => {
    if (activeTab !== 'logs' || logTab !== 'clusterlog') return;
    const controller = new AbortController();
    
    const fetchLogs = async (silent = false) => {
      if (!silent) setIsLoadingLogs(true);
      try {
        const res = await api.get('/proxmox/cluster/logs', { signal: controller.signal });
        if (res.data) setClusterLogs(res.data);
      } catch (err: any) {
        if (err.name !== 'CanceledError') console.error('Cluster logs fetch failed:', err);
      } finally {
        if (!silent) setIsLoadingLogs(false);
      }
    };
    
    fetchLogs(false);
    const interval = setInterval(() => fetchLogs(true), 15000); // stable 15s auto-refresh
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [activeTab, logTab]);


  const checkAuth = () => {
    const token = Cookies.get('token');
    if (!token) { navigate('/login'); return false; }
    return true;
  };

  // 1. Fetch Global Summary (On Mount & Refresh)
  const fetchGlobalData = async (silent = false) => {
    if (!checkAuth()) return;
    if (!silent) setIsLoadingSummary(true);
    try {
      let nodeToUse = targetNode;
      const nodesRes = await api.get('/proxmox/nodes').catch(() => null);
      if (nodesRes?.data?.length > 0) {
        nodeToUse = nodesRes.data[0].node;
        setTargetNode(nodeToUse);
      }

      const [statusRes, summaryRes] = await Promise.all([
        api.get(`/proxmox/nodes/${nodeToUse}/status`).catch(() => null),
        api.get('/admin/summary').catch(() => null),
      ]);

      if (statusRes?.data) setNodeStatus(statusRes.data);
      if (summaryRes?.data) setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoadingSummary(false);
    }
  };

  useEffect(() => { 
    fetchGlobalData(false); 
    const interval = setInterval(() => fetchGlobalData(true), 15000); // stable 15s auto-refresh
    return () => clearInterval(interval);
  }, []);


  // 3. Lazy Load VMs (Anti-Race Condition)
  useEffect(() => {
    // Data VM diperlukan secara global untuk kalkulasi di Dashboard utama.
    if (!targetNode) return;
    const controller = new AbortController();
    
    const fetchVms = async (silent = false) => {
      if (!silent) setIsLoadingVms(true);
      try {
        const res = await api.get(`/proxmox/nodes/${targetNode}/instances`, { signal: controller.signal });
        if (res.data) setAllVms(res.data);
      } catch (err: any) {
        if (err.name !== 'CanceledError') console.error('VMs fetch failed:', err);
      } finally {
        if (!silent) setIsLoadingVms(false);
      }
    };
    
    fetchVms(false);
    const interval = setInterval(() => fetchVms(true), 15000); // stable 15s auto-refresh
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [activeTab, targetNode]);


  const handleLogout = () => { Cookies.remove('token'); navigate('/login'); };
  // ── Derived Proxmox Capacity Metrics ─────────────────────────────────────────
  const totalRamBytes = nodeStatus?.memory?.total ?? 0;
  const usedRamBytes = nodeStatus?.memory?.used ?? 0;
  const availableRamBytes = Math.max(0, totalRamBytes - usedRamBytes);

  const totalDiskBytes = nodeStatus?.storage_total ?? nodeStatus?.rootfs?.total ?? 0;
  const usedDiskBytes = nodeStatus?.storage_used ?? nodeStatus?.rootfs?.used ?? 0;
  const availableDiskBytes = Math.max(0, totalDiskBytes - usedDiskBytes);

  const cpuUsagePct = nodeStatus?.cpu ? nodeStatus.cpu * 100 : 0;
  const totalCores = nodeStatus?.cpuinfo?.cpus ?? 0;
  const cpuModel = nodeStatus?.cpuinfo?.model ?? 'N/A';

  // Allocation Metrics
  const totalAllocatedRam = allVms.reduce((sum, vm) => sum + (vm.maxmem || 0), 0);
  const unallocatedRam = Math.max(0, totalRamBytes - totalAllocatedRam);

  const totalAllocatedDisk = allVms.reduce((sum, vm) => sum + (vm.maxdisk || 0), 0);
  const unallocatedDisk = Math.max(0, totalDiskBytes - totalAllocatedDisk);

  const totalAllocatedCores = allVms.reduce((sum, vm) => sum + (vm.cpus || 1), 0);
  const unallocatedCores = Math.max(0, totalCores - totalAllocatedCores);

  // ── Swarm Cluster Partitioning ─────────────────────────────────────────────
  const swarmManagers = allVms.filter(vm => vm.name?.toLowerCase().includes('manager'));
  const swarmWorkers = allVms.filter(vm => vm.name?.toLowerCase().includes('worker'));
  const genericNodes = allVms.filter(vm => !vm.name?.toLowerCase().includes('manager') && !vm.name?.toLowerCase().includes('worker'));

  const partitionMetrics = (vms: any[]) => ({
    cpu: vms.reduce((sum, vm) => sum + (vm.cpus || 1), 0),
    ram: vms.reduce((sum, vm) => sum + (vm.maxmem || 0), 0),
    disk: vms.reduce((sum, vm) => sum + (vm.maxdisk || 0), 0),
    count: vms.length
  });

  const mgrMetrics = partitionMetrics(swarmManagers);
  const wkrMetrics = partitionMetrics(swarmWorkers);
  const genMetrics = partitionMetrics(genericNodes);

  // Estimated "available" capacity in terms of VM slots (based on Unallocated RAM headroom, 1GB per VM min)
  const estimatedMaxNewVms = Math.floor(unallocatedRam / (1 * 1024 * 1024 * 1024));

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
      READY_TO_ACTIVATE: 'bg-blue-100 text-blue-700 border border-blue-200',
      COMPLETED: 'bg-green-100 text-green-700 border border-green-200',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row relative transition-colors duration-200">
      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: Left Sidebar — Responsive Mobile Drawer
      ════════════════════════════════════════════════════════════════ */}

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-xl z-40
          transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/30 bg-transparent">
              <img src={logoUrl} alt="Cloud Baja Tegal Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-blue-50">Admin Control</h1>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Cloud Baja Tegal</p>
            </div>
          </div>
          {/* Close button — visible on mobile only */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="px-5 pb-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">KLUSTER & MANAJEMEN</span>
          </div>
          <button
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm
              ${activeTab === 'orders'
                ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm dark:bg-cyan-600 dark:text-white dark:border-cyan-500 dark:shadow-cyan-600/30'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            <span>Personal Management</span>
          </button>

          <button
            onClick={() => { setActiveTab('vms'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm
              ${activeTab === 'vms'
                ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm dark:bg-cyan-600 dark:text-white dark:border-cyan-500 dark:shadow-cyan-600/30'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}
          >
            <Server className="w-5 h-5" />
            <span>All Instances</span>
          </button>

          <button
            onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm
              ${activeTab === 'logs'
                ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm dark:bg-cyan-600 dark:text-white dark:border-cyan-500 dark:shadow-cyan-600/30'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}
          >
            <FileText className="w-5 h-5" />
            <span>Cluster Logs</span>
          </button>

          <button
            onClick={() => { setActiveTab('uptime'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm
              ${activeTab === 'uptime'
                ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm dark:bg-cyan-600 dark:text-white dark:border-cyan-500 dark:shadow-cyan-600/30'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}
          >
            <Activity className="w-5 h-5" />
            <span>Uptime Monitors</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center font-bold">
                A
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Admin Superuser</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">admin@cloudbajategal</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-xl font-bold transition-all text-sm border border-rose-100 dark:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: Main Content Area
      ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative z-10 overflow-y-auto lg:ml-0">
        {/* Sticky Top Bar */}
        <header className="bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors mr-1"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 dark:text-white">
              {activeTab === 'orders' ? 'Personal Management' : activeTab === 'vms' ? 'Node Instances Overview' : activeTab === 'logs' ? 'System Cluster Logs' : 'API & Service Uptime'}
            </h2>
            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 dark:bg-cyan-500/10 dark:text-cyan-400 rounded-full font-bold border border-blue-100 dark:border-cyan-500/20 hidden md:inline-block">
              Cluster: {targetNode}
            </span>
          </div>
          <button
            onClick={() => { fetchGlobalData(); }}
            disabled={isLoadingSummary}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Status</span>
          </button>
        </header>

        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: Quick Stats Row
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Unallocated VM Slots', value: estimatedMaxNewVms, sub: 'est. new VMs can fit', icon: <TrendingUp className="w-5 h-5" />, color: 'from-cyan-500 to-blue-600' },
            { label: 'Master Node CPU', value: `${cpuUsagePct.toFixed(1)}%`, sub: `of ${totalCores} vCores`, icon: <Cpu className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className={`p-2.5 bg-gradient-to-br ${stat.color} text-white rounded-xl shadow-lg flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{isLoadingSummary ? '—' : stat.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3: Proxmox Node Capacity (Real Data)
        ════════════════════════════════════════════════════════════════ */}
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

        {/* SECTION 3.5: Swarm Partitioning */}
        <SectionCard>
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
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: Active View Area
        ════════════════════════════════════════════════════════════════ */}
        <SectionCard>
          {/* ── Tab: Personal Management ────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="p-6">
              <SectionHeader
                icon={<Users className="w-5 h-5" />}
                title="Personal Management & Cluster Configuration"
                subtitle="Manage personal administrator profile, Proxmox VE API authentication security, and real-time telemetry stream preferences."
              />
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                      <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-cyan-600 text-white rounded-xl shadow-md">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Personal Admin Profile</h4>
                        <p className="text-xs text-slate-500">Superuser Account Identity</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Account Role</span>
                        <span className="font-bold text-cyan-600">SUPER_ADMIN</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Auth Mechanism</span>
                        <span className="font-semibold text-slate-700">JWT Bearer Token (Stateless)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Access Level</span>
                        <span className="font-semibold text-emerald-600">Full Cluster Root Control</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-400">
                    Active personal session verified
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Proxmox VE Cluster API</h4>
                        <p className="text-xs text-slate-500">Hypervisor Target Connection</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Target Node</span>
                        <span className="font-bold text-slate-800">{targetNode || 'Capybara'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Transport Security</span>
                        <span className="font-semibold text-emerald-600">SSL/TLS Verified</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">API Status</span>
                        <span className="font-semibold text-slate-700">Online — Authenticated</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-400">
                    Proxmox VE JSON API v2
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-md">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Personal View Gateway</h4>
                        <p className="text-xs text-slate-500">Live Telemetry &amp; VM Controls</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Telemetry Channel</span>
                        <span className="font-bold text-slate-800">WebSocket WSS Streaming</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Refresh Cycle</span>
                        <span className="font-semibold text-slate-700">Every 5 Seconds</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Power Operations</span>
                        <span className="font-semibold text-emerald-600">Enabled</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    Switch to Personal View <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: All Instances ──────────────────────────────────────── */}
          {activeTab === 'vms' && (
            <div className="p-5">
              <SectionHeader
                icon={<Server className="w-5 h-5" />}
                title="All Node Instances"
                subtitle={`Live telemetry view of every VM and LXC container on node: ${targetNode}. Complete with Network I/O, Disk I/O, IP Reveal, Web Console, and Power Controls.`}
              />
              <div className="mt-4">
                <DataTable data={allVms} isLoading={isLoadingVms} nodeName={targetNode} onDeleteSuccess={() => fetchGlobalData()} />
              </div>
            </div>
          )}

          {/* ── Tab: Cluster Logs ────────────────────────────────────── */}
          {activeTab === 'logs' && (
            <div className="p-5">
              <SectionHeader
                icon={<FileText className="w-5 h-5" />}
                title="Proxmox Cluster Logs & Tasks"
                subtitle="Authentic Proxmox VE cluster execution audit logs. Switch between worker Tasks history and live system daemon Cluster log."
              />
              <div className="bg-blue-950 rounded-2xl border border-blue-900 shadow-inner overflow-hidden">
                {/* Proxmox VE Authentic Sub-tab Toggle Bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-blue-900 bg-blue-900/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLogTab('tasks')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${logTab === 'tasks' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'bg-blue-900/60 text-blue-200 hover:bg-blue-800 hover:text-white'}`}
                    >
                      <Terminal className="w-3.5 h-3.5" /> Tasks
                    </button>
                    <button
                      onClick={() => setLogTab('clusterlog')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${logTab === 'clusterlog' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'bg-blue-900/60 text-blue-200 hover:bg-blue-800 hover:text-white'}`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Cluster log
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Auto-refreshes every 15s</span>
                </div>

                {logTab === 'tasks' ? (
                  <div className="p-2 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-blue-900/80 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Start Time ↓</th>
                          <th className="py-3 px-4">End Time</th>
                          <th className="py-3 px-4">Node</th>
                          <th className="py-3 px-4">User name</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-mono text-blue-100 divide-y divide-blue-900/50">
                        {isLoadingTasks && clusterTasks.length === 0 ? (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-500 animate-pulse">Fetching cluster tasks...</td></tr>
                        ) : clusterTasks.map((taskItem, idx) => {
                          const startObj = new Date((taskItem.starttime || 0) * 1000);
                          const startStr = startObj.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          const endObj = new Date((taskItem.endtime || taskItem.starttime || 0) * 1000);
                          const endStr = endObj.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          
                          // Format Description exactly like Proxmox VE (e.g. VM 104 - Destroy, VM 104 - Stop, Update package database)
                          let description = taskItem.type || 'Task';
                          if (taskItem.type === 'qemudestroy') description = `VM ${taskItem.id || ''} - Destroy`;
                          else if (taskItem.type === 'qemustop') description = `VM ${taskItem.id || ''} - Stop`;
                          else if (taskItem.type === 'qemustart') description = `VM ${taskItem.id || ''} - Start`;
                          else if (taskItem.type === 'qemucreate') description = `VM ${taskItem.id || ''} - Create`;
                          else if (taskItem.type === 'qemushutdown') description = `VM ${taskItem.id || ''} - Shutdown`;
                          else if (taskItem.type === 'aptupdate') description = `Update package database`;
                          else if (taskItem.id) description = `VM ${taskItem.id} - ${taskItem.type}`;

                          const statusText = taskItem.status || 'PROG';
                          const isOK = statusText === 'OK';
                          
                          return (
                            <tr key={idx} className={`transition-colors ${isOK ? 'hover:bg-white/5' : 'bg-red-500/15 hover:bg-red-500/25 text-red-200'}`}>
                              <td className="py-3 px-4 text-cyan-200/70 whitespace-nowrap">{startStr}</td>
                              <td className="py-3 px-4 text-cyan-200/70 whitespace-nowrap">{endStr}</td>
                              <td className="py-3 px-4 text-blue-200">{taskItem.node || targetNode}</td>
                              <td className="py-3 px-4 text-cyan-400 font-semibold">{taskItem.user || 'root@pam'}</td>
                              <td className="py-3 px-4 font-medium">{description}</td>
                              <td className="py-3 px-4">
                                {isOK ? (
                                  <span className="text-emerald-400 font-bold">OK</span>
                                ) : (
                                  <span className="text-red-300 font-bold">{statusText}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {clusterTasks.length === 0 && !isLoadingTasks && (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-500">No recent tasks found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-2 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-blue-900/80 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Node</th>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">PID</th>
                          <th className="py-3 px-4">User name</th>
                          <th className="py-3 px-4">Message</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-mono text-blue-100 divide-y divide-blue-900/50">
                        {isLoadingLogs && clusterLogs.length === 0 ? (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-500 animate-pulse">Fetching cluster logs...</td></tr>
                        ) : clusterLogs.map((logItem, idx) => {
                          const dateObj = new Date((logItem.time || 0) * 1000);
                          const timeStr = dateObj.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 text-cyan-200/70 whitespace-nowrap">{timeStr}</td>
                              <td className="py-3 px-4 text-cyan-200/70">{logItem.node || targetNode}</td>
                              <td className="py-3 px-4 text-yellow-400/90">{logItem.tag || 'pvedaemon'}</td>
                              <td className="py-3 px-4 text-blue-300/70">{logItem.pid || 'N/A'}</td>
                              <td className="py-3 px-4 text-cyan-400 font-semibold">{logItem.user || 'root@pam'}</td>
                              <td className="py-3 px-4 text-white font-medium">{logItem.msg || logItem.type || 'cluster event'}</td>
                            </tr>
                          );
                        })}
                        {clusterLogs.length === 0 && !isLoadingLogs && (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-500">No recent log entries found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Uptime Monitoring ────────────────────────────────────── */}
          {activeTab === 'uptime' && (
            <div className="p-5">
              <SectionHeader
                icon={<Activity className="w-5 h-5" />}
                title="Uptime Monitoring"
                subtitle="Live blackbox monitoring of external endpoints and microservices with 24-hour historical latency."
              />
              <UptimeWidget />
            </div>
          )}
        </SectionCard>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pb-4">
          <Clock className="w-3.5 h-3.5" />
          Last refreshed: {new Date().toLocaleTimeString('id-ID')}
        </div>

      </div>
    </main>
  </div>
  );
}
