import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, UserCog, BarChart3, TrendingUp, Activity, ArrowRight, PlusCircle, Search, Download, CheckCircle2, AlertCircle, Award, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DB from '../lib/db';
import { getHubData } from '../lib/mapping';
import useStore from '../hooks/useStore';
import { addUser, removeUser, updateUser, exportCSV, addNotification } from '../lib/store';
import Modal from '../components/Modal';
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
const OverviewView = ({ schoolData, stats }) => (
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

/* ── Users View ──────────────────────────────────────────── */
const UsersView = () => {
  const { users } = useStore();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student', grade: 6, status: 'active' });

  const schoolUsers = users.filter(u => u.schoolId === user?.schoolId);
  const filtered = schoolUsers.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      u.status.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, grade: u.grade || 6, status: u.status || 'active' });
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'student', grade: 6, status: 'active' });
    setShowModal(true);
  };

  const handleSaveMember = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, { 
        name: formData.name, 
        email: formData.email, 
        role: formData.role, 
        grade: formData.role === 'student' ? Number(formData.grade) : null,
        status: formData.status
      });
      addNotification({ title: 'Member Updated', body: `${formData.name} has been updated successfully.`, type: 'success' });
    } else {
      try {
        addUser({ 
          name: formData.name, 
          email: formData.email, 
          role: formData.role, 
          schoolId: user?.schoolId, 
          grade: formData.role === 'student' ? Number(formData.grade) : null,
          status: formData.status
        });
        addNotification({ title: 'Member Added', body: `${formData.name} has been added successfully.`, type: 'success' });
        setShowModal(false);
      } catch (err) {
        // Error notification is already handled in store.js, but we keep modal open
        console.error(err);
      }
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800 bg-zinc-900/60"><tr>{['Member', 'Role', 'Grade', 'Status', 'Actions'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-zinc-800">{filtered.map((u) => (
            <tr key={u.id} className="hover:bg-white/[0.01] transition-all">
              <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs">{u.name[0]}</div><div><p className="text-sm font-bold text-white">{u.name}</p><p className="text-[10px] text-zinc-500">{u.email}</p></div></div></td>
              <td className="px-6 py-4"><span className="text-[9px] font-black bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-400 uppercase tracking-widest">{u.role}</span></td>
              <td className="px-6 py-4 text-xs text-zinc-500 font-bold">{u.grade ? `Grade ${u.grade}` : '—'}</td>
              <td className="px-6 py-4"><div className="flex items-center gap-1.5">{u.status === 'active' ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[9px] font-black text-emerald-500 uppercase">Active</span></> : <><AlertCircle className="w-3.5 h-3.5 text-zinc-500" /><span className="text-[9px] font-black text-zinc-500 uppercase">Inactive</span></>}</div></td>
              <td className="px-6 py-4 text-right space-x-2"><button onClick={() => handleOpenEdit(u)} className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:border-zinc-600 text-zinc-400 hover:text-white transition-all">Edit</button><button onClick={() => removeUser(u.id)} className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all">Remove</button></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-500 text-sm font-bold">No members found.</td></tr>}
          </tbody>
        </table>
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
          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">{editingUser ? "Save Changes" : "Add Member"}</button>
        </form>
      </Modal>
    </div>
  );
};

/* ── Analytics ────────────────────────────────────────────── */
const AnalyticsView = () => (
  <div>
    <div className="flex items-end justify-between mb-6">
      <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Institution Reports</h2><p className="text-zinc-500 text-sm mt-1">Performance and engagement analytics for this hub.</p></div>
      <button onClick={() => window.print()} className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all print:hidden"><Download className="w-3.5 h-3.5" /> Export PDF</button>
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

  return (
    <div className="space-y-6">
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
            <tr>{['ID', 'Student', 'Credential', 'Issued By', 'Date'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {hubCerts.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No certificates issued yet.</td></tr>
            ) : (
              hubCerts.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="px-6 py-4 text-[10px] font-mono text-emerald-400 font-bold">{c.id}</td>
                  <td className="px-6 py-4 font-bold text-white text-sm">{c.studentName}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">{c.title}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-500">{c.issuedBy}</td>
                  <td className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">{c.date}</td>
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

/* ── Main ─────────────────────────────────────────────────── */
const SchoolAdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [schoolData, setSchoolData] = useState(null);
  const [stats, setStats] = useState(null);
  const { user } = useAuth();
  const activeView = searchParams.get('v') || 'dashboard';
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
    certificates: <CertificatesView /> 
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        {views[activeView] || views.dashboard}
      </motion.div>
    </AnimatePresence>
  );
};

export default SchoolAdminDashboard;
