import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from 'lucide-react';
import useStore from '../hooks/useStore';
import { markRead } from '../lib/store';

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
  error:   <ShieldAlert className="w-5 h-5 text-red-400" />,
  info:    <Info className="w-5 h-5 text-blue-400" />,
};

const BORDERS = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  error:   'border-red-500/30 bg-red-500/10',
  info:    'border-blue-500/30 bg-blue-500/10',
};

const ToastContainer = () => {
  const { notifications } = useStore();
  // Filter for unread notifications to show as toasts
  const activeToasts = notifications.filter(n => !n.read).slice(0, 3); // show max 3

  useEffect(() => {
    // Auto-dismiss after 5s
    const timers = activeToasts.map((toast) => 
      setTimeout(() => markRead(toast.id), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [activeToasts]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl w-80 ${BORDERS[toast.type] || BORDERS.info}`}
          >
            <div className="shrink-0 mt-0.5">{ICONS[toast.type] || ICONS.info}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{toast.title}</h4>
              <p className="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed">{toast.body}</p>
            </div>
            <button
              onClick={() => markRead(toast.id)}
              className="shrink-0 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
