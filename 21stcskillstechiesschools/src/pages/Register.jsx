import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, LayoutGrid, Rocket, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addUser } from '../lib/store';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    schoolCode: '',
    password: '',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.schoolCode.trim()) {
      setShowConfirm(true);
    } else {
      completeRegistration('student', formData.schoolCode.trim());
    }
  };

  const completeRegistration = (role, code = null) => {
    setLoading(true);
    
    // Add to global store for persistence and admin visibility
    try {
      addUser({
        name: `${formData.firstName} ${formData.lastName}`.trim() || 'New User',
        email: formData.email,
        password: formData.password, // Store for demo purposes
        role: role,
        schoolId: code || null,
        grade: 6, // Default grade
        status: 'active'
      });
    } catch (e) {
      console.warn('Store not available for registration persistence', e);
    }

    // Persist session
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole',   role);
    localStorage.setItem('userName',   `${formData.firstName} ${formData.lastName}`.trim() || 'New User');
    localStorage.setItem('userEmail',  formData.email);
    if (code) localStorage.setItem('schoolCode', code);

    // Hard navigate to force AuthContext re-hydration
    setTimeout(() => window.location.replace('/student'), 300);
  };

  const inputClass = "w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-6 py-4 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-zinc-700 font-medium";
  const labelClass = "text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative py-12 overflow-hidden">
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-50"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl glass-card rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 border border-white/10"
      >
        {/* ── Left: Branding ── */}
        <div className="lg:w-1/2 bg-primary/10 p-12 md:p-20 flex flex-col justify-center relative overflow-hidden order-2 lg:order-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 pointer-events-none"></div>
          <div className="relative z-10 space-y-10">
            <Link to="/" className="flex items-center gap-3 group/logo">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl transition-transform group-hover/logo:scale-110">
                <LayoutGrid className="text-primary w-full h-full" />
              </div>
              <span className="text-2xl font-black font-headline text-white tracking-tight">21stc Skills</span>
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-black font-headline text-white leading-tight tracking-tighter">
                Start Your <br /><span className="text-primary italic">Innovation</span> <br />Journey Today.
              </h1>
              <p className="text-zinc-400 text-lg max-w-md leading-relaxed font-medium mt-4">
                Join thousands of students in Tamil Nadu building the future with Robotics, AI, and Science.
              </p>
            </div>
            <div className="relative w-full aspect-square max-w-[340px] mx-auto">
              <div className="absolute -inset-10 bg-primary/20 blur-[80px] rounded-full animate-pulse"></div>
              <img src="/register-img-tn.png" alt="Illustration" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="lg:w-1/2 p-12 md:p-20 bg-surface-bright/30 backdrop-blur-xl flex flex-col justify-center border-l border-white/5 order-1 lg:order-2">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div>
              <h2 className="text-4xl font-black font-headline text-white tracking-tight">Create Account</h2>
              <p className="text-zinc-500 mt-2 font-medium">Enter your details to join the network</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>First Name</label>
                  <input type="text" required placeholder="Arun" value={formData.firstName} onChange={set('firstName')} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Last Name</label>
                  <input type="text" required placeholder="Kumar" value={formData.lastName} onChange={set('lastName')} className={inputClass} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Student Email</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input type="email" required placeholder="arun@school.com" value={formData.email} onChange={set('email')} autoComplete="email" className={`${inputClass} pl-14`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Institutional Code <span className="text-zinc-700 normal-case font-medium">(optional)</span></label>
                <div className="relative">
                  <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input type="text" placeholder="HUB-CH-01 or HUB-CBE-02" value={formData.schoolCode} onChange={set('schoolCode')} className={`${inputClass} pl-14`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Set Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input type="password" required placeholder="••••••••" value={formData.password} onChange={set('password')} autoComplete="new-password" className={`${inputClass} pl-14`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-black py-5 rounded-3xl hover:bg-blue-600 transition-all text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (<><span>Complete Registration</span><Rocket className="w-5 h-5" /></>)}
              </button>
            </form>

            <div className="pt-6 border-t border-white/5 text-center space-y-4">
              <p className="text-zinc-500 text-sm font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-secondary font-black hover:underline ml-1">Sign In</Link>
              </p>
              <Link to="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Confirm Individual Modal ── */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="glass-card w-full max-w-md p-12 rounded-[3.5rem] relative z-10 border border-white/10 text-center space-y-8">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <User className="text-secondary w-10 h-10" />
              </div>
              <div>
                <h3 className="text-3xl font-black font-headline text-white leading-tight">Join as Individual?</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed mt-2">
                  No institutional code entered. You'll be registered as an{' '}
                  <span className="text-secondary font-black">Individual Member</span>. You can join your school hub later.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => completeRegistration('student')} className="w-full bg-white text-black font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all">
                  Proceed as Individual
                </button>
                <button onClick={() => setShowConfirm(false)} className="w-full bg-zinc-900 text-zinc-500 font-black py-5 rounded-[2rem] border border-zinc-800 hover:text-white transition-all text-xs uppercase tracking-widest">
                  Go Back & Enter Code
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
