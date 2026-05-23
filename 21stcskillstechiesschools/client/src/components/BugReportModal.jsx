import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, CheckCircle2, Eye, Cpu, Zap, Database, HelpCircle, AlertTriangle, ArrowRight } from 'lucide-react';
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
    { id: 'UI/Visual', label: 'UI / Visual', icon: Eye, activeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)]', inactiveClass: 'border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200' },
    { id: 'Functionality', label: 'Functionality', icon: Cpu, activeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]', inactiveClass: 'border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200' },
    { id: 'Performance', label: 'Performance', icon: Zap, activeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]', inactiveClass: 'border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200' },
    { id: 'Data', label: 'Data', icon: Database, activeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]', inactiveClass: 'border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200' },
    { id: 'Other', label: 'Other', icon: HelpCircle, activeClass: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300 shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)]', inactiveClass: 'border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200' }
  ];

  const severities = [
    { id: 'low', label: 'Low', desc: 'Cosmetic / UI glitch', border: 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]', active: 'border-zinc-500/30 bg-zinc-500/5 text-zinc-300 shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)]', indicator: 'bg-zinc-500' },
    { id: 'medium', label: 'Medium', desc: 'Workaround exists', border: 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]', active: 'border-blue-500/30 bg-blue-500/5 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]', indicator: 'bg-blue-500' },
    { id: 'high', label: 'High', desc: 'Workflow blocked', border: 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]', active: 'border-amber-500/30 bg-amber-500/5 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]', indicator: 'bg-amber-500' },
    { id: 'critical', label: 'Critical', desc: 'Crash / Data issue', border: 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]', active: 'border-rose-500/35 bg-rose-500/5 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]', indicator: 'bg-rose-500 animate-ping' }
  ];

  const getSeverityTheme = () => {
    switch (severity) {
      case 'low': return { focusBorder: 'focus:border-zinc-500/30', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)]' };
      case 'medium': return { focusBorder: 'focus:border-blue-500/30', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]' };
      case 'high': return { focusBorder: 'focus:border-amber-500/30', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]' };
      case 'critical': return { focusBorder: 'focus:border-rose-500/30', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(244,63,94,0.12)]' };
      default: return { focusBorder: 'focus:border-red-500/30', focusShadow: 'focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]' };
    }
  };

  const theme = getSeverityTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report a Bug">
      {isSuccess ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-10 text-center relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute w-42 h-42 rounded-full bg-emerald-500/[0.06] blur-3xl -z-10 animate-pulse" />
          
          <motion.div 
            initial={{ scale: 0.6, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10"
          >
            <CheckCircle2 className="w-7 h-7" />
          </motion.div>
          
          <h4 className="text-lg font-black font-headline text-white uppercase tracking-tight">Report Logged Successfully</h4>
          <p className="text-xs text-zinc-400 max-w-xs mt-3 leading-relaxed">
            Thank you! Our engineering team has been alerted and will inspect this issue shortly.
          </p>
          <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-550 bg-white/[0.02] border border-white/[0.03] px-3.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Auto-Closing Modal...
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Telemetry Context Alert */}
          <div className="flex items-center gap-3.5 p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.01] to-transparent pointer-events-none" />
            <Bug className="w-5 h-5 text-red-500/80 animate-pulse shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Describe the defect. We have auto-captured your view context:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-white/[0.02] border border-white/[0.03] px-2.5 py-0.5 rounded">View Path</span>
                <code className="text-[10px] font-black font-mono text-red-400/90 bg-red-950/20 px-2 py-0.5 rounded border border-red-500/10">
                  {getQueryView()}
                </code>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Bug Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-white/[0.015] border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:bg-white/[0.03] focus:outline-none transition-all ${theme.focusBorder} ${theme.focusShadow}`}
              placeholder="e.g. Navigation panel overlaps elements on mobile screens"
            />
          </div>

          {/* Category Selector Pills */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200 active:scale-[0.98] ${
                      isSelected ? cat.activeClass : cat.inactiveClass
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Selector Cards */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2.5">Severity Level</label>
            <div className="grid grid-cols-2 gap-3">
              {severities.map((sev) => {
                const isSelected = severity === sev.id;
                return (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setSeverity(sev.id)}
                    className={`flex flex-col items-start text-left p-3.5 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                      isSelected ? sev.active : sev.border
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${sev.indicator}`} />
                      <span className="text-xs font-black uppercase tracking-wider text-white">{sev.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium leading-relaxed">{sev.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reproduction Description</label>
              <span className={`text-[9px] font-mono font-bold ${description.length < 15 ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {description.length} chars
              </span>
            </div>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full bg-white/[0.015] border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:bg-white/[0.03] focus:outline-none transition-all h-24 resize-none ${theme.focusBorder} ${theme.focusShadow}`}
              placeholder="Provide clear steps to reproduce the issue..."
            />
            {description.length > 0 && description.length < 15 && (
              <p className="text-[10px] text-amber-500/90 font-semibold mt-2 flex items-center gap-1.5 animate-fadeIn">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Please write at least 15 characters to describe the issue.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || description.length < 15 || !title.trim()}
            className={`w-full font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-350 shadow-lg flex items-center justify-center gap-2 ${
              isSubmitting || description.length < 15 || !title.trim()
                ? 'bg-white/[0.02] text-zinc-600 cursor-not-allowed border border-white/[0.02] shadow-none'
                : 'bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/20 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                Submit Bug Report 
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200" />
              </>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default BugReportModal;
