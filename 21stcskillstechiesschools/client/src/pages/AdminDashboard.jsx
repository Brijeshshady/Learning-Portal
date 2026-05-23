import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Users, ShieldCheck, Key, BarChart3, PlusCircle, Upload,
  Search, Database, Activity, BadgeCheck, Settings as SettingsIcon,
  TrendingUp, Download, Copy, AlertTriangle, Cpu, CheckCircle2, AlertCircle, Award, Trash2, Calendar, Lock, UserCheck, FileText, MapPin, Zap, Server, HardDrive,
  Rocket, Bug
} from 'lucide-react';
import {
  PageHeader, KpiGrid, KpiCard, ChartRow,
  AreaChartCard, BarChartCard, ActivityFeed, SectionCard,
} from '../components/DashboardShell';
import Modal from '../components/Modal';
import useStore from '../hooks/useStore';
import { addUser, removeUser, updateUser, addHub, updateHub, removeHub, exportCSV, generateLicenseKey, addNotification, setMaintenanceMode, setHubMaintenance, getState, markAttendance, setHubs } from '../lib/store';
import DB from '../lib/db';
import ExamAnalytics from './ExamAnalytics';




/* ── Dashboard Overview ──────────────────────────────────── */
const DashboardView = ({ stats, onNavigate }) => {
  const { hubs, users } = useStore();
  const studentCount = users.filter(u => u.role === 'student').length;
  
  return (
    <div>
      <PageHeader title="Global Administration" subtitle="Welcome back, Super Admin. Here's what's happening across all hubs." />
      <KpiGrid>
        <KpiCard label="Total Students"  value={studentCount.toLocaleString()}  change={stats?.kpis?.studentsChange || "+0%"} icon={Users}    iconBg="bg-primary/15"   iconColor="text-primary"   delay={0.05} />
        <KpiCard label="Active Hubs"     value={hubs.length}     change={stats?.kpis?.hubsChange || "0"}     changeLabel="new this term" icon={Database}  iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.1} />
        <div onClick={() => onNavigate('system')} className="cursor-pointer hover:scale-[1.02] transition-transform duration-250">
          <KpiCard label="System Health"   value={stats?.kpis?.systemUptime || "99.9%"} change={stats?.kpis?.uptimeChange || "0.1%"} icon={BarChart3} iconBg="bg-secondary/15" iconColor="text-secondary"  delay={0.15} />
        </div>
        <KpiCard label="ARR"             value={stats?.kpis?.mrr || "$124K"}   change={stats?.kpis?.mrrChange || "+8%"}  icon={Cpu}       iconBg="bg-amber-500/15" iconColor="text-amber-400"  delay={0.2} />
      </KpiGrid>
      <ChartRow>
        <AreaChartCard title="Enrollment Growth" subtitle="Monthly student registrations across all hubs" data={stats?.enrollmentData || []} dataKey="value" color="#3b82f6" delay={0.2} />
        <div onClick={() => onNavigate('system')} className="cursor-pointer hover:scale-[1.01] transition-transform duration-250 w-full h-full">
          <BarChartCard  title="System Load"       subtitle="Server CPU utilization across network nodes"   data={stats?.performanceData || []}  dataKey="cpu" color="#7c3aed" delay={0.25} />
        </div>
      </ChartRow>
      <ActivityFeed title="System Activity" subtitle="Latest platform events and updates" items={stats?.activities || []} delay={0.3} />
    </div>
  );
};

