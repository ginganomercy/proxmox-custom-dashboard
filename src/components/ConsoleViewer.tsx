'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import RFB from '@novnc/novnc';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import {
  Keyboard,
  Clipboard,
  Camera,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  MousePointer,
  Monitor,
  AlertCircle,
} from 'lucide-react';

interface ConsoleViewerProps {
  node: string;
  type: string; // 'qemu' | 'lxc'
  vmid: number | string;
  vmName?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Full-featured noVNC console viewer matching Proxmox's native console UX.
 *
 * Key design decisions:
 * - The canvas wrapper uses `position: absolute; inset: 0` so noVNC's injected
 *   <canvas> fills 100% of the parent without any centering interference.
 * - scaleViewport is set BEFORE the RFB object connects so noVNC picks up the
 *   initial container dimensions correctly.
 * - ResizeObserver fires on every container size change and calls
 *   rfb._updateScale() indirectly via a synthetic window resize event.
 */
export function ConsoleViewer({ node, type, vmid, vmName }: ConsoleViewerProps) {
  // containerRef: the absolute-positioned div that noVNC mounts its canvas into
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const mobileInputRef = useRef<HTMLTextAreaElement>(null);

  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [clipboardText, setClipboardText] = useState('');
  const [showClipboard, setShowClipboard] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const [isScaled, setIsScaled] = useState(true);
  const [viewOnly, setViewOnly] = useState(false);
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);

  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  // ─────────────────────────────────────────────────────────────────────────
  // Connection bootstrap
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const token = Cookies.get('token');
    if (!token) {
      setStatus('disconnected');
      setErrorMsg('No authentication token found. Please log in.');
      return;
    }

    let isMounted = true;

