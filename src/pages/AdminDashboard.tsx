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
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { NodeCapacityCard, StatBar, SectionCard } from '@/components/admin/NodeCapacityCard';
import { SwarmAllocationCard } from '@/components/admin/SwarmAllocationCard';
import { SectionHeader } from '@/components/admin/SectionHeader';
import { PersonalManagementTab } from '@/components/admin/tabs/PersonalManagementTab';
import { ClusterLogsTab } from '@/components/admin/tabs/ClusterLogsTab';

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

      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: Main Content Area
      ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative z-10 overflow-y-auto lg:ml-0">
        <AdminHeader
          setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab}
          targetNode={targetNode}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          fetchGlobalData={fetchGlobalData}
          isLoadingSummary={isLoadingSummary}
        />

        <div className="p-6 sm:p-8 space-y-6 w-full">

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: Quick Stats Row
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Unallocated VM Slots', value: estimatedMaxNewVms, sub: 'est. new VMs can fit', icon: <TrendingUp className="w-5 h-5" />, color: 'from-cyan-500 to-blue-600' },
            { label: 'Master Node CPU', value: `${cpuUsagePct.toFixed(1)}%`, sub: `of ${totalCores} vCores`, icon: <Cpu className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-colors">
              <div className={`p-2.5 bg-gradient-to-br ${stat.color} text-white rounded-xl shadow-lg flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{isLoadingSummary ? '—' : stat.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stat.label}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3: Proxmox Node Capacity (Real Data)
        ════════════════════════════════════════════════════════════════ */}
        <NodeCapacityCard
          targetNode={targetNode}
          nodeStatus={nodeStatus}
          cpuModel={cpuModel}
          totalAllocatedCores={totalAllocatedCores}
          cpuUsagePct={cpuUsagePct}
          totalCores={totalCores}
          unallocatedCores={unallocatedCores}
          totalAllocatedRam={totalAllocatedRam}
          usedRamBytes={usedRamBytes}
          totalRamBytes={totalRamBytes}
          unallocatedRam={unallocatedRam}
          estimatedMaxNewVms={estimatedMaxNewVms}
          totalAllocatedDisk={totalAllocatedDisk}
          usedDiskBytes={usedDiskBytes}
          totalDiskBytes={totalDiskBytes}
          unallocatedDisk={unallocatedDisk}
          fmtUptime={fmtUptime}
          fmtBytes={fmtBytes}
        />

        {/* SECTION 3.5: Swarm Partitioning */}
        <SwarmAllocationCard
          mgrMetrics={mgrMetrics}
          wkrMetrics={wkrMetrics}
          genMetrics={genMetrics}
          fmtBytes={fmtBytes}
        />

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: Active View Area
        ════════════════════════════════════════════════════════════════ */}
        <SectionCard>
          {/* ── Tab: Personal Management ────────────────────────────────── */}
          {activeTab === 'orders' && (
            <PersonalManagementTab targetNode={targetNode} />
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
            <ClusterLogsTab
              logTab={logTab}
              setLogTab={setLogTab}
              isLoadingTasks={isLoadingTasks}
              clusterTasks={clusterTasks}
              targetNode={targetNode}
              isLoadingLogs={isLoadingLogs}
              clusterLogs={clusterLogs}
            />
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
