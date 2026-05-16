import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ClipboardList, BookOpen, Search, Download, ChevronDown, FileText, Activity, Award, CheckCircle2, AlertTriangle, Lock, Calendar, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DB from '../lib/db';
import {
  PageHeader, KpiGrid, KpiCard, ChartRow,
  AreaChartCard, BarChartCard, ActivityFeed, SectionCard,
} from '../components/DashboardShell';
import useStore from '../hooks/useStore';
import { submitGrade, exportCSV, addNotification, markAttendance, teacherCheckIn, teacherCheckOut, updateLeaveStatus } from '../lib/store';
import Modal from '../components/Modal';



/* ── Overview ─────────────────────────────────────────────── */
const OverviewView = ({ stats }) => {
  const activities = stats?.activities || [];
  return (
    <div>
      <PageHeader title="Teacher Panel" subtitle="Here's your class performance and what needs attention this week." />
      <KpiGrid>
        <KpiCard label="Class Avg Progress" value={stats?.kpis?.avgProgress || "0%"}  change={stats?.kpis?.progressChange || "0%"}  changeLabel="this week"   icon={Activity}     iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.05} />
        <KpiCard label="At-Risk Learners"   value={stats?.kpis?.atRisk || 0}    change={stats?.kpis?.atRiskChange || "0"}   changeLabel="vs last week" icon={Users}        iconBg="bg-amber-500/15"  iconColor="text-amber-400"  delay={0.1}  />
        <KpiCard label="Pending Reviews"    value={stats?.kpis?.reviews || 0}   change={stats?.kpis?.reviewsChange || "+0"}   changeLabel="new today"    icon={ClipboardList} iconBg="bg-primary/15"    iconColor="text-primary"   delay={0.15} />
        <KpiCard label="Top Performing"     value={stats?.kpis?.topSkill || "-"} change={stats?.kpis?.topSkillScore || "0%"} changeLabel="class average"  icon={Award}         iconBg="bg-blue-500/15"   iconColor="text-blue-400"  delay={0.2}  />
      </KpiGrid>

      <ChartRow>
        <AreaChartCard title="Engagement Trend" subtitle="Weekly active participation across all grades" data={stats?.weekTrendData || []} dataKey="pct" color="#3b82f6" delay={0.2} />
        <BarChartCard  title="Grade Distribution" subtitle="Average progress per grade level" data={stats?.gradeBar || []} dataKey="score" color="#8b5cf6" delay={0.25} />
      </ChartRow>

      <ActivityFeed title="Recent Student Activity" subtitle="Real-time updates from your classes" items={activities} delay={0.3} />
    </div>
  );
};

/* ── Students View ─────────────────────────────────────────── */
const ProgressBar = ({ value, color = 'bg-primary' }) => (
  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
    <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1 }} className={`h-full ${color} rounded-full`} />
  </div>
);

