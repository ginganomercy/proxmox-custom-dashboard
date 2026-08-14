import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, ServerCrash, CheckCircle2 } from 'lucide-react';
import { monitorService, MonitorTarget, MonitorLog } from '../lib/api';

const UptimeWidget: React.FC = () => {
  const [monitors, setMonitors] = useState<MonitorTarget[]>([]);
  const [logs, setLogs] = useState<Record<string, MonitorLog[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const targets = await monitorService.getMonitors();
      setMonitors(targets);

      const logsData: Record<string, MonitorLog[]> = {};
      for (const target of targets) {
        const targetLogs = await monitorService.getMonitorLogs(target.id);
        logsData[target.id] = targetLogs;
      }
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
      <div className="flex justify-center items-center h-48 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
        <Activity className="animate-spin text-blue-400 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {monitors.map((monitor) => {
        const isUp = monitor.status === 'UP';
        const targetLogs = logs[monitor.id] || [];
        
        // Format data for chart
        const chartData = targetLogs.map(log => ({
          time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latency: log.latencyMs,
          status: log.status
        }));

        return (
          <div key={monitor.id} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden relative group">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{monitor.domain.replace('https://', '')}</h3>
                <p className="text-sm text-gray-400 mt-1">Last checked: {new Date(monitor.lastPing).toLocaleTimeString()}</p>
              </div>
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm shadow-lg ${isUp ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {isUp ? <CheckCircle2 className="w-4 h-4" /> : <ServerCrash className="w-4 h-4" />}
                {monitor.status}
              </div>
            </div>

            <div className="h-[200px] w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
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
  );
};

export default UptimeWidget;
