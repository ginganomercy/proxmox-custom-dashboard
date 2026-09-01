import { useParams, useNavigate } from 'react-router-dom';
import { XtermConsole } from '@/components/XtermConsole';
import { ChevronLeft, TerminalSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TerminalView() {
  const { node, type, vmid } = useParams();
  const navigate = useNavigate();
  // Menggunakan viewport height aktual mobile agar tidak tertutup keyboard/browser chrome
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const handleResize = () => {
      // dvh (dynamic viewport height) terkadang belum didukung penuh,
      // kita gunakan window.innerHeight sebagai fallback
      setViewportHeight(`${window.innerHeight}px`);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!node || !type || !vmid) {
    return <div className="p-8 text-center text-rose-500">Parameter tidak valid.</div>;
  }

  return (
    <div className="flex flex-col bg-slate-950 w-full overflow-hidden" style={{ height: viewportHeight }}>
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <TerminalSquare className="w-4 h-4 text-emerald-400" />
              CLI Terminal
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              {node} • {type.toUpperCase()} #{vmid}
            </p>
          </div>
        </div>
      </div>

      {/* Terminal Area */}
      <div className="flex-1 w-full overflow-hidden relative">
        <XtermConsole node={node} type={type} vmid={vmid} />
      </div>
    </div>
  );
}
