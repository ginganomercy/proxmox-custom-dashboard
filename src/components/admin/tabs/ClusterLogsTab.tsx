import React from 'react';
import { FileText, Terminal } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';

interface ClusterLogsTabProps {
  logTab: 'tasks' | 'clusterlog';
  setLogTab: (tab: 'tasks' | 'clusterlog') => void;
  isLoadingTasks: boolean;
  clusterTasks: any[];
  targetNode: string;
  isLoadingLogs: boolean;
  clusterLogs: any[];
}

export function ClusterLogsTab({
  logTab,
  setLogTab,
  isLoadingTasks,
  clusterTasks,
  targetNode,
  isLoadingLogs,
  clusterLogs
}: ClusterLogsTabProps) {
  return (
    <div className="p-5">
      <SectionHeader
        icon={<FileText className="w-5 h-5" />}
        title="Proxmox Cluster Logs & Tasks"
        subtitle="Authentic Proxmox VE cluster execution audit logs. Switch between worker Tasks history and live system daemon Cluster log."
      />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {/* Proxmox VE Authentic Sub-tab Toggle Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogTab('tasks')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${logTab === 'tasks' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Terminal className="w-3.5 h-3.5" /> Tasks
            </button>
            <button
              onClick={() => setLogTab('clusterlog')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${logTab === 'clusterlog' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Cluster log
            </button>
          </div>
          <span className="text-xs text-slate-400 font-medium">Auto-refreshes every 15s</span>
        </div>

        {logTab === 'tasks' ? (
          <div className="p-2 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Start Time ↓</th>
                  <th className="py-3 px-4">End Time</th>
                  <th className="py-3 px-4">Node</th>
                  <th className="py-3 px-4">User name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoadingTasks && clusterTasks.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500 animate-pulse">Fetching cluster tasks...</td></tr>
                ) : clusterTasks.map((taskItem, idx) => {
                  const startObj = new Date((taskItem.starttime || 0) * 1000);
                  const startStr = startObj.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const endObj = new Date((taskItem.endtime || taskItem.starttime || 0) * 1000);
                  const endStr = endObj.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  
                  let description = taskItem.type || 'Task';
                  if (taskItem.type === 'qemudestroy') description = `VM ${taskItem.id || ''} - Destroy`;
                  else if (taskItem.type === 'qemustop') description = `VM ${taskItem.id || ''} - Stop`;
                  else if (taskItem.type === 'qemustart') description = `VM ${taskItem.id || ''} - Start`;
                  else if (taskItem.type === 'qemucreate') description = `VM ${taskItem.id || ''} - Create`;
                  else if (taskItem.type === 'qemushutdown') description = `VM ${taskItem.id || ''} - Shutdown`;
                  else if (taskItem.type === 'aptupdate') description = `Update package database`;
                  else if (taskItem.id) description = `VM ${taskItem.id} - ${taskItem.type}`;

                  const statusText = taskItem.status || 'PROG';
                  const isOK = statusText === 'OK';
                  
                  return (
                    <tr key={idx} className={`transition-colors ${isOK ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{startStr}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{endStr}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{taskItem.node || targetNode}</td>
                      <td className="py-3 px-4 text-cyan-600 dark:text-cyan-400 font-semibold">{taskItem.user || 'root@pam'}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100">{description}</td>
                      <td className="py-3 px-4">
                        {isOK ? (
                          <span className="text-emerald-500 dark:text-emerald-400 font-bold">OK</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-bold">{statusText}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {clusterTasks.length === 0 && !isLoadingTasks && (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">No recent tasks found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-2 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Node</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">PID</th>
                  <th className="py-3 px-4">User name</th>
                  <th className="py-3 px-4">Message</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoadingLogs && clusterLogs.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500 animate-pulse">Fetching cluster logs...</td></tr>
                ) : clusterLogs.map((logItem, idx) => {
                  const dateObj = new Date((logItem.time || 0) * 1000);
                  const timeStr = dateObj.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{timeStr}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{logItem.node || targetNode}</td>
                      <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-medium">{logItem.tag || 'pvedaemon'}</td>
                      <td className="py-3 px-4 text-slate-400 dark:text-slate-500">{logItem.pid || 'N/A'}</td>
                      <td className="py-3 px-4 text-cyan-600 dark:text-cyan-400 font-semibold">{logItem.user || 'root@pam'}</td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-100 font-medium">{logItem.msg || logItem.type || 'cluster event'}</td>
                    </tr>
                  );
                })}
                {clusterLogs.length === 0 && !isLoadingLogs && (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">No recent log entries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
