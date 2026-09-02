import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, Command, LogOut, ArrowRightToLine, Keyboard, ArrowLeftToLine } from 'lucide-react';
import api from '@/lib/api';
import '@xterm/xterm/css/xterm.css';

interface XtermConsoleProps {
  node: string;
  type: string;
  vmid: string;
}

const VirtualKey = ({ label, icon: Icon, sequence, onSend }: { label: string, icon?: any, sequence: string, onSend: (s: string) => void }) => (
  <button
    onClick={() => onSend(sequence)}
    className="flex items-center justify-center min-w-[44px] h-10 px-2 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white active:bg-slate-600 transition-colors shadow-sm font-medium text-sm"
    title={label}
  >
    {Icon ? <Icon className="w-4 h-4" /> : label}
  </button>
);

export function XtermConsole({ node, type, vmid }: XtermConsoleProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [showKeyboardToolbar, setShowKeyboardToolbar] = useState(true);

  useEffect(() => {
    let active = true;

    const initTerminal = async () => {
      try {
        if (!terminalRef.current) return;

        // 1. Inisialisasi Xterm
        const term = new Terminal({
          cursorBlink: true,
          theme: {
            background: '#0f172a', // slate-900
            foreground: '#e2e8f0', // slate-200
            cursor: '#3b82f6', // blue-500
            selectionBackground: '#334155',
            black: '#0f172a',
            red: '#ef4444',
            green: '#22c55e',
            yellow: '#eab308',
            blue: '#3b82f6',
            magenta: '#d946ef',
            cyan: '#06b6d4',
            white: '#f8fafc',
            brightBlack: '#475569',
            brightRed: '#f87171',
            brightGreen: '#4ade80',
            brightYellow: '#facc15',
            brightBlue: '#60a5fa',
            brightMagenta: '#e879f9',
            brightCyan: '#22d3ee',
            brightWhite: '#ffffff',
          },
          fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Consolas, monospace',
          fontSize: window.innerWidth < 768 ? 13 : 15,
          lineHeight: 1.2,
          scrollback: 5000,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // 2. Minta VNC Token khusus untuk WebSocket
        let wsToken = '';
        try {
          const tokenRes = await api.get('/auth/vnc-token');
          wsToken = tokenRes.data.token;
        } catch (e: any) {
          console.error("VNC token error:", e);
          setError("Sesi kadaluarsa atau kredensial tidak valid. Silakan login kembali.");
          setConnecting(false);
          if (active) return;
        }

        // 3. Minta Tiket Termproxy dari Backend Golang
        const res = await api.post(`/proxmox/nodes/${node}/${type}/${vmid}/termproxy`);
        if (!active) return;
        
        const { port, ticket, user } = res.data;

        // 4. Bangun koneksi WebSocket ke Rust vnc-proxy
        const wsBaseUrl = import.meta.env.VITE_VNC_URL || (import.meta.env.DEV ? 'ws://localhost:3002' : 'wss://cloud-proxy.pbjt.web.id');
        
        const wsUrl = `${wsBaseUrl}/console/${node}/${vmid}?port=${port}&vncticket=${encodeURIComponent(ticket)}`;
        
        const ws = new WebSocket(wsUrl, ['jwt', wsToken]);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setConnecting(false);
          term.focus();
          // Proxmox termproxy mewajibkan pesan pertama adalah string otentikasi
          if (user && ticket) {
            ws.send(`${user}:${ticket}\n`);
          }
        };

        ws.onmessage = (event) => {
          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              term.write(new Uint8Array(reader.result as ArrayBuffer));
            };
            reader.readAsArrayBuffer(event.data);
          } else {
            term.write(event.data);
          }
        };

        ws.onclose = () => {
          if (!active) return;
          term.write('\r\n\x1b[31;1m[Session Disconnected]\x1b[0m\r\n');
          setConnecting(false);
        };

        ws.onerror = (e) => {
          if (!active) return;
          console.error("WebSocket Error:", e);
          setError("Gagal terhubung ke WebSocket Proxy.");
        };

        // 4. Salurkan input pengguna ke WebSocket
        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });

        // 5. Tangani Perubahan Ukuran Layar (Responsive Resize)
        const handleResize = () => {
          if (fitAddonRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
            fitAddonRef.current.fit();
            const { cols, rows } = fitAddonRef.current.proposeDimensions() || { cols: 80, rows: 24 };
            // Beri tahu Proxmox tentang ukuran layar baru (format ukuran: '1:cols:rows:')
            wsRef.current.send(`1:${cols}:${rows}:`);
          }
        };

        window.addEventListener('resize', handleResize);
        
        // Panggil resize awal setelah jeda sedikit untuk memastikan DOM siap
        setTimeout(handleResize, 100);

      } catch (err: any) {
        if (!active) return;
        console.error(err);
        setError(err.response?.data?.error || "Gagal menginisialisasi terminal. Pastikan VM ini dikonfigurasi menggunakan port Serial Terminal (ttyS0).");
        setConnecting(false);
      }
    };

    initTerminal();

    return () => {
      active = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [node, type, vmid]);

  // Fungsi utilitas Mobile Keyboard Hacks
  const sendKey = (sequence: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(sequence);
      xtermRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0f172a] relative">
      {/* Overlay Status */}
      {connecting && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <Command className="w-10 h-10 text-emerald-500 animate-pulse mb-4" />
          <p className="text-slate-300 font-mono text-sm">Menghubungkan ke Terminal...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center">
          <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl max-w-md">
            <LogOut className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-rose-400 mb-2">Koneksi Gagal</h3>
            <p className="text-slate-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Kontainer Xterm */}
      <div 
        className="flex-1 w-full overflow-hidden" 
        ref={terminalRef} 
        style={{ padding: '8px' }} // Sedikit jarak agar tidak mentok ke sisi
      />

      {/* Mobile Hacks: Extra Keyboard Toolbar */}
      <div className="md:hidden flex flex-col border-t border-slate-800 bg-[#0f172a]">
        {/* Toggle Button */}
        <button 
          onClick={() => setShowKeyboardToolbar(!showKeyboardToolbar)}
          className="flex items-center justify-center w-full py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Keyboard className="w-3 h-3 mr-1" />
          {showKeyboardToolbar ? "Sembunyikan Toolbar" : "Tampilkan Toolbar Ekstra"}
        </button>
        
        {/* Toolbar Baris 1: Modifier & Panah */}
        {showKeyboardToolbar && (
          <div className="p-2 pt-0 flex flex-col gap-2">
            <div className="flex justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
              <VirtualKey label="Esc" sequence="\x1b" onSend={sendKey} />
              <VirtualKey label="Tab" sequence="\x09" icon={ArrowRightToLine} onSend={sendKey} />
              <VirtualKey label="Ctrl+C" sequence="\x03" onSend={sendKey} />
              <VirtualKey label="Ctrl+D" sequence="\x04" onSend={sendKey} />
              <VirtualKey label="Enter" sequence="\x0d" icon={CornerDownLeft} onSend={sendKey} />
            </div>
            
            <div className="flex justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
              <VirtualKey label="Up" icon={ChevronUp} sequence="\x1b[A" onSend={sendKey} />
              <VirtualKey label="Down" icon={ChevronDown} sequence="\x1b[B" onSend={sendKey} />
              <VirtualKey label="Left" icon={ChevronLeft} sequence="\x1b[D" onSend={sendKey} />
              <VirtualKey label="Right" icon={ChevronRight} sequence="\x1b[C" onSend={sendKey} />
              <VirtualKey label="|" sequence="|" onSend={sendKey} />
              <VirtualKey label="/" sequence="/" onSend={sendKey} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
