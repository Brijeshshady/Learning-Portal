import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Users, ShieldCheck, Key, BarChart3, PlusCircle, Upload,
  Search, Database, Activity, BadgeCheck, Settings as SettingsIcon,
  TrendingUp, Download, Copy, AlertTriangle, Cpu, CheckCircle2, AlertCircle, Award, Trash2
} from 'lucide-react';
import {
  PageHeader, KpiGrid, KpiCard, ChartRow,
  AreaChartCard, BarChartCard, ActivityFeed, SectionCard,
} from '../components/DashboardShell';
import Modal from '../components/Modal';
import useStore from '../hooks/useStore';
import { addUser, removeUser, updateUser, addHub, updateHub, removeHub, exportCSV, generateLicenseKey, addNotification, setMaintenanceMode, setHubMaintenance, getState } from '../lib/store';
import DB from '../lib/db';



/* ── Dashboard Overview ──────────────────────────────────── */
const DashboardView = ({ stats }) => {
  const { hubs, users } = useStore();
  const studentCount = users.filter(u => u.role === 'student').length;
  
  return (
    <div>
      <PageHeader title="Global Administration" subtitle="Welcome back, Super Admin. Here's what's happening across all hubs." />
      <KpiGrid>
        <KpiCard label="Total Students"  value={studentCount.toLocaleString()}  change={stats?.kpis?.studentsChange || "+0%"} icon={Users}    iconBg="bg-primary/15"   iconColor="text-primary"   delay={0.05} />
        <KpiCard label="Active Hubs"     value={hubs.length}     change={stats?.kpis?.hubsChange || "0"}     changeLabel="new this term" icon={Database}  iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.1} />
        <KpiCard label="System Health"   value={stats?.kpis?.systemUptime || "99.9%"} change={stats?.kpis?.uptimeChange || "0.1%"} icon={BarChart3} iconBg="bg-secondary/15" iconColor="text-secondary"  delay={0.15} />
        <KpiCard label="ARR"             value={stats?.kpis?.mrr || "$124K"}   change={stats?.kpis?.mrrChange || "+8%"}  icon={Cpu}       iconBg="bg-amber-500/15" iconColor="text-amber-400"  delay={0.2} />
      </KpiGrid>
    <ChartRow>
      <AreaChartCard title="Enrollment Growth" subtitle="Monthly student registrations across all hubs" data={stats?.enrollmentData || []} dataKey="value" color="#3b82f6" delay={0.2} />
      <BarChartCard  title="System Load"       subtitle="Server CPU utilization across network nodes"   data={stats?.performanceData || []}  dataKey="cpu" color="#7c3aed" delay={0.25} />
    </ChartRow>
    <ActivityFeed title="System Activity" subtitle="Latest platform events and updates" items={stats?.activities || []} delay={0.3} />
    </div>
  );
};

