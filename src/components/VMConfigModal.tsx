import React, { useState } from 'react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { toast } from 'sonner';
import { X, Cpu, HardDrive, Network, Key, AlertCircle } from 'lucide-react';

interface VMConfigModalProps {
  node: string;
  vmid: number;
  isOpen: boolean;
  onClose: () => void;
}

export function VMConfigModal({ node, vmid, isOpen, onClose }: VMConfigModalProps) {
  const [memory, setMemory] = useState<number>(2048);
  const [cores, setCores] = useState<number>(2);
  const [ciuser, setCiuser] = useState('');
  const [cipassword, setCipassword] = useState('');
  const [ipconfig0, setIpconfig0] = useState('ip=dhcp');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        memory,
        cores,
      };

      if (ciuser) payload.ciuser = ciuser;
      if (cipassword) payload.cipassword = cipassword;
      if (ipconfig0) payload.ipconfig0 = ipconfig0;

      await api.post(`/proxmox/nodes/${node}/qemu/${vmid}/config`, payload);
      
      toast.success('VM Configuration updated successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update VM configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-white p-8 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <HardDrive className="w-6 h-6 text-blue-500" />
          Configure VM #{vmid}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Hardware Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Hardware Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Memory (MB): <span className="text-blue-600 font-bold">{memory}</span>
                </label>
                <input 
                  type="range" 
                  min="512" 
                  max="32768" 
                  step="512"
                  value={memory}
                  onChange={(e) => setMemory(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CPU Cores: <span className="text-blue-600 font-bold">{cores}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="16" 
                  step="1"
                  value={cores}
                  onChange={(e) => setCores(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* Cloud-Init Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Network className="w-4 h-4" /> Cloud-Init
            </h3>
            
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl mb-4 flex gap-3 text-sm text-blue-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-500" />
              <p>Cloud-Init changes require the VM to have a Cloud-Init drive attached. Changes will apply on the next reboot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
                <input 
                  type="text" 
                  value={ciuser}
                  onChange={(e) => setCiuser(e.target.value)}
                  placeholder="e.g. ubuntu"
                  className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={cipassword}
                  onChange={(e) => setCipassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Network (ipconfig0)</label>
                <input 
                  type="text" 
                  value={ipconfig0}
                  onChange={(e) => setIpconfig0(e.target.value)}
                  placeholder="e.g. ip=dhcp OR ip=10.0.0.5/24,gw=10.0.0.1"
                  className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:opacity-70 flex items-center gap-2"
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
