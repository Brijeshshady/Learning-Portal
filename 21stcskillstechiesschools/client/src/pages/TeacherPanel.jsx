import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ClipboardList, BookOpen, Search, Download, ChevronDown, FileText, Activity, Award, CheckCircle2, AlertTriangle, Lock, Calendar, CheckSquare, MapPin, Inbox, XCircle, Clock, ArrowRight, ThumbsUp, ThumbsDown, Filter, PlusCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DB from '../lib/db';
import {
  PageHeader, KpiGrid, KpiCard, ChartRow,
  AreaChartCard, BarChartCard, ActivityFeed, SectionCard,
} from '../components/DashboardShell';
import useStore from '../hooks/useStore';
import { submitGrade, submitAssignment, exportCSV, addNotification, markAttendance, teacherCheckIn, teacherCheckOut, updateLeaveStatus } from '../lib/store';
import Modal from '../components/Modal';
import html2pdf from 'html2pdf.js';
import CertificateTemplate from '../components/CertificateTemplate';
import CreateExam from './CreateExam';
import ManageExams from './ManageExams';
import EvaluateAnswers from './EvaluateAnswers';



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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileTab, setProfileTab] = useState('roadmap'); // 'roadmap' | 'submissions' | 'attendance' | 'certificates'
  
  const store = useStore();
  const submissions = store.submissions || [];
  const attendance = store.attendance || [];
  const certificates = store.certificates || [];

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
                  <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedStudent(s); setProfileTab('roadmap'); }} className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 transition-all">View</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 pointer-events-auto"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]"
              >
                {/* Header Profile Card */}
                <div className="relative p-8 border-b border-zinc-800/80 bg-gradient-to-r from-blue-950/20 via-zinc-950 to-purple-950/10 shrink-0">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all animate-none"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20 shrink-0">
                      {selectedStudent.name[0]}
                    </div>
                    <div className="text-center md:text-left space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                        <h3 className="text-2xl font-black font-headline text-white tracking-tight">{selectedStudent.name}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md">
                          Grade {selectedStudent.grade}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-800 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                          Student
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs font-bold">{selectedStudent.email || `${selectedStudent.name.toLowerCase().replace(/\s+/g, '')}@21stc.com`}</p>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{selectedStudent.schoolId || 'HUB-CH-01'}</p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800/80 w-full md:w-auto shrink-0">
                      <div className="px-4 py-2 text-center border-r border-zinc-800/50 last:border-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Progress</p>
                        <p className="text-base font-black text-white">
                          {selectedStudent.progress ? Math.min((selectedStudent.progress.currentWeek / 36) * 100, 100).toFixed(0) : 0}%
                        </p>
                      </div>
                      <div className="px-4 py-2 text-center border-r border-zinc-800/50 last:border-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Roadmap</p>
                        <p className="text-base font-black text-emerald-400">Wk {selectedStudent.progress?.currentWeek || 0}</p>
                      </div>
                      <div className="px-4 py-2 text-center border-r border-zinc-800/50 last:border-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Attendance</p>
                        <p className="text-base font-black text-blue-400">95%</p>
                      </div>
                      <div className="px-4 py-2 text-center last:border-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Credentials</p>
                        <p className="text-base font-black text-purple-400">
                          {certificates.filter(c => c.studentId === selectedStudent.id).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-zinc-900 bg-zinc-950 px-8 py-3 shrink-0 gap-1 overflow-x-auto">
                  {[
                    { id: 'roadmap', label: 'Roadmap Progress', icon: Activity },
                    { id: 'submissions', label: 'Assignments', icon: ClipboardList },
                    { id: 'attendance', label: 'Attendance Logs', icon: Calendar },
                    { id: 'certificates', label: 'Credentials', icon: Award }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setProfileTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          profileTab === tab.id
                            ? 'bg-zinc-900 border border-zinc-800 text-white shadow-md'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Contents Area */}
                <div className="p-8 overflow-y-auto flex-1 bg-zinc-950">
                  {profileTab === 'roadmap' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">36-Week Learning Journey</h4>
                        <p className="text-xs text-zinc-500 mt-1">Visualize completed milestones, active lessons, and future subjects.</p>
                      </div>

                      {/* Dynamic Roadmap Grid of 36 Weeks */}
                      <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
                        {Array.from({ length: 36 }).map((_, idx) => {
                          const wNum = idx + 1;
                          const isCompleted = selectedStudent.progress?.completedWeeks?.includes(wNum) || wNum < (selectedStudent.progress?.currentWeek || 0);
                          const isActive = wNum === (selectedStudent.progress?.currentWeek || 0);
                          
                          let category = 'Robotics Foundation';
                          let catBg = 'border-amber-500/20 text-amber-500 bg-amber-500/5';
                          if (wNum > 12 && wNum <= 24) {
                            category = 'Python for AI';
                            catBg = 'border-blue-500/20 text-blue-500 bg-blue-500/5';
                          } else if (wNum > 24) {
                            category = 'Advanced AI';
                            catBg = 'border-purple-500/20 text-purple-500 bg-purple-500/5';
                          }

                          return (
                            <div
                              key={wNum}
                              className={`group relative aspect-square border rounded-2xl flex flex-col items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5'
                                  : isActive
                                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/10'
                                  : 'bg-zinc-900/30 border-zinc-900 text-zinc-700'
                              }`}
                            >
                              <span className="text-xs font-black font-headline">{wNum}</span>
                              <span className="text-[7px] font-black uppercase tracking-wider mt-0.5 opacity-60">
                                {isCompleted ? 'Done' : isActive ? 'Active' : 'Locked'}
                              </span>

                              {/* Rich Tooltip on Hover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 space-y-1">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Week {wNum}</p>
                                <p className="text-[10px] font-black text-white">{category}</p>
                                <p className={`text-[8px] px-2 py-0.5 rounded border w-fit ${catBg} font-black uppercase`}>
                                  {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Locked'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend Bar */}
                      <div className="flex gap-6 border-t border-zinc-900 pt-5 justify-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 font-headline">
                          <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 block shrink-0" /> Completed
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 font-headline">
                          <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/35 block shrink-0" /> Active Week
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 font-headline">
                          <span className="w-3 h-3 rounded-full bg-zinc-900/50 border border-zinc-800 block shrink-0" /> Locked
                        </div>
                      </div>
                    </div>
                  )}

                  {profileTab === 'submissions' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Assignment Submissions</h4>
                        <p className="text-xs text-zinc-500 mt-1">Review assignments submitted and scores graded.</p>
                      </div>

                      {submissions.filter(sub => sub.studentId === selectedStudent.id).length === 0 ? (
                        <div className="bg-zinc-900/30 border border-zinc-900 p-12 text-center rounded-3xl space-y-2">
                          <ClipboardList className="w-8 h-8 text-zinc-800 mx-auto" />
                          <p className="text-xs font-bold text-zinc-600">No submissions uploaded yet.</p>
                        </div>
                      ) : (
                        <div className="bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-zinc-900 bg-zinc-900/20">
                                {['Week', 'Assignment', 'Submitted', 'Status', 'Grade'].map(h => (
                                  <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                              {submissions.filter(sub => sub.studentId === selectedStudent.id).map(sub => (
                                <tr key={sub.id} className="hover:bg-white/[0.01] transition-all">
                                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">Week {sub.week}</td>
                                  <td className="px-6 py-4">
                                    <p className="text-xs font-black text-white">{sub.title}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold truncate max-w-xs">{sub.content}</p>
                                  </td>
                                  <td className="px-6 py-4 text-[10px] text-zinc-500 font-bold">{sub.submittedAt}</td>
                                  <td className="px-6 py-4">
                                    {sub.status === 'graded' ? (
                                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase">Graded</span>
                                    ) : (
                                      <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg uppercase">Pending Review</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs font-mono font-black text-blue-400">
                                    {sub.status === 'graded' ? 'Grade A' : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {profileTab === 'attendance' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Attendance History</h4>
                        <p className="text-xs text-zinc-500 mt-1">Detailed history of daily physical check-ins.</p>
                      </div>

                      {attendance.filter(att => att.studentId === selectedStudent.id).length === 0 ? (
                        <div className="bg-zinc-900/30 border border-zinc-900 p-12 text-center rounded-3xl space-y-2">
                          <Calendar className="w-8 h-8 text-zinc-800 mx-auto" />
                          <p className="text-xs font-bold text-zinc-600">No attendance registered for this student.</p>
                        </div>
                      ) : (
                        <div className="bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-zinc-900 bg-zinc-900/20">
                                {['Date', 'Status', 'Verified By'].map(h => (
                                  <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                              {attendance.filter(att => att.studentId === selectedStudent.id).map(att => (
                                <tr key={att.id} className="hover:bg-white/[0.01] transition-all">
                                  <td className="px-6 py-4 text-xs font-bold text-white">{att.date}</td>
                                  <td className="px-6 py-4">
                                    {att.status === 'present' ? (
                                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase">Present</span>
                                    ) : att.status === 'late' ? (
                                      <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg uppercase">Late</span>
                                    ) : (
                                      <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase">Absent</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-zinc-500 font-bold">Ms. Kavitha (Teacher)</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {profileTab === 'certificates' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Issued Credentials</h4>
                        <p className="text-xs text-zinc-500 mt-1">Verified achievements and awards for this learner.</p>
                      </div>

                      {certificates.filter(c => c.studentId === selectedStudent.id).length === 0 ? (
                        <div className="bg-zinc-900/30 border border-zinc-900 p-12 text-center rounded-3xl space-y-2">
                          <Award className="w-8 h-8 text-zinc-800 mx-auto" />
                          <p className="text-xs font-bold text-zinc-600">No credentials issued to this learner yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {certificates.filter(c => c.studentId === selectedStudent.id).map(c => (
                            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between h-40">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                              <Award className="w-6 h-6 text-purple-400 shrink-0" />
                              <div className="mt-4">
                                <h5 className="text-sm font-black text-white">{c.title}</h5>
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1">ID: {c.id}</p>
                              </div>
                              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-3 text-[10px] text-zinc-400">
                                <span>{c.date}</span>
                                <span className="font-bold text-zinc-500">By {c.issuedBy}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Submissions ──────────────────────────────────────────── */
const SubmissionsView = ({ students = [] }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [activeGrade, setActiveGrade] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', week: 1, title: '', link: '', notes: '' });
  const { submissions, grades } = useStore();
  const { user } = useAuth();

  // Filter submissions by teacher's school and assigned grades
  const subs = submissions.filter(s => {
    // Basic filter: only show submissions from student in the same school
    // Advanced: could filter by teacher.grades if available
    return true; // For demo, show all global subs
  }).map(s => ({
    ...s,
    grade: grades[s.id] || null,
    status: grades[s.id] ? 'graded' : 'pending'
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

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const student = students.find(s => s.id === formData.studentId);
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
      <div className="flex items-end justify-between">
        <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Submissions & Grading</h2><p className="text-zinc-500 text-sm mt-1">{subs.filter(s => s.status === 'pending').length} awaiting review.</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateModal(true)} className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"><PlusCircle className="w-3.5 h-3.5" /> Create</button>
          <button onClick={handleExport} className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-zinc-600 transition-all"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>
      <div className="space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all">
              <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-black text-xs shrink-0">{s.studentName[0]}</div>
              <div className="flex-1"><p className="text-sm font-bold text-white">{s.studentName}</p><p className="text-xs text-zinc-500 font-medium">Week {s.week}: {s.title}</p></div>
              <span className="text-[9px] text-zinc-600 font-black">{s.submittedAt}</span>
              {s.status === 'pending' ? <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Pending</span> : <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Grade: {s.grade}</span>}
              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${expandedId === s.id ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedId === s.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-zinc-800">
                  <div className="p-5 space-y-4">
                    <div className="bg-zinc-800/60 rounded-xl p-4 text-sm text-zinc-400 min-h-[60px] border border-zinc-700/50">
                      {s.content}
                    </div>
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Record Submission">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Student</label>
            <select required value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              <option value="" disabled>Select a student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
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
          <button onClick={() => addNotification({ title: 'Syllabus Downloaded', body: 'The full syllabus PDF has been saved.', type: 'success' })} className={`w-full mt-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${t.borderClass} ${t.textClass} hover:bg-white/5 transition-all flex items-center justify-center gap-2`}><FileText className="w-3.5 h-3.5" /> Full Syllabus</button>
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

  const certRef = useRef(null);
  const [activeCert, setActiveCert] = useState(null);

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
    <div className="space-y-8">
      {/* Hidden Certificate Template for PDF Generation */}
      <CertificateTemplate cert={activeCert} ref={certRef} />

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
        <div className="px-6 py-4 border-b border-zinc-800">
          <p className="text-xs font-black text-white uppercase tracking-widest">Student Summary</p>
        </div>
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <p className="text-xs font-black text-white uppercase tracking-widest">Issued Credentials Log</p>
        </div>
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800">
            <tr>{['ID', 'Student', 'Credential', 'Issued By', 'Date', 'Actions'].map((h) => <th key={h} className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {certificates.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-16 text-center text-zinc-600 font-bold text-xs">No certificates issued yet.</td></tr>
            ) : (
              certificates.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="px-6 py-4 text-[10px] font-mono text-blue-400 font-bold">{c.id}</td>
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

/* ── Pending Inbox ─────────────────────────────────────────── */
const PendingView = () => {
  const { submissions, grades, leaves } = useStore();
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' | 'leaves'
  const [activeGrade, setActiveGrade] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const pendingSubs = submissions.filter(s => !grades[s.id]);
  const gradedSubs  = submissions.filter(s =>  grades[s.id]);
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  const handleGradeSubmit = (id) => {
    if (!activeGrade[id]) return;
    submitGrade(id, activeGrade[id]);
    setExpandedId(null);
    setActiveGrade(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black font-headline tracking-tighter text-white">Pending Inbox</h2>
        <p className="text-zinc-500 text-sm mt-1">All items awaiting your action — submissions to grade and leaves to review.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-0.5">Ungraded</p>
            <p className="text-3xl font-black text-white">{pendingSubs.length}</p>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 mb-0.5">Leave Requests</p>
            <p className="text-3xl font-black text-white">{pendingLeaves.length}</p>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mb-0.5">Graded</p>
            <p className="text-3xl font-black text-white">{gradedSubs.length}</p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'submissions' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Submissions
          {pendingSubs.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">{pendingSubs.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'leaves' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Leave Requests
          {pendingLeaves.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{pendingLeaves.length}</span>
          )}
        </button>
      </div>

      {/* ── Submissions Tab ── */}
      {activeTab === 'submissions' && (
        <div className="space-y-3">
          {pendingSubs.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-black text-lg">All caught up!</p>
              <p className="text-zinc-500 text-sm text-center">No submissions awaiting your grade. Check back later.</p>
            </div>
          ) : (
            pendingSubs.map(s => (
              <motion.div
                key={s.id}
                layout
                className="bg-zinc-900 border border-amber-500/20 rounded-2xl overflow-hidden"
              >
                {/* Row */}
                <button
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all"
                >
                  <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                    {(s.studentName || 'S')[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{s.studentName}</p>
                    <p className="text-xs text-zinc-500 font-medium">Week {s.week}: {s.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-600 font-black">{s.submittedAt}</span>
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Pending
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${expandedId === s.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded grading panel */}
                <AnimatePresence>
                  {expandedId === s.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-zinc-800"
                    >
                      <div className="p-6 space-y-5">
                        {/* Submission content */}
                        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Submission Details</p>
                          {(() => {
                            const linkMatch = s.content?.match(/Link:\s*(.*)/);
                            const notesMatch = s.content?.match(/Notes:\s*([\s\S]*)/);
                            if (linkMatch || notesMatch) {
                              return (
                                <div className="space-y-3">
                                  {linkMatch && linkMatch[1] && (
                                    <div>
                                      <span className="text-[10px] font-bold text-zinc-500 mr-2">Link:</span>
                                      <a href={linkMatch[1]} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-400 hover:underline">{linkMatch[1]}</a>
                                    </div>
                                  )}
                                  {notesMatch && notesMatch[1] && (
                                    <div>
                                      <span className="text-[10px] font-bold text-zinc-500 block mb-1">Notes:</span>
                                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{notesMatch[1]}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{s.content || 'No content provided.'}</p>;
                          })()}
                        </div>

                        {/* Grade picker */}
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Assign Grade</p>
                          <div className="flex gap-2 flex-wrap items-center">
                            {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'].map(g => (
                              <button
                                key={g}
                                onClick={() => setActiveGrade(prev => ({ ...prev, [s.id]: g }))}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                                  activeGrade[s.id] === g
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105'
                                    : 'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleGradeSubmit(s.id)}
                            disabled={!activeGrade[s.id]}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                              activeGrade[s.id]
                                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {activeGrade[s.id] ? `Submit Grade: ${activeGrade[s.id]}` : 'Select a Grade First'}
                          </button>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}

          {/* Graded section */}
          {gradedSubs.length > 0 && (
            <div className="mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 px-1">Recently Graded</p>
              <div className="space-y-2">
                {gradedSubs.slice(0, 3).map(s => (
                  <div key={s.id} className="bg-zinc-900 border border-emerald-500/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-black text-sm">{(s.studentName || 'S')[0]}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{s.studentName}</p>
                      <p className="text-xs text-zinc-500">Week {s.week}: {s.title}</p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">Grade: {grades[s.id]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Leave Requests Tab ── */}
      {activeTab === 'leaves' && (
        <div className="space-y-3">
          {pendingLeaves.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-black text-lg">No pending requests!</p>
              <p className="text-zinc-500 text-sm">All leave applications have been reviewed.</p>
            </div>
          ) : (
            pendingLeaves.map(leave => (
              <motion.div
                key={leave.id}
                layout
                className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-black text-sm shrink-0">
                      {(leave.studentName?.[0] ?? '?')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white">{leave.studentName ?? 'Unknown Student'}</p>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        {leave.startDate} → {leave.endDate}
                      </p>
                      <div className="mt-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Reason</p>
                        <p className="text-sm text-zinc-300 leading-relaxed">{leave.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => { updateLeaveStatus(leave.id, 'approved'); addNotification({ title: 'Leave Approved', body: `${leave.studentName}'s leave has been approved.`, type: 'success' }); }}
                      className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => { updateLeaveStatus(leave.id, 'rejected'); addNotification({ title: 'Leave Rejected', body: `${leave.studentName}'s leave has been rejected.`, type: 'warning' }); }}
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Resolved leaves */}
          {leaves.filter(l => l.status !== 'pending').length > 0 && (
            <div className="mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 px-1">Resolved Requests</p>
              <div className="space-y-2">
                {leaves.filter(l => l.status !== 'pending').slice(0, 5).map(l => (
                  <div key={l.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-xs">{(l.studentName?.[0] ?? '?')}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{l.studentName ?? 'Student'}</p>
                      <p className="text-xs text-zinc-500">{l.startDate} → {l.endDate}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                      l.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>{l.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AttendanceView = ({ students }) => {
  const { attendance = [], teacherAttendance = [], leaves = [] } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workMode, setWorkMode] = useState('onsite'); // 'onsite' or 'remote'
  const [isLocating, setIsLocating] = useState(false);
  const { user } = useAuth();

  const handleMark = (studentId, status) => {
    markAttendance(studentId, selectedDate, status, user?.id);
  };

  const handleMarkAll = () => {
    students.forEach(s => markAttendance(s.id, selectedDate, 'present', user?.id));
    addNotification({ title: 'Attendance Saved', body: `All students marked present for ${selectedDate}.`, type: 'success' });
  };

  const handleTeacherCheckIn = async () => {
    if (workMode === 'remote') {
      try {
        teacherCheckIn(user.id, 'remote');
      } catch (err) {
        addNotification({ title: 'Check-In Failed', body: err.message, type: 'error' });
      }
      return;
    }

    setIsLocating(true);
    if (!navigator.geolocation) {
      addNotification({ title: 'Error', body: 'Geolocation is not supported by your browser', type: 'error' });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          teacherCheckIn(user.id, 'onsite', coords);
        } catch (err) {
          if (err.message === 'NOT_IN_HUB_LOCATION') {
            alert('You are not in the hub\'s location. Please go to the hub to mark attendance.');
          } else {
            addNotification({ title: 'Check-In Failed', body: err.message, type: 'error' });
          }
        }
        setIsLocating(false);
      },
      (err) => {
        addNotification({ title: 'Location Error', body: 'Please enable location access to check-in on-site.', type: 'error' });
        setIsLocating(false);
      }
    );
  };

  const handleTeacherCheckOut = () => {
    try {
      teacherCheckOut(user.id);
    } catch (err) {
      addNotification({ title: 'Check-Out Failed', body: err.message, type: 'error' });
    }
  };

  const d = new Date();
  const todayLocal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const myRecord = teacherAttendance.find(a => a.teacherId === user?.id && a.date === todayLocal);
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
              {!myRecord && (
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button 
                    onClick={() => setWorkMode('onsite')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workMode === 'onsite' ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <MapPin className="w-3.5 h-3.5" /> On-Site
                  </button>
                  <button 
                    onClick={() => setWorkMode('remote')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workMode === 'remote' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Remote
                  </button>
                </div>
              )}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    Daily Check-In {myRecord && <span className="text-zinc-400 ml-1">({myRecord.mode})</span>}
                  </p>
                  <p className="text-lg font-black text-white mt-1">{myRecord?.checkIn || '--:--'}</p>
                </div>
                {!myRecord ? (
                  <button 
                    disabled={isLocating}
                    onClick={handleTeacherCheckIn} 
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isLocating ? 'Locating...' : 'Check In'}
                  </button>
                ) : !myRecord.checkOut ? (
                  <button onClick={handleTeacherCheckOut} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">Check Out</button>
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
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-[10px] uppercase">{leave.studentName?.[0] ?? '?'}</div>
                      <div>
                        <p className="text-xs font-black text-white">{leave.studentName ?? 'Unknown Student'}</p>
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
    pending:  <PendingView />,
    submissions: <SubmissionsView students={students} />, 
    exams: <ManageExams />,
    'create-exam': <CreateExam />,
    'evaluate-answers': <EvaluateAnswers />,
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
