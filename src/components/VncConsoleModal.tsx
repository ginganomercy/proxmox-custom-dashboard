import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal, Maximize2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
// @ts-ignore
import RFB from '@novnc/novnc/core/rfb';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);

  const fetchTicket = async () => {
    setIsLoading(true);
    setError('');
    
    // Disconnect existing if any
    if (rfbRef.current) {
      try { rfbRef.current.disconnect(); } catch (e) {}
      rfbRef.current = null;
    }
    
    try {
      // 1. Get ticket from core-api
      const res = await api.post(`/proxmox/nodes/${node}/${type}/${vmid}/vncproxy`);
      if (res.data && res.data.ticket) {
        setTicket(res.data.ticket);
        connectVNC(res.data.ticket);
      } else {
        throw new Error('Ticket not generated properly by backend');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to initialize VNC Console');
      setIsLoading(false);
    }
  };

  const connectVNC = (vncTicket: string) => {
    if (!containerRef.current) return;
    
    // Clean container
    containerRef.current.innerHTML = '';
    
    // Construct WSS URL
    // Asumsikan proxy berada di URL ini (misal wss://cloud-core.pbjt.web.id/console...)
    // Tapi karena kita mengakses vnc-proxy, URL-nya biasanya sama dengan API URL tapi ganti path dan wss
    const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://cloud-core.pbjt.web.id/api');
    
    // Extract host from apiBaseUrl
    const urlObj = new URL(apiBaseUrl);
    
    // Untuk production di PBJT, vnc-proxy di-expose di path wss://cloud-dashboard.pbjt.web.id/vnc atau ada port khusus.
    // Jika vnc-proxy ada di belakang ingress dengan path /console:
    // Tunggu, mari kita ambil token JWT
    const jwtToken = Cookies.get('token');
    
    // Karena VNC proxy adalah service terpisah, mari kita tebak URLnya atau gunakan env fallback
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const proxyHost = import.meta.env.VITE_VNC_PROXY_HOST || urlObj.hostname;
    const proxyPort = import.meta.env.VITE_VNC_PROXY_PORT || (window.location.protocol === 'https:' ? '443' : '3002');
    
    // wss://host:port/console/node/vmid
    let wsUrl = `${wsProtocol}//${proxyHost}`;
    if (proxyPort !== '443' && proxyPort !== '80') {
      wsUrl += `:${proxyPort}`;
    }
    wsUrl += `/console/${node}/${vmid}`;

    try {
      // Configure RFB
      const rfb = new RFB(containerRef.current, wsUrl, {
        wsProtocols: ['jwt', jwtToken || ''],
      });
      
      rfbRef.current = rfb;
      
      rfb.addEventListener('connect', () => {
        setIsLoading(false);
      });
      
      rfb.addEventListener('disconnect', (e: any) => {
        setIsLoading(false);
        if (!e.detail.clean) {
          setError('Koneksi terputus tiba-tiba. VM mungkin sedang reboot atau Proxmox sibuk.');
        }
      });
      
      rfb.scaleViewport = true;
      rfb.resizeSession = false;
      rfb.showDotCursor = true;
      
    } catch (err: any) {
      setError(`Gagal membuat koneksi RFB: ${err.message}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vmid) {
      fetchTicket();
    } else {
      if (rfbRef.current) {
        try { rfbRef.current.disconnect(); } catch (e) {}
        rfbRef.current = null;
      }
      setTicket(null);
      setIsFullscreen(false);
    }
    
    return () => {
      if (rfbRef.current) {
        try { rfbRef.current.disconnect(); } catch (e) {}
        rfbRef.current = null;
      }
    };
  }, [isOpen, vmid, node, type]);

  if (!isOpen) return null;

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
        <div className="flex-1 relative bg-black flex items-center justify-center p-0 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-white">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p>Menghubungkan ke VM Terminal...</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/90">
              <div className="text-center p-6 bg-red-900/20 border border-red-500/30 rounded-xl max-w-md">
                <Terminal className="w-12 h-12 text-red-500 mx-auto mb-3 opacity-50" />
                <h4 className="text-red-400 font-semibold mb-2">Koneksi Gagal</h4>
                <p className="text-slate-300 text-sm">{error}</p>
                <button 
                  onClick={fetchTicket}
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {/* noVNC Container */}
          <div 
            ref={containerRef} 
            className="w-full h-full flex items-center justify-center bg-slate-900 focus:outline-none"
            tabIndex={0}
          />
        </div>
      </div>
    </div>
  );
}