const StudentsView = ({ students }) => {
  const [search, setSearch] = useState('');
  
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Student Roster</h2><p className="text-zinc-500 text-sm mt-1">All students in your assigned grades.</p></div>
        <div className="relative w-60"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all" /></div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800"><tr>{['Student', 'Grade', 'Week', 'Progress', 'Status', ''].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? <tr><td colSpan="6" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No students found.</td></tr> :
            filtered.map((s) => {
              const pct = s.progress ? Math.min((s.progress.currentWeek / 36) * 100, 100).toFixed(0) : 0;
              const isAtRisk = Number(pct) < 30;
              return (
                <tr key={s.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">{s.name[0]}</div><p className="text-sm font-bold text-white">{s.name}</p></div></td>
                  <td className="px-6 py-4 text-xs text-zinc-500 font-bold">Grade {s.grade}</td>
                  <td className="px-6 py-4 text-xs text-zinc-500 font-bold">Week {s.progress?.currentWeek || 0}</td>
                  <td className="px-6 py-4 w-36"><div className="flex items-center gap-2"><div className="flex-1"><ProgressBar value={Number(pct)} color={isAtRisk ? 'bg-red-500' : 'bg-blue-500'} /></div><span className="text-[9px] font-black text-zinc-500 w-7 text-right">{pct}%</span></div></td>
                  <td className="px-6 py-4">{isAtRisk ? <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg uppercase">At Risk</span> : <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg uppercase">On Track</span>}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => addNotification({ title: 'Student View', body: `Viewing full profile for ${s.name} is under development.` })} className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 transition-all">View</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Submissions ──────────────────────────────────────────── */
const SubmissionsView = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [activeGrade, setActiveGrade] = useState('');
  const { grades } = useStore();

  const baseSubs = [
    { id: 1, student: 'Arun Kumar',  week: 6, title: 'Neural Network Basics', submitted: '2h ago' },
    { id: 2, student: 'Priya Selvi', week: 6, title: 'Neural Network Basics', submitted: 'Yesterday' },
    { id: 3, student: 'Meena Devi',  week: 6, title: 'Neural Network Basics', submitted: '1h ago' },
  ];

  // Merge with store grades
  const subs = baseSubs.map(s => ({
    ...s,
    grade: grades[s.id] || (s.id === 2 ? 'A' : null),
    status: grades[s.id] || s.id === 2 ? 'graded' : 'pending'
  }));

  const handleExport = () => {
    exportCSV(subs.map(s => ({ Student: s.student, Week: s.week, Title: s.title, Grade: s.grade || 'Pending' })), 'grades.csv');
  };

  const handleGradeSubmit = (id) => {
    if (!activeGrade) return;
    submitGrade(id, activeGrade);
    setExpandedId(null);
    setActiveGrade('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Submissions & Grading</h2><p className="text-zinc-500 text-sm mt-1">{subs.filter(s => s.status === 'pending').length} awaiting review.</p></div>
        <button onClick={handleExport} className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all"><Download className="w-3.5 h-3.5" /> Export</button>
      </div>
      <div className="space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all">
              <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-black text-xs shrink-0">{s.student[0]}</div>
              <div className="flex-1"><p className="text-sm font-bold text-white">{s.student}</p><p className="text-xs text-zinc-500 font-medium">Week {s.week}: {s.title}</p></div>
              <span className="text-[9px] text-zinc-600 font-black">{s.submitted}</span>
              {s.status === 'pending' ? <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Pending</span> : <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Grade: {s.grade}</span>}
              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${expandedId === s.id ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedId === s.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-zinc-800">
                  <div className="p-5 space-y-4">
                    <div className="bg-zinc-800/60 rounded-xl p-4 text-sm text-zinc-400 min-h-[60px] border border-zinc-700/50">Submission contents loaded from user workspace. Contains Python script for neural network training loop. Code passed all basic syntax checks.</div>
                    {s.status === 'pending' && (
                      <div className="flex gap-2 flex-wrap items-center">
                        {['A', 'B+', 'B', 'C+', 'C'].map((g) => (
                          <button key={g} onClick={() => setActiveGrade(g)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeGrade === g ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 border-blue-500' : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 border'}`}>{g}</button>
                        ))}
                        <button onClick={() => handleGradeSubmit(s.id)} className={`ml-auto px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeGrade ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>Submit Grade</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Curriculum ───────────────────────────────────────────── */
const CurriculumView = () => (
  <div className="space-y-6">
    <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Syllabus View</h2><p className="text-zinc-500 text-sm mt-1">36-week curriculum across all assigned grades.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { term: 'Term 1', weeks: '1–12', theme: 'Foundations', borderClass: 'border-primary/20',     textClass: 'text-primary',     topics: ['AI Basics', 'Python Intro', 'Robotics Concepts', 'IoT Fundamentals'] },
        { term: 'Term 2', weeks: '13–24', theme: 'Building',   borderClass: 'border-emerald-500/20', textClass: 'text-emerald-400', topics: ['ML Models', 'Smart Projects', 'Data Structures', 'Web APIs'] },
        { term: 'Term 3', weeks: '25–36', theme: 'Innovation', borderClass: 'border-secondary/20',   textClass: 'text-secondary',   topics: ['Capstone Project', 'AI Ethics', 'Deployment', 'Certification'] },
      ].map((t) => (
        <SectionCard key={t.term} className={`border ${t.borderClass}`}>
          <span className={`text-[9px] font-black uppercase tracking-widest ${t.textClass} block mb-1`}>{t.term} · Weeks {t.weeks}</span>
          <h3 className="text-lg font-black font-headline text-white mb-4">{t.theme}</h3>
          <div className="space-y-2">{t.topics.map((topic) => <div key={topic} className="flex items-center gap-2 text-sm font-medium text-zinc-400"><span className={`w-1.5 h-1.5 rounded-full ${t.textClass.replace('text', 'bg')}`}></span>{topic}</div>)}</div>
          <button className={`w-full mt-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${t.borderClass} ${t.textClass} hover:bg-white/5 transition-all flex items-center justify-center gap-2`}><FileText className="w-3.5 h-3.5" /> Full Syllabus</button>
        </SectionCard>
      ))}
    </div>
    <SectionCard title="Week-by-Week Roadmap">
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2">
        {[...Array(36)].map((_, i) => <div key={i} className={`aspect-square rounded-xl border flex items-center justify-center text-[9px] font-black transition-all cursor-pointer hover:scale-110 ${i < 6 ? 'bg-primary/10 border-primary/30 text-primary' : i === 6 ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-zinc-800/40 border-zinc-700 text-zinc-600 opacity-40'}`}>{i + 1}</div>)}
      </div>
    </SectionCard>
  </div>
);

/* ── Certificates ─────────────────────────────────────────── */
const CertificatesView = ({ students }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [certType, setCertType] = useState('AI Innovation Lab - Beginner');
  const [certificates, setCertificates] = useState([]);

  const fetchCerts = async () => {
    const data = await DB.getCertificates();
    setCertificates(data);
  };

  useEffect(() => { fetchCerts(); }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    // Find student to get schoolId
    const studentObj = students.find(s => s.id === selectedStudent);
    await DB.issueCertificate(selectedStudent, certType, user?.name || 'Teacher', studentObj?.schoolId);
    
    addNotification({ 
      title: 'Certificate Issued', 
      body: `You have been awarded the ${certType} credential!`, 
      type: 'success',
      targetUser: selectedStudent
    });
    
    setShowModal(false);
    setSelectedStudent('');
    fetchCerts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Issue Certificates</h2>
          <p className="text-zinc-500 text-sm mt-1">Review student progress and issue official credentials.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
          <Award className="w-3.5 h-3.5" /> Issue Credential
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800">
            <tr>{['Student', 'Recent Certifications', 'Total Credentials'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {students.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No students available.</td></tr>
            ) : (
              students.map((s) => {
                const studentCerts = certificates.filter(c => c.studentId === s.id);
                const recent = studentCerts.length > 0 ? studentCerts[0].title : 'None';
                return (
                  <tr key={s.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">{s.name[0]}</div>
                        <p className="text-sm font-bold text-white">{s.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-500">{recent}</td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-400 uppercase tracking-widest">{studentCerts.length} Earned</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue Certificate">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Select Student</label>
            <select required value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50">
              <option value="" disabled>Choose a student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Credential Type</label>
            <select value={certType} onChange={(e) => setCertType(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50">
              <option value="AI Innovation Lab - Beginner">AI Innovation Lab - Beginner</option>
              <option value="Robotics Foundation">Robotics Foundation</option>
              <option value="Python Programming 101">Python Programming 101</option>
              <option value="IoT Excellence">IoT Excellence</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">Issue Credential</button>
        </form>
      </Modal>
    </div>
  );
};


/* ── Attendance ───────────────────────────────────────────── */
const AttendanceView = ({ students }) => {
  const { attendance = [], teacherAttendance = [], leaves = [] } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { user } = useAuth();

  const handleMark = (studentId, status) => {
    markAttendance(studentId, selectedDate, status, user?.id);
  };

  const handleMarkAll = () => {
    students.forEach(s => markAttendance(s.id, selectedDate, 'present', user?.id));
    addNotification({ title: 'Attendance Saved', body: `All students marked present for ${selectedDate}.`, type: 'success' });
  };

  const myRecord = teacherAttendance.find(a => a.teacherId === user?.id && a.date === new Date().toISOString().split('T')[0]);
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  const currentRecords = attendance.filter(a => a.date === selectedDate);
  const presentCount = currentRecords.filter(a => a.status === 'present').length;
  const lateCount = currentRecords.filter(a => a.status === 'late').length;
  const absentCount = currentRecords.filter(a => a.status === 'absent').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Attendance Log</h2>
              <p className="text-zinc-500 text-sm mt-1">Manage daily attendance for your roster.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <button onClick={handleMarkAll} className="bg-blue-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                <CheckSquare className="w-3.5 h-3.5" /> Mark All Present
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Present Today" value={presentCount} icon={CheckCircle2} iconBg="bg-emerald-500/15" iconColor="text-emerald-400" />
            <KpiCard label="Late Today" value={lateCount} icon={AlertTriangle} iconBg="bg-amber-500/15" iconColor="text-amber-400" />
            <KpiCard label="Absent Today" value={absentCount} icon={Lock} iconBg="bg-red-500/15" iconColor="text-red-400" />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800">
                <tr>{['Student', 'Grade', 'Current Status', 'Action'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {students.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No students available.</td></tr>
                ) : (
                  students.map((s) => {
                    const record = currentRecords.find(a => a.studentId === s.id);
                    const status = record?.status || 'unmarked';
                    
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">{s.name[0]}</div>
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleMark(s.id, 'present')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-emerald-400'}`}><CheckCircle2 className="w-4 h-4" /></button>
                            <button onClick={() => handleMark(s.id, 'late')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status === 'late' ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-amber-400'}`}><AlertTriangle className="w-4 h-4" /></button>
                            <button onClick={() => handleMark(s.id, 'absent')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-red-400'}`}><Lock className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="My Attendance">
            <div className="flex flex-col gap-4 mt-2">
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Daily Check-In</p>
                  <p className="text-lg font-black text-white mt-1">{myRecord?.checkIn || '--:--'}</p>
                </div>
                {!myRecord ? (
                  <button onClick={() => teacherCheckIn(user.id)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Check In</button>
                ) : !myRecord.checkOut ? (
                  <button onClick={() => teacherCheckOut(user.id)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">Check Out</button>
                ) : (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Check-Out</p>
                    <p className="text-sm font-bold text-white">{myRecord.checkOut}</p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Pending Leaves">
            <div className="space-y-3 mt-3">
              {pendingLeaves.length === 0 ? (
                <p className="text-center py-6 text-zinc-600 text-[11px] font-bold italic">No pending requests.</p>
              ) : (
                pendingLeaves.map(leave => (
                  <div key={leave.id} className="bg-zinc-800/40 border border-zinc-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-[10px] uppercase">{leave.studentName[0]}</div>
                      <div>
                        <p className="text-xs font-black text-white">{leave.studentName}</p>
                        <p className="text-[10px] text-zinc-500 font-bold">{leave.startDate} to {leave.endDate}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">{leave.reason}</p>
                    <div className="flex gap-2">
                      <button onClick={() => updateLeaveStatus(leave.id, 'approved')} className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-all">Approve</button>
                      <button onClick={() => updateLeaveStatus(leave.id, 'rejected')} className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all">Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────── */
const TeacherPanel = () => {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const { user } = useAuth();
  const activeView = searchParams.get('v') || 'overview';

  useEffect(() => {
    const fetchData = async () => {
      if (user?.schoolId) {
        const [all, st] = await Promise.all([
          DB.getUsersBySchool(user.schoolId),
          DB.getDashboardStats('teacher', user.id)
        ]);
        const grades = user?.grades || [];
        const filtered = all.filter(u => u.role === 'student' && (grades.length === 0 || grades.includes(u.grade)));
        setStudents(await Promise.all(filtered.map(async (s) => ({ ...s, progress: await DB.getProgress(s.id) }))));
        setStats(st);
      }
    };
    fetchData();
  }, [user]);

  const views = { 
    overview: <OverviewView stats={stats} />, 
    students: <StudentsView students={students} />, 
    submissions: <SubmissionsView />, 
    curriculum: <CurriculumView />, 
    attendance: <AttendanceView students={students} />,
    certificates: <CertificatesView students={students} /> 
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        {views[activeView] || views.overview}
      </motion.div>
    </AnimatePresence>
  );
};

export default TeacherPanel;
