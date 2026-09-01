'use client';

import { useState, useEffect } from 'react';
import logoUrl from '@/assets/logo.svg?url';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Server, Lock, User, Eye, EyeOff } from 'lucide-react';

export function Login() {
  useEffect(() => {
    document.title = "Secure Login | Cloud Baja Tegal";
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Enterprise Hardening: Token is now securely stored in HttpOnly Cookie by the backend.
      // We no longer manually read or store it via JavaScript.

      if (response.data) {
        // Cek role untuk menentukan arah redirect secara langsung dari payload Login (Single-Trip)
        if (response.data.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error;
      setError(typeof errorMessage === 'string' ? errorMessage : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <GlassCard className="w-full max-w-md p-6 sm:p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4 shadow-xl shadow-blue-500/20 rounded-2xl overflow-hidden bg-transparent transform hover:scale-105 transition-transform duration-200">
            <img src={logoUrl} alt="Cloud Baja Tegal Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Cloud Baja Tegal (CBT)</h1>
          <p className="text-slate-500 text-sm mt-1">Infrastructure Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 glass-input text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
