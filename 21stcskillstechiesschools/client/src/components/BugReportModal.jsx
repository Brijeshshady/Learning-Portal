import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, CheckCircle2, Eye, Cpu, Zap, Database, HelpCircle, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import Modal from './Modal';
import DB from '../lib/db';
import { addNotification } from '../lib/store';

const BugReportModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [category, setCategory] = useState('Functionality');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get current view from url query param ?v=
  const getQueryView = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('v') || 'overview';
    }
    return 'overview';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.length < 15 || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const page = getQueryView();
      await DB.submitBug({
        title,
        description,
        severity,
        category,
        page
      });
      setIsSuccess(true);
      addNotification({
        title: 'Bug Report Submitted',
        body: 'Thank you! The developers have been notified.',
        type: 'success'
      });
      setTimeout(() => {
        setIsSuccess(false);
        setTitle('');
        setDescription('');
        setSeverity('medium');
        setCategory('Functionality');
        onClose();
      }, 2500);
    } catch (err) {
      addNotification({
        title: 'Submission Failed',
        body: err.message || 'Unable to submit bug report.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'UI/Visual', label: 'UI / Visual', icon: Eye, activeClass: 'border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_-3px_rgba(168,85,247,0.25)]', inactiveClass: 'border-zinc-800/80 bg-zinc-950/20 text-zinc-500 hover:border-zinc-700/60 hover:text-zinc-300 hover:bg-zinc-950/40' },
    { id: 'Functionality', label: 'Functionality', icon: Cpu, activeClass: 'border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]', inactiveClass: 'border-zinc-800/80 bg-zinc-950/20 text-zinc-500 hover:border-zinc-700/60 hover:text-zinc-300 hover:bg-zinc-950/40' },
    { id: 'Performance', label: 'Performance', icon: Zap, activeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]', inactiveClass: 'border-zinc-800/80 bg-zinc-950/20 text-zinc-500 hover:border-zinc-700/60 hover:text-zinc-300 hover:bg-zinc-950/40' },
    { id: 'Data', label: 'Data', icon: Database, activeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]', inactiveClass: 'border-zinc-800/80 bg-zinc-950/20 text-zinc-500 hover:border-zinc-700/60 hover:text-zinc-300 hover:bg-zinc-950/40' },
    { id: 'Other', label: 'Other', icon: HelpCircle, activeClass: 'border-zinc-500/50 bg-zinc-550/15 text-zinc-300 shadow-[0_0_15px_-3px_rgba(255,255,255,0.08)]', inactiveClass: 'border-zinc-800/80 bg-zinc-950/20 text-zinc-500 hover:border-zinc-700/60 hover:text-zinc-300 hover:bg-zinc-950/40' }
  ];

  const severities = [
    { id: 'low', label: 'Low', desc: 'Cosmetic / UI glitch', border: 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700/65 hover:bg-zinc-950/40', active: 'border-zinc-500/40 bg-zinc-500/5 text-zinc-300 shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)]', indicator: 'bg-zinc-500' },
    { id: 'medium', label: 'Medium', desc: 'Workaround exists', border: 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700/65 hover:bg-zinc-950/40', active: 'border-blue-500/40 bg-blue-500/5 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]', indicator: 'bg-blue-500' },
    { id: 'high', label: 'High', desc: 'Workflow blocked', border: 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700/65 hover:bg-zinc-950/40', active: 'border-amber-500/40 bg-amber-500/5 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]', indicator: 'bg-amber-500' },
    { id: 'critical', label: 'Critical', desc: 'Crash / Data issue', border: 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700/65 hover:bg-zinc-950/40', active: 'border-rose-500/40 bg-rose-500/5 text-rose-400 shadow-[0_0_20px_-3px_rgba(244,63,94,0.25)]', indicator: 'bg-rose-500 animate-pulse' }
  ];

  const getSeverityTheme = () => {
    switch (severity) {
      case 'low': return { focusBorder: 'focus:border-zinc-500/40', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)]', glowColor: 'rgba(255,255,255,0.015)' };
      case 'medium': return { focusBorder: 'focus:border-blue-500/40', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]', glowColor: 'rgba(59,130,246,0.03)' };
      case 'high': return { focusBorder: 'focus:border-amber-500/40', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]', glowColor: 'rgba(245,158,11,0.03)' };
      case 'critical': return { focusBorder: 'focus:border-rose-500/45', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(244,63,94,0.12)]', glowColor: 'rgba(244,63,94,0.05)' };
      default: return { focusBorder: 'focus:border-red-500/40', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]', glowColor: 'rgba(239,68,68,0.03)' };
    }
  };

  const theme = getSeverityTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report a Bug">
      {isSuccess ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute w-48 h-48 rounded-full bg-emerald-500/[0.06] blur-3xl -z-10 animate-pulse" />
          
          <motion.div 
            initial={{ scale: 0.6, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
          
          <h4 className="text-lg font-black font-headline text-white uppercase tracking-tight">Report Logged</h4>
          <p className="text-xs text-zinc-400 max-w-xs mt-3 leading-relaxed">
            Thank you! Our engineering team has been alerted and will inspect this issue shortly.
          </p>
          <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-550 bg-white/[0.02] border border-white/[0.03] px-3.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Auto-Closing Modal...
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {/* Ambient Glow behind form */}
          <div 
            className="absolute inset-0 rounded-[2rem] filter blur-[40px] pointer-events-none -z-10 transition-colors duration-500" 
            style={{ backgroundColor: theme.glowColor }}
          />

          {/* Telemetry Context Alert */}
          <div className="flex items-center gap-3.5 p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.015] to-transparent pointer-events-none" />
            <div className="w-9 h-9 rounded-xl bg-red-950/30 border border-red-500/20 flex items-center justify-center shrink-0">
              <Bug className="w-4 h-4 text-red-400/90 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                We have captured your active workspace view parameter:
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-600 bg-white/[0.02] border border-white/[0.03] px-2 py-0.5 rounded">Scope</span>
                <code className="text-[10px] font-black font-mono text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-500/10">
                  {getQueryView()}
                </code>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 block">Bug Summary</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 hover:border-zinc-700/60 focus:bg-zinc-950/70 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-all ${theme.focusBorder} ${theme.focusShadow}`}
              placeholder="Brief summary of the issue..."
            />
          </div>

          {/* Category Selector Pills */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:scale-[0.97] cursor-pointer ${
                      isSelected ? cat.activeClass : cat.inactiveClass
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 transition-transform duration-200" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Selector Cards */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 block">Severity Level</label>
            <div className="grid grid-cols-2 gap-3">
              {severities.map((sev) => {
                const isSelected = severity === sev.id;
                return (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setSeverity(sev.id)}
                    className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:scale-[0.97] cursor-pointer ${
                      isSelected ? sev.active : sev.border
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${sev.indicator}`} />
                        <span className="text-xs font-black uppercase tracking-wider text-white">{sev.label}</span>
                      </div>
                      {isSelected && (
                        <motion.div 
                          layoutId="severityCheck"
                          className="w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center shrink-0"
                          style={{ color: 'inherit' }}
                        >
                          <Check className="w-2.5 h-2.5 text-zinc-950 stroke-[3]" />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold leading-relaxed">{sev.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">Reproduction Steps</label>
              <span className={`text-[9px] font-mono font-bold ${description.length < 15 ? 'text-amber-500/80' : 'text-zinc-650'}`}>
                {description.length} / 15+ chars
              </span>
            </div>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 hover:border-zinc-700/60 focus:bg-zinc-950/70 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-all h-28 resize-none ${theme.focusBorder} ${theme.focusShadow}`}
              placeholder="Provide step-by-step description of the defect..."
            />
            {description.length > 0 && description.length < 15 && (
              <motion.p 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-amber-500/90 font-bold mt-1.5 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Reproduction details must be at least 15 characters long.
              </motion.p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || description.length < 15 || !title.trim()}
            className={`w-full font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 cursor-pointer ${
              isSubmitting || description.length < 15 || !title.trim()
                ? 'bg-zinc-900 border border-zinc-850 text-zinc-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/20 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting Report...
              </span>
            ) : (
              <>
                Submit Bug Report 
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default BugReportModal;
