import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, UserCog, BarChart3, TrendingUp, Activity, ArrowRight, PlusCircle, Search, Download, CheckCircle2, AlertCircle, Award, Eye, Calendar, Lock, AlertTriangle, UserCheck, FileText, MapPin, Clock, ThumbsUp, ThumbsDown, Inbox, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DB from '../lib/db';
import { getHubData } from '../lib/mapping';
import useStore from '../hooks/useStore';
import { addUser, removeUser, updateUser, exportCSV, addNotification, markAttendance, updateLeaveStatus, submitGrade, submitAssignment } from '../lib/store';
import Modal from '../components/Modal';
import html2pdf from 'html2pdf.js';
import CertificateTemplate from '../components/CertificateTemplate';
import ExamAnalytics from './ExamAnalytics';

import {
  PageHeader, KpiGrid, KpiCard, ChartRow,
  AreaChartCard, BarChartCard, ActivityFeed, SectionCard,
} from '../components/DashboardShell';

const HEAT = {
  emerald: { card: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  blue:    { card: 'bg-blue-500/10 border-blue-500/20',       text: 'text-blue-400' },
  amber:   { card: 'bg-amber-500/10 border-amber-500/20',     text: 'text-amber-400' },
  zinc:    { card: 'bg-zinc-800/60 border-zinc-700',           text: 'text-zinc-500' },
};



/* ── Overview ─────────────────────────────────────────────── */
const OverviewView = ({ schoolData, stats }) => {
  const [calibrating, setCalibrating] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isRebooted, setIsRebooted] = useState(false);

  // Fallback hub metrics if not present
  const metrics = stats?.hubLoadMetrics || {
    aiQuotaUsed: 14245,
    aiQuotaLimit: 20000,
    activeClients: 342,
    maxClients: 500,
    routerCpu: 42,
    routerMem: 58,
    iotStatus: { online: 58, total: 60 }
  };

  const aiPercentage = Math.round((metrics.aiQuotaUsed / metrics.aiQuotaLimit) * 100);
  const clientPercentage = Math.round((metrics.activeClients / metrics.maxClients) * 100);

  const handleCalibrate = () => {
    setCalibrating(true);
    setIsCalibrated(false);
    setTimeout(() => {
      setCalibrating(false);
      setIsCalibrated(true);
      addNotification({
        title: 'Diagnostics Complete',
        body: 'GPS Proximity Server calibrated successfully.',
        type: 'success'
      });
    }, 2500);
  };

  const handleReboot = () => {
    setRebooting(true);
    setIsRebooted(false);
    setTimeout(() => {
      setRebooting(false);
      setIsRebooted(true);
      addNotification({
        title: 'Router Rebooted',
        body: 'Lab Router rebooted and all 58/60 IoT kits reconnected successfully.',
        type: 'success'
      });
    }, 3000);
  };

  return (
    <div>
      <PageHeader title={schoolData.name} subtitle="Institutional overview — here's your hub's current performance." />
      <KpiGrid>
        <KpiCard label="Total Students"  value={schoolData.studentCount} change={stats?.kpis?.studentsChange || "0"}   changeLabel="this term"    icon={Users}    iconBg="bg-primary/15"    iconColor="text-primary"     delay={0.05} />
        <KpiCard label="Teachers"        value={schoolData.teacherCount} change={stats?.kpis?.teachersChange || "0"}    changeLabel="new hire"      icon={UserCog}  iconBg="bg-blue-500/15"   iconColor="text-blue-400"    delay={0.1}  />
        <KpiCard label="Quota Used"      value={schoolData.quotaUsed}    change="+4.2%" changeLabel="of seat limit"  icon={Activity} iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.15} />
        <KpiCard label="Active Grades"   value="6 – 9"                   change="4"     changeLabel="grade levels"   icon={BarChart3} iconBg="bg-secondary/15"  iconColor="text-secondary"  delay={0.2}  />
      </KpiGrid>
      
      <ChartRow>
        <AreaChartCard title="Weekly Active Users" subtitle="Hub attendance across all grades" data={stats?.hubTrendData || []} dataKey="active" color="#10b981" delay={0.2} />
        <BarChartCard  title="Grade Distribution"  subtitle="Total student enrollment by grade" data={stats?.gradeDistData || []}  dataKey="val" color="#3b82f6" delay={0.25} />
      </ChartRow>

      {/* Local Hub Server & Gateway Health Card */}
      <SectionCard
        title="Local Hub Server & Gateway Health"
        subtitle="Real-time monitoring of school AI quotas, edge gateway nodes, and lab connections."
        delay={0.28}
        className="mb-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* AI Usage Quota Progress Bar */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AI Request Quota</p>
                <h4 className="text-sm font-bold text-white mt-1">Monthly Allocation</h4>
              </div>
              <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                aiPercentage > 85 ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                aiPercentage > 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {aiPercentage}% Used
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-zinc-400">{metrics.aiQuotaUsed.toLocaleString()} queries</span>
                <span className="font-bold text-zinc-500">/ {metrics.aiQuotaLimit.toLocaleString()} limit</span>
              </div>
              <div className="h-2.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    aiPercentage > 85 ? 'bg-red-500' :
                    aiPercentage > 70 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${aiPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {aiPercentage > 85 ? 'Warning: Quota limit nearly exceeded. Contact administrator to scale keys.' :
                 aiPercentage > 70 ? 'Alert: Approaching quota warning threshold.' :
                 'System operating normally within standard allocation limits.'}
              </p>
            </div>
          </div>

          {/* IoT Gateway Status */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">IoT Lab Gateway</p>
              <h4 className="text-sm font-bold text-white mt-1">Hardware Kits Connectivity</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active Kits</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-emerald-400">{metrics.iotStatus.online}</span>
                  <span className="text-xs text-zinc-600">/ {metrics.iotStatus.total}</span>
                </div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Connected Clients</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-white">{metrics.activeClients}</span>
                  <span className="text-xs text-zinc-600">/ {metrics.maxClients}</span>
                </div>
              </div>
            </div>

            {/* Router status stats */}
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 pt-1">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> CPU: {metrics.routerCpu}%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> MEM: {metrics.routerMem}%</span>
              <span className="text-emerald-400">Online</span>
            </div>
          </div>

          {/* Diagnostic Controls */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Diagnostics</p>
              <h4 className="text-sm font-bold text-white mt-1">Local Control Actions</h4>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCalibrate}
                disabled={calibrating}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 disabled:opacity-50 transition-all group text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                  GPS Proximity Calibrate
                </span>
                {calibrating ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : isCalibrated ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce shrink-0" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shrink-0" />
                )}
              </button>

              <button
                onClick={handleReboot}
                disabled={rebooting}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 disabled:opacity-50 transition-all group text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                  Reboot Lab Router
                </span>
                {rebooting ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : isRebooted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce shrink-0" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Heatmap */}
      <SectionCard title="Grade Performance Heatmap" subtitle="This term's completion scores by grade" delay={0.3} className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {[{ grade: '6', score: '88%', status: 'Excellent', heat: 'emerald' }, { grade: '7', score: '72%', status: 'Good', heat: 'blue' }, { grade: '8', score: '54%', status: 'Moderate', heat: 'amber' }, { grade: '9', score: 'N/A', status: 'Pending', heat: 'zinc' }].map((g) => (
            <div key={g.grade} className="text-center space-y-2">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Grade {g.grade}</p>
              <div className={`h-28 ${HEAT[g.heat].card} border rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:scale-[1.02] transition-all`}>
                <span className={`text-2xl font-black font-headline ${HEAT[g.heat].text}`}>{g.score}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{g.status}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <ActivityFeed title="Hub Activity" subtitle="Latest events at your institution" delay={0.35} items={[
        { name: 'Robotics Workshop', action: 'Scheduled — Tomorrow 10:00 AM, Lab A',     time: 'Upcoming',  tag: 'now',    avatar: '🤖', avatarBg: 'bg-primary/20',   avatarColor: 'text-primary' },
        { name: 'AI Ethics Seminar', action: 'Friday, 2:00 PM — Main Hall',             time: 'This week', tag: 'recent', avatar: '💡', avatarBg: 'bg-secondary/20', avatarColor: 'text-secondary' },
        { name: 'Grade 6 Insight',   action: '+12% completion increase this week',       time: '2h ago',    tag: 'recent', avatar: '📈', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' },
        { name: 'At-Risk Alert',     action: '8 students need immediate attention',      time: '1 day ago', tag: 'warning', avatar: '!', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' },
      ]} />
    </div>
  );
};

/* ── Users View ──────────────────────────────────────────── */
const UsersView = () => {
  const { users } = useStore();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student', grade: 6, status: 'active' });
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  const schoolUsers = users.filter(u => u.schoolId === user?.schoolId);
  const filtered = schoolUsers.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      (u.status || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setSaveError('');
    setFormData({ name: u.name, email: u.email, role: u.role, grade: u.grade || 6, status: u.status || 'active' });
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setSaveError('');
    setFormData({ name: '', email: '', role: 'student', grade: 6, status: 'active' });
    setShowModal(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          grade: formData.role === 'student' ? Number(formData.grade) : null,
          status: formData.status
        });
        addNotification({ title: 'Member Updated', body: `${formData.name} has been updated successfully.`, type: 'success' });
      } else {
        await addUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          schoolId: user?.schoolId,
          grade: formData.role === 'student' ? Number(formData.grade) : null,
          status: formData.status
        });
        addNotification({ title: 'Member Added', body: `${formData.name} has been added successfully.`, type: 'success' });
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Failed to save member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (u) => {
    if (!confirm(`Remove ${u.name}? This action cannot be undone.`)) return;
    try {
      await removeUser(u.id);
    } catch (err) {
      addNotification({ title: 'Error', body: err.message || 'Failed to remove member.', type: 'error' });
    }
  };

  const handleExport = () => {
    exportCSV(filtered.map(u => ({ Name: u.name, Email: u.email, Role: u.role, Grade: u.grade, Status: u.status })), 'members_export.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Manage Users</h2><p className="text-zinc-500 text-sm mt-1">Manage institution members.</p></div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all"><Download className="w-3.5 h-3.5" /> Export</button>
          <button onClick={handleOpenAdd} className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"><PlusCircle className="w-3.5 h-3.5" /> Add Member</button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
        <div className="flex gap-2">{['all', 'student', 'teacher'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-white'}`}>{f}</button>)}</div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <span className="text-[9px] font-black bg-zinc-800/60 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-400 uppercase tracking-widest">
            {filtered.length} active records
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-500 text-sm font-bold">No members found.</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((u) => {
              // Role-based design tokens
              let roleConfig = {
                badge: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
                avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
                border: 'border-zinc-800/80 hover:border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.05)]'
              };
              if (u.role === 'teacher') {
                roleConfig = {
                  badge: 'border-purple-500/20 text-purple-400 bg-purple-500/10',
                  avatarBg: 'bg-gradient-to-tr from-purple-600 to-pink-500',
                  border: 'border-zinc-800/80 hover:border-purple-500/30 shadow-[0_0_20px_-5px_rgba(168,85,247,0.05)]'
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
                        {u.role}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-3.5 border-t border-zinc-900/60">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-zinc-500 uppercase tracking-wider">Role Type</span>
                        <span className="font-bold text-zinc-400 uppercase">{u.role}</span>
                      </div>
                      {u.role === 'student' && u.grade && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-zinc-500 uppercase tracking-wider">Class Grade</span>
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
                      onClick={() => handleRemoveMember(u)}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? "Edit Institution Member" : "Add Institution Member"}>
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Full Name</label><input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" placeholder="e.g. John Doe" /></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Email Address</label><input required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" placeholder="john@21stc.school" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Role</label><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"><option value="student">Student</option><option value="teacher">Teacher</option></select></div>
            {formData.role === 'student' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Grade</label>
                <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                  {[6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
            )}
          </div>
          {editingUser && (
            <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          )}
          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 font-bold">{saveError}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {saving && <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
            {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Add Member'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

/* ── Analytics ────────────────────────────────────────────── */
const termTrend = [
  { name: 'Month 1', pct: 45 }, { name: 'Month 2', pct: 60 }, { name: 'Month 3', pct: 72 }, { name: 'Month 4', pct: 88 }
];
const gradeBar = [
  { name: 'Grade 6', score: 85 }, { name: 'Grade 7', score: 72 }, { name: 'Grade 8', score: 65 }, { name: 'Grade 9', score: 90 }
];

const AnalyticsView = () => (
  <div>
    <div className="flex items-end justify-between mb-6">
      <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Institution Reports</h2><p className="text-zinc-500 text-sm mt-1">Performance and engagement analytics for this hub.</p></div>
      <button onClick={() => addNotification({ title: 'Downloading...', body: 'Analytics_Report.pdf is generating.', type: 'info' })} className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all print:hidden"><Download className="w-3.5 h-3.5" /> Export PDF</button>
    </div>
    <KpiGrid>
      <KpiCard label="Avg Completion"  value="76%"   change="+6%"  icon={Activity}  iconBg="bg-primary/15"    iconColor="text-primary"     delay={0} />
      <KpiCard label="Lesson Hours"    value="1,240" change="+180" changeLabel="this term" icon={BarChart3} iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.05} />
      <KpiCard label="Certifications"  value="84"    change="+14"  icon={Users}     iconBg="bg-secondary/15"  iconColor="text-secondary"   delay={0.1} />
      <KpiCard label="At-Risk Students" value="8"   change="-3"   icon={TrendingUp} iconBg="bg-amber-500/15" iconColor="text-amber-400"   delay={0.15} />
    </KpiGrid>
    <ChartRow>
      <AreaChartCard title="Completion Rate Trend" subtitle="Monthly average across all grades" data={termTrend} dataKey="pct" color="#10b981" />
      <BarChartCard  title="Grade Performance"     subtitle="Completion % by grade"             data={gradeBar} dataKey="score" color="#7c3aed" />
    </ChartRow>
  </div>
);

/* ── Certificates ─────────────────────────────────────────── */
const CertificatesView = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [certType, setCertType] = useState('AI Innovation Lab - Beginner');

  const [hubStudents, setHubStudents] = useState([]);
  const [hubCerts, setHubCerts] = useState([]);

  const certRef = useRef(null);
  const [activeCert, setActiveCert] = useState(null);

  const fetchData = async () => {
    if (user?.schoolId) {
      const [studentsData, certsData] = await Promise.all([
        DB.getUsersBySchool(user.schoolId),
        DB.getCertificates({ schoolId: user.schoolId })
      ]);
      setHubStudents(studentsData.filter(u => u.role === 'student'));
      setHubCerts(certsData);
    }
  };

  useEffect(() => { fetchData(); }, [user?.schoolId]);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    await DB.issueCertificate(selectedStudent, certType, user?.name || 'Hub Admin', user?.schoolId);
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

  const handleDownload = (cert) => {
    setActiveCert(cert);
    addNotification({ title: 'Generating PDF...', body: `Certificate ${cert.id}.pdf is being generated.`, type: 'info' });
    
    setTimeout(() => {
      if (certRef.current) {
        const opt = {
          margin:       0,
          filename:     `${cert.title.replace(/\s+/g, '_')}_Certificate.pdf`,
          image:        { type: 'jpeg', quality: 1 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'px', format: [1123, 794], orientation: 'landscape' }
        };
        
        html2pdf().set(opt).from(certRef.current).save().then(() => {
           addNotification({ title: 'Success', body: `Certificate downloaded successfully.`, type: 'success' });
           setActiveCert(null);
        });
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Hidden Certificate Template for PDF Generation */}
      <CertificateTemplate cert={activeCert} ref={certRef} />

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Hub Certificates</h2>
          <p className="text-zinc-500 text-sm mt-1">Review and issue credentials to students in your hub.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
          <Award className="w-3.5 h-3.5" /> Issue Credential
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800">
            <tr>{['ID', 'Student', 'Credential', 'Issued By', 'Date', 'Actions'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {hubCerts.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No certificates issued yet.</td></tr>
            ) : (
              hubCerts.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="px-6 py-4 text-[10px] font-mono text-emerald-400 font-bold">{c.id}</td>
                  <td className="px-6 py-4 font-bold text-white text-sm">{c.studentName}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">{c.title}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-500">{c.issuedBy}</td>
                  <td className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">{c.date}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDownload(c)} className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:border-zinc-600 text-zinc-400 hover:text-white transition-all flex items-center gap-1">
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue Certificate">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Select Student</label>
            <select required value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              <option value="" disabled>Choose a student...</option>
              {hubStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Credential Type</label>
            <select value={certType} onChange={(e) => setCertType(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              <option value="AI Innovation Lab - Beginner">AI Innovation Lab - Beginner</option>
              <option value="Robotics Foundation">Robotics Foundation</option>
              <option value="Python Programming 101">Python Programming 101</option>
              <option value="IoT Excellence">IoT Excellence</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">Issue Credential</button>
        </form>
      </Modal>
    </div>
  );
};


/* ── Hub Attendance ───────────────────────────────────── */
const SchoolAttendanceView = () => {
  const { users, attendance = [], teacherAttendance = [], leaves = [] } = useStore();
  const { user } = useAuth();
  const d = new Date();
  const todayLocal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers', 'students', 'leaves'

  const students = users.filter(u => u.role === 'student' && u.schoolId === user?.schoolId);
  const teachers = users.filter(u => u.role === 'teacher' && u.schoolId === user?.schoolId);

  const currentRecords = attendance.filter(a => a.date === selectedDate && students.some(s => s.id === a.studentId));
  const currentTeacherRecords = teacherAttendance.filter(a => a.date === selectedDate && teachers.some(t => t.id === a.teacherId));
  const leaveRequests = leaves.filter(l => l.status === 'pending' && (students.some(s => s.id === l.studentId) || teachers.some(t => t.id === l.teacherId)));

  // Teacher mode KPIs
  const onSiteCount  = currentTeacherRecords.filter(a => a.mode === 'onsite').length;
  const remoteCount  = currentTeacherRecords.filter(a => a.mode === 'remote').length;
  const notCheckedIn = teachers.filter(t => !currentTeacherRecords.find(a => a.teacherId === t.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Hub Attendance</h2>
          <p className="text-zinc-500 text-sm mt-1">Monitor teacher on-site/remote check-ins and student attendance.</p>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-800">
        {[
          { id: 'students', label: 'Student Logs', icon: Users },
          { id: 'teachers', label: 'Staff Logs', icon: UserCheck },
          { id: 'leaves',   label: 'Leave Requests', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'}`}
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
              <tr>{['Student', 'Grade', 'Status'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {students.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No students available.</td></tr>
              ) : (
                students.map((s) => {
                  const record = currentRecords.find(a => a.studentId === s.id);
                  const status = record?.status || 'unmarked';
                  
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs">{s.name[0]}</div>
                          <p className="text-sm font-bold text-white">{s.name}</p>
                        </div>
                      </td>
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
        <div className="space-y-4">
          {/* KPI summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{onSiteCount}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70">On-Site</p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{remoteCount}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/70">Remote / WFH</p>
              </div>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{notCheckedIn}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Not Checked In</p>
              </div>
            </div>
          </div>

          {/* Teacher table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-sm font-black text-white">Teacher Check-In Logs</p>
              <p className="text-xs text-zinc-500">{selectedDate}</p>
            </div>
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800">
                <tr>{['Teacher', 'Mode', 'Check-In', 'Check-Out', 'Status'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {teachers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No teachers in this hub.</td></tr>
                ) : (
                  teachers.map((t) => {
                    const record = currentTeacherRecords.find(a => a.teacherId === t.id);
                    const mode = record?.mode;
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">{t.name[0]}</div>
                            <div>
                              <p className="text-sm font-bold text-white">{t.name}</p>
                              <p className="text-[9px] text-zinc-500">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {mode === 'onsite' && (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                              <MapPin className="w-2.5 h-2.5" /> On-Site
                            </span>
                          )}
                          {mode === 'remote' && (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                              <Activity className="w-2.5 h-2.5" /> Remote
                            </span>
                          )}
                          {!mode && <span className="text-zinc-600 text-[9px] font-bold">—</span>}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-white">{record?.checkIn || '--:--'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400">{record?.checkOut || '--:--'}</td>
                        <td className="px-6 py-4">
                          {record?.checkOut ? (
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-md">Completed</span>
                          ) : record ? (
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> On Duty
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1 rounded-md">Not Checked In</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>{['Student', 'Dates', 'Reason', 'Status'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {leaves.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No leave applications.</td></tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{l.studentName || 'Student'}</p>
                    </td>
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

/* ── Hub Pending View ────────────────────────────────── */
const HubPendingView = () => {
  const { user } = useAuth();
  const { users, submissions = [], grades = {}, leaves = [] } = useStore();
  const [activeTab, setActiveTab] = useState('leaves');
  const [expandedId, setExpandedId] = useState(null);
  const [activeGrade, setActiveGrade] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', week: 1, title: '', link: '', notes: '' });

  const hubStudents = users.filter(u => u.schoolId === user?.schoolId && u.role === 'student');

  // Filter to this hub's data
  const hubLeaves   = leaves.filter(l => !l.schoolId || l.schoolId === user?.schoolId);
  const hubSubs     = submissions; // all subs visible to hub admin
  const pendingLeaves  = hubLeaves.filter(l => l.status === 'pending');
  const resolvedLeaves = hubLeaves.filter(l => l.status !== 'pending');
  const pendingSubs = hubSubs.filter(s => !grades[s.id]);
  const gradedSubs  = hubSubs.filter(s =>  grades[s.id]);

  const handleGradeSubmit = (id) => {
    if (!activeGrade[id]) return;
    submitGrade(id, activeGrade[id]);
    setExpandedId(null);
    setActiveGrade(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleLeaveAction = (id, status, studentName) => {
    updateLeaveStatus(id, status, user?.name);
    addNotification({
      title: `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      body: `${studentName}'s leave has been ${status}.`,
      type: status === 'approved' ? 'success' : 'warning'
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const student = hubStudents.find(s => s.id === formData.studentId);
    if (!student) return;
    
    submitAssignment({
      studentId: student.id,
      studentName: student.name,
      week: Number(formData.week),
      title: formData.title,
      content: formData.link || formData.notes ? `Link: ${formData.link}\nNotes: ${formData.notes}` : 'Offline Submission'
    });
    
    addNotification({ title: 'Submission Created', body: `Recorded for ${student.name}`, type: 'success' });
    setShowCreateModal(false);
    setFormData({ studentId: '', week: 1, title: '', link: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Hub Pending Actions</h2>
        <p className="text-zinc-500 text-sm mt-1">Hub-wide pending leave requests and ungraded submissions.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-red-500/70 mb-2">Pending Leaves</p>
          <p className="text-3xl font-black text-white">{pendingLeaves.length}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/70 mb-2">Ungraded Subs</p>
          <p className="text-3xl font-black text-white">{pendingSubs.length}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 mb-2">Leaves Resolved</p>
          <p className="text-3xl font-black text-white">{resolvedLeaves.length}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-blue-500/70 mb-2">Graded Subs</p>
          <p className="text-3xl font-black text-white">{gradedSubs.length}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'leaves' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Leave Requests
          {pendingLeaves.length > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{pendingLeaves.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'submissions' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" /> Submissions
          {pendingSubs.length > 0 && <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">{pendingSubs.length}</span>}
        </button>
      </div>

      {/* Leave requests tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-3">
          {pendingLeaves.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-black">No pending leave requests</p>
              <p className="text-zinc-500 text-sm">All student leaves have been processed.</p>
            </div>
          ) : (
            pendingLeaves.map(leave => (
              <motion.div key={leave.id} layout className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                      {leave.studentName?.[0] ?? '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white">{leave.studentName ?? 'Student'}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{leave.startDate} → {leave.endDate}</p>
                      <div className="mt-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Reason</p>
                        <p className="text-sm text-zinc-300">{leave.reason}</p>
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-2">
                        Applied: {leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleLeaveAction(leave.id, 'approved', leave.studentName)}
                      className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleLeaveAction(leave.id, 'rejected', leave.studentName)}
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {/* Resolved */}
          {resolvedLeaves.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 px-1">Resolved</p>
              <div className="space-y-2">
                {resolvedLeaves.slice(0, 5).map(l => (
                  <div key={l.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-xs">{l.studentName?.[0] ?? '?'}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{l.studentName}</p>
                      <p className="text-xs text-zinc-500">{l.startDate} → {l.endDate}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                      l.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>{l.status}</span>
                    {l.reviewedBy && <span className="text-[9px] text-zinc-600">by {l.reviewedBy}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submissions tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            <button onClick={() => setShowCreateModal(true)} className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"><PlusCircle className="w-3.5 h-3.5" /> Create Submission</button>
          </div>
          {pendingSubs.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-black">All submissions graded!</p>
            </div>
          ) : (
            pendingSubs.map(s => (
              <motion.div key={s.id} layout className="bg-zinc-900 border border-amber-500/20 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all"
                >
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm shrink-0">{(s.studentName || 'S')[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{s.studentName}</p>
                    <p className="text-xs text-zinc-500">Week {s.week}: {s.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Pending
                    </span>
                  </div>
                </button>
                <AnimatePresence>
                  {expandedId === s.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-zinc-800">
                      <div className="p-6 space-y-4">
                        <div className="bg-zinc-800/60 rounded-xl p-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Content</p>
                          <p className="text-sm text-zinc-300">{s.content || 'No content.'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Assign Grade</p>
                          <div className="flex gap-2 flex-wrap">
                            {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'].map(g => (
                              <button key={g} onClick={() => setActiveGrade(prev => ({ ...prev, [s.id]: g }))}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                                  activeGrade[s.id] === g ? 'bg-emerald-500 text-white scale-105' : 'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'
                                }`}>{g}</button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleGradeSubmit(s.id)} disabled={!activeGrade[s.id]}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                              activeGrade[s.id] ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}>
                            <CheckCircle2 className="w-4 h-4" />{activeGrade[s.id] ? `Submit Grade: ${activeGrade[s.id]}` : 'Select a Grade First'}
                          </button>
                          <button onClick={() => setExpandedId(null)} className="px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Record Submission">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Student</label>
            <select required value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              <option value="" disabled>Select a student...</option>
              {hubStudents.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Week Number</label>
              <input required type="number" min="1" max="36" value={formData.week} onChange={(e) => setFormData({...formData, week: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Project Title</label>
              <input required type="text" placeholder="e.g. AI Model" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Project Link (Optional)</label>
            <input type="url" placeholder="https://..." value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Notes / Context (Optional)</label>
            <textarea placeholder="Any additional context..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none" />
          </div>
          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">Submit on behalf of Student</button>
        </form>
      </Modal>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────── */
const SchoolAdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [schoolData, setSchoolData] = useState(null);
  const [stats, setStats] = useState(null);
  const { user } = useAuth();
  const activeView = searchParams.get('v') || 'overview';
  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolId = user?.schoolId;
        if (!schoolId) return;
        const hubInfo  = getHubData(schoolId);
        const schools  = await DB.getSchools();
        const mySchool = schools.find(s => s.id === schoolId) || { name: hubInfo.name, studentLimit: 3000 };
        const users    = await DB.getUsersBySchool(schoolId);
        const sCount   = users.filter(u => u.role === 'student').length;
        const tCount   = users.filter(u => u.role === 'teacher').length;
        const quota    = mySchool.studentLimit ? Math.min((sCount / mySchool.studentLimit) * 100, 100).toFixed(1) : '0';
        setSchoolData({ name: mySchool.name || hubInfo.name, studentCount: sCount || hubInfo.stats.totalStudents, teacherCount: tCount || 1, quotaUsed: `${quota}%` });
        
        const st = await DB.getDashboardStats('school-admin', schoolId);
        setStats(st);
      } catch (err) { console.error('SchoolAdminDashboard:', err); }
    };
    fetchData();
  }, [user]);

  if (!schoolData) return <div className="p-8 text-white">Loading hub data...</div>;

  const views = { 
    overview:     <OverviewView schoolData={schoolData} stats={stats} />, 
    users:        <UsersView />, 
    analytics:    <AnalyticsView />, 
    'exam-analytics': <ExamAnalytics />,
    attendance:   <SchoolAttendanceView />,
    pending:      <HubPendingView />,
    certificates: <CertificatesView /> 
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        {views[activeView] || views.overview}
      </motion.div>
    </AnimatePresence>
  );
};

export default SchoolAdminDashboard;
