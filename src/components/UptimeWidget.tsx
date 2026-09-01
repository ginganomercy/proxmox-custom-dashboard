import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, ServerCrash, CheckCircle2, Plus, Trash2, ShieldCheck, ShieldAlert, Globe2 } from 'lucide-react';
import { monitorService, MonitorTarget, MonitorLog } from '../lib/api';

// --- Sub-components for Performance Isolation ---

const AddEndpointModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void; 
  onSuccess: () => Promise<void>; 
}) => {
  const [newDomain, setNewDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setIsSubmitting(true);
    try {
      await monitorService.addTarget(newDomain.trim());
      setNewDomain('');
      onClose();
      await onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to add domain");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">Add New Endpoint</h3>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleAddDomain} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors">Endpoint URL or Domain</label>
            <input 
              type="text" 
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. finger.pbjt.web.id" 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 transition-colors">https:// will be automatically prefixed if omitted.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-6 py-2 rounded-xl font-medium text-sm transition-all"
            >
              {isSubmitting ? 'Adding...' : 'Start Monitoring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Widget Component ---

const UptimeWidget: React.FC = () => {
  const [monitors, setMonitors] = useState<MonitorTarget[]>([]);
  const [logs, setLogs] = useState<Record<string, MonitorLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      const targets = await monitorService.getMonitors();
      setMonitors(targets);

      // Concurrent fetching for all logs
      const logsData: Record<string, MonitorLog[]> = {};
      const logsPromises = targets.map(target => monitorService.getMonitorLogs(target.id));
      const logsResults = await Promise.all(logsPromises);
      
      targets.forEach((target, idx) => {
        logsData[target.id] = logsResults[idx];
      });
      
      setLogs(logsData);
      setFetchError(null);
    } catch (error: any) {
      console.error("Failed to fetch uptime data", error);
      setFetchError(error.response?.data?.error || "Gagal menghubungi server untuk memuat data Endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 2 minutes to match the backend ping interval
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <Activity className="animate-spin text-indigo-500 w-8 h-8" />
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this endpoint? All historical logs will be lost.")) {
      try {
        await monitorService.deleteTarget(id);
        await fetchData();
      } catch (error) {
        alert("Failed to delete endpoint");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mt-2 mb-6 px-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 transition-colors">
          <Activity className="w-5 h-5 text-indigo-500" />
          Active Monitors
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Add Endpoint
        </button>
      </div>

      {fetchError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400 rounded-2xl flex items-center gap-3 font-medium transition-colors">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p>{fetchError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {monitors.map((monitor) => {
        const isUp = monitor.status === 'UP';
        const isPending = monitor.status === 'PENDING';
        const targetLogs = logs[monitor.id] || [];
        const isHttps = monitor.domain.startsWith('https');
        
        // Format data for chart
        const chartData = targetLogs.map(log => ({
          time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latency: log.latencyMs,
          status: log.status
        }));

        return (
          <div key={monitor.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden relative group transition-colors">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${isUp ? 'bg-emerald-500' : isPending ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 transition-colors">
                  <Globe2 className="w-5 h-5 text-slate-400" />
                  {monitor.domain.replace('https://', '').replace('http://', '')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                  Last checked: {isPending ? 'Waiting for first ping...' : new Date(monitor.lastPing).toLocaleTimeString()}
                </p>
                {/* Health Metrics Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {monitor.lastStatusCode > 0 && (
                    <span className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 ${monitor.lastStatusCode >= 200 && monitor.lastStatusCode < 400 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                      HTTP {monitor.lastStatusCode}
                    </span>
                  )}
                  {isHttps ? (
                    isPending ? (
                      <span className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-slate-200 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 transition-colors">
                        <ShieldCheck className="w-3 h-3" /> SSL: Pending
                      </span>
                    ) : monitor.sslValid ? (
                      <span className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 transition-colors">
                        <ShieldCheck className="w-3 h-3" /> SSL: {monitor.sslExpiryDays}d left
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 transition-colors">
                        <ShieldAlert className="w-3 h-3" /> SSL: Invalid
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-slate-200 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 transition-colors">
                      <ShieldCheck className="w-3 h-3" /> SSL: N/A (HTTP)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <button 
                  onClick={() => handleDelete(monitor.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  title="Remove Monitor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm shadow-lg ${isUp ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : isPending ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'} transition-colors`}>
                  {isUp ? <CheckCircle2 className="w-4 h-4" /> : isPending ? <Activity className="w-4 h-4 animate-spin" /> : <ServerCrash className="w-4 h-4" />}
                  {monitor.status}
                </div>
              </div>
            </div>

            <div className="h-[200px] w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}ms`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#38bdf8' }}
                      formatter={(value: number) => [`${value} ms`, 'Latency']}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="latency" 
                      stroke={isUp ? "#10b981" : "#ef4444"} 
                      strokeWidth={3}
                      dot={{ r: 4, fill: isUp ? '#10b981' : '#ef4444', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: isUp ? "#34d399" : "#f87171", strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center text-slate-400 dark:text-slate-500 text-sm transition-colors">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  <p>Not enough data to render chart yet.</p>
                  <p className="text-xs mt-1">Check back in a few minutes.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
      {/* Isolated Add Modal */}
      {showAddModal && (
        <AddEndpointModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
};

export default UptimeWidget;
