import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const successMessage = (location.state as { message?: string } | null)?.message;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;
      setAuth(user, token);

      if (user.is_first_login && user.role === 'student') {
        navigate('/change-password');
        return;
      }

      navigate(user.role === 'admin' ? '/admin' : '/student');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/request-password-reset', { rollNumber });
      setForgotMessage(res.data.message);
    } catch (err: any) {
      setForgotMessage(err.response?.data?.message || 'Request failed');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold tracking-tight">CampusCore</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Enter your credentials to access your account
          </p>

          {successMessage && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              Forgot password?
            </button>
          </form>
        </div>

        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background rounded-3xl border border-border p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
              <h2 className="font-bold text-foreground">Reset Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your roll number. Your administrator will reset your password and you'll be notified.
              </p>

              {forgotMessage ? (
                <>
                  <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                    {forgotMessage}
                  </div>
                  <button
                    onClick={() => { setShowForgot(false); setForgotMessage(''); setRollNumber(''); }}
                    className="h-10 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                  >
                    Close
                  </button>
                </>
              ) : (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                  <input
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Your roll number (e.g. 23005060)"
                    required
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      {forgotLoading ? 'Sending...' : 'Request Reset'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(false); setRollNumber(''); }}
                      className="h-10 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right — animated branding panel */}
<div className="hidden md:flex flex-1 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
  
  {/* Animated grid background */}
  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

  {/* Glowing orbs */}
  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse [animation-delay:1s]" />
  <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/8 rounded-full blur-xl animate-pulse [animation-delay:2s]" />

  {/* Floating stat cards */}
  <div className="absolute top-16 right-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 animate-bounce [animation-duration:3s]">
    <p className="text-white/60 text-xs">Requests/sec</p>
    <p className="text-white font-bold text-lg">1,350+</p>
  </div>

  <div className="absolute bottom-24 left-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 animate-bounce [animation-duration:4s] [animation-delay:0.5s]">
    <p className="text-white/60 text-xs">RBAC Latency</p>
    <p className="text-white font-bold text-lg">&lt; 1ms</p>
  </div>

  <div className="absolute top-1/2 right-8 -translate-y-1/2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 animate-bounce [animation-duration:3.5s] [animation-delay:1s]">
    <p className="text-white/60 text-xs">Concurrent Users</p>
    <p className="text-white font-bold text-lg">500+</p>
  </div>

  <div className="absolute top-32 left-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 animate-bounce [animation-duration:5s] [animation-delay:1.5s]">
    <p className="text-white/60 text-xs">Error Rate</p>
    <p className="text-white font-bold text-lg">0.00%</p>
  </div>

  {/* Floating permission bits */}
  <div className="absolute top-20 left-1/2 text-white/20 font-mono text-xs animate-pulse [animation-delay:0.3s]">
    userMask & routeMask
  </div>
  <div className="absolute bottom-40 right-16 text-white/15 font-mono text-xs animate-pulse [animation-delay:1.2s]">
    O(1) bitwise AND
  </div>
  <div className="absolute bottom-16 left-1/3 text-white/15 font-mono text-xs animate-pulse [animation-delay:0.8s]">
    Redis TTL → 15 days
  </div>

  {/* Center content */}
  <div className="relative z-10 text-center text-primary-foreground max-w-xs">
    <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
      <GraduationCap className="w-8 h-8 text-white" />
    </div>
    <h2 className="text-3xl font-bold mb-3 tracking-tight leading-tight">
      Built for scale.<br />Designed for GCOEA.
    </h2>
    <p className="text-white/50 text-sm leading-relaxed">
      High-concurrency student information system with sub-millisecond role-based access control.
    </p>
  </div>
</div>
    </div>
  );
}