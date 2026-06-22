'use client';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Server, Lock, User } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.token) {
        // Store JWT securely in cookies
        Cookies.set('token', response.data.token, { expires: 1, secure: true, sameSite: 'strict' });
        
        // Cek role untuk menentukan arah redirect (Intelligent Routing)
        try {
          const userRes = await api.get('/auth/me');
          if (userRes.data && userRes.data.role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (meErr) {
          // Fallback jika /auth/me gagal
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error;
      setError(typeof errorMessage === 'string' ? errorMessage : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <GlassCard className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-50 p-4 rounded-full mb-4 shadow-sm shadow-blue-200/50">
            <Server className="w-8 h-8 text-blue-600" />
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
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                required
              />
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

        <div className="mt-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
          <span className="text-xs text-center text-slate-500 uppercase font-semibold">Or continue with</span>
          <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
        </div>

        <button
          onClick={() => {
            const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://cloud-core.pbjt.web.id/api');
            window.location.href = `${baseUrl}/auth/google`;
          }}
          className="w-full mt-4 flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-slate-500">
            <Link to="/forgot-password" className="text-blue-600 font-semibold hover:underline">
              Forgot your password?
            </Link>
          </p>
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Sign Up here
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
