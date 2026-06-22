import React, { useEffect, useState } from 'react';
import { X, Terminal, Maximize2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface VncConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: string;
  vmid: number;
  type: string;
  vmName: string;
}

export function VncConsoleModal({ isOpen, onClose, node, vmid, type, vmName }: VncConsoleModalProps) {
  const [ticket, setTicket] = useState<string | null>(null);
  const [port, setPort] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const proxmoxHost = import.meta.env.VITE_PROXMOX_HOST || window.location.hostname; // Can be configured via .env

  const fetchTicket = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post(`/proxmox/nodes/${node}/${type}/${vmid}/vncproxy`);
      if (res.data && res.data.ticket) {
        setTicket(res.data.ticket);
        setPort(res.data.port);
      } else {
        throw new Error('Ticket not generated properly by backend');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to initialize VNC Console');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vmid) {
      fetchTicket();
    } else {
      setTicket(null);
      setPort(null);
      setIsFullscreen(false);
    }
  }, [isOpen, vmid, node, type]);

  if (!isOpen) return null;

  // URL construction for Proxmox native noVNC
  // We use the proxy port and ticket returned by the API
  const vncUrl = ticket 
    ? `https://${proxmoxHost}:8006/?console=kvm&novnc=1&vmid=${vmid}&node=${node}&resize=scale&vncticket=${encodeURIComponent(ticket)}` 
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 w-full transition-all duration-300 ${isFullscreen ? 'h-full max-w-full' : 'h-[80vh] max-w-5xl'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold">{vmName} <span className="text-slate-400 text-sm font-mono ml-2">[{vmid}]</span></h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchTicket} 
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              title="Reconnect"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors hidden sm:block"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors ml-2 border-l border-slate-700 pl-4"
              title="Close Console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-black flex items-center justify-center p-2">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p>Establishing secure connection...</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/90">
              <div className="text-center p-6 bg-red-900/20 border border-red-500/30 rounded-xl max-w-md">
                <Terminal className="w-12 h-12 text-red-500 mx-auto mb-3 opacity-50" />
                <h4 className="text-red-400 font-semibold mb-2">Connection Failed</h4>
                <p className="text-slate-300 text-sm">{error}</p>
                <button 
                  onClick={fetchTicket}
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {ticket && !isLoading && !error && (
            <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
              {/* Note: In a production environment, you might need to handle CORS and WSS proxies if the Proxmox IP is different from the web server. 
                  This iframe assumes the Proxmox UI port 8006 is reachable from the client's browser. */}
              <iframe 
                src={vncUrl}
                className="w-full h-full border-0 focus:outline-none"
                title={`VNC Console for ${vmName}`}
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