    const connectVnc = async () => {
      try {
        setStatus('connecting');
        const { default: api } = await import('@/lib/api');
        const res = await api.post(`/proxmox/nodes/${node}/${type}/${vmid}/vncproxy`);
        const { port, ticket, password } = res.data;

        if (!isMounted || !containerRef.current) return;

        const wsBaseUrl = import.meta.env.VITE_VNC_URL || (import.meta.env.DEV ? 'ws://localhost:3002' : 'wss://cloud-proxy.pbjt.web.id');
        const encodedTicket = encodeURIComponent(ticket);
        const wsUrl = `${wsBaseUrl}/console/${node}/${vmid}?port=${port}&vncticket=${encodedTicket}`;

        const rfb = new RFB(containerRef.current, wsUrl, {
          credentials: { password: password || ticket },
          wsProtocols: ['jwt', token],
        });

        // Set scaling BEFORE the connection completes so the initial render fills space
        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.viewOnly = false;
        rfb.focusOnClick = false; // Disable native mobile keyboard trap to prevent double typing
        rfbRef.current = rfb;

        rfb.addEventListener('connect', () => {
          if (isMounted) {
            setStatus('connected');
            setErrorMsg('');
            // Force a size recalculation after the canvas appears
            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
          }
        });

        rfb.addEventListener('disconnect', (e: any) => {
          if (isMounted) {
            setStatus('disconnected');
            if (e.detail?.clean === false) {
              setErrorMsg('Connection lost unexpectedly. The VM may have shut down.');
            }
          }
        });

        rfb.addEventListener('credentialsrequired', () => {
          rfb.sendCredentials({ password: password || ticket });
        });

        rfb.addEventListener('clipboard', (e: any) => {
          if (e.detail?.text) {
            setClipboardText(e.detail.text);
          }
        });

      } catch (err: any) {
        console.error('Failed to initialize noVNC:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Could not connect to console.');
        }
      }
    };

    connectVnc();

    // ── ResizeObserver: fires whenever the canvas wrapper changes size ────────
    // This is the correct fix: no flexbox centering + ResizeObserver = canvas
    // always matches the container dimensions.
    const resizeObserver = new ResizeObserver(() => {
      if (rfbRef.current) {
        // Dispatching a synthetic resize event causes noVNC's internal
        // _updateScale() / _resize() to recalculate canvas dimensions.
        window.dispatchEvent(new Event('resize'));
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (rfbRef.current) {
        try { rfbRef.current.disconnect(); } catch (_) { /* ignore */ }
        rfbRef.current = null;
      }
    };
  }, [node, type, vmid, reconnectTrigger]);

  // ─────────────────────────────────────────────────────────────────────────
  // Toolbar actions
  // ─────────────────────────────────────────────────────────────────────────

  const sendKeySym = useCallback((keysym: number) => {
    if (!rfbRef.current) return;
    
    if (ctrlActive) rfbRef.current.sendKey(0xFFE3, true); // Ctrl Left
    if (altActive) rfbRef.current.sendKey(0xFFE9, true);  // Alt Left
    
    rfbRef.current.sendKey(keysym, true);
    rfbRef.current.sendKey(keysym, false);
    
    if (ctrlActive) {
      rfbRef.current.sendKey(0xFFE3, false);
      setCtrlActive(false);
    }
    if (altActive) {
      rfbRef.current.sendKey(0xFFE9, false);
      setAltActive(false);
    }
  }, [ctrlActive, altActive]);

  /** Send Ctrl+Alt+Delete to the remote VM */
  const sendCtrlAltDel = useCallback(() => {
    if (!rfbRef.current) return;
    rfbRef.current.sendCtrlAltDel();
  }, []);

  /** Scroll terminal up or down by sending Shift+PageUp/PageDown */
  const scrollTerminal = useCallback(async (direction: 'up' | 'down') => {
    if (!rfbRef.current) return;
    const SHIFT = 0xFFE1;
    const PAGE_KEY = direction === 'up' ? 0xFF55 : 0xFF56; // 0xFF55 is PageUp, 0xFF56 is PageDown

    rfbRef.current.sendKey(SHIFT, true);
    await new Promise(r => setTimeout(r, 10)); // Ensure Shift registers first
    rfbRef.current.sendKey(PAGE_KEY, true);
    rfbRef.current.sendKey(PAGE_KEY, false);
    await new Promise(r => setTimeout(r, 10));
    rfbRef.current.sendKey(SHIFT, false);
  }, []);

  /** Universal Type/Paste mechanism bypassing buggy clipboard protocols */
  const pasteClipboard = useCallback(async () => {
    if (!rfbRef.current || !clipboardText) return;

    setIsTypeModalOpen(false); // Close modal if open

    for (let i = 0; i < clipboardText.length; i++) {
      const charCode = clipboardText.charCodeAt(i);
      
      // Proxmox noVNC native keystroke injection
      rfbRef.current.sendKey(charCode, true);
      rfbRef.current.sendKey(charCode, false);
      
      // 5ms delay between keystrokes to ensure VM processes them
      await new Promise(r => setTimeout(r, 5));
    }
  }, [clipboardText]);

  /** Hidden interceptor for Termux-style native mobile typing */
  const handleMobileInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!rfbRef.current) return;
    const val = e.target.value;
    
    if (val.length > mobileInput.length) {
      // Character added (typing)
      const newChar = val.slice(-1);
      const code = newChar.charCodeAt(0);
      rfbRef.current.sendKey(code, true);
      rfbRef.current.sendKey(code, false);
    } else if (val.length < mobileInput.length) {
      // Character removed (backspace)
      rfbRef.current.sendKey(0xFF08, true); // Backspace Keysym
      rfbRef.current.sendKey(0xFF08, false);
    }
    
    // Always clear the input to prevent composition buffer overflow
    // and to keep it completely stateless (just an event generator)
    setMobileInput('');
  };

  /** Read local clipboard and stage it for pasting */
  const readLocalClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      setShowClipboard(true);
    } catch (_) {
      setClipboardText('');
      setShowClipboard(true); // open manual input if permission denied
    }
  }, []);

  /** Take a screenshot of the current canvas frame */
  const takeScreenshot = useCallback(() => {
    if (!rfbRef.current) return;
    try {
      const canvas = containerRef.current?.querySelector('canvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `console-${vmName || vmid}-${Date.now()}.png`;
      link.href = (canvas as HTMLCanvasElement).toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Screenshot failed:', e);
    }
  }, [vmName, vmid]);

  /** Toggle between scaled (fit-to-window) and 1:1 native resolution */
  const toggleScale = useCallback(() => {
    if (!rfbRef.current) return;
    const next = !isScaled;
    rfbRef.current.scaleViewport = next;
    setIsScaled(next);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }, [isScaled]);

  /** Toggle view-only mode (keyboard/mouse input disabled) */
  const toggleViewOnly = useCallback(() => {
    if (!rfbRef.current) return;
    const next = !viewOnly;
    rfbRef.current.viewOnly = next;
    setViewOnly(next);
  }, [viewOnly]);

  /** Reconnect the session */
  const reconnect = useCallback(() => {
    if (rfbRef.current) {
      try { rfbRef.current.disconnect(); } catch (_) { /* ignore */ }
      rfbRef.current = null;
    }
    setStatus('connecting');
    setErrorMsg('');
    setReconnectTrigger(prev => prev + 1);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const statusColor =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'connecting'
      ? 'bg-yellow-500 animate-pulse'
      : status === 'error'
      ? 'bg-red-500'
      : 'bg-slate-500';

  const statusLabel =
    status === 'connecting'
      ? 'Connecting...'
      : status === 'connected'
      ? 'Connected'
      : status === 'error'
      ? 'Error'
      : 'Disconnected';

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 overflow-hidden" style={{ minHeight: 0 }}>

      {/* ── Proxmox-style toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-1 px-2 sm:px-3 py-2 bg-[#1e2535] border-b border-slate-700 flex-shrink-0 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Connection status indicator */}
        <div className="flex items-center gap-2 mr-2 sm:mr-3 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">{statusLabel}</span>
        </div>

        <div className="hidden sm:block w-px h-5 bg-slate-600 mr-1 flex-shrink-0" />

        {/* Ctrl+Alt+Delete */}
        <button
          onClick={sendCtrlAltDel}
          disabled={status !== 'connected'}
          title="Send Ctrl+Alt+Delete"
          className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Keyboard className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Ctrl+Alt+Del</span>
        </button>

        {/* Clipboard */}
        <div className="relative flex-shrink-0">
          <button
            onClick={readLocalClipboard}
            disabled={status !== 'connected'}
            title="Type or Paste Text"
            className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Clipboard className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Type/Paste</span>
          </button>
          
          {showClipboard && (
            <>
              {/* Mobile overlay */}
              <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setShowClipboard(false)} />
              {/* Dropdown / Modal */}
              <div className="fixed sm:absolute z-50 w-[90vw] sm:w-72 left-1/2 sm:left-0 top-1/2 sm:top-full -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 sm:mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4 sm:p-3">
                <p className="text-sm sm:text-xs text-slate-400 font-semibold mb-2">Ketik perintah atau Paste teks di sini:</p>
                <textarea
                  className="w-full h-32 sm:h-24 bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm sm:text-xs text-slate-200 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={clipboardText}
                  onChange={(e) => setClipboardText(e.target.value)}
                  placeholder="Contoh: apt update && apt upgrade"
                  autoFocus
                />
                <div className="flex gap-2 mt-3 sm:mt-2">
                  <button
                    onClick={pasteClipboard}
                    disabled={!clipboardText}
                    className="flex-1 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm sm:text-xs font-bold rounded-lg transition-colors"
                  >
                    Send to Console
                  </button>
                  <button
                    onClick={() => setShowClipboard(false)}
                    className="py-2 sm:py-1.5 px-4 sm:px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm sm:text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="hidden sm:block w-px h-5 bg-slate-600 mx-1 flex-shrink-0" />

        {/* Screenshot */}
        <button
          onClick={takeScreenshot}
          disabled={status !== 'connected'}
          title="Take screenshot"
          className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Camera className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Screenshot</span>
        </button>

        <div className="hidden sm:block w-px h-5 bg-slate-600 mx-1 flex-shrink-0" />

        {/* Zoom / Scale controls */}
        <button
          onClick={toggleScale}
          disabled={status !== 'connected'}
          title={isScaled ? 'Switch to 1:1 native resolution' : 'Fit console to window'}
          className={`flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ${
            isScaled
              ? 'text-blue-400 bg-blue-500/15 hover:bg-blue-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          {isScaled ? <Maximize className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Monitor className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
          <span className="hidden sm:inline">{isScaled ? 'Scaled' : '1:1'}</span>
        </button>

        <div className="hidden sm:block w-px h-5 bg-slate-600 mx-1 flex-shrink-0" />

        {/* View-only mode toggle */}
        <button
          onClick={toggleViewOnly}
          disabled={status !== 'connected'}
          title={viewOnly ? 'Exit view-only mode (enable input)' : 'Enter view-only mode (disable input)'}
          className={`flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ${
            viewOnly
              ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <MousePointer className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">{viewOnly ? 'View Only' : 'Interactive'}</span>
        </button>

        {/* Reconnect */}
        {(status === 'disconnected' || status === 'error') && (
          <>
            <div className="hidden sm:block w-px h-5 bg-slate-600 mx-1 flex-shrink-0" />
            <button
              onClick={reconnect}
              title="Reconnect to console"
              className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold text-green-400 bg-green-500/15 hover:bg-green-500/25 transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Reconnect</span>
            </button>
          </>
        )}
      </div>

      {/* ── Termux-style Extra Keys (Mobile Only) ─────────────────────────── */}
      <div className="flex sm:hidden items-center gap-1.5 px-2 py-1.5 bg-[#151a25] border-b border-slate-800 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => {
            setClipboardText('');
            setShowClipboard(true);
          }}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-400 rounded text-xs font-bold text-white transition-colors flex-shrink-0 flex items-center gap-1 shadow-sm"
        >
          ⌨️ TYPE
        </button>
        <div className="w-px h-4 bg-slate-700 flex-shrink-0 mx-0.5"></div>
        <button
          onClick={() => sendKeySym(0xFF1B)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-xs font-mono text-slate-300 transition-colors flex-shrink-0"
        >
          ESC
        </button>
        <button
          onClick={() => scrollTerminal('up')}
          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded text-[10px] font-bold text-slate-200 transition-colors flex-shrink-0"
        >
          ↑ SCROLL
        </button>
        <button
          onClick={() => scrollTerminal('down')}
          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded text-[10px] font-bold text-slate-200 transition-colors flex-shrink-0"
        >
          ↓ SCROLL
        </button>
        <button
          onClick={() => sendKeySym(0xFF09)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-xs font-mono text-slate-300 transition-colors flex-shrink-0"
        >
          TAB
        </button>
        <button
          onClick={() => setCtrlActive(!ctrlActive)}
          className={cn("px-2.5 py-1 rounded text-xs font-mono transition-colors flex-shrink-0", ctrlActive ? "bg-blue-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300")}
        >
          CTRL
        </button>
        <button
          onClick={() => setAltActive(!altActive)}
          className={cn("px-2.5 py-1 rounded text-xs font-mono transition-colors flex-shrink-0", altActive ? "bg-blue-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300")}
        >
          ALT
        </button>
        <button
          onClick={() => sendKeySym(0xFF52)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-xs font-mono text-slate-300 transition-colors flex-shrink-0"
        >
          ↑
        </button>
        <button
          onClick={() => sendKeySym(0xFF54)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-xs font-mono text-slate-300 transition-colors flex-shrink-0"
        >
          ↓
        </button>
        <button
          onClick={() => sendKeySym(0xFF51)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-xs font-mono text-slate-300 transition-colors flex-shrink-0"
        >
          ←
        </button>
        <button
          onClick={() => sendKeySym(0xFF53)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-xs font-mono text-slate-300 transition-colors flex-shrink-0"
        >
          →
        </button>
        <button
          onClick={() => sendKeySym(0xFF0D)}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded text-xs font-mono text-slate-300 font-bold transition-colors flex-shrink-0"
        >
          ENTER
        </button>
      </div>

      {/* ── Canvas area ──────────────────────────────────────────────────────
          CRITICAL: The parent div uses position:relative + overflow:hidden.
          noVNC injects a <canvas> and a <div> wrapper. We must NOT use
          flex centering here — that would constrain the canvas to its
          natural resolution instead of letting it scale to fill the space.
      ───────────────────────────────────────────────────────────────────── */}
      <div
        className="relative flex-1 bg-black overflow-hidden"
        style={{ minHeight: 0 }}
        onClick={() => {
          // Hanya fokus jika di layar mobile (lebar kecil)
          if (window.innerWidth < 640) {
            mobileInputRef.current?.focus();
          }
        }}
      >
        {/* Hidden Interceptor for Termux-style Mobile Typing (Bypasses noVNC double-typing bugs) */}
        <textarea
          ref={mobileInputRef}
          value={mobileInput}
          onChange={handleMobileInput}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="absolute top-0 left-0 w-1 h-1 opacity-0 z-0 pointer-events-none"
        />
        {/* noVNC mounts its canvas into this div. It must be positioned to fill and center perfectly in 4:3 frame. */}
        <div
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center bg-black"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Connection overlay states */}
        {status === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/80 z-10 pointer-events-none gap-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold">Establishing secure console connection...</div>
            <div className="text-xs text-slate-500">Proxmox VNC proxy handshake in progress</div>
          </div>
        )}

        {(status === 'disconnected' || status === 'error') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
              <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${status === 'error' ? 'text-red-500' : 'text-slate-500'}`} />
              <h3 className="text-white font-bold mb-2">
                {status === 'error' ? 'Connection Failed' : 'Console Disconnected'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {errorMsg || 'The console session has ended. The VM may have restarted or shut down.'}
              </p>
              <button
                onClick={reconnect}
                className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
