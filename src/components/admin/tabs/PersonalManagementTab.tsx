import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, Server, Activity, ChevronRight } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';

interface PersonalManagementTabProps {
  targetNode: string;
}

export function PersonalManagementTab({ targetNode }: PersonalManagementTabProps) {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <SectionHeader
        icon={<Users className="w-5 h-5" />}
        title="Personal Management & Cluster Configuration"
        subtitle="Manage personal administrator profile, Proxmox VE API authentication security, and real-time telemetry stream preferences."
      />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
              <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-cyan-600 text-white rounded-xl shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Personal Admin Profile</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Superuser Account Identity</p>
              </div>
            </div>
            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Account Role</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">SUPER_ADMIN</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Auth Mechanism</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">JWT Bearer Token (Stateless)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Access Level</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Full Cluster Root Control</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
            Active personal session verified
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Proxmox VE Cluster API</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hypervisor Target Connection</p>
              </div>
            </div>
            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Target Node</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{targetNode || 'Capybara'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Transport Security</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">SSL/TLS Verified</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">API Status</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Online — Authenticated</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
            Proxmox VE JSON API v2
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-md">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Personal View Gateway</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live Telemetry &amp; VM Controls</p>
              </div>
            </div>
            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Telemetry Channel</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">WebSocket WSS Streaming</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Refresh Cycle</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Every 5 Seconds</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Power Operations</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Enabled</span>
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
  );
}
