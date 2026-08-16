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
import { LogOut, Server, Activity, RefreshCw, Plus, Rocket, MonitorPlay, CheckCircle2, Loader2, Moon, Sun } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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

/**
 * Main User Dashboard View.
 * Displays user's provisioned Virtual Machines and provides basic management controls.
 * Features auto-refresh and isolated view based on JWT role claims.
 * 
 * @component
 * @returns {JSX.Element} The rendered User Dashboard.
 */
export function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "My Virtual Machines | Cloud Baja Tegal";
  }, []);
  const [vms, setVms] = useState([]);
  const [nodeName, setNodeName] = useState<string>('Loading...');
  const [nodeStatus, setNodeStatus] = useState<any>(null);
  
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const hasItems = vms.length > 0;

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Decorative background blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[40rem] h-[40rem] bg-blue-300 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-300 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="w-full relative z-10 space-y-6"
      >
        
        {/* Header */}
        <motion.header variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 bg-transparent">
              <img src={logoUrl} alt="Cloud Baja Tegal Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Cloud Baja Tegal (CBT)</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Personal Dashboard</p>
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
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-center p-2 bg-white/60 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-all border border-white dark:border-slate-700 shadow-sm"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => fetchData()}
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
        </motion.header>

        {error && hasItems && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium shadow-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <motion.div variants={itemVariants} className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold shadow-sm animate-in fade-in duration-300">
            <div className="p-1 bg-emerald-500 text-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* Onboarding Hero Section */}
        {!hasItems && !isLoading && user?.role === 'ADMIN' && (
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10 max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                Tidak ada Virtual Machine
              </h1>
              <p className="text-blue-100 text-lg md:text-xl mb-8 font-light">
                Sebagai Administrator, Anda dapat memesan VM baru untuk digunakan atau dialokasikan.
              </p>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white text-indigo-700 hover:bg-blue-50 text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3"
              >
                <Rocket className="w-6 h-6 text-indigo-600" /> Pesan VM Baru
              </button>
            </div>
          </motion.div>
        )}

        {!hasItems && !isLoading && user?.role !== 'ADMIN' && (
          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 md:p-12 text-slate-800 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-xl mx-auto">
              <MonitorPlay className="w-16 h-16 text-indigo-200 mx-auto mb-6" />
              <h1 className="text-2xl font-bold tracking-tight mb-3">
                Belum Ada Virtual Machine
              </h1>
              <p className="text-slate-500 mb-0">
                Anda belum memiliki Virtual Machine (VM) yang terhubung ke akun ini. Jika Anda membutuhkan akses ke server, silakan hubungi Administrator.
              </p>
            </div>
          </motion.div>
        )}


        {/* Data Table */}
        {hasItems && (
          <motion.div variants={itemVariants}>
            <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-slate-700 dark:text-slate-200 transition-colors">Virtual Machines & LXC</h2>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" /> Pesan VM Baru
                </button>
              )}
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
          </motion.div>
        )}

      </motion.div>

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
