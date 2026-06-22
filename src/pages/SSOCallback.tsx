import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export function SSOCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Wajib disimpan di Cookies agar terbaca oleh api.ts dan rute terproteksi
      Cookies.set('token', token, { expires: 1, secure: true, sameSite: 'strict' });
      toast.success('Successfully logged in with Google!');
      
      // Intelligent Routing berdasarkan Role
      const routeUser = async () => {
        try {
          // Dynamic import of api to avoid circular dependencies if any, though regular import is fine
          const apiModule = await import('@/lib/api');
          const userRes = await apiModule.default.get('/auth/me');
          if (userRes.data && userRes.data.role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (err) {
          navigate('/dashboard');
        }
      };

      // Eksekusi routing
      setTimeout(routeUser, 500);
    } else {
      toast.error('SSO Login failed: No token received.');
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Authenticating...</h2>
        <p className="text-slate-500 mt-2">Please wait while we log you in securely.</p>
      </div>
    </div>
  );
}
