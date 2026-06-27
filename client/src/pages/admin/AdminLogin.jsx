import { useState, useEffect } from 'react';
import { useNavigate }   from 'react-router-dom';
import { Eye, EyeOff }   from 'lucide-react';
import adminService      from '../../services/adminService';
import toast             from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true); // check if already logged in
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');

  // ── If already logged in → go to dashboard ──
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminData  = localStorage.getItem('admin');

    if (adminToken && adminData) {
      // Verify token is valid
      adminService.getMe()
        .then(() => {
          navigate('/admin/dashboard', { replace: true });
        })
        .catch(() => {
          // Token invalid — clear and show login
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) { setError('Email is required');    return; }
    if (!form.password)     { setError('Password is required'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await adminService.login({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      const adminName = res.data?.admin?.name || 'Admin';
      toast.success(`Welcome back, ${adminName}! 🍕`);

      // Navigate after small delay to ensure localStorage is set
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 200);

    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking existing session
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🍕</div>
          <p className="text-gray-400 text-sm animate-pulse">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/10 border-2 border-orange-500/20 rounded-3xl mb-5">
            <span className="text-4xl">🍕</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">
            Admin Panel
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Sign in to manage your pizza store
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@pizzaapp.com"
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                '🔑 Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600/50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-3">
              Demo Credentials
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setForm({
                  email:    'admin@pizzaapp.com',
                  password: 'Admin@1234',
                })}
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span>📧</span>
                  <span className="font-mono">admin@pizzaapp.com</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                  <span>🔑</span>
                  <span className="font-mono">Admin@1234</span>
                </div>
                <p className="text-xs text-orange-400 mt-1.5 font-medium">
                  Click to autofill ↑
                </p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Pizza App Admin Panel • Authorized access only
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;