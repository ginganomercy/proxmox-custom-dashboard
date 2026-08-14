import React from 'react';
import { X, Users, Server, FileText, Activity, LogOut } from 'lucide-react';
import logoUrl from '@/assets/logo.svg?url';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeTab: 'orders' | 'vms' | 'logs' | 'uptime';
  setActiveTab: (tab: 'orders' | 'vms' | 'logs' | 'uptime') => void;
  handleLogout: () => void;
}

export function AdminSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  handleLogout,
}: AdminSidebarProps) {
  return (
    <>
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
    </>
  );
}
