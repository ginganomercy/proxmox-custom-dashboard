import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { LogOut, Ticket, Plus, RefreshCw, Copy, CheckCircle } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<number>(50000);
  const [copiedCode, setCopiedCode] = useState('');

  const checkAuth = () => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const fetchVouchers = async () => {
    if (!checkAuth()) return;
    setIsLoading(true);
    try {
      const res = await api.get('/vouchers');
      if (res.data && res.data.data) {
        setVouchers(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch vouchers. You might not be an admin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  const generateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vouchers', { amount });
      fetchVouchers();
      alert('Voucher generated successfully!');
    } catch (err) {
      alert('Failed to generate voucher');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden bg-slate-50">
      {/* Decorative background blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[40rem] h-[40rem] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 text-white p-2.5 rounded-xl shadow-lg shadow-slate-800/20">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 font-medium">Voucher Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchVouchers}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-slate-700 rounded-xl text-sm font-medium transition-all border border-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Generator */}
          <GlassCard className="flex flex-col justify-start">
            <h2 className="font-semibold text-lg text-slate-700 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Generate Voucher
            </h2>
            <form onSubmit={generateVoucher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button 
                type="submit" 
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Generate New Code
              </button>
            </form>
          </GlassCard>

          {/* List */}
          <GlassCard className="md:col-span-2">
            <h2 className="font-semibold text-lg text-slate-700 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-500" /> Voucher Database
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Used By</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-medium text-slate-700">{v.code}</td>
                      <td className="py-3 text-slate-600">Rp {v.amount.toLocaleString('id-ID')}</td>
                      <td className="py-3">
                        {v.isUsed ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-medium">Used</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Active</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {v.usedBy || '-'}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => copyToClipboard(v.code)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode === v.code ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">No vouchers generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
