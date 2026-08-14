import React from 'react';
import { Menu, Moon, Sun, RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeTab: string;
  targetNode: string;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  fetchGlobalData: () => void;
  isLoadingSummary: boolean;
}

export function AdminHeader({
  setIsSidebarOpen,
  activeTab,
  targetNode,
  isDarkMode,
  setIsDarkMode,
  fetchGlobalData,
  isLoadingSummary,
}: AdminHeaderProps) {
  return (
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => { fetchGlobalData(); }}
          disabled={isLoadingSummary}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Status</span>
        </button>
      </div>
    </header>
  );
}
