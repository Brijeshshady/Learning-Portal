/**
 * DashboardShell.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared layout primitives used by ALL four dashboard overview pages.
 * Inspired by the Premium SaaS reference design — adapted to dark theme.
 *
 * Usage:
 *   import { KpiGrid, KpiCard, ChartRow, ActivityFeed } from '../components/DashboardShell';
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ── Animation helpers ─────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ── Page Header ───────────────────────────────────────────────────────── */
export const PageHeader = ({ title, subtitle }) => (
  <motion.div {...fadeUp(0)} className="mb-8">
    <h1 className="text-4xl font-black font-headline tracking-tight text-white">{title}</h1>
    <p className="text-zinc-500 font-medium mt-1 text-base">{subtitle}</p>
  </motion.div>
);

/* ── KPI Card ──────────────────────────────────────────────────────────── */
export const KpiCard = ({ label, value, change, changeLabel = 'vs last month', icon: Icon, iconBg = 'bg-primary/15', iconColor = 'text-primary', delay = 0 }) => {
  const isPositive = typeof change === 'string' ? !change.startsWith('-') : change >= 0;
  const changeStr  = typeof change === 'string' ? change : `${change > 0 ? '+' : ''}${change}%`;

  return (
    <motion.div {...fadeUp(delay)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-400">{label}</p>
          <p className="text-3xl font-black font-headline text-white tracking-tight">{value}</p>
        </div>
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isPositive
          ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
        }
        <span className={`text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{changeStr}</span>
        <span className="text-xs text-zinc-600 font-medium">{changeLabel}</span>
      </div>
    </motion.div>
  );
};

/* ── KPI Grid (4-column) ───────────────────────────────────────────────── */
export const KpiGrid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {children}
  </div>
);

/* ── Custom Tooltip ────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: <span className="text-white">{p.value}</span></p>
      ))}
    </div>
  );
};

/* ── Area Chart Card ───────────────────────────────────────────────────── */
export const AreaChartCard = ({ title, subtitle, data, dataKey, color = '#3b82f6', delay = 0.2 }) => (
  <motion.div {...fadeUp(delay)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
    <div className="mb-6">
      <h3 className="text-base font-black text-white">{title}</h3>
      <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>
    </div>
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#grad-${dataKey})`} dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

/* ── Bar Chart Card ────────────────────────────────────────────────────── */
export const BarChartCard = ({ title, subtitle, data, dataKey, color = '#7c3aed', delay = 0.25 }) => (
  <motion.div {...fadeUp(delay)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
    <div className="mb-6">
      <h3 className="text-base font-black text-white">{title}</h3>
      <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>
    </div>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={24}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

/* ── Chart Row (2-column) ──────────────────────────────────────────────── */
export const ChartRow = ({ children }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
    {children}
  </div>
);

/* ── Activity Feed ─────────────────────────────────────────────────────── */
const TAG_COLORS = {
  now:       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  recent:    'bg-primary/20    text-primary    border-primary/30',
  older:     'bg-secondary/20  text-secondary  border-secondary/30',
  warning:   'bg-amber-500/20  text-amber-400  border-amber-500/30',
};

export const ActivityFeed = ({ title = 'Recent Activity', subtitle = 'Latest updates', items = [], delay = 0.3 }) => (
  <motion.div {...fadeUp(delay)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
    <div className="mb-6">
      <h3 className="text-base font-black text-white">{title}</h3>
      <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>
    </div>
    <div className="divide-y divide-zinc-800">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-white/[0.01] -mx-2 px-2 rounded-xl transition-all">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${item.avatarBg || 'bg-primary/20'} ${item.avatarColor || 'text-primary'}`}>
            {item.avatar || item.name?.[0] || '?'}
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{item.name}</p>
            <p className="text-xs text-zinc-500 font-medium truncate">{item.action}</p>
          </div>
          {/* Time badge */}
          {item.time && (
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${TAG_COLORS[item.tag] || TAG_COLORS.older}`}>
              {item.time}
            </span>
          )}
        </div>
      ))}
    </div>
  </motion.div>
);

/* ── Section card (generic) ────────────────────────────────────────────── */
export const SectionCard = ({ title, subtitle, children, delay = 0, className = '' }) => (
  <motion.div {...fadeUp(delay)} className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 ${className}`}>
    {(title || subtitle) && (
      <div className="mb-5">
        {title    && <h3 className="text-base font-black text-white">{title}</h3>}
        {subtitle && <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
    )}
    {children}
  </motion.div>
);