/* ── Users View ──────────────────────────────────────────── */
const UsersView = () => {
  const { users, hubs } = useStore();
  const [search, setSearch] = React.useState('');
  const [editingUser, setEditingUser] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: '', email: '', role: 'student', hub: 'HUB-CH-01', status: 'active' });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.schoolId?.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, hub: u.schoolId || '', status: u.status });
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'student', hub: 'HUB-CH-01', status: 'active', grade: 6 });
    setShowModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, { name: formData.name, email: formData.email, role: formData.role, schoolId: formData.hub, status: formData.status });
      addNotification({ title: 'User Updated', body: `${formData.name} has been updated successfully.`, type: 'success' });
    } else {
      try {
        addUser({ 
          name: formData.name, 
          email: formData.email, 
          role: formData.role, 
          schoolId: formData.hub, 
          grade: formData.role === 'student' ? Number(formData.grade) : null, 
          status: formData.status 
        });
        addNotification({ title: 'User Provisioned', body: `${formData.name} has been added successfully.`, type: 'success' });
        setShowModal(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExport = () => {
    exportCSV(filteredUsers.map(u => ({ Name: u.name, Email: u.email, Role: u.role, Hub: u.schoolId, Status: u.status })), 'users_export.csv');
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
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or hub…" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800 bg-zinc-900/60">
              <tr>{['Full Name', 'Institution', 'Role', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{u.name[0]}</div><div><p className="text-sm font-bold text-white">{u.name}</p><p className="text-[10px] text-zinc-500">{u.email}</p></div></div></td>
                  <td className="px-6 py-4 text-xs text-zinc-500 font-bold">{u.schoolId || '—'}</td>
                  <td className="px-6 py-4"><span className="text-[9px] font-black bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-400 uppercase tracking-widest">{u.role}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1.5">{u.status === 'active' ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-black text-emerald-500 uppercase">Active</span></> : <><AlertCircle className="w-3.5 h-3.5 text-zinc-500" /><span className="text-[10px] font-black text-zinc-500 uppercase">Inactive</span></>}</div></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(u)} className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:border-zinc-600 text-zinc-400 hover:text-white transition-all">Edit</button>
                    <button 
                      onClick={() => {
                        const adminUser = users.find(x => x.id === 'u0');
                        if (u.email === adminUser?.email) {
                          alert("Security Error: Cannot remove the primary Super Admin account.");
                          return;
                        }
                        if(confirm(`Remove ${u.name}?`)) removeUser(u.id);
                      }} 
                      className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-500 text-sm font-bold">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? "Edit User Profile" : "Provision New User"}>
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
          <button type="submit" className="w-full bg-primary text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">{editingUser ? "Save Changes" : "Provision Account"}</button>
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
  const [formData, setFormData] = React.useState({ 
    id: '', name: '', loc: '', status: 'active', studentLimit: 1000,
    mActive: false, mUntil: '', mMessage: '' 
  });

  const getStudentCount = (hubId) => users.filter(u => u.schoolId === hubId && u.role === 'student').length;

  const handleOpenAdd = () => {
    setEditingHub(null);
    setFormData({ id: '', name: '', loc: '', status: 'active', studentLimit: 1000, mActive: false, mUntil: '', mMessage: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (hub) => {
    setEditingHub(hub);
    setFormData({ 
      id: hub.id, 
      name: hub.name, 
      loc: hub.location || hub.loc, 
      status: hub.status || 'active', 
      studentLimit: hub.studentLimit || 1000,
      mActive: hub.maintenance?.active || false,
      mUntil: hub.maintenance?.until || '',
      mMessage: hub.maintenance?.message || ''
    });
    setShowModal(true);
  };

  const handleSaveHub = (e) => {
    e.preventDefault();
    const hubData = { 
      name: formData.name, 
      location: formData.loc, 
      status: formData.status, 
      studentLimit: Number(formData.studentLimit),
      maintenance: {
        active: formData.mActive,
        until: formData.mUntil,
        message: formData.mMessage
      }
    };

    if (editingHub) {
      updateHub(editingHub.id, hubData);
      addNotification({ title: 'Hub Updated', body: `${formData.name} configuration updated.`, type: 'success' });
    } else {
      addHub({ id: formData.id, ...hubData });
      addNotification({ title: 'Hub Created', body: `${formData.name} added to the registry.`, type: 'success' });
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
              <div><p className={`text-[9px] font-black uppercase tracking-widest text-primary mb-1`}>{hub.id}</p><h3 className="text-lg font-black font-headline text-white">{hub.name}</h3><p className="text-sm text-zinc-500">{hub.location || hub.loc}</p></div>
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
          <div><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Location</label><input required value={formData.loc} onChange={(e) => setFormData({...formData, loc: e.target.value})} type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Chennai Central" /></div>
          
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

          <button type="submit" className="w-full bg-primary text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
            {editingHub ? "Apply Hub Updates" : "Register Hub"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

/* ── Analytics View ──────────────────────────────────────── */
const analyticsArea = [
  { name: 'Jan', value: 62 }, { name: 'Feb', value: 70 }, { name: 'Mar', value: 68 },
  { name: 'Apr', value: 75 }, { name: 'May', value: 80 }, { name: 'Jun', value: 83 },
];
const hubBar = [
  { name: 'CH-01', pct: 78 }, { name: 'CBE-02', pct: 82 }, { name: 'MDU-03', pct: 45 },
];
const AnalyticsView = () => (
  <div>
    <div className="flex items-end justify-between mb-6">
      <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Platform Analytics</h2><p className="text-zinc-500 text-sm mt-1">Engagement and outcomes across all hubs.</p></div>
      <button className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all"><Download className="w-3.5 h-3.5" /> Export</button>
    </div>
    <KpiGrid>
      <KpiCard label="Total Enrolled"  value="4,085" change="+12%"  icon={Users}    iconBg="bg-primary/15"   iconColor="text-primary"   delay={0} />
      <KpiCard label="Avg Completion"  value="80%"   change="+5.3%" icon={BarChart3} iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.05} />
      <KpiCard label="Active Today"    value="1,247" change="+8.2%" icon={Activity} iconBg="bg-secondary/15" iconColor="text-secondary"  delay={0.1} />
      <KpiCard label="Certifications"  value="342"   change="+21%"  icon={ShieldCheck} iconBg="bg-amber-500/15" iconColor="text-amber-400" delay={0.15} />
    </KpiGrid>
    <ChartRow>
      <AreaChartCard title="Completion Rate Trend" subtitle="Monthly average across all hubs" data={analyticsArea} dataKey="value" color="#3b82f6" />
      <BarChartCard  title="Hub Performance"       subtitle="Completion % per hub"           data={hubBar}        dataKey="pct"   color="#7c3aed" />
    </ChartRow>
    <ActivityFeed title="At-Risk Alerts" subtitle="Grades and hubs that need attention" items={[
      { name: 'Grade 8 — Debugging Logic', action: 'HUB-CH-01 • Only 12% completion', time: 'Critical', tag: 'warning', avatar: '!', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' },
      { name: 'Grade 9 — Advanced IoT',    action: 'HUB-CBE-02 • 23% completion',     time: 'Warning',  tag: 'warning', avatar: '!', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' },
    ]} />
  </div>
);

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

/* ── Main ────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHub, setSelectedHub] = React.useState('ALL');
  const [stats, setStats] = React.useState(null);
  const { hubs, maintenanceMode, getState } = useStore();
  const activeView = searchParams.get('v') || 'dashboard';

  React.useEffect(() => {
    const fetchStats = async () => {
      const st = await DB.getDashboardStats('admin');
      setStats(st);
    };
    fetchStats();
  }, []);

  const views = {
    dashboard:    <DashboardView stats={stats} />,
    users:        <UsersView />,
    schools:      <HubRegistryView />,
    certificates: <CertificatesView />,
    activation:   <LicenseView />,
    analytics:    <AnalyticsView />,
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
