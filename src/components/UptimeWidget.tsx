import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, ServerCrash, CheckCircle2, Plus, Trash2, ShieldCheck, ShieldAlert, Globe2 } from 'lucide-react';
import { monitorService, MonitorTarget, MonitorLog } from '../lib/api';

const UptimeWidget: React.FC = () => {
  const [monitors, setMonitors] = useState<MonitorTarget[]>([]);
  const [logs, setLogs] = useState<Record<string, MonitorLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (error) {
      console.error("Failed to fetch uptime data", error);
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
      <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Activity className="animate-spin text-indigo-500 w-8 h-8" />
      </div>
    );
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setIsSubmitting(true);
    try {
      await monitorService.addTarget(newDomain.trim());
      setNewDomain('');
      setShowAddModal(false);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to add domain");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
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
          <div key={monitor.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative group">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${isUp ? 'bg-emerald-500' : isPending ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-slate-400" />
                  {monitor.domain.replace('https://', '').replace('http://', '')}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Last checked: {new Date(monitor.lastPing).toLocaleTimeString()}</p>
                
                {/* Health Metrics Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {monitor.lastStatusCode > 0 && (
                    <span className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 ${monitor.lastStatusCode >= 200 && monitor.lastStatusCode < 400 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      HTTP {monitor.lastStatusCode}
                    </span>
                  )}
                  {isHttps ? (
                    monitor.sslValid ? (
                      <span className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-sky-500/20 text-sky-400">
                        <ShieldCheck className="w-3 h-3" /> SSL: {monitor.sslExpiryDays}d left
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-rose-500/20 text-rose-400">
                        <ShieldAlert className="w-3 h-3" /> SSL: Invalid
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-slate-500/20 text-slate-400">
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
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm shadow-lg ${isUp ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isPending ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isUp ? <CheckCircle2 className="w-4 h-4" /> : isPending ? <Activity className="w-4 h-4 animate-spin" /> : <ServerCrash className="w-4 h-4" />}
                  {monitor.status}
                </div>
              </div>
            </div>

            <div className="h-[200px] w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
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
                      stroke={isUp ? "#34d399" : "#f87171"} 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: isUp ? "#34d399" : "#f87171", strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center text-gray-500 text-sm">
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
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Add New Endpoint</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <XAxis className="hidden" /> {/* Temp hack to import lucide X */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleAddDomain} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Endpoint URL or Domain</label>
                <input 
                  type="text" 
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. finger.pbjt.web.id" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">https:// will be automatically prefixed if omitted.</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
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
      )}
    </div>
  );
};

export default UptimeWidget;
