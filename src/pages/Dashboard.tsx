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
import { LogOut, Server, Activity, RefreshCw, Plus, Rocket, MonitorPlay, Mail, CheckCircle2 } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const [vms, setVms] = useState([]);
  const [nodeName, setNodeName] = useState<string>('Loading...');
  const [nodeStatus, setNodeStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activatingOrder, setActivatingOrder] = useState<string | null>(null);
  const [activationCodeInput, setActivationCodeInput] = useState<{ [key: string]: string }>({});

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

      // 2. Fetch node status, instances, user profile, and orders
      const [statusRes, vmsRes, userRes, ordersRes] = await Promise.all([
        api.get(`/proxmox/nodes/${targetNode}/status`).catch(() => null),
        api.get(`/proxmox/nodes/${targetNode}/instances`).catch(() => null),
        api.get(`/auth/me`).catch(() => null),
        api.get(`/orders/me`).catch(() => null)
      ]);

      if (userRes?.data) {
        setUser(userRes.data);
      }

      if (ordersRes?.data) {
        setOrders(ordersRes.data);
      }

      if (statusRes?.data && vmsRes?.data) {
        setNodeStatus(statusRes.data);
        setVms(vmsRes.data);
      } else {
        // Jangan tampilkan mock data di production. Biarkan kosong.
        setNodeStatus(null);
        setVms([]);
        if (targetNode !== 'pve') {
           setError('Terdapat gangguan koneksi ke server pusat (Proxmox). Hubungi Administrator.');
        }
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

  const handleActivateOrder = async (orderId: string) => {
    const code = activationCodeInput[orderId];
    if (!code) return;
    
    setActivatingOrder(orderId);
    try {
      await api.post(`/orders/${orderId}/activate`, { code });
      alert('VM Successfully Provisioned! Please refresh the page if the VM does not appear immediately.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to activate order');
    } finally {
      setActivatingOrder(null);
    }
  };

  const hasItems = vms.length > 0 || orders.length > 0;

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
              <p className="text-sm text-slate-500 font-medium">Customer Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md"
              >
                <Server className="w-4 h-4" />
                Admin Panel
              </button>
            )}
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

        {error && hasItems && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* Onboarding Hero Section (Only shown if user has no VMs and no Orders) */}
        {!hasItems && !isLoading && (
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10 max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                Mulai Perjalanan Cloud Anda
              </h1>
              <p className="text-blue-100 text-lg md:text-xl mb-8 font-light">
                Cloud Baja Tegal (CBT) menyediakan Virtual Private Server (VPS) performa tinggi. Anda berhak memesan <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md">1 Server Eksklusif</span> per akun.
              </p>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-blue-200" /> Tata Cara Pemesanan
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <p className="text-blue-50">Tekan tombol <strong>Pesan VM Sekarang</strong> di bawah untuk memilih spesifikasi server yang Anda butuhkan.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <p className="text-blue-50">Setelah sukses mengajukan pesanan, hubungi Admin via WhatsApp di <strong>0856117933</strong> untuk melakukan pembayaran tunai.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <p className="text-blue-50">Admin akan mengonfirmasi pembayaran dan mengirimkan <strong>Kode Aktivasi</strong> unik ke email Anda.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">4</div>
                    <p className="text-blue-50">Masukkan kode tersebut di halaman ini, dan Virtual Machine Anda akan menyala secara otomatis!</p>
                  </li>
                </ol>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white text-indigo-700 hover:bg-blue-50 text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3"
              >
                <Rocket className="w-6 h-6 text-indigo-600" /> Pesan VM Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Pending Orders Row */}
        {orders.filter(o => o.status === 'PENDING' || o.status === 'READY_TO_ACTIVATE').length > 0 && (
          <GlassCard>
            <h2 className="font-semibold text-lg text-slate-700 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" /> My Pending Orders
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-slate-500 font-medium">VM Name</th>
                    <th className="pb-3 text-slate-500 font-medium">Specs</th>
                    <th className="pb-3 text-slate-500 font-medium">Total Cost</th>
                    <th className="pb-3 text-slate-500 font-medium">Status</th>
                    <th className="pb-3 text-slate-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.filter(o => o.status === 'PENDING' || o.status === 'READY_TO_ACTIVATE').map(order => (
                    <tr key={order.id}>
                      <td className="py-3 font-medium text-slate-800">{order.name}</td>
                      <td className="py-3 text-slate-600">{order.cores}C / {order.memory}MB / {order.storage}GB</td>
                      <td className="py-3 text-slate-800 font-semibold">Rp {order.totalCost.toLocaleString('id-ID')}</td>
                      <td className="py-3">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          order.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {order.status === 'PENDING' ? 'Awaiting Payment' : 'Code Sent to Email'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Enter Code"
                            className="w-32 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500"
                            value={activationCodeInput[order.id] || ''}
                            onChange={e => setActivationCodeInput({...activationCodeInput, [order.id]: e.target.value})}
                          />
                          <button
                            onClick={() => handleActivateOrder(order.id)}
                            disabled={activatingOrder === order.id || !activationCodeInput[order.id]}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50"
                          >
                            {activatingOrder === order.id ? '...' : 'Activate VM'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Data Table */}
        {hasItems && (
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-slate-700">Virtual Machines & LXC</h2>
            </div>
            <DataTable data={vms} isLoading={isLoading} nodeName={nodeName} />
          </GlassCard>
        )}

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
