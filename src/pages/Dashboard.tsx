'use client';

import { useEffect, useState } from 'react';
import logoUrl from '@/assets/logo.svg?url';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricChart } from '@/components/MetricChart';
import { DataTable } from '@/components/DataTable';
import { CreateVMModal } from '@/components/CreateVMModal';
import { LogOut, Server, Activity, RefreshCw, Plus, Rocket, MonitorPlay, CheckCircle2, Loader2 } from 'lucide-react';

// Dedicated axios instance with 5-minute timeout for VM provisioning pipeline
// (Clone → WaitForTask → ResizeDisk → CloudInit → PowerOn can take 2-4 minutes)
const longApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://cloud-core.pbjt.web.id/api'),
  timeout: 300000, // 5 minutes
});
longApi.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "My Virtual Machines | Cloud Baja Tegal";
  }, []);
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
  const [provisionStep, setProvisionStep] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const checkAuth = () => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const fetchData = async (silent = false) => {
    if (!checkAuth()) return;
    
    if (!silent) setIsLoading(true);
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

      // 2. Fetch node status, instances, user profile, and orders in parallel
      const [statusRes, vmsRes, userRes, ordersRes] = await Promise.all([
        api.get(`/proxmox/nodes/${targetNode}/status`).catch(() => null),
        api.get(`/proxmox/nodes/${targetNode}/instances`).catch(() => null),
        api.get(`/auth/me`).catch((e) => e.response || null),
        api.get(`/orders/me`).catch(() => null)
      ]);

      // If /auth/me returns 404, the user record is gone (DB was wiped).
      // Force a clean logout so the user can re-register.
      if (userRes && (userRes.status === 404 || userRes.data?.error === 'user not found')) {
        Cookies.remove('token');
        navigate('/login');
        return;
      }

      if (userRes?.data) setUser(userRes.data);
      if (ordersRes?.data) setOrders(ordersRes.data);

      if (statusRes?.data && vmsRes?.data !== undefined) {
        setNodeStatus(statusRes.data);
        setVms(vmsRes.data || []);
      } else {
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
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), 15000); // stable 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  const handleActivateOrder = async (orderId: string) => {
    const code = activationCodeInput[orderId];
    if (!code?.trim()) return;
    
    setActivatingOrder(orderId);
    setProvisionStep('Memverifikasi kode aktivasi...');
    
    try {
      // Step 1: Submit activation — backend returns 202 immediately
      // The actual provisioning runs in a background goroutine on the server.
      const res = await api.post(`/orders/${orderId}/activate`, { code: code.trim() });
      
      // If synchronous success (shouldn't happen normally, but handle it)
      if (res.status === 200) {
        setProvisionStep('✅ VM berhasil dibuat dan dinyalakan!');
        setTimeout(() => { setActivatingOrder(null); setProvisionStep(''); fetchData(); }, 2000);
        return;
      }

      // Step 2: 202 Accepted — start polling /orders/me for status
      setProvisionStep('Memulai proses provisioning VM di cluster Proxmox...');
      
      let pollCount = 0;
      const MAX_POLLS = 120; // 120 × 5s = 10 minutes max
      
      const poll = setInterval(async () => {
        pollCount++;
        
        // Show progressive status messages while waiting
        if (pollCount === 3)  setProvisionStep('Mengalokasikan VMID baru dari cluster...');
        if (pollCount === 6)  setProvisionStep('Mengkloning template VM (ini membutuhkan waktu 1-3 menit)...');
        if (pollCount === 15) setProvisionStep('Menunggu konfirmasi clone selesai dari Proxmox...');
        if (pollCount === 25) setProvisionStep('Menyesuaikan ukuran disk sesuai pesanan...');
        if (pollCount === 35) setProvisionStep('Menerapkan konfigurasi Cloud-Init (CPU, RAM, IP)...');
        if (pollCount === 45) setProvisionStep('Menyalakan VM dan mendaftarkan ke sistem...');
        
        if (pollCount >= MAX_POLLS) {
          clearInterval(poll);
          setActivatingOrder(null);
          setProvisionStep('');
          alert('⚠️ Waktu menunggu habis. Silakan refresh halaman untuk melihat status VM terbaru.');
          return;
        }
        
        try {
          const ordersRes = await api.get('/orders/me');
          const updatedOrder = ordersRes.data?.find((o: any) => o.id === orderId);
          
          if (!updatedOrder) return; // still fetching, wait next poll
          
          if (updatedOrder.status === 'COMPLETED') {
            clearInterval(poll);
            setProvisionStep('✅ VM berhasil dibuat dan dinyalakan!');
            setTimeout(() => { setActivatingOrder(null); setProvisionStep(''); fetchData(); }, 2500);
          } else if (updatedOrder.status === 'FAILED') {
            clearInterval(poll);
            setActivatingOrder(null);
            setProvisionStep('');
            alert(`❌ Aktivasi gagal: ${updatedOrder.provisionError || 'Terjadi kesalahan di server. Hubungi Administrator.'}`);
          }
          // status === 'PROVISIONING' → keep polling
        } catch {
          // Transient poll error — ignore and retry next cycle
        }
      }, 5000);
      
    } catch (err: any) {
      setActivatingOrder(null);
      setProvisionStep('');
      const msg = err.response?.data?.error || err.message || 'Gagal menghubungi server';
      alert(`❌ Aktivasi gagal: ${msg}`);
    }
  };

  const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'READY_TO_ACTIVATE' || o.status === 'FAILED');
  const hasItems = vms.length > 0 || activeOrders.length > 0;

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* ── VM Provisioning Full-Screen Overlay ──────────────────────────────── */}
      {activatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5">
              {provisionStep.startsWith('✅') ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {provisionStep.startsWith('✅') ? 'VM Siap!' : 'Menyiapkan Virtual Machine...'}
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{provisionStep}</p>
            {!provisionStep.startsWith('✅') && (
              <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
                <p className="text-xs text-slate-400">Harap jangan tutup atau refresh halaman ini</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decorative background blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[40rem] h-[40rem] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 bg-transparent">
              <img src={logoUrl} alt="Cloud Baja Tegal Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Cloud Baja Tegal (CBT)</h1>
              <p className="text-sm text-slate-500 font-medium">Personal Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 w-full md:w-auto justify-end">
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

        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold shadow-sm animate-in fade-in duration-300">
            <div className="p-1 bg-emerald-500 text-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span>{successMsg}</span>
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


        {/* Data Table */}
        {hasItems && (
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-slate-700">Virtual Machines & LXC</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" /> Pesan VM Baru
              </button>
            </div>
            <DataTable 
              data={vms} 
              isLoading={isLoading} 
              nodeName={nodeName} 
              onDeleteSuccess={() => {
                setSuccessMsg('Virtual Machine berhasil dihapus secara permanen dari sistem.');
                fetchData(false);
              }} 
            />
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
