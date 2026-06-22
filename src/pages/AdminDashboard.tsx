import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { LogOut, Ticket, Plus, RefreshCw, Copy, CheckCircle, Server, Activity } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [nodeStatus, setNodeStatus] = useState<any>(null);
  const [allVms, setAllVms] = useState<any[]>([]);
  const [targetNode, setTargetNode] = useState('pve');
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<number>(50000);
  const [copiedCode, setCopiedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const checkAuth = () => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const fetchData = async () => {
    if (!checkAuth()) return;
    setIsLoading(true);
    try {
      // 1. Fetch available nodes
      let nodeToUse = targetNode;
      const nodesRes = await api.get('/proxmox/nodes').catch(() => null);
      if (nodesRes?.data && nodesRes.data.length > 0) {
        nodeToUse = nodesRes.data[0].node;
        setTargetNode(nodeToUse);
      }

      // 2. Fetch everything
      const [vouchersRes, ordersRes, statusRes, vmsRes] = await Promise.all([
        api.get('/vouchers').catch(() => null),
        api.get('/admin/orders').catch(() => null),
        api.get(`/proxmox/nodes/${nodeToUse}/status`).catch(() => null),
        api.get(`/proxmox/nodes/${nodeToUse}/instances`).catch(() => null)
      ]);
      
      if (vouchersRes?.data?.data) {
        setVouchers(vouchersRes.data.data);
      }
      if (ordersRes?.data) {
        setOrders(ordersRes.data);
      }
      if (statusRes?.data) {
        setNodeStatus(statusRes.data);
      }
      if (vmsRes?.data) {
        setAllVms(vmsRes.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch data. You might not be an admin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  const generateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vouchers', { amount });
      fetchData();
      alert('Voucher generated successfully!');
    } catch (err) {
      alert('Failed to generate voucher');
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setIsGenerating(orderId);
    try {
      const res = await api.post(`/admin/orders/${orderId}/generate`);
      alert(`Kode berhasil dibuat dan email terkirim! Kode: ${res.data.code}`);
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

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden bg-slate-50">
      {/* Decorative background blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[40rem] h-[40rem] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 text-white p-2.5 rounded-xl shadow-lg shadow-slate-800/20">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 font-medium">Voucher Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-slate-700 rounded-xl text-sm font-medium transition-all border border-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Cluster Status Card */}
          <GlassCard className="md:col-span-4 bg-gradient-to-r from-slate-800 to-indigo-900 border-slate-700 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2 text-indigo-100">
                <Activity className="w-5 h-5" /> Master Node Status: {targetNode}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">CPU Usage</p>
                <div className="text-2xl font-bold flex items-end gap-2">
                  {nodeStatus?.cpu ? (nodeStatus.cpu * 100).toFixed(1) : 0}%
                  <span className="text-sm font-normal text-slate-400 pb-0.5">of {nodeStatus?.cpuinfo?.cpus || 0} Cores</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">RAM Usage</p>
                <div className="text-2xl font-bold flex items-end gap-2">
                  {nodeStatus?.memory ? ((nodeStatus.memory.used / nodeStatus.memory.total) * 100).toFixed(1) : 0}%
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${nodeStatus?.memory ? (nodeStatus.memory.used / nodeStatus.memory.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Storage</p>
                <div className="text-2xl font-bold flex items-end gap-2">
                  {nodeStatus?.rootfs ? ((nodeStatus.rootfs.used / nodeStatus.rootfs.total) * 100).toFixed(1) : 0}%
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${nodeStatus?.rootfs ? (nodeStatus.rootfs.used / nodeStatus.rootfs.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Uptime</p>
                <div className="text-2xl font-bold">
                  {nodeStatus?.uptime ? Math.floor(nodeStatus.uptime / 86400) : 0} <span className="text-sm font-normal text-slate-400">Days</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Instances</p>
                <div className="text-2xl font-bold text-blue-400">
                  {allVms.length} <span className="text-sm font-normal text-slate-400 ml-1">VMs/LXC</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Generator */}
          <GlassCard className="flex flex-col justify-start">
            <h2 className="font-semibold text-lg text-slate-700 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Generate Voucher
            </h2>
            <form onSubmit={generateVoucher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button 
                type="submit" 
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Generate New Code
              </button>
            </form>
          </GlassCard>

          {/* List */}
          <GlassCard className="md:col-span-3">
            <h2 className="font-semibold text-lg text-slate-700 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-500" /> Voucher Database
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Used By</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-medium text-slate-700">{v.code}</td>
                      <td className="py-3 text-slate-600">Rp {v.amount.toLocaleString('id-ID')}</td>
                      <td className="py-3">
                        {v.isUsed ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-medium">Used</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Active</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {v.usedBy || '-'}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => copyToClipboard(v.code)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode === v.code ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">No vouchers generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Customer Orders */}
        <GlassCard>
          <h2 className="font-semibold text-lg text-slate-700 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-500" /> Customer VM Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm">
                  <th className="pb-3 font-medium">Order ID / VM Name</th>
                  <th className="pb-3 font-medium">Customer Email</th>
                  <th className="pb-3 font-medium">Specs & Price</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="py-3">
                      <div className="font-medium text-slate-800">{o.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{o.id}</div>
                    </td>
                    <td className="py-3 text-slate-600">{o.userEmail}</td>
                    <td className="py-3 text-slate-600">
                      <div>{o.cores}C / {o.memory}MB / {o.storage}GB</div>
                      <div className="font-semibold text-indigo-600 mt-0.5">Rp {o.totalCost.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : o.status === 'READY_TO_ACTIVATE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {o.status === 'PENDING' ? (
                        <button
                          onClick={() => handleConfirmOrder(o.id)}
                          disabled={isGenerating === o.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium disabled:opacity-50 transition-colors"
                        >
                          {isGenerating === o.id ? 'Processing...' : 'Confirm Payment & Email Code'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">Code: {o.activationCode || '-'}</span>
                          {o.activationCode && (
                            <button onClick={() => copyToClipboard(o.activationCode)} className="text-slate-400 hover:text-indigo-600">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Global VM View */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-slate-700 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" /> All Node Instances (Global View)
            </h2>
            <div className="text-sm text-slate-500">
              Running: <span className="font-bold text-green-600">{allVms.filter(v => v.status === 'running').length}</span> | 
              Stopped: <span className="font-bold text-red-500 ml-1">{allVms.filter(v => v.status !== 'running').length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm bg-slate-50">
                  <th className="py-3 px-4 font-medium rounded-tl-lg">ID</th>
                  <th className="py-3 px-4 font-medium">Name & Type</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">CPU</th>
                  <th className="py-3 px-4 font-medium">RAM / Max</th>
                  <th className="py-3 px-4 font-medium rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {allVms.map((vm) => (
                  <tr key={vm.vmid} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">#{vm.vmid}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{vm.name}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{vm.type || 'qemu'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${vm.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${vm.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {vm.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {((vm.cpu || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {((vm.mem || 0) / 1024 / 1024 / 1024).toFixed(1)}GB / {((vm.maxmem || 1) / 1024 / 1024 / 1024).toFixed(1)}GB
                    </td>
                    <td className="py-3 px-4 text-right">
                      {/* VNC button will be added in future integration if admin wants native access */}
                      <span className="text-xs text-slate-400 italic">Managed in User Dashboard</span>
                    </td>
                  </tr>
                ))}
                {allVms.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">No instances found on {targetNode}.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
