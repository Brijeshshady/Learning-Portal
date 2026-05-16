import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Rocket, LayoutGrid, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ROLE_ROUTES } from '../lib/mapping';

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const { login, logout }  = useAuth();
  const [searchParams] = useSearchParams();
  const navigate   = useNavigate();

  useEffect(() => {
    if (searchParams.get('logout') === 'true') {
      logout();
    }
  }, [searchParams, logout]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_ROUTES[user.role] || '/dashboard', { replace: true });
    } catch {
      setError('Invalid credentials. Check the demo list below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-50"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl glass-card rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 border border-white/10"
      >
        {/* ── Left: Branding ── */}
        <div className="lg:w-1/2 bg-secondary/10 p-12 md:p-20 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-transparent to-primary/20 pointer-events-none"></div>
          <div className="relative z-10 space-y-10">
            <Link to="/" className="flex items-center gap-3 group/logo">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-3 shrink-0 shadow-xl transition-transform group-hover/logo:scale-110">
                <LayoutGrid className="text-primary w-full h-full" />
              </div>
              <span className="text-2xl font-black font-headline text-white tracking-tight">21stc Skills</span>
            </Link>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black font-headline text-white leading-tight tracking-tighter">
                Transforming <br />
                <span className="text-secondary italic">Potential</span> into <br />
                <span className="text-primary italic">Performance.</span>
              </h1>
              <p className="text-zinc-400 text-lg max-w-md leading-relaxed font-medium">
                Access your personalized dashboard and explore the frontiers of Robotics, AI, and Innovation.
              </p>
            </div>

            <div className="relative w-full aspect-square max-w-[340px] mx-auto">
              <div className="absolute -inset-10 bg-secondary/20 blur-[80px] rounded-full animate-pulse"></div>
              <img src="/login-img-tn.png" alt="Illustration" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="lg:w-1/2 p-12 md:p-20 bg-surface-bright/30 backdrop-blur-xl flex flex-col justify-center border-l border-white/5">
          <div className="max-w-md w-full mx-auto space-y-10">
            <div>
              <h2 className="text-4xl font-black font-headline text-white tracking-tight">Welcome Back</h2>
              <p className="text-zinc-500 mt-2 font-medium">Sign in to your 21stc learning portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arun.s@21stc.school"
                    autoComplete="email"
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 pl-14 pr-6 py-4 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-zinc-700 font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Password</label>
                  <button type="button" onClick={() => setShowReset(true)} className="text-[10px] font-black text-secondary hover:text-purple-400 uppercase tracking-widest transition-all">
                    Reset Password
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 pl-14 pr-6 py-4 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-zinc-700 font-medium"
                  />
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white font-black py-5 rounded-3xl hover:bg-purple-600 transition-all text-xs uppercase tracking-[0.2em] shadow-2xl shadow-secondary/30 flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <Rocket className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="pt-8 border-t border-white/5 space-y-4 text-center">
              <p className="text-zinc-500 text-sm font-medium">
                New student?{' '}
                <Link to="/register" className="text-secondary font-black hover:underline ml-1">
                  Create Account
                </Link>
              </p>
              <Link to="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" />
                Back to Portal Site
              </Link>
            </div>

            {/* Demo Credentials */}
            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Demo Credentials</h3>
              <div className="space-y-2">
                {[
                  { role: 'Super Admin',   email: 'superadmin@21stc.com', pw: 'password123' },
                  { role: 'School Admin',  email: 'hubadmin@21stc.com',   pw: 'password123' },
                  { role: 'Teacher',       email: 'teacher@21stc.com',    pw: 'password123' },
                  { role: 'Student',       email: 'student@21stc.com',    pw: 'password123' },
                ].map(({ role, email: e, pw }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(e); setPassword(pw); }}
                    className="w-full flex justify-between items-center text-[10px] border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 px-2 rounded transition-colors"
                  >
                    <span className="font-black text-zinc-500 uppercase tracking-widest">{role}</span>
                    <span className="text-zinc-300 font-medium">{e}</span>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-zinc-600 text-center font-medium">Click any row to auto-fill credentials</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reset Modal */}
      <AnimatePresence>
        {showReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowReset(false); setResetStep(1); }} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="glass-card w-full max-w-md p-12 rounded-[3.5rem] relative z-10 border border-white/10 text-center space-y-8">
              {resetStep === 1 ? (
                <>
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="text-primary w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black font-headline text-white">Check Your Mail</h3>
                    <p className="text-zinc-500 text-sm font-medium mt-2 leading-relaxed">Enter the 6-digit code sent to your registered email.</p>
                  </div>
                  <input type="text" maxLength={6} placeholder="000000" className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-6 py-5 text-center text-3xl tracking-[0.5em] font-black text-white focus:outline-none focus:border-primary transition-all" />
                  <button onClick={() => setResetStep(2)} className="w-full bg-primary text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Verify Code</button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black font-headline text-white">All Set!</h3>
                    <p className="text-zinc-500 text-sm font-medium mt-2">Your password has been successfully reset.</p>
                  </div>
                  <button onClick={() => { setShowReset(false); setResetStep(1); }} className="w-full bg-white text-black font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest">Back to Login</button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
