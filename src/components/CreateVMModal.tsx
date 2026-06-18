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
        node,
        name,
        cores,
        memory,
        storage,
        ciuser,
        cipassword,
        ipconfig0
      };

      await api.post('/proxmox/vms', payload);
      toast.success('VM Provisioning started! This might take a few seconds.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create VM');
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
          Purchase New VM
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">VM Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. production-web" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CPU Cores: <span className="text-indigo-600 font-bold">{cores}</span>
                  </label>
                  <input type="range" min="1" max="8" step="1" value={cores} onChange={e => setCores(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Memory: <span className="text-indigo-600 font-bold">{memory} MB</span>
                  </label>
                  <input type="range" min="1024" max="16384" step="1024" value={memory} onChange={e => setMemory(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Storage (NVMe SSD): <span className="text-indigo-600 font-bold">{storage} GB</span>
                  </label>
                  <input type="range" min="10" max="250" step="10" value={storage} onChange={e => setStorage(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                  <p className="text-xs text-slate-400 mt-1">Base image size is 3GB. Remaining will be expanded automatically.</p>
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
                {isLoading ? 'Processing...' : step === 1 ? 'Next: Cloud-Init' : 'Purchase VM'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
