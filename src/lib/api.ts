import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://cloud-core.pbjt.web.id/api'),
  timeout: 15000, // 15s for regular requests
  withCredentials: true, // Enterprise Hardening: Send HttpOnly cookies automatically
});

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      // Redirect to login page only if we aren't already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