/* ── System Monitor View ─────────────────────────────────── */
const SystemMonitorView = ({ stats }) => {
  const [activeSubTab, setActiveSubTab] = React.useState('compute'); // 'compute', 'data', 'network'
  const [keys, setKeys] = React.useState(stats?.aiUsageStats?.keysStatus || [
    { slot: 1, key: 'AIzaSyBW...tYx1', limit: 200, used: 142, rate: '71%', status: 'active' },
    { slot: 2, key: 'AIzaSyAS...uR88', limit: 200, used: 198, rate: '99%', status: 'active' },
    { slot: 3, key: 'AIzaSyKP...xX90', limit: 200, used: 45,  rate: '22%', status: 'active' },
    { slot: 4, key: 'AIzaSyTR...kP12', limit: 200, used: 0,   rate: '0%',  status: 'active' },
    { slot: 5, key: 'AIzaSyLM...uV34', limit: 200, used: 0,   rate: '0%',  status: 'suspended' }
  ]);

  const [actions, setActions] = React.useState({
    redis: { loading: false, done: false },
    db: { loading: false, done: false },
    gateway: { loading: false, done: false }
  });

  const toggleKey = (slotNum) => {
    setKeys(prevKeys => prevKeys.map(k => {
      if (k.slot === slotNum) {
        const nextStatus = k.status === 'active' ? 'suspended' : 'active';
        return { ...k, status: nextStatus };
      }
      return k;
    }));
    addNotification({ title: 'AI Router Updated', body: `Gemini API key slot ${slotNum} modified.`, type: 'info' });
  };

  const runAction = (type, label, msg) => {
    setActions(prev => ({ ...prev, [type]: { loading: true, done: false } }));
    setTimeout(() => {
      setActions(prev => ({ ...prev, [type]: { loading: false, done: true } }));
      addNotification({ title: label, body: msg, type: 'success' });
    }, 2000);
  };

  const nodes = stats?.performanceData || [
    { name: 'Node A (Chennai Core)', cpu: 45, mem: 60, connections: 840, latency: 12, disk: 18, status: 'healthy' },
    { name: 'Node B (Coimbatore Core)', cpu: 75, mem: 82, connections: 1202, latency: 38, disk: 44, status: 'warning' },
    { name: 'Node C (Regional Router)', cpu: 30, mem: 45, connections: 450, latency: 15, disk: 12, status: 'healthy' },
    { name: 'DB Sync (Master Node)', cpu: 88, mem: 95, connections: 345, latency: 45, disk: 78, status: 'critical' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">System Monitor & Command Deck</h2>
          <p className="text-zinc-500 text-sm mt-1">Multi-region performance metrics and fallback router control.</p>
        </div>
      </div>

      {/* Cluster Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {nodes.map(n => {
          const statusColors = {
            healthy: {
              border: 'border-emerald-500/20',
              glow: 'hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.08)] hover:border-emerald-500/30',
              text: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              bar: 'from-emerald-500 to-teal-400'
            },
            warning: {
              border: 'border-amber-500/20',
              glow: 'hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.08)] hover:border-amber-500/30',
              text: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              bar: 'from-amber-500 to-orange-400'
            },
            critical: {
              border: 'border-rose-500/25',
              glow: 'hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.12)] hover:border-rose-500/40',
              text: 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse',
              bar: 'from-rose-600 to-pink-500'
            }
          };
          const currentColors = statusColors[n.status] || statusColors.healthy;

          return (
            <motion.div
              key={n.name}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className={`bg-zinc-950/40 backdrop-blur-md border ${currentColors.border} rounded-2xl p-5 hover:bg-zinc-950/60 transition-all duration-300 ${currentColors.glow}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 truncate max-w-[150px] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-zinc-500" />
                  {n.name}
                </span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 ${currentColors.text}`}>
                  <span className={`w-1 h-1 rounded-full bg-current ${n.status === 'critical' ? 'animate-ping' : ''}`} />
                  {n.status}
                </span>
              </div>
              
              <div className="space-y-3">
                {/* CPU usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase">
                    <span>CPU Load</span>
                    <span className="text-white font-mono">{n.cpu}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${n.cpu}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${currentColors.bar}`}
                    />
                  </div>
                </div>

                {/* MEM usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase">
                    <span>Memory</span>
                    <span className="text-white font-mono">{n.mem}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${n.mem}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400"
                    />
                  </div>
                </div>

                {/* Disk usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase">
                    <span>Disk Usage</span>
                    <span className="text-white font-mono">{n.disk}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${n.disk}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                    />
                  </div>
                </div>

                {/* Additional stats */}
                <div className="pt-2 border-t border-zinc-900/60 grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-zinc-500">
                  <div>
                    <span className="block text-zinc-500 text-[8px] tracking-wider mb-0.5">Active Clients</span>
                    <span className="text-white font-mono text-xs">{n.connections.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-[8px] tracking-wider mb-0.5">Ping Latency</span>
                    <span className="text-white font-mono text-xs">{n.latency}ms</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid: Control Deck + Sub-panel tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Sub-panels tab deck */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4 mb-6">
              <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-900">
                {[
                  { id: 'compute', label: 'Computing' },
                  { id: 'data', label: 'Data Layer' },
                  { id: 'network', label: 'Network & AI' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className="relative px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                  >
                    {activeSubTab === tab.id && (
                      <motion.div
                        layoutId="activeSubTabIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-lg shadow-md shadow-primary/25"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors ${activeSubTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: Compute */}
            {activeSubTab === 'compute' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl space-y-2 hover:border-zinc-800 transition-all duration-300">
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-primary" />
                      Core Performance Index
                    </p>
                    <p className="text-3xl font-headline font-black text-white">4.88 <span className="text-xs text-emerald-400 font-bold font-sans">/ 5.00 Optimal</span></p>
                  </div>
                  <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl space-y-2 hover:border-zinc-800 transition-all duration-300">
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-orange-400" />
                      Average Node Temp
                    </p>
                    <p className="text-3xl font-headline font-black text-white">42°C <span className="text-xs text-emerald-400 font-bold font-sans">Stable</span></p>
                  </div>
                </div>
                
                <div className="bg-zinc-950/60 p-5 border border-zinc-900 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Background Worker Queues
                    </p>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Process ID: 89402</span>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-zinc-900/30 transition-colors">
                      <span className="text-zinc-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        PDF Generator Jobs:
                      </span>
                      <span className="text-emerald-400 font-bold">0 Idle</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-zinc-900/30 transition-colors">
                      <span className="text-zinc-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Email SMTP Relays:
                      </span>
                      <span className="text-emerald-400 font-bold">2 Queue</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-zinc-900/30 transition-colors">
                      <span className="text-zinc-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        AI Logs Parser:
                      </span>
                      <span className="text-amber-400 font-bold">18 Processing</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Data */}
            {activeSubTab === 'data' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl text-center hover:border-zinc-800 transition-all duration-300">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">DB Latency</span>
                    <p className="text-2xl font-black text-white mt-1 font-mono">4.2ms</p>
                  </div>
                  <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl text-center hover:border-zinc-800 transition-all duration-300">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Cache Hits</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">98.4%</p>
                  </div>
                  <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl text-center hover:border-zinc-800 transition-all duration-300">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Storage Used</span>
                    <p className="text-2xl font-black text-white mt-1 font-mono">42.8 GB</p>
                  </div>
                </div>
                
                <div className="bg-zinc-950/60 p-5 border border-zinc-900 rounded-2xl space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-primary" />
                      Active MongoDB Client Pool
                    </span>
                    <span className="text-white font-mono">45 / 100 Connections</span>
                  </div>
                  <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '45%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Network & AI */}
            {activeSubTab === 'network' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl space-y-1 hover:border-zinc-800 transition-all">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-primary" />
                      Total API Token Requests
                    </span>
                    <p className="text-2xl font-black text-white font-mono">{(stats?.aiUsageStats?.totalRequests || 84293).toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl space-y-1 hover:border-zinc-800 transition-all">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Estimated Token Savings
                    </span>
                    <p className="text-2xl font-black text-emerald-400 font-mono">{(stats?.aiUsageStats?.costSavingsPct || 92)}% via caching</p>
                  </div>
                </div>

                {/* API Key Load Balancer Deck */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      Gemini Key Balance Deck
                    </p>
                    <span className="text-[9px] text-zinc-500 font-bold bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-900 font-mono">
                      {keys.filter(k => k.status === 'active').length} of {keys.length} Active Slots
                    </span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden divide-y divide-zinc-900/60">
                    {keys.map(k => (
                      <div key={k.slot} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-900/25 transition-all">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${k.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-primary font-mono font-black">Slot {k.slot}</code>
                            <code className="text-[11px] text-zinc-500 font-mono select-all bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-900/60">{k.key}</code>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                          <div className="text-right">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Used: {k.used} / {k.limit} tokens</p>
                            <div className="w-24 h-1.5 bg-zinc-900 rounded-full mt-1.5 overflow-hidden p-[1px] border border-zinc-800">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${k.status === 'suspended' ? 'bg-zinc-600' : k.used > 190 ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                                style={{ width: `${(k.used/k.limit)*100}%` }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => toggleKey(k.slot)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                              k.status === 'active'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            {k.status === 'active' ? 'Suspend' : 'Resume'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Command controls */}
        <div className="space-y-6">
          <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 rounded-[2rem] p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-primary" />
                Command Diagnostics
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Deploy emergency controls and synchronize routing indices.</p>
            </div>
            <div className="space-y-4">
              {[
                {
                  id: 'redis',
                  title: 'Flush Cache Layer',
                  desc: 'Purges stale Redis tokens, session histories, and local cache layers.',
                  icon: Trash2,
                  iconColor: 'text-rose-400 bg-rose-500/10 border border-rose-500/20',
                  buttonText: 'Flush Caching Layer',
                  loadingText: 'Flushing Redis cache...',
                  doneText: 'Flushed Successfully',
                  successMsg: 'Successfully cleared 14,839 cached schema entries.',
                  actionLabel: 'Redis cache layer flushed'
                },
                {
                  id: 'db',
                  title: 'Optimize DB Indexing',
                  desc: 'Triggers MongoDB defragmentation and updates document search index bindings.',
                  icon: Database,
                  iconColor: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
                  buttonText: 'Optimize DB Indices',
                  loadingText: 'Optimizing DB indices...',
                  doneText: 'Optimized Successfully',
                  successMsg: 'Completed MongoDB collection index compression.',
                  actionLabel: 'Database optimized successfully'
                },
                {
                  id: 'gateway',
                  title: 'Reset Gateway Router',
                  desc: 'Force recycles regional edge router WebSocket listeners.',
                  icon: Zap,
                  iconColor: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
                  buttonText: 'Reset Gateway Router',
                  loadingText: 'Recycling edge gateway...',
                  doneText: 'Gateway Reset Successful',
                  successMsg: 'Router socket connections successfully recycled.',
                  actionLabel: 'Regional edge gateway restarted'
                }
              ].map(act => {
                const isActLoading = actions[act.id].loading;
                const isActDone = actions[act.id].done;
                const IconComponent = act.icon;

                return (
                  <div key={act.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3 hover:border-zinc-800 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.iconColor}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">{act.title}</h4>
                        <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">{act.desc}</p>
                      </div>
                    </div>
                    <button
                      disabled={isActLoading}
                      onClick={() => runAction(act.id, act.actionLabel, act.successMsg)}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border ${
                        isActLoading
                          ? 'bg-zinc-900/50 border-primary/30 text-primary cursor-wait'
                          : isActDone
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          : 'bg-zinc-900 border-zinc-800 hover:border-primary/40 text-zinc-400 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.08)]'
                      }`}
                    >
                      {isActLoading && (
                        <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isActLoading ? act.loadingText : isActDone ? act.doneText : act.buttonText}
                     </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Users View ──────────────────────────────────────────── */
const UsersView = () => {
  const { users, hubs } = useStore();
  const [search, setSearch] = React.useState('');
  const [editingUser, setEditingUser] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  const [formData, setFormData] = React.useState({ name: '', email: '', role: 'student', hub: 'HUB-CH-01', status: 'active' });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.schoolId?.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    (u.status || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setSaveError('');
    setFormData({ name: u.name, email: u.email, role: u.role, hub: u.schoolId || '', status: u.status });
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setSaveError('');
    setFormData({ name: '', email: '', role: 'student', hub: 'HUB-CH-01', status: 'active', grade: 6 });
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { name: formData.name, email: formData.email, role: formData.role, schoolId: formData.hub, status: formData.status });
        addNotification({ title: 'User Updated', body: `${formData.name} has been updated successfully.`, type: 'success' });
      } else {
        await addUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          schoolId: formData.hub,
          grade: formData.role === 'student' ? Number(formData.grade) : null,
          status: formData.status
        });
        addNotification({ title: 'User Provisioned', body: `${formData.name} has been added successfully.`, type: 'success' });
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Failed to save user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUser = async (u) => {
    const adminUser = users.find(x => x.id === 'u0');
    if (u.email === adminUser?.email) {
      alert('Security Error: Cannot remove the primary Super Admin account.');
      return;
    }
    if (!confirm(`Remove ${u.name}? This action cannot be undone.`)) return;
    try {
      await removeUser(u.id);
    } catch (err) {
      addNotification({ title: 'Error', body: err.message || 'Failed to remove user.', type: 'error' });
    }
  };

  const handleExport = () => {
    exportCSV(
      filteredUsers.map(u => ({
        ID: u.id,
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Hub: u.schoolId || 'N/A',
        Status: u.status || 'active',
        Grade: u.grade || 'N/A'
      })),
      'users_export.csv'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">User Management</h2>
          <p className="text-zinc-500 text-sm mt-1">Provision accounts and manage roles across all hubs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all"><Download className="w-3.5 h-3.5" /> Export CSV</button>
          <button onClick={handleOpenAdd} className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"><PlusCircle className="w-3.5 h-3.5" /> Add User</button>
        </div>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by name, email, or hub…" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all" 
            />
          </div>
          <span className="text-[9px] font-black bg-zinc-800/60 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-400 uppercase tracking-widest self-start md:self-auto">
            {filteredUsers.length} active records
          </span>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-500 text-sm font-bold">No users found.</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((u) => {
              // Role-based design tokens
              let roleConfig = {
                badge: 'border-blue-500/20 text-blue-400 bg-blue-500/10',
                avatarBg: 'bg-gradient-to-tr from-blue-600 to-indigo-500',
                border: 'border-zinc-800/80 hover:border-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.05)]'
              };
              if (u.role === 'teacher') {
                roleConfig = {
                  badge: 'border-purple-500/20 text-purple-400 bg-purple-500/10',
                  avatarBg: 'bg-gradient-to-tr from-purple-600 to-pink-500',
                  border: 'border-zinc-800/80 hover:border-purple-500/30 shadow-[0_0_20px_-5px_rgba(168,85,247,0.05)]'
                };
              } else if (u.role === 'school-admin') {
                roleConfig = {
                  badge: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
                  avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
                  border: 'border-zinc-800/80 hover:border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.05)]'
                };
              } else if (u.role === 'student') {
                roleConfig = {
                  badge: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
                  avatarBg: 'bg-gradient-to-tr from-amber-500 to-orange-400',
                  border: 'border-zinc-800/80 hover:border-amber-500/30 shadow-[0_0_20px_-5px_rgba(245,158,11,0.05)]'
                };
              }
              
              return (
                <motion.div
                  key={u.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-zinc-950/40 border ${roleConfig.border} rounded-2xl p-5 flex flex-col justify-between transition-all duration-300`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${roleConfig.avatarBg} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                          {u.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-white truncate max-w-[140px]" title={u.name}>{u.name}</h3>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[140px]" title={u.email}>{u.email}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black border px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 ${roleConfig.badge}`}>
                        {u.role === 'school-admin' ? 'Hub Admin' : u.role}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-3.5 border-t border-zinc-900/60">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-zinc-500 uppercase tracking-wider">Institution Hub</span>
                        <span className="font-bold text-zinc-400 uppercase">{u.schoolId || '—'}</span>
                      </div>
                      {u.role === 'student' && u.grade && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-zinc-500 uppercase tracking-wider">Grade</span>
                          <span className="font-bold text-zinc-400 uppercase">Grade {u.grade}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-zinc-500 uppercase tracking-wider">Status</span>
                        <div className="flex items-center gap-1.5">
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-black text-emerald-500 uppercase tracking-wider">Active</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
                              <span className="font-black text-zinc-600 uppercase tracking-wider">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-5 pt-3.5 border-t border-zinc-900/60">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:border-zinc-700 text-zinc-400 hover:text-white transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveUser(u)}
                      className="bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { if (!saving) setShowModal(false); }} title={editingUser ? "Edit User Profile" : "Provision New User"}>
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Full Name</label><input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" placeholder="e.g. John Doe" /></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Email Address</label><input required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" placeholder="john@21stc.school" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Role</label><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"><option value="student">Student</option><option value="teacher">Teacher</option><option value="school-admin">School Admin</option></select></div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Institution Hub</label>
              <select value={formData.hub} onChange={(e) => setFormData({...formData, hub: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50">
                <option value="">Select a Hub...</option>
                {hubs.map(h => <option key={h.id} value={h.id}>{h.name} ({h.id})</option>)}
              </select>
            </div>
          </div>
          {formData.role === 'student' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Grade / Class</label>
              <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50">
                {[6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
          )}
          {editingUser && (
            <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          )}
          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 font-bold">{saveError}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {saving && <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
            {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Provision Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

/* ── Hub Registry ────────────────────────────────────────── */
const HubRegistryView = () => {
  const { hubs, users } = useStore();
  const [editingHub, setEditingHub] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  const DEFAULT_LIMITS = {
    plan: 'Basic',
    studentLimit: 3000,
    aiLimit: 20000,
    examLimit: 50,
    storageLimit: 10,
    playgroundEnabled: true,
    certificateLimit: 200,
    communityAccess: true
  };

  const [formData, setFormData] = React.useState({ 
    id: '', name: '', loc: '', mapsLink: '', status: 'active', 
    mActive: false, mUntil: '', mMessage: '',
    ...DEFAULT_LIMITS
  });

  const getStudentCount = (hubId) => users.filter(u => u.schoolId === hubId && u.role === 'student').length;

  const handleOpenAdd = () => {
    setEditingHub(null);
    setFormData({ 
      id: '', name: '', loc: '', mapsLink: '', status: 'active', 
      mActive: false, mUntil: '', mMessage: '',
      ...DEFAULT_LIMITS
    });
    setShowModal(true);
  };

  const handleOpenEdit = (hub) => {
    setEditingHub(hub);
    setFormData({ 
      id: hub.id, 
      name: hub.name, 
      loc: hub.location || hub.loc || '', 
      mapsLink: hub.mapsLink || '',
      status: hub.status || 'active', 
      plan: hub.plan || 'Basic',
      studentLimit: hub.studentLimit || 3000,
      aiLimit: hub.aiLimit || 20000,
      examLimit: hub.featureLimits?.examLimit ?? 50,
      storageLimit: hub.featureLimits?.storageLimit ?? 10,
      playgroundEnabled: hub.featureLimits?.playgroundEnabled ?? true,
      certificateLimit: hub.featureLimits?.certificateLimit ?? 200,
      communityAccess: hub.featureLimits?.communityAccess ?? true,
      mActive: hub.maintenance?.active || false,
      mUntil: hub.maintenance?.until || '',
      mMessage: hub.maintenance?.message || ''
    });
    setShowModal(true);
  };

  const resetToDefaults = () => {
    setFormData(prev => ({
      ...prev,
      ...DEFAULT_LIMITS
    }));
  };

  const handleSaveHub = async (e) => {
    e.preventDefault();
    const hubData = { 
      name: formData.name, 
      location: formData.loc,
      mapsLink: formData.mapsLink?.trim() || null,
      status: formData.status, 
      plan: formData.plan,
      studentLimit: Number(formData.studentLimit),
      aiLimit: Number(formData.aiLimit),
      maintenance: {
        active: formData.mActive,
        until: formData.mUntil,
        message: formData.mMessage
      },
      featureLimits: {
        examLimit: Number(formData.examLimit),
        storageLimit: Number(formData.storageLimit),
        playgroundEnabled: formData.playgroundEnabled,
        certificateLimit: Number(formData.certificateLimit),
        communityAccess: formData.communityAccess
      }
    };

    try {
      const res = await DB.updateSchool(formData.id, hubData);
      if (res && !res.error) {
        addNotification({ 
          title: editingHub ? 'Hub Updated' : 'Hub Created', 
          body: `${formData.name} configuration saved successfully.`, 
          type: 'success' 
        });
        const schools = await DB.getSchools();
        setHubs(schools);
      } else {
        addNotification({ 
          title: 'Operation Failed', 
          body: res?.error || 'Failed to save hub settings.', 
          type: 'error' 
        });
      }
    } catch (err) {
      console.error(err);
      addNotification({ title: 'Operation Failed', body: err.message, type: 'error' });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Hub Registry</h2><p className="text-zinc-500 text-sm mt-1">All institutional hubs connected to the platform.</p></div>
        <button onClick={handleOpenAdd} className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"><PlusCircle className="w-3.5 h-3.5" /> Add Hub</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hubs.map((hub) => (
          <SectionCard key={hub.id} className={`border ${hub.color || 'border-zinc-800'}`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest text-primary mb-1`}>{hub.id}</p>
                <h3 className="text-lg font-black font-headline text-white">{hub.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-zinc-500">{hub.location || hub.loc}</p>
                  {hub.mapsLink && (
                    <a
                      href={hub.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full hover:bg-blue-500 hover:text-white transition-all"
                    >
                      <MapPin className="w-2.5 h-2.5" /> Maps
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {hub.maintenance?.active && (
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Maint.
                    </span>
                  )}
                  {hub.status === 'active' 
                    ? <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Active</span>
                    : <span className="text-[9px] font-black text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full uppercase tracking-widest">Inactive</span>
                  }
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(hub)} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Edit</button>
                  <button
                    onClick={() => setHubMaintenance(hub.id, !hub.maintenance?.active)}
                    className={`text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 ${
                      hub.maintenance?.active ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-500 hover:text-amber-400'
                    }`}
                    title={hub.maintenance?.active ? 'Deactivate maintenance' : 'Activate maintenance'}
                  >
                    <Zap className="w-2.5 h-2.5" />{hub.maintenance?.active ? 'Live' : 'Maint'}
                  </button>
                  <button onClick={() => { if(confirm('Delete hub?')) removeHub(hub.id) }} className="text-[9px] font-black text-zinc-500 hover:text-red-400 uppercase tracking-widest transition-colors">Delete</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/60 rounded-xl p-4 text-center">
                <p className="text-2xl font-black font-headline text-white">{getStudentCount(hub.id).toLocaleString()} / {hub.studentLimit?.toLocaleString() || '∞'}</p>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Student Quota</p>
              </div>
              <div className="bg-zinc-800/60 rounded-xl p-4 text-center"><p className={`text-2xl font-black font-headline text-primary`}>{hub.completion || '0%'}</p><p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Avg Completion</p></div>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-2.5">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-wider">Plan</p>
                <p className="text-xs font-black text-white mt-0.5">{hub.plan || 'Basic'}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-2.5">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-wider">AI Limit</p>
                <p className="text-xs font-bold text-white mt-0.5">{hub.aiLimit?.toLocaleString() || '0'}/mo</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-2.5">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-wider">Exams</p>
                <p className="text-xs font-bold text-white mt-0.5">Max {hub.featureLimits?.examLimit || 50}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-2.5">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-wider">Storage</p>
                <p className="text-xs font-bold text-white mt-0.5">{hub.featureLimits?.storageLimit || 10} GB</p>
              </div>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                hub.featureLimits?.playgroundEnabled ?? true 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-zinc-500 bg-zinc-800/40 border-zinc-800'
              }`}>
                Playground: {hub.featureLimits?.playgroundEnabled ?? true ? 'Enabled' : 'Disabled'}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                hub.featureLimits?.communityAccess ?? true 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-zinc-500 bg-zinc-800/40 border-zinc-800'
              }`}>
                Community: {hub.featureLimits?.communityAccess ?? true ? 'Active' : 'Locked'}
              </span>
              <span className="text-[8px] font-black text-zinc-500 bg-zinc-800/40 border border-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider">
                Certs: {hub.featureLimits?.certificateLimit || 200}/mo
              </span>
            </div>

          {/* Maps button if link exists */}
          {hub.mapsLink && (
            <a
              href={hub.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin className="w-3.5 h-3.5" /> Open in Google Maps
            </a>
          )}
        </SectionCard>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingHub ? "Edit Hub details" : "Register New Hub"}>
        <form onSubmit={handleSaveHub} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Hub ID</label><input required disabled={!!editingHub} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})} type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 disabled:opacity-50" placeholder="HUB-XXX-00" /></div>
            <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Student Limit</label><input required value={formData.studentLimit} onChange={(e) => setFormData({...formData, studentLimit: e.target.value})} type="number" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" /></div>
          </div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Hub Name</label><input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Chennai Skillstech" /></div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Location (City/Area)</label>
            <input required value={formData.loc} onChange={(e) => setFormData({...formData, loc: e.target.value})} type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Chennai Central" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-blue-400" /> Google Maps Link
            </label>
            <input
              value={formData.mapsLink}
              onChange={(e) => setFormData({...formData, mapsLink: e.target.value})}
              type="url"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder:text-zinc-600"
              placeholder="https://maps.google.com/..."
            />
            <p className="text-[9px] text-zinc-600 font-medium mt-1 px-1">Paste the Google Maps share link or place URL for this hub location.</p>
          </div>

          <div className="pt-4 border-t border-zinc-800 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Feature Limits & Subscription
              </h4>
              <button 
                type="button" 
                onClick={resetToDefaults}
                className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors animate-pulse"
              >
                Reset to Defaults
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Plan</label>
                <select 
                  value={formData.plan} 
                  onChange={(e) => setFormData({...formData, plan: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">AI Limit (req/mo)</label>
                <input 
                  required 
                  type="number" 
                  value={formData.aiLimit} 
                  onChange={(e) => setFormData({...formData, aiLimit: e.target.value})} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Max Exams/mo</label>
                <input 
                  required 
                  type="number" 
                  value={formData.examLimit} 
                  onChange={(e) => setFormData({...formData, examLimit: e.target.value})} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Storage (GB)</label>
                <input 
                  required 
                  type="number" 
                  value={formData.storageLimit} 
                  onChange={(e) => setFormData({...formData, storageLimit: e.target.value})} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Certs Limit/mo</label>
                <input 
                  required 
                  type="number" 
                  value={formData.certificateLimit} 
                  onChange={(e) => setFormData({...formData, certificateLimit: e.target.value})} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-white">Coding Playground</p>
                  <p className="text-[9px] text-zinc-500 font-medium">Enable student coding editor and sandboxed output runtime.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, playgroundEnabled: !formData.playgroundEnabled})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.playgroundEnabled ? 'bg-primary' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.playgroundEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-white">Community Access</p>
                  <p className="text-[9px] text-zinc-500 font-medium">Enable discussions and community collaboration portals.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, communityAccess: !formData.communityAccess})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.communityAccess ? 'bg-primary' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.communityAccess ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-zinc-800 mt-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Hub Maintenance Mode</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-white">Activate Lockdown</p>
                  <p className="text-[9px] text-zinc-500 font-medium">Prevent all non-admin logins for this hub.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, mActive: !formData.mActive})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.mActive ? 'bg-amber-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.mActive ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {formData.mActive && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Scheduled Completion</label>
                    <input 
                      type="datetime-local" 
                      value={formData.mUntil} 
                      onChange={(e) => setFormData({...formData, mUntil: e.target.value})} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Maintenance Notice</label>
                    <textarea 
                      value={formData.mMessage} 
                      onChange={(e) => setFormData({...formData, mMessage: e.target.value})} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 h-20 resize-none" 
                      placeholder="e.g. Routine database maintenance..."
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-primary text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 animate-pulse">
            {editingHub ? "Apply Hub Updates" : "Register Hub"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

/* ── Analytics View ──────────────────────────────────────── */
const HUB_ANALYTICS_DATA = {
  'HUB-CH-01':  { enrolled: 2845, completion: '78%', activeToday: 641, certs: 198, area: [{name:'Jan',value:60},{name:'Feb',value:65},{name:'Mar',value:70},{name:'Apr',value:72},{name:'May',value:78},{name:'Jun',value:80}], atRisk: [{ name: 'Grade 8 — Debugging Logic', action: 'Only 12% completion', time: 'Critical', tag: 'warning', avatar: '!', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' }] },
  'HUB-CBE-02': { enrolled: 1240, completion: '82%', activeToday: 421, certs: 112, area: [{name:'Jan',value:68},{name:'Feb',value:72},{name:'Mar',value:75},{name:'Apr',value:80},{name:'May',value:82},{name:'Jun',value:84}], atRisk: [{ name: 'Grade 9 — Advanced IoT', action: '23% completion', time: 'Warning', tag: 'warning', avatar: '!', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' }] },
};
const GLOBAL_ANALYTICS = {
  enrolled: 4085, completion: '80%', activeToday: 1247, certs: 342,
  area: [{name:'Jan',value:62},{name:'Feb',value:70},{name:'Mar',value:68},{name:'Apr',value:75},{name:'May',value:80},{name:'Jun',value:83}],
  hubBar: [{name:'CH-01',pct:78},{name:'CBE-02',pct:82},{name:'MDU-03',pct:45}],
  atRisk: [
    { name: 'Grade 8 — Debugging Logic', action: 'HUB-CH-01 • Only 12% completion', time: 'Critical', tag: 'warning', avatar: '!', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' },
    { name: 'Grade 9 — Advanced IoT',    action: 'HUB-CBE-02 • 23% completion',     time: 'Warning',  tag: 'warning', avatar: '!', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' },
  ]
};

const AnalyticsView = ({ selectedHub }) => {
  const { hubs } = useStore();
  const isAll = !selectedHub || selectedHub === 'ALL';
  const hubData = isAll ? GLOBAL_ANALYTICS : (HUB_ANALYTICS_DATA[selectedHub] || GLOBAL_ANALYTICS);
  const hubName = !isAll ? (hubs.find(h => h.id === selectedHub)?.name || selectedHub) : null;

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Platform Analytics</h2>
          {isAll
            ? <p className="text-zinc-500 text-sm mt-1">Engagement and outcomes across all hubs. Select a hub to drill down.</p>
            : <p className="text-sm mt-1"><span className="text-primary font-black">{hubName}</span> <span className="text-zinc-500">· Hub-specific engagement metrics.</span></p>
          }
        </div>
        <button className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all"><Download className="w-3.5 h-3.5" /> Export</button>
      </div>

      {isAll ? (
        /* ── ALL HUBS: Show per-hub cards grid ── */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {hubs.map(hub => {
              const d = HUB_ANALYTICS_DATA[hub.id] || { enrolled: 0, completion: '0%', activeToday: 0, certs: 0 };
              return (
                <motion.div
                  key={hub.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-4 hover:border-primary/20 transition-all cursor-default"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{hub.id}</p>
                      <p className="text-sm font-black text-white mt-0.5 leading-tight">{hub.name}</p>
                      <p className="text-[9px] text-zinc-600 mt-0.5">{hub.location}</p>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
                    <div>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Enrolled</p>
                      <p className="text-lg font-black text-white">{d.enrolled.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Completion</p>
                      <p className="text-lg font-black text-emerald-400">{d.completion}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Active Today</p>
                      <p className="text-lg font-black text-white">{d.activeToday}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Certs</p>
                      <p className="text-lg font-black text-primary">{d.certs}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <KpiGrid>
            <KpiCard label="Total Enrolled"  value="4,085" change="+12%"  icon={Users}       iconBg="bg-primary/15"    iconColor="text-primary"    delay={0} />
            <KpiCard label="Avg Completion"  value="80%"   change="+5.3%" icon={BarChart3}   iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.05} />
            <KpiCard label="Active Today"    value="1,247" change="+8.2%" icon={Activity}    iconBg="bg-secondary/15"  iconColor="text-secondary"  delay={0.1} />
            <KpiCard label="Certifications"  value="342"   change="+21%"  icon={ShieldCheck} iconBg="bg-amber-500/15"  iconColor="text-amber-400"  delay={0.15} />
          </KpiGrid>
          <ChartRow>
            <AreaChartCard title="Platform Completion Trend" subtitle="Monthly average across all hubs" data={GLOBAL_ANALYTICS.area} dataKey="value" color="#3b82f6" />
            <BarChartCard  title="Hub Performance Ranking"   subtitle="Completion % per hub"             data={GLOBAL_ANALYTICS.hubBar} dataKey="pct"   color="#7c3aed" />
          </ChartRow>
          <ActivityFeed title="At-Risk Alerts (Platform)" subtitle="Grades and hubs that need attention" items={GLOBAL_ANALYTICS.atRisk} />
        </>
      ) : (
        /* ── SPECIFIC HUB ── */
        <>
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
            <Database className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs font-bold text-zinc-300">Showing analytics for <span className="text-primary font-black">{hubName}</span> ({selectedHub}) only. Switch to <span className="text-zinc-400 font-bold">All Hubs</span> to see platform-wide view.</p>
          </div>
          <KpiGrid>
            <KpiCard label="Enrolled"       value={hubData.enrolled.toLocaleString()} change="+6%"   icon={Users}       iconBg="bg-primary/15"    iconColor="text-primary"    delay={0} />
            <KpiCard label="Completion"     value={hubData.completion}                 change="+3%"   icon={BarChart3}   iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.05} />
            <KpiCard label="Active Today"   value={hubData.activeToday.toLocaleString()} change="+5%" icon={Activity}    iconBg="bg-secondary/15"  iconColor="text-secondary"  delay={0.1} />
            <KpiCard label="Certifications" value={hubData.certs}                       change="+12%"  icon={ShieldCheck} iconBg="bg-amber-500/15"  iconColor="text-amber-400"  delay={0.15} />
          </KpiGrid>
          <ChartRow>
            <AreaChartCard title={`${hubName} Completion Trend`} subtitle="Monthly average for this hub" data={hubData.area} dataKey="value" color="#3b82f6" />
            <BarChartCard  title="At-Risk Grade Overview"          subtitle="Completion % by grade"        data={[{name:'G7',pct:85},{name:'G8',pct:52},{name:'G9',pct:71}]} dataKey="pct" color="#7c3aed" />
          </ChartRow>
          <ActivityFeed title="At-Risk Alerts" subtitle={`Issues flagged within ${hubName}`} items={hubData.atRisk || []} />
        </>
      )}
    </div>
  );
};

/* ── License View ────────────────────────────────────────── */
const LicenseView = () => {
  const [keys, setKeys] = React.useState([
    { id: 'LIC-CH-2024-A1',  hub: 'HUB-CH-01',  seats: 3000, used: 2845, expires: 'Dec 2025', status: 'active' },
    { id: 'LIC-CBE-2024-B2', hub: 'HUB-CBE-02', seats: 1500, used: 1240, expires: 'Mar 2026', status: 'active' },
    { id: 'LIC-MDU-2025-C1', hub: 'HUB-MDU-03', seats: 2000, used: 0,    expires: 'Jun 2026', status: 'pending' },
  ]);

  const handleGenerate = () => {
    const key = generateLicenseKey('NEW');
    setKeys([{ id: key, hub: 'HUB-NEW', seats: 1000, used: 0, expires: 'Dec 2026', status: 'pending' }, ...keys]);
  };

  const handleCopy = (keyStr) => {
    navigator.clipboard.writeText(keyStr);
    addNotification({ title: 'Copied to Clipboard', body: `License key ${keyStr} copied.`, type: 'info' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">License Management</h2><p className="text-zinc-500 text-sm mt-1">Hub seat quotas and activation keys.</p></div>
        <button onClick={handleGenerate} className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"><Key className="w-3.5 h-3.5" /> Generate Key</button>
      </div>
      <div className="space-y-4">
        {keys.map((k) => {
          const pct = k.seats ? Math.min((k.used / k.seats) * 100, 100) : 0;
          return (
            <SectionCard key={k.id}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div><div className="flex items-center gap-2 mb-1"><code className="text-sm font-black text-primary font-mono">{k.id}</code><button onClick={() => handleCopy(k.id)} className="text-zinc-600 hover:text-white transition-colors"><Copy className="w-3.5 h-3.5" /></button></div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hub: {k.hub} · Expires: {k.expires}</p></div>
                {k.status === 'active'
                  ? <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0">Active</span>
                  : <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0">Pending</span>}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-zinc-500">Seats Used</span><span className="text-white">{k.used.toLocaleString()} / {k.seats.toLocaleString()}</span></div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${pct > 90 ? 'bg-amber-500' : 'bg-primary'}`} /></div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
};

/* ── Certificates ────────────────────────────────────────── */
const CertificatesView = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState('');
  const [certType, setCertType] = React.useState('AI Innovation Lab - Beginner');

  const { users } = useStore();
  const [certificates, setCertificates] = React.useState([]);

  const fetchData = async () => {
    const allCerts = await DB.getCertificates();
    setCertificates(allCerts);
  };

  React.useEffect(() => { fetchData(); }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const s = users.find(u => u.id === selectedStudent);
    await DB.issueCertificate(selectedStudent, certType, user?.name || 'Super Admin', s?.schoolId);
    addNotification({ 
      title: 'Certificate Issued', 
      body: `You have been awarded the ${certType} credential!`, 
      type: 'success',
      targetUser: selectedStudent
    });
    setShowModal(false);
    setSelectedStudent('');
    fetchData();
  };

  const handleRevoke = async (id) => {
    await DB.revokeCertificate(id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Global Certificate Ledger</h2>
          <p className="text-zinc-500 text-sm mt-1">Platform-wide overview of all issued credentials.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
          <Award className="w-3.5 h-3.5" /> Issue Credential
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800">
            <tr>{['ID / Link', 'Student', 'Credential', 'Issued By', 'Date', 'Actions'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {certificates.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No certificates issued yet.</td></tr>
            ) : (
              certificates.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.01] transition-all group">
                  <td className="px-6 py-4 text-[10px] font-mono text-primary font-bold">{c.id}</td>
                  <td className="px-6 py-4 font-bold text-white text-sm">{c.studentName}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">{c.title}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-500">{c.issuedBy}</td>
                  <td className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">{c.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleRevoke(c.id)} className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue Certificate Global">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Select Student (Global Search)</label>
            <select required value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50">
              <option value="" disabled>Choose a student...</option>
              {users.filter(u => u.role === 'student').map(s => <option key={s.id} value={s.id}>{s.name} ({s.schoolId})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Credential Type</label>
            <select value={certType} onChange={(e) => setCertType(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50">
              <option value="AI Innovation Lab - Beginner">AI Innovation Lab - Beginner</option>
              <option value="Robotics Foundation">Robotics Foundation</option>
              <option value="Python Programming 101">Python Programming 101</option>
              <option value="IoT Excellence">IoT Excellence</option>
              <option value="Global Excellence Award">Global Excellence Award</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-primary text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">Issue Credential</button>
        </form>
      </Modal>
    </div>
  );
};

/* ── System Attendance ───────────────────────────────────── */
const SchoolAttendanceView = ({ selectedHub }) => {
  const { users, attendance = [], teacherAttendance = [], leaves = [], hubs } = useStore();
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = React.useState('students');

  const isAll = !selectedHub || selectedHub === 'ALL';
  const hubName = !isAll ? (hubs?.find(h => h.id === selectedHub)?.name || selectedHub) : null;

  // Hub-filtered data
  const allStudents = users.filter(u => u.role === 'student');
  const allTeachers = users.filter(u => u.role === 'teacher');
  const students = isAll ? allStudents : allStudents.filter(u => u.schoolId === selectedHub);
  const teachers = isAll ? allTeachers : allTeachers.filter(u => u.schoolId === selectedHub);

  const currentRecords = attendance.filter(a => a.date === selectedDate);
  const currentTeacherRecords = teacherAttendance.filter(a => a.date === selectedDate);

  const leaveRequests = leaves.filter(l => l.status === 'pending');

  // Hub overview stats when ALL is selected
  const hubAttendanceSummary = isAll ? (hubs || []).map(hub => {
    const hubStudents = allStudents.filter(u => u.schoolId === hub.id);
    const presentCount = currentRecords.filter(r => hubStudents.some(s => s.id === r.studentId) && r.status === 'present').length;
    const total = hubStudents.length;
    return { hub, total, present: presentCount, pct: total ? Math.round((presentCount / total) * 100) : 0 };
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">System Attendance</h2>
          {isAll
            ? <p className="text-zinc-500 text-sm mt-1">Platform-wide attendance monitoring. Select a hub to view hub-specific logs.</p>
            : <p className="text-sm mt-1"><span className="text-primary font-black">{hubName}</span> <span className="text-zinc-500">· Attendance logs for this hub only.</span></p>
          }
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* When ALL hubs selected — show hub-wise summary grid */}
      {isAll && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubAttendanceSummary.map(({ hub, total, present, pct }) => (
            <motion.div
              key={hub.id}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{hub.id}</p>
                  <p className="text-sm font-black text-white mt-0.5 leading-tight">{hub.name}</p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">{hub.location}</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                  pct >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : pct >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}>{pct}%</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center mb-3">
                <div className="bg-zinc-900/50 rounded-xl p-2">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Present</p>
                  <p className="text-lg font-black text-emerald-400">{present}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-2">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Total</p>
                  <p className="text-lg font-black text-white">{total}</p>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    pct >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : pct >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                              : 'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* When specific hub selected — show banner */}
      {!isAll && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
          <Database className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-bold text-zinc-300">Showing attendance data for <span className="text-primary font-black">{hubName}</span> ({selectedHub}) only. Switch to <span className="text-zinc-400 font-bold">All Hubs</span> to see the platform overview.</p>
        </div>
      )}

      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-800">
        {[
          { id: 'students', label: 'Student Logs', icon: Users },
          { id: 'teachers', label: 'Staff Logs', icon: UserCheck },
          { id: 'leaves',   label: 'Leave Requests', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-white'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'leaves' && leaveRequests.length > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] animate-pulse">{leaveRequests.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'students' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>{['Student', 'Hub', 'Grade', 'Status'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {students.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No students {isAll ? '' : `in ${hubName}`}.</td></tr>
              ) : (
                students.map((s) => {
                  const record = currentRecords.find(a => a.studentId === s.id);
                  const status = record?.status || 'unmarked';
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.01]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">{s.name[0]}</div>
                          <p className="text-sm font-bold text-white">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-500">{s.schoolId || 'Platform'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-500">Grade {s.grade}</td>
                      <td className="px-6 py-4">
                        {status === 'present' && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">Present</span>}
                        {status === 'late' && <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">Late</span>}
                        {status === 'absent' && <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">Absent</span>}
                        {status === 'unmarked' && <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-md">Unmarked</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>{['Teacher', 'Hub', 'Check-In', 'Check-Out', 'Status'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {teachers.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No teachers {isAll ? '' : `in ${hubName}`}.</td></tr>
              ) : (
                teachers.map((t) => {
                  const record = currentTeacherRecords.find(a => a.teacherId === t.id);
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.01]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">{t.name[0]}</div>
                          <p className="text-sm font-bold text-white">{t.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-500">{t.schoolId || '—'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-white">{record?.checkIn || '--:--'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-white">{record?.checkOut || '--:--'}</td>
                      <td className="px-6 py-4">
                        {record ? (
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">On Duty</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-md">Off Duty</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>{['Student', 'Hub', 'Dates', 'Reason', 'Status'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {leaves.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No leave applications.</td></tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{l.studentName || 'Student'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-500">{l.hubId || l.schoolId || '—'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-white">{l.startDate} to {l.endDate}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500 italic max-w-xs truncate">{l.reason}</td>
                    <td className="px-6 py-4">
                      {l.status === 'pending' && <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">Pending</span>}
                      {l.status === 'approved' && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">Approved</span>}
                      {l.status === 'rejected' && <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">Rejected</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ── Rollout Manager View ────────────────────────────────── */
const RolloutManagerView = () => {
  const { hubs } = useStore();
  const [rollouts, setRollouts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    version: '',
    title: '',
    description: '',
    channel: 'stable',
    targetHubs: [],
    scheduledDate: '',
    scheduledTime: '23:59',
    changelogRaw: ''
  });

  const fetchRollouts = async () => {
    setLoading(true);
    try {
      const res = await DB.getRollouts();
      if (res && !res.error) {
        setRollouts(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRollouts();
  }, []);

  const handleToggleHub = (hubId) => {
    setFormData(prev => {
      const exists = prev.targetHubs.includes(hubId);
      if (exists) {
        return { ...prev, targetHubs: prev.targetHubs.filter(id => id !== hubId) };
      } else {
        return { ...prev, targetHubs: [...prev.targetHubs, hubId] };
      }
    });
  };

  const handleCreateRollout = async (e) => {
    e.preventDefault();
    
    // Parse scheduled datetime
    let scheduledAt = null;
    if (formData.scheduledDate) {
      scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    } else {
      // Default to tomorrow midnight
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      scheduledAt = tomorrow;
    }

    const changelog = formData.changelogRaw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const payload = {
      version: formData.version,
      title: formData.title,
      description: formData.description,
      channel: formData.channel,
      targetHubs: formData.targetHubs,
      scheduledAt,
      changelog
    };

    try {
      const res = await DB.createRollout(payload);
      if (res && !res.error) {
        addNotification({
          title: 'Rollout Scheduled',
          body: `Version ${payload.version} rollout has been scheduled.`,
          type: 'success'
        });
        setShowForm(false);
        setFormData({
          version: '',
          title: '',
          description: '',
          channel: 'stable',
          targetHubs: [],
          scheduledDate: '',
          scheduledTime: '23:59',
          changelogRaw: ''
        });
        fetchRollouts();
      } else {
        addNotification({
          title: 'Rollout Failed',
          body: res?.error || 'Failed to schedule rollout.',
          type: 'error'
        });
      }
    } catch (err) {
      addNotification({
        title: 'Error',
        body: err.message,
        type: 'error'
      });
    }
  };

  const handleUpdateStatus = async (rolloutId, status) => {
    try {
      const res = await DB.updateRolloutStatus(rolloutId, status);
      if (res && !res.error) {
        addNotification({
          title: 'Rollout Updated',
          body: `Rollout status set to ${status}.`,
          type: 'success'
        });
        fetchRollouts();
      } else {
        addNotification({
          title: 'Update Failed',
          body: res?.error || 'Failed to update rollout status.',
          type: 'error'
        });
      }
    } catch (err) {
      addNotification({
        title: 'Error',
        body: err.message,
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" /> Version Rollout Manager
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Deploy new update releases, configure rollout schedules, and track application across hubs.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
        >
          {showForm ? 'View Timeline' : 'Schedule Rollout'}
        </button>
      </div>

      {showForm ? (
        <SectionCard className="border border-zinc-800 bg-zinc-950/40 backdrop-blur-md">
          <form onSubmit={handleCreateRollout} className="space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-zinc-850 pb-2">Create Scheduled Release</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Version Code</label>
                <input 
                  required 
                  type="text" 
                  value={formData.version} 
                  onChange={(e) => setFormData({...formData, version: e.target.value})} 
                  placeholder="e.g. v2.5.0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Release Title</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Interactive Code Playground Integration"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Release Summary</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="A brief overview of what this version update accomplishes..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Deployment Channel</label>
                <select 
                  value={formData.channel} 
                  onChange={(e) => setFormData({...formData, channel: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="stable">Stable Release</option>
                  <option value="beta">Beta Testing</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Scheduled Date (Midnight Release)</label>
                <input 
                  type="date" 
                  value={formData.scheduledDate} 
                  onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Release Time</label>
                <input 
                  type="time" 
                  value={formData.scheduledTime} 
                  onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Changelog items (One change per line)</label>
              <textarea 
                value={formData.changelogRaw} 
                onChange={(e) => setFormData({...formData, changelogRaw: e.target.value})} 
                placeholder="- Added sandboxed JS compilation engine&#10;- Integrated custom Gemini debugging chatbot&#10;- Restructured global dashboard menu"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 h-32 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Target Hubs (Select none for ALL hubs)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl">
                {hubs.map((hub) => (
                  <label key={hub.id} className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-white">
                    <input 
                      type="checkbox" 
                      checked={formData.targetHubs.includes(hub.id)} 
                      onChange={() => handleToggleHub(hub.id)}
                      className="rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-zinc-900"
                    />
                    <span>{hub.name} ({hub.id})</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
              Deploy Schedule
            </button>
          </form>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 font-bold text-xs">Loading rollouts...</div>
          ) : rollouts.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-16 text-center text-zinc-500 font-bold text-xs">No rollouts scheduled yet. Click "Schedule Rollout" to deploy updates.</div>
          ) : (
            <div className="space-y-4">
              {rollouts.map((r) => {
                const isAllHubs = !r.targetHubs || r.targetHubs.length === 0;
                
                return (
                  <SectionCard key={r.id} className="border border-zinc-800 bg-zinc-950/40 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-900 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <code className="text-sm font-black text-primary font-mono">{r.version}</code>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            r.channel === 'stable' 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {r.channel}
                          </span>
                          
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            r.status === 'applied' 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : r.status === 'scheduled'
                              ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                              : r.status === 'rolled-back'
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        
                        <h3 className="text-base font-black font-headline text-white mt-1.5">{r.title}</h3>
                        <p className="text-zinc-500 text-xs mt-1">{r.description}</p>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-left md:text-right space-y-0.5">
                          <p>Scheduled: {r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : 'N/A'}</p>
                          {r.appliedAt && <p className="text-emerald-400">Applied: {new Date(r.appliedAt).toLocaleString()}</p>}
                          <p className="text-zinc-600">Created: {new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex gap-2 mt-1">
                          {r.status !== 'applied' && r.status !== 'rolled-back' && (
                            <button 
                              onClick={() => handleUpdateStatus(r.id, 'applied')}
                              className="text-[9px] font-black text-emerald-400 hover:text-white bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500 px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
                            >
                              Apply Now
                            </button>
                          )}
                          {r.status === 'applied' && (
                            <button 
                              onClick={() => handleUpdateStatus(r.id, 'rolled-back')}
                              className="text-[9px] font-black text-rose-400 hover:text-white bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
                            >
                              Rollback
                            </button>
                          )}
                          {r.status === 'scheduled' && (
                            <button 
                              onClick={() => handleUpdateStatus(r.id, 'pending')}
                              className="text-[9px] font-black text-zinc-500 hover:text-white bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Changelog Details</p>
                        {r.changelog && r.changelog.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-xs">
                            {r.changelog.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-zinc-655 italic">No changelog specified.</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Target Scope</p>
                        <div className="flex flex-wrap gap-1.5">
                          {isAllHubs ? (
                            <span className="text-[9px] font-black text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full uppercase tracking-wider">All Hubs (Global)</span>
                          ) : (
                            r.targetHubs.map(hubId => (
                              <span key={hubId} className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {hubId}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Community View (Admin: Hub-wise) ───────────────────── */
const TAG_COLORS = {
  Announcement: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Discussion:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Platform:     'text-primary bg-primary/10 border-primary/20',
  Showcase:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Event:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};
const ROLE_COLORS = {
  admin: 'text-primary bg-primary/10',
  'school-admin': 'text-emerald-400 bg-emerald-500/10',
  teacher: 'text-amber-400 bg-amber-500/10',
  student: 'text-zinc-400 bg-zinc-800',
};

const CommunityView = ({ selectedHub }) => {
  const { posts, hubs } = useStore();
  const [searchQ, setSearchQ] = React.useState('');
  const [tagFilter, setTagFilter] = React.useState('ALL');

  const isAll = !selectedHub || selectedHub === 'ALL';
  const hubName = !isAll ? (hubs?.find(h => h.id === selectedHub)?.name || selectedHub) : null;

  // Since store posts don't have schoolId, we simulate hub-wise by author role/tag.
  // In a real system posts would carry schoolId; for now show all posts with hub banner.
  const filteredPosts = posts.filter(p => {
    const matchTag = tagFilter === 'ALL' || p.tag === tagFilter;
    const matchSearch = !searchQ || p.body.toLowerCase().includes(searchQ.toLowerCase()) || p.author.toLowerCase().includes(searchQ.toLowerCase());
    return matchTag && matchSearch;
  });

  const allTags = ['ALL', ...new Set(posts.map(p => p.tag))];

  // Hub-wise post counts (simulated)
  const HUB_POST_COUNTS = { 'HUB-CH-01': 3, 'HUB-CBE-02': 2 };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white flex items-center gap-2">
            Community Hub
          </h2>
          {isAll
            ? <p className="text-zinc-500 text-sm mt-1">Platform-wide discussions, announcements, and showcases. Select a hub to filter.</p>
            : <p className="text-sm mt-1"><span className="text-primary font-black">{hubName}</span> <span className="text-zinc-500">· Community posts from this hub.</span></p>
          }
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search posts..."
              className="bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary/50 placeholder:text-zinc-600 w-48"
            />
          </div>
        </div>
      </div>

      {/* Hub overview when ALL is selected */}
      {isAll && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(hubs || []).map(hub => (
            <motion.div
              key={hub.id}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{hub.id}</p>
                  <p className="text-sm font-black text-white mt-0.5 leading-tight">{hub.name}</p>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full border text-primary bg-primary/10 border-primary/20">
                  {HUB_POST_COUNTS[hub.id] || 0} posts
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">{hub.location} · Community active</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tag filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setTagFilter(tag)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
              tagFilter === tag
                ? 'bg-primary border-primary text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-600'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {!isAll && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
          <Database className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-bold text-zinc-300">Showing posts from <span className="text-primary font-black">{hubName}</span>. Switch to <span className="text-zinc-400 font-bold">All Hubs</span> to see platform-wide activity.</p>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 font-bold text-xs">No posts match the current filter.</div>
        ) : (
          filteredPosts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/60 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${ROLE_COLORS[post.role] || 'text-zinc-400 bg-zinc-800'}`}>
                  {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm font-black text-white">{post.author}</span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_COLORS[post.role] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>{post.role}</span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${TAG_COLORS[post.tag] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>{post.tag}</span>
                    <span className="text-[9px] text-zinc-600 font-bold ml-auto">{post.time}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{post.body}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[10px] font-bold text-zinc-600">❤ {post.likes} likes</span>
                    <span className="text-[10px] font-bold text-zinc-600">💬 {post.comments} comments</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

/* ── Bug Tracker View ────────────────────────────────────── */
const BugTrackerView = () => {
  const [bugs, setBugs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [severityFilter, setSeverityFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const res = await DB.getBugs();
      if (res && !res.error) {
        setBugs(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBugs();
  }, []);

  const handleUpdateStatus = async (bugId, newStatus) => {
    try {
      const res = await DB.updateBugStatus(bugId, newStatus);
      if (res && !res.error) {
        addNotification({
          title: 'Bug Status Updated',
          body: `Bug status updated to ${newStatus}.`,
          type: 'success'
        });
        fetchBugs();
      } else {
        addNotification({
          title: 'Update Failed',
          body: res?.error || 'Failed to update bug status.',
          type: 'error'
        });
      }
    } catch (err) {
      addNotification({
        title: 'Error',
        body: err.message,
        type: 'error'
      });
    }
  };

  const filteredBugs = bugs.filter(b => {
    const matchesSev = severityFilter === 'ALL' || b.severity === severityFilter.toLowerCase();
    const matchesStat = statusFilter === 'ALL' || b.status === statusFilter.toLowerCase();
    return matchesSev && matchesStat;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-rose-500 animate-pulse" /> Global Bug Tracker
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Monitor, categorize, and resolve issues reported by teachers, students, and administrators.</p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="text-[8px] font-black uppercase text-zinc-650 block mb-1">Severity</label>
            <select 
              value={severityFilter} 
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-zinc-650 block mb-1">Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN-PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800 bg-zinc-950/20">
              <tr>
                {['Bug ID', 'Reporter', 'Summary & Description', 'Page/Route', 'Severity', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">Loading reported issues...</td>
                </tr>
              ) : filteredBugs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No bug reports match your filter criteria.</td>
                </tr>
              ) : (
                filteredBugs.map((b) => {
                  const severityColors = {
                    low: 'text-zinc-400 bg-zinc-800 border-zinc-700',
                    medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    high: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse'
                  };
                  
                  const statusColors = {
                    open: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                    acknowledged: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    'in-progress': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    closed: 'text-zinc-500 bg-zinc-800 border-zinc-700'
                  };

                  return (
                    <tr key={b.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono font-bold text-zinc-500">{b.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-white">{b.reporterName || 'Anonymous'}</p>
                          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                            {b.reporterRole} {b.hubId && `· ${b.hubId}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-white">{b.title}</p>
                          <p className="text-[11px] text-zinc-400 leading-relaxed break-words whitespace-pre-wrap">{b.description}</p>
                          <p className="text-[9px] text-zinc-650 font-bold">Reported on {new Date(b.createdAt).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] font-mono text-zinc-400 bg-zinc-950/40 px-2 py-1 border border-zinc-800/80 rounded-md">
                          {b.page || '/'}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${severityColors[b.severity] || severityColors.low}`}>
                          {b.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColors[b.status] || statusColors.open}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={b.status} 
                          onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                        >
                          <option value="open">Open</option>
                          <option value="acknowledged">Acknowledge</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Main ────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHub, setSelectedHub] = React.useState('ALL');
  const [stats, setStats] = React.useState(null);
  const { hubs, maintenanceMode } = useStore();
  const activeView = searchParams.get('v') || 'dashboard';

  React.useEffect(() => {
    const fetchStats = async () => {
      const st = await DB.getDashboardStats('admin');
      setStats(st);
      const schools = await DB.getSchools();
      setHubs(schools);
    };
    fetchStats();
  }, []);

  const views = {
    dashboard:        <DashboardView stats={stats} onNavigate={(v) => setSearchParams({ v })} />,
    users:            <UsersView />,
    schools:          <HubRegistryView />,
    certificates:     <CertificatesView />,
    activation:       <LicenseView />,
    attendance:       <SchoolAttendanceView selectedHub={selectedHub} />,
    analytics:        <AnalyticsView selectedHub={selectedHub} />,
    'exam-analytics': <ExamAnalytics selectedHub={selectedHub} />,
    community:        <CommunityView selectedHub={selectedHub} />,
    system:           <SystemMonitorView stats={stats} />,
    rollouts:         <RolloutManagerView />,
    bugs:             <BugTrackerView />,
  };

  return (
    <div>
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-2 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Super Admin · Command Center v2.4</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
              maintenanceMode 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-lg shadow-amber-500/10' 
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            {maintenanceMode ? 'Maintenance ON' : 'Maintenance Mode'}
          </button>
          <select value={selectedHub} onChange={(e) => setSelectedHub(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer focus:outline-none">
            <option value="ALL">All Hubs</option>
            {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <button className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all"><SettingsIcon className="w-4 h-4" /></button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {views[activeView] || views.dashboard}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
