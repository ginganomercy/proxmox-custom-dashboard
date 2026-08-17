import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://cloud-core.pbjt.web.id/api'),
  timeout: 15000, // 15s for regular requests
  withCredentials: true, // Enterprise Hardening: Send HttpOnly cookies automatically
});

// Response interceptor removed — we no longer forcefully redirect on 401 globally.
// This allows silent auth checks (like on the Landing Page) to fail gracefully
// without hijacking the router and forcing a reload to /login.


export default api;

// --- Uptime Monitoring API ---

export interface MonitorTarget {
  id: string;
  domain: string;
  status: string;
  lastStatusCode: number;
  sslValid: boolean;
  sslExpiryDays: number;
  lastPing: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonitorLog {
  id: string;
  monitorTargetId: string;
  status: string;
  latencyMs: number;
  errorReason?: string;
  createdAt: string;
}

export const monitorService = {
  getMonitors: async (): Promise<MonitorTarget[]> => {
    const res = await api.get('/monitors');
    return res.data;
  },
  getMonitorLogs: async (id: string): Promise<MonitorLog[]> => {
    const res = await api.get(`/monitors/${id}/logs`);
    return res.data;
  },
  addTarget: async (domain: string): Promise<MonitorTarget> => {
    const res = await api.post('/monitors', { domain });
    return res.data;
  },
  deleteTarget: async (id: string): Promise<void> => {
    await api.delete(`/monitors/${id}`);
  }
};
