'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  History, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Cpu, 
  HardDrive, 
  Activity, 
  ArrowLeftRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface VM {
  vmid: number;
  name: string;
  status: string;
  type?: string;
}

interface Snapshot {
  name: string;
  description?: string;
  snaptime: number;
  parent?: string;
}

interface NetworkInfo {
  ipAddress: string;
  interfaces: Array<{ name: string; ip?: string; mac?: string; ipAddresses?: string[] }>;
  bandwidth: {
    tx_bytes: number;
    rx_bytes: number;
    tx_speed: number;
    rx_speed: number;
  };
}

interface InstanceManageModalProps {
  vm: VM;
  nodeName: string;
  onClose: () => void;
}

export default function InstanceManageModal({ vm, nodeName, onClose }: InstanceManageModalProps) {
  const [activeTab, setActiveTab] = useState<'network' | 'snapshots' | 'rebuild' | 'danger'>('network');
  const [destroyConfirmName, setDestroyConfirmName] = useState('');
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Snapshot form state
  const [newSnapName, setNewSnapName] = useState('');
  const [newSnapDesc, setNewSnapDesc] = useState('');

  const type = vm.type || 'qemu';

  // Fetch functions
  const fetchNetworkInfo = async () => {
    try {
      const res = await api.get(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/network`);
      setNetwork(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch network information');
    }
  };

  const fetchSnapshots = async () => {
    try {
      const res = await api.get(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/snapshots`);
      setSnapshots(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch snapshots');
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    if (activeTab === 'network') {
      await fetchNetworkInfo();
    } else if (activeTab === 'snapshots') {
      await fetchSnapshots();
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(true), 15000); // stable 15s auto-refresh
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapName.trim()) return;

    setActionLoading(true);
    setError('');
    try {
      await api.post(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/snapshots`, {
        snapname: newSnapName,
        description: newSnapDesc
      });
      setNewSnapName('');
      setNewSnapDesc('');
      alert('Snapshot creation request sent successfully!');
      fetchSnapshots();
    } catch (err) {
      console.error(err);
      setError('Failed to create snapshot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollbackSnapshot = async (snapname: string) => {
    if (!confirm(`Are you sure you want to rollback ${vm.name} to state: "${snapname}"? Current changes will be overwritten.`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await api.post(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/snapshots/${snapname}/rollback`);
      alert(`Rollback to ${snapname} initiated successfully!`);
    } catch (err) {
      console.error(err);
      setError(`Failed to rollback to snapshot: ${snapname}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSnapshot = async (snapname: string) => {
    if (!confirm(`Are you sure you want to permanently delete snapshot "${snapname}"?`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await api.delete(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/snapshots/${snapname}`);
      alert(`Snapshot ${snapname} deleted.`);
      fetchSnapshots();
    } catch (err) {
      console.error(err);
      setError(`Failed to delete snapshot: ${snapname}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRebuild = async () => {
    if (!confirm(`WARNING: This will completely reinstall the operating system on ${vm.name}. All custom data on disks will be permanently deleted. Are you absolutely sure?`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await api.post(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}/rebuild`);
      alert('VPS Operating System rebuild initiated successfully. Check back in a few minutes!');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to rebuild VPS.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDestroy = async () => {
    if (destroyConfirmName !== vm.name) return;
    
    setActionLoading(true);
    setError('');
    try {
      await api.delete(`/proxmox/nodes/${nodeName}/${type}/${vm.vmid}`);
      alert('VM has been permanently deleted.');
      onClose();
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to destroy VPS.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (!bytesPerSec) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">VPS Control Panel</span>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
              <Cpu className="w-5 h-5 text-blue-500" />
              Manage: {vm.name}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('network')}
            className={cn(
              "flex items-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-all",
              activeTab === 'network'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Globe className="w-4 h-4" />
            Network & IP
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={cn(
              "flex items-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-all",
              activeTab === 'snapshots'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <History className="w-4 h-4" />
            Snapshots (Backup)
          </button>
          <button
            onClick={() => setActiveTab('rebuild')}
            className={cn(
              "flex items-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-all",
              activeTab === 'rebuild'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <ShieldAlert className="w-4 h-4" />
            Rebuild OS
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={cn(
              "flex items-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-all",
              activeTab === 'danger'
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-500 hover:text-red-600"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-150 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 font-semibold">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              Loading details...
            </div>
          ) : (
            <>
              {/* NETWORK TAB */}
              {activeTab === 'network' && network && (
                <div className="space-y-6">
                  {/* IP Address banner */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">IPv4 IP Address</span>
                      <div className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                        {network.ipAddress}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Use this IP for SSH, Web server hosting, or routing configs.</p>
                    </div>
                    <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-500/20">
                      <Globe className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Network stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-3">
                        <span>DATA RECEIVED (RX)</span>
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800">{formatBytes(network.bandwidth.rx_bytes)}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5 bg-slate-50 w-fit px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Speed: {formatSpeed(network.bandwidth.rx_speed)}
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-3">
                        <span>DATA TRANSMITTED (TX)</span>
                        <ArrowUpRight className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800">{formatBytes(network.bandwidth.tx_bytes)}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5 bg-slate-50 w-fit px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Speed: {formatSpeed(network.bandwidth.tx_speed)}
                      </div>
                    </div>
                  </div>

                  {/* Network Interfaces */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700">Network Interface Cards (NICs)</h3>
                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="py-3 px-4 font-bold text-slate-500">Device</th>
                            <th className="py-3 px-4 font-bold text-slate-500">IP Addresses</th>
                            <th className="py-3 px-4 font-bold text-slate-500">MAC Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {network.interfaces.map((iface) => (
                            <tr key={iface.name} className="border-b border-slate-100/60 last:border-b-0 hover:bg-slate-50/20">
                              <td className="py-3.5 px-4 font-bold text-slate-700 flex items-center gap-1.5">
                                <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                                {iface.name}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600 font-mono text-xs">
                                {iface.ip || (iface.ipAddresses && iface.ipAddresses.join(', ')) || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-semibold font-mono text-xs">
                                {iface.mac || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SNAPSHOTS TAB */}
              {activeTab === 'snapshots' && (
                <div className="space-y-6">
                  {/* Create Snapshot Form */}
                  <form onSubmit={handleCreateSnapshot} className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-blue-600" />
                      Create a new VM Snapshot
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Snapshot Name</label>
                        <input
                          type="text"
                          required
                          value={newSnapName}
                          onChange={(e) => setNewSnapName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                          placeholder="e.g. pre-install-nginx"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Description</label>
                        <input
                          type="text"
                          value={newSnapDesc}
                          onChange={(e) => setNewSnapDesc(e.target.value)}
                          placeholder="e.g. Stable backup before deployment"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium bg-white text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={actionLoading || !newSnapName}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                      >
                        {actionLoading ? 'Creating...' : 'Create Snapshot'}
                      </button>
                    </div>
                  </form>

                  {/* List of snapshots */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700">Restore Points</h3>
                    {snapshots.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-medium text-sm bg-white border border-slate-100 rounded-2xl">
                        No restore points found. Create one above to back up this VPS.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {snapshots.map((snap) => (
                          <div 
                            key={snap.name} 
                            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-100 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 font-mono text-sm">{snap.name}</h4>
                                {snap.parent && (
                                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    parent: {snap.parent}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium">{snap.description || 'No description provided.'}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">
                                Created: {new Date(snap.snaptime * 1000).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-auto">
                              <button
                                onClick={() => handleRollbackSnapshot(snap.name)}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                title="Rollback VPS to this state"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Rollback
                              </button>
                              <button
                                onClick={() => handleDeleteSnapshot(snap.name)}
                                disabled={actionLoading}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all disabled:opacity-50"
                                title="Delete Snapshot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* REBUILD TAB */}
              {activeTab === 'rebuild' && (
                <div className="space-y-6 max-w-xl mx-auto py-4 text-center">
                  <div className="bg-red-50 border border-red-150 p-6 rounded-3xl text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-800">Critical: Reinstall Operating System</h3>
                      <p className="text-sm text-red-600 mt-2 leading-relaxed font-medium">
                        Rebuilding your VPS will erase all local files, configurations, and user databases. The instance will clone a clean template state and restart fresh.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Please confirm that you have backups of your critical production data before proceeding.
                    </p>
                    <button
                      onClick={handleRebuild}
                      disabled={actionLoading}
                      className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all text-base transform active:scale-95 disabled:opacity-50"
                    >
                      {actionLoading ? 'Initiating Rebuild...' : 'I Understand, Rebuild OS Now'}
                    </button>
                  </div>
                </div>
              )}

              {/* DANGER TAB */}
              {activeTab === 'danger' && (
                <div className="space-y-6 max-w-xl mx-auto py-4 text-center">
                  <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-red-800 uppercase tracking-wide">Danger Zone: Destroy VM</h3>
                      <p className="text-sm text-red-700 mt-2 leading-relaxed font-semibold">
                        Tindakan ini bersifat PERMANEN dan TIDAK BISA DIBATALKAN.
                        Seluruh data, file, dan konfigurasi akan dimusnahkan. <br/><br/>
                        <span className="font-black bg-red-200 px-2 py-1 rounded">WARNING: NO REFUNDS.</span><br/>
                        Uang yang telah Anda bayarkan untuk server ini tidak akan dikembalikan jika Anda menghapusnya.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-600 font-medium">
                      Untuk mengonfirmasi penghapusan, ketik ulang nama VM di bawah ini:
                      <br/>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded mt-2 inline-block select-all">{vm.name}</span>
                    </p>
                    <input
                      type="text"
                      value={destroyConfirmName}
                      onChange={(e) => setDestroyConfirmName(e.target.value)}
                      placeholder={vm.name}
                      className="w-full text-center px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 font-mono font-bold text-slate-800 transition-all"
                    />
                    <button
                      onClick={handleDestroy}
                      disabled={actionLoading || destroyConfirmName !== vm.name}
                      className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all text-base transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {actionLoading ? 'Destroying...' : 'DESTROY SERVER NOW'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
