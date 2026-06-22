import React, { useState } from 'react';
import { X, Cpu, HardDrive, Network, ShoppingCart } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateVMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateVMModal({ isOpen, onClose, onSuccess }: CreateVMModalProps) {
  const [step, setStep] = useState(1);
  const [node, setNode] = useState('azizazindani');
  const [name, setName] = useState('');
  
  // Hardware
  const [cores, setCores] = useState(2);
  const [memory, setMemory] = useState(2048);
  const [storage, setStorage] = useState(10); // GB
  
  // Order Detail
  const [userEmail, setUserEmail] = useState('');
  
  // Cloud-Init
  const [ciuser, setCiuser] = useState('');
  const [cipassword, setCipassword] = useState('');
  const [ipconfig0, setIpconfig0] = useState('ip=dhcp');

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Cost calculation (Mock logic matching backend)
  const cost = (cores * 10000) + (memory * 10) + (storage * 5000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        userEmail,
        node,
        name,
        cores,
        memory,
        storage,
        ciuser,
        cipassword,
        ipconfig0
      };

      const res = await api.post('/orders', payload);
      toast.success('Pesanan berhasil dibuat! Segera hubungi Admin (WA: 0856117933) untuk pembayaran.', { duration: 10000 });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to request VM');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white p-8 animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-indigo-500" />
          Request New VM Order
        </h2>

        {/* Stepper indicator */}
        <div className="flex gap-2 mb-8">
          <div className={cn("h-2 flex-1 rounded-full transition-colors", step >= 1 ? "bg-indigo-500" : "bg-slate-200")} />
          <div className={cn("h-2 flex-1 rounded-full transition-colors", step >= 2 ? "bg-indigo-500" : "bg-slate-200")} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-left-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Hardware Specifications
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Node</label>
                  <select value={node} onChange={e => setNode(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="azizazindani">azizazindani (Proxmox 1)</option>
                    <option value="pve">pve (Mock Node)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Email (For Activation Code)</label>
                  <input type="email" required value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="e.g. raflypriyantoro@gmail.com" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">VM Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. production-web" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-sm font-semibold text-slate-700">CPU Cores</label>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-sm">{cores} Core{cores > 1 ? 's' : ''}</span>
                  </div>
                  <input type="range" min="1" max="8" step="1" value={cores} onChange={e => setCores(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all" />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium"><span>1</span><span>8</span></div>
                </div>
                
                <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-sm font-semibold text-slate-700">Memory (RAM)</label>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-sm">{memory >= 1024 ? memory/1024 + ' GB' : memory + ' MB'}</span>
                  </div>
                  <input type="range" min="1024" max="16384" step="1024" value={memory} onChange={e => setMemory(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all" />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium"><span>1GB</span><span>16GB</span></div>
                </div>

                <div className="col-span-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-sm font-semibold text-slate-700">Storage (NVMe SSD)</label>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-sm">{storage} GB</span>
                  </div>
                  <input type="range" min="10" max="250" step="10" value={storage} onChange={e => setStorage(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all" />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium"><span>10GB</span><span>250GB</span></div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <HardDrive className="w-3.5 h-3.5" /> Base OS template requires 3GB. The rest will be auto-expanded.
                  </p>
                </div>
                
                {/* Total Price Calculator */}
                <div className="col-span-2 mt-4 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-900">Total Harga Estimasi</h3>
                    <p className="text-xs text-indigo-600/80 mt-0.5">Sekali bayar untuk selamanya (Batas 1 VM/Akun)</p>
                  </div>
                  <div className="text-2xl font-black text-indigo-600">
                    Rp {((cores * 10000) + (memory * 10) + (storage * 5000)).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
                <Network className="w-4 h-4" /> Cloud-Init (OS Credentials)
              </h3>
              <p className="text-sm text-slate-600">This configures the default user, password, and networking for the Golden Image template.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input type="text" required value={ciuser} onChange={e => setCiuser(e.target.value)} placeholder="e.g. syslinux" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required value={cipassword} onChange={e => setCipassword(e.target.value)} placeholder="Secure password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Network Config (ipconfig0)</label>
                  <input type="text" required value={ipconfig0} onChange={e => setIpconfig0(e.target.value)} placeholder="ip=172.17.2.X/24,gw=172.17.2.1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
              <span className="text-xs text-indigo-600 font-semibold block uppercase">Total Cost</span>
              <span className="text-xl font-bold text-indigo-900">Rp {cost.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex gap-3">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Back
                </button>
              )}
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 disabled:opacity-70 flex items-center gap-2">
                {isLoading ? 'Processing...' : step === 1 ? 'Next: Cloud-Init' : 'Request Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
