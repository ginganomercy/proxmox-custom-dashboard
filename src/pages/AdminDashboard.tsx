import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import {
  LogOut, Ticket, Plus, RefreshCw, Copy, CheckCircle,
  Server, Activity, Cpu, MemoryStick, HardDrive, Clock,
  ShieldCheck, Users, TrendingUp, CircleDot, ChevronRight
} from 'lucide-react';

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

export function AdminDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [nodeStatus, setNodeStatus] = useState<any>(null);
  const [allVms, setAllVms] = useState<any[]>([]);
  const [targetNode, setTargetNode] = useState('pve');
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<number>(50000);
  const [copiedCode, setCopiedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'vouchers' | 'vms'>('orders');

  const checkAuth = () => {
    const token = Cookies.get('token');
    if (!token) { navigate('/login'); return false; }
    return true;
  };

  const fetchData = async () => {
    if (!checkAuth()) return;
    setIsLoading(true);
    try {
      let nodeToUse = targetNode;
      const nodesRes = await api.get('/proxmox/nodes').catch(() => null);
      if (nodesRes?.data?.length > 0) {
        nodeToUse = nodesRes.data[0].node;
        setTargetNode(nodeToUse);
      }

      const [vouchersRes, ordersRes, statusRes, vmsRes] = await Promise.all([
        api.get('/vouchers').catch(() => null),
        api.get('/admin/orders').catch(() => null),
        api.get(`/proxmox/nodes/${nodeToUse}/status`).catch(() => null),
        api.get(`/proxmox/nodes/${nodeToUse}/instances`).catch(() => null),
      ]);

      if (vouchersRes?.data?.data) setVouchers(vouchersRes.data.data);
      if (ordersRes?.data) setOrders(ordersRes.data);
      if (statusRes?.data) setNodeStatus(statusRes.data);
      if (vmsRes?.data) setAllVms(vmsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => { Cookies.remove('token'); navigate('/login'); };

  const generateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vouchers', { amount });
      fetchData();
    } catch {
      alert('Failed to generate voucher');
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setIsGenerating(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/generate`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate code');
    } finally {
      setIsGenerating(null);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // ── Derived Proxmox Capacity Metrics ─────────────────────────────────────────
  const totalRamBytes = nodeStatus?.memory?.total ?? 0;
  const usedRamBytes = nodeStatus?.memory?.used ?? 0;
  const availableRamBytes = totalRamBytes - usedRamBytes;

  const totalDiskBytes = nodeStatus?.rootfs?.total ?? 0;
  const usedDiskBytes = nodeStatus?.rootfs?.used ?? 0;
  const availableDiskBytes = totalDiskBytes - usedDiskBytes;

  const cpuUsagePct = nodeStatus?.cpu ? nodeStatus.cpu * 100 : 0;
  const totalCores = nodeStatus?.cpuinfo?.cpus ?? 0;
  const cpuModel = nodeStatus?.cpuinfo?.model ?? 'N/A';

  const runningVms = allVms.filter(v => v.status === 'running').length;
  const stoppedVms = allVms.length - runningVms;

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const activeVouchers = vouchers.filter(v => !v.isUsed).length;

  // Estimated "available" capacity in terms of VM slots (based on RAM headroom, 1GB per VM min)
  const estimatedMaxNewVms = Math.floor(availableRamBytes / (1 * 1024 * 1024 * 1024));

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
      READY_TO_ACTIVATE: 'bg-blue-100 text-blue-700 border border-blue-200',
      COMPLETED: 'bg-green-100 text-green-700 border border-green-200',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full filter blur-[120px] opacity-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-purple-100 rounded-full filter blur-[100px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 relative z-10">

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1: Header
        ════════════════════════════════════════════════════════════════ */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 px-5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Admin Control Center</h1>
              <p className="text-xs text-slate-500 font-medium">Cloud Baja Tegal — Cluster: <span className="font-semibold text-indigo-600">{targetNode}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all border border-red-100"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: Quick Stats Row
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Instances', value: allVms.length, sub: `${runningVms} running`, icon: <Server className="w-5 h-5" />, color: 'from-indigo-500 to-indigo-600' },
            { label: 'Pending Orders', value: pendingOrders, sub: `${orders.length} total orders`, icon: <Users className="w-5 h-5" />, color: 'from-amber-500 to-orange-500' },
            { label: 'Active Vouchers', value: activeVouchers, sub: `${vouchers.length} total issued`, icon: <Ticket className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600' },
            { label: 'VM Headroom', value: estimatedMaxNewVms, sub: 'estimated new VMs', icon: <TrendingUp className="w-5 h-5" />, color: 'from-violet-500 to-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className={`p-2.5 bg-gradient-to-br ${stat.color} text-white rounded-xl shadow-lg flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stat.value}</div>
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
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Activity className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Live Node Capacity — <span className="text-indigo-300">{targetNode}</span></h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uptime: <span className="text-slate-300 font-medium">{nodeStatus?.uptime ? fmtUptime(nodeStatus.uptime) : '—'}</span>
                    &nbsp;·&nbsp; CPU Model: <span className="text-slate-300 font-medium">{cpuModel}</span>
                  </p>
                </div>
              </div>
              <div className="hidden md:flex gap-2 text-xs text-slate-400">
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-lg font-medium">
                  ● {runningVms} Running
                </span>
                <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg font-medium">
                  ● {stoppedVms} Stopped
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CPU Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-semibold text-white">CPU</span>
                </div>
                <StatBar
                  label="Core Utilization"
                  used={cpuUsagePct}
                  total={100}
                  usedLabel={`${cpuUsagePct.toFixed(1)}%`}
                  totalLabel={`${totalCores} vCores`}
                  color="bg-sky-500"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-sky-300">{totalCores}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Total Cores</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-sky-300">{(totalCores * (1 - cpuUsagePct / 100)).toFixed(0)}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Avail. Cores</div>
                  </div>
                </div>
              </div>

              {/* RAM Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-white">Memory (RAM)</span>
                </div>
                <StatBar
                  label="RAM Utilization"
                  used={usedRamBytes}
                  total={totalRamBytes}
                  usedLabel={fmtBytes(usedRamBytes)}
                  totalLabel={fmtBytes(totalRamBytes)}
                  color="bg-violet-500"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-violet-300">{fmtBytes(availableRamBytes)}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Available</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-violet-300">{estimatedMaxNewVms}</div>
                    <div className="text-[10px] text-slate-500 uppercase">VM Slots</div>
                  </div>
                </div>
              </div>

              {/* Storage Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-semibold text-white">Storage (Root FS)</span>
                </div>
                <StatBar
                  label="Disk Utilization"
                  used={usedDiskBytes}
                  total={totalDiskBytes}
                  usedLabel={fmtBytes(usedDiskBytes)}
                  totalLabel={fmtBytes(totalDiskBytes)}
                  color="bg-teal-500"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-teal-300">{fmtBytes(availableDiskBytes)}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Free Space</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-teal-300">{totalDiskBytes > 0 ? ((usedDiskBytes / totalDiskBytes) * 100).toFixed(0) : 0}%</div>
                    <div className="text-[10px] text-slate-500 uppercase">Used</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: Tabbed Management Area
        ════════════════════════════════════════════════════════════════ */}
        <SectionCard>
          {/* Tab Navigation */}
          <div className="flex gap-1 p-4 border-b border-slate-100 bg-slate-50/50">
            {([
              { key: 'orders', label: 'Customer Orders', icon: <Users className="w-4 h-4" />, badge: pendingOrders > 0 ? pendingOrders : null },
              { key: 'vouchers', label: 'Voucher Management', icon: <Ticket className="w-4 h-4" />, badge: null },
              { key: 'vms', label: 'All Instances', icon: <Server className="w-4 h-4" />, badge: null },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== null && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Customer Orders ────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="p-5">
              <SectionHeader
                icon={<Users className="w-5 h-5" />}
                title="Customer VM Orders"
                subtitle="Manage incoming provisioning requests. Click 'Confirm' to send the activation code via email."
                action={
                  <div className="flex gap-3 text-xs">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-semibold">
                      {pendingOrders} Pending
                    </span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg font-semibold">
                      {orders.filter(o => o.status === 'COMPLETED').length} Completed
                    </span>
                  </div>
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wide bg-slate-50">
                      <th className="py-3 px-4 rounded-l-lg">VM Name & ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Specifications</th>
                      <th className="py-3 px-4">Total Cost</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{o.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{o.id?.slice(0, 8)}...</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-sm">{o.userEmail}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-xs font-medium border border-sky-100">{o.cores}C</span>
                            <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md text-xs font-medium border border-violet-100">{(o.memory / 1024).toFixed(0)}GB RAM</span>
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs font-medium border border-teal-100">{o.storage}GB SSD</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-600">
                          Rp {o.totalCost?.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {o.status === 'PENDING' ? (
                            <button
                              onClick={() => handleConfirmOrder(o.id)}
                              disabled={isGenerating === o.id}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 ml-auto"
                            >
                              {isGenerating === o.id ? (
                                <><RefreshCw className="w-3 h-3 animate-spin" /> Processing...</>
                              ) : (
                                <><ChevronRight className="w-3 h-3" /> Confirm &amp; Email</>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              {o.activationCode && (
                                <>
                                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">{o.activationCode}</span>
                                  <button onClick={() => copyToClipboard(o.activationCode)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                    {copiedCode === o.activationCode ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && !isLoading && (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No orders found yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: Voucher Management ─────────────────────────────────── */}
          {activeTab === 'vouchers' && (
            <div className="p-5">
              <SectionHeader
                icon={<Ticket className="w-5 h-5" />}
                title="Voucher Management"
                subtitle="Generate and distribute top-up vouchers to customers."
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Generator */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4 text-sm">
                    <Plus className="w-4 h-4 text-indigo-500" /> Generate New Voucher
                  </h3>
                  <form onSubmit={generateVoucher} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nominal (Rp)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[25000, 50000, 100000].map(v => (
                        <button key={v} type="button" onClick={() => setAmount(v)} className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${amount === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                          {(v / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-indigo-200">
                      Generate Code
                    </button>
                  </form>
                </div>

                {/* Voucher List */}
                <div className="md:col-span-2 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wide bg-slate-50 rounded-lg">
                        <th className="py-3 px-3 rounded-l-lg">Code</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Used By</th>
                        <th className="py-3 px-3 rounded-r-lg text-right">Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map((v) => (
                        <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono font-semibold text-slate-700 text-xs">{v.code}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium">Rp {v.amount?.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${v.isUsed ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                              {v.isUsed ? 'Used' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{v.usedBy || '—'}</td>
                          <td className="py-3 px-3 text-right">
                            <button onClick={() => copyToClipboard(v.code)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                              {copiedCode === v.code ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {vouchers.length === 0 && !isLoading && (
                        <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No vouchers generated yet.</td></tr>
                      )}
                    </tbody>
                  </table>
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
                subtitle={`Live view of every VM and LXC container on node: ${targetNode}`}
                action={
                  <div className="flex gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg font-semibold flex items-center gap-1">
                      <CircleDot className="w-3 h-3" /> {runningVms} Running
                    </span>
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg font-semibold flex items-center gap-1">
                      <CircleDot className="w-3 h-3" /> {stoppedVms} Stopped
                    </span>
                  </div>
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wide bg-slate-50">
                      <th className="py-3 px-4 rounded-l-lg">VMID</th>
                      <th className="py-3 px-4">Name & Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">CPU Usage</th>
                      <th className="py-3 px-4">RAM Usage</th>
                      <th className="py-3 px-4 rounded-r-lg">Disk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVms.map((vm) => {
                      const ramPct = vm.maxmem > 0 ? ((vm.mem / vm.maxmem) * 100) : 0;
                      return (
                        <tr key={vm.vmid} className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{vm.vmid}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{vm.name}</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vm.type || 'qemu'}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${vm.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${vm.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`} />
                              {vm.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min((vm.cpu ?? 0) * 100, 100)}%` }} />
                              </div>
                              <span className="text-slate-600 font-medium text-xs">{((vm.cpu ?? 0) * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${ramPct > 80 ? 'bg-red-500' : ramPct > 60 ? 'bg-amber-500' : 'bg-violet-500'}`} style={{ width: `${Math.min(ramPct, 100)}%` }} />
                              </div>
                              <span className="text-slate-600 font-medium text-xs">{fmtBytes(vm.mem ?? 0)} / {fmtBytes(vm.maxmem ?? 0)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">{fmtBytes(vm.disk ?? 0)}</td>
                        </tr>
                      );
                    })}
                    {allVms.length === 0 && !isLoading && (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No instances found on {targetNode}.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pb-4">
          <Clock className="w-3.5 h-3.5" />
          Last refreshed: {new Date().toLocaleTimeString('id-ID')}
        </div>

      </div>
    </div>
  );
}
