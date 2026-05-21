import React, { useState } from 'react';
import { Bug, CheckCircle2 } from 'lucide-react';
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
      }, 2000);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report a Bug">
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
          </div>
          <h4 className="text-lg font-black text-white">Report Logged Successfully</h4>
          <p className="text-sm text-zinc-500 mt-2">Our development team will inspect this issue shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl mb-2">
            <Bug className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-xs text-red-350 leading-relaxed font-semibold">
              Submit details of the defect. We will auto-capture your current view context (<code className="bg-red-500/20 px-1.5 py-0.5 rounded font-mono text-red-300">{getQueryView()}</code>).
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Bug Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
              placeholder="e.g. Graph not loading on mobile view"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
              >
                <option value="UI/Visual">UI / Visual</option>
                <option value="Functionality">Functionality</option>
                <option value="Performance">Performance</option>
                <option value="Data">Data</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Reproduction Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 h-28 resize-none"
              placeholder="Explain the steps to reproduce the bug and what went wrong..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-650 hover:bg-red-750 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default BugReportModal;
