'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricChart } from '@/components/MetricChart';
import { DataTable } from '@/components/DataTable';
import { CreateVMModal } from '@/components/CreateVMModal';
import { LogOut, Server, Activity, RefreshCw, Plus } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const [vms, setVms] = useState([]);
  const [nodeName, setNodeName] = useState<string>('Loading...');
  const [nodeStatus, setNodeStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    setError('');
    
    try {
      // 1. Fetch available nodes
      const nodesRes = await api.get('/proxmox/nodes').catch(() => null);
      let targetNode = 'pve'; // fallback

      if (nodesRes?.data && nodesRes.data.length > 0) {
        targetNode = nodesRes.data[0].node;
        setNodeName(targetNode);
      } else {
        setNodeName('Unknown (Mock)');
      }

      // 2. Fetch node status, instances, and user profile
      const [statusRes, vmsRes, userRes] = await Promise.all([
        api.get(`/proxmox/nodes/${targetNode}/status`).catch(() => null),
        api.get(`/proxmox/nodes/${targetNode}/instances`).catch(() => null),
        api.get(`/auth/me`).catch(() => null)
      ]);

      if (userRes?.data) {
        setUser(userRes.data);
      }

      if (statusRes?.data && vmsRes?.data) {
        setNodeStatus(statusRes.data);
        setVms(vmsRes.data);
      } else {
        // Fallback to mock data if Proxmox isn't connected or .env isn't set up
        setNodeStatus({
          cpu: 0.24,
          memory: { used: 16 * 1024 * 1024 * 1024, total: 32 * 1024 * 1024 * 1024 }
        });
        setVms([
          { vmid: 100, name: 'web-server-prod', status: 'running', cpu: 0.12, maxmem: 4294967296, mem: 2147483648 },
          { vmid: 101, name: 'db-cluster-01', status: 'running', cpu: 0.45, maxmem: 8589934592, mem: 7516192768 },
          { vmid: 102, name: 'test-env-isolated', status: 'stopped', cpu: 0, maxmem: 2147483648, mem: 0 },
        ] as any);
        setError('Could not connect to Proxmox API. Showing mock data.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
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

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode) return;
    setIsRedeeming(true);
    try {
      const res = await api.post('/vouchers/redeem', { code: voucherCode });
      alert(`Success! Rp ${res.data.addedAmount.toLocaleString('id-ID')} added to your balance.`);
      setVoucherCode('');
      fetchData(); // refresh balance
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to redeem voucher');
    } finally {
      setIsRedeeming(false);
    }
  };

  let cpuUsage = 0;
  if (nodeStatus?.cpu && nodeStatus.cpu > 0) {
    cpuUsage = nodeStatus.cpu * 100;
  } else if (nodeStatus?.loadavg && nodeStatus?.cpuinfo?.cpus) {
    // Proxmox API sometimes returns cpu: 0 for tokens; fallback to 1-minute load average
    const load1m = parseFloat(nodeStatus.loadavg[0]);
    const cores = nodeStatus.cpuinfo.cpus;
    cpuUsage = Math.min((load1m / cores) * 100, 100);
  }

  const ramUsage = nodeStatus?.memory ? (nodeStatus.memory.used / nodeStatus.memory.total) * 100 : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[40rem] h-[40rem] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Cloud Baja Tegal (CBT)</h1>
              <p className="text-sm text-slate-500 font-medium">Node: {nodeName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-slate-700 rounded-xl text-sm font-medium transition-all border border-white disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
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

        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4 text-slate-700">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-lg">System Health</h2>
            </div>
            <div className="flex justify-around items-center pt-2">
              <MetricChart title="CPU" value={cpuUsage} color="#3B82F6" />
              <MetricChart title="RAM" value={ramUsage} color="#8B5CF6" />
            </div>
          </GlassCard>

          <GlassCard className="md:col-span-2 flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full opacity-50 pointer-events-none"></div>
             <h2 className="font-semibold text-lg text-slate-700 mb-2">Cluster Status</h2>
             <div className="grid grid-cols-2 gap-4 mt-4">
               <div>
                 <p className="text-slate-500 text-sm font-medium">Total VMs</p>
                 <p className="text-3xl font-bold text-slate-800">{vms.length}</p>
               </div>
               <div>
                 <p className="text-slate-500 text-sm font-medium">Running</p>
                 <p className="text-3xl font-bold text-blue-600">
                   {vms.filter((v: any) => v.status === 'running').length}
                 </p>
              </div>
           </GlassCard>

           <GlassCard className="flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-4 text-slate-700">
               <div className="w-5 h-5 text-indigo-500 font-bold">Rp</div>
               <h2 className="font-semibold text-lg">My Wallet</h2>
             </div>
             <div className="mb-4">
               <p className="text-slate-500 text-sm font-medium">Current Balance</p>
               <p className="text-3xl font-bold text-slate-800">
                 Rp {user?.balance ? user.balance.toLocaleString('id-ID') : '0'}
               </p>
             </div>
             <form onSubmit={handleRedeemVoucher} className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Voucher Code" 
                 value={voucherCode}
                 onChange={(e) => setVoucherCode(e.target.value)}
                 className="w-full px-3 py-2 bg-white/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
               <button 
                 type="submit" 
                 disabled={isRedeeming || !voucherCode}
                 className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
               >
                 {isRedeeming ? '...' : 'Redeem'}
               </button>
             </form>
           </GlassCard>
        </div>

        {/* Data Table */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg text-slate-700">Virtual Machines & LXC</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Create VM
            </button>
          </div>
          <DataTable data={vms} isLoading={isLoading} nodeName={nodeName} />
        </GlassCard>

      </div>

      <CreateVMModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchData(); // Refresh VM list and balance
        }}
      />
    </div>
  );
}
