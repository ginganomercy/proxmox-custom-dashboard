import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface MetricGraphsProps {
  node: string;
  vmid?: number; // Optional. If omitted, we fetch node-level metrics
  type?: string; // qemu or lxc. Omitted if fetching node-level
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl text-sm">
        <p className="text-slate-300 mb-2 font-medium border-b border-slate-700 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MetricGraphs({ node, vmid, type }: MetricGraphsProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('hour'); // hour, day, week, month, year

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      let endpoint = `/proxmox/nodes/${node}/rrddata?timeframe=${timeframe}`;
      if (vmid && type) {
        endpoint = `/proxmox/nodes/${node}/${type}/${vmid}/rrddata?timeframe=${timeframe}`;
      }
      
      const res = await api.get(endpoint);
      if (res.data && Array.isArray(res.data)) {
        // Parse time and convert metrics
        const parsedData = res.data.map((point: any) => {
          const date = new Date(point.time * 1000);
          return {
            time: timeframe === 'hour' ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : date.toLocaleDateString(),
            cpu: point.cpu ? (point.cpu * 100).toFixed(2) : 0,
            ram: point.mem ? (point.mem / 1024 / 1024 / 1024).toFixed(2) : 0, // In GB
            netin: point.netin ? (point.netin / 1024 / 1024).toFixed(2) : 0, // In MB/s
            netout: point.netout ? (point.netout / 1024 / 1024).toFixed(2) : 0, // In MB/s
          };
        });
        // Remove empty data points at the end
        setData(parsedData.filter((d: any) => d.cpu !== 0 || d.ram !== 0));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch telemetry data.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (node) {
      fetchData(false);
      const interval = setInterval(() => fetchData(true), 30000); // stable 30s auto-refresh
      return () => clearInterval(interval);
    }
  }, [node, vmid, type, timeframe]);

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold">Telemetry Metrics</h3>
            <p className="text-slate-500 text-xs font-medium">Real-time resource utilization</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="hour">Past Hour</option>
            <option value="day">Past Day</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      ) : isLoading && data.length === 0 ? (
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* CPU Chart */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">CPU Usage (%)</h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" name="CPU %" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RAM Chart */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Memory Usage (GB)</h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" name="RAM (GB)" dataKey="ram" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
