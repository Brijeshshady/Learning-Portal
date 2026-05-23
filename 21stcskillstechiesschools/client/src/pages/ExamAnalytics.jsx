import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  ShieldAlert, 
  BookOpen, 
  UserCheck, 
  Calendar, 
  Activity, 
  GraduationCap, 
  ChevronRight, 
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  AreaChart, 
  Area,
  PieChart,
  Pie
} from 'recharts';
import DB from '../lib/db';

const ExamAnalytics = ({ user, selectedHub }) => {
  const [analytics, setAnalytics] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [hubs, setHubs] = useState([]);

  const isAll = !selectedHub || selectedHub === 'ALL';
  const hubName = !isAll ? (hubs.find(h => h.id === selectedHub)?.name || selectedHub) : null;

  const fetchData = async () => {
    try {
      const hubFilter = selectedHub && selectedHub !== 'ALL' ? selectedHub : null;
      const [analyticsData, examsData, schoolsData] = await Promise.all([
        DB.getExamAnalytics(hubFilter),
        DB.getExams(hubFilter),
        DB.getSchools()
      ]);
      setAnalytics(analyticsData);
      setExams(examsData);
      setHubs(schoolsData || []);
    } catch (err) {
      console.error("Failed to load exam analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedHub]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-headline font-bold text-xs uppercase tracking-widest animate-pulse">
            Compiling Academic Reports...
          </p>
        </div>
      </div>
    );
  }

  // Fallback defaults if API returns null/empty
  const totalExams = analytics?.totalExams ?? exams.length;
  const totalAttempts = analytics?.totalAttempts ?? 0;
  const averagePercentage = analytics?.averagePercentage ?? 0;
  const tabSwitches = analytics?.securityViolations?.tabSwitches ?? 0;
  const fullscreenExits = analytics?.securityViolations?.fullscreenExits ?? 0;
  const subjectPerformance = analytics?.subjectPerformance ?? [];

  // Filter subject list
  const subjects = ['All', ...new Set(exams.map(e => e.subject))];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exam.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || exam.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Theme chart colors
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // Safe topic details formatting
  const formattedSubjectData = subjectPerformance.map((item, idx) => ({
    name: item.subject,
    score: item.averageScore,
    color: colors[idx % colors.length]
  }));

  const securityData = [
    { name: 'Tab Switches', value: tabSwitches, color: '#ef4444' },
    { name: 'Clean Sessions', value: Math.max(0, totalAttempts - tabSwitches), color: '#10b981' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BarChart3 className="text-secondary w-7 h-7" />
            Academic Examination Insights
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Real-time assessment completion rates, subject mastery, and proctoring metrics.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start md:self-auto bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-black px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Hub context banner */}
      {!isAll && (
        <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-2xl flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-secondary shrink-0" />
          <p className="text-xs font-bold text-zinc-300">Showing exam analytics for <span className="text-secondary font-black">{hubName}</span> ({selectedHub}). Switch to <span className="text-zinc-400 font-bold">All Hubs</span> to see platform-wide exam data.</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Exams Scheduled</span>
            <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalExams}</p>
          <p className="text-xs text-zinc-500 mt-1">Active curricular modules</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Student Attempts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalAttempts}</p>
          <p className="text-xs text-zinc-500 mt-1">Answer rosters submitted</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Average Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{averagePercentage}%</p>
          <p className="text-xs text-zinc-500 mt-1">Cohort mastery rating</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Security Flags</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{tabSwitches}</p>
          <p className="text-xs text-zinc-500 mt-1">Tab switches logged</p>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject wise Performance Chart */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-6 backdrop-blur-xl">
          <div className="mb-6">
            <h3 className="text-sm font-black text-white">Subject Mastery breakdown</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Average scores achieved across subjects</p>
          </div>

          <div className="h-64">
            {formattedSubjectData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-600 text-xs italic">No performance history data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedSubjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-xl">
                            <p className="text-xs font-black text-white uppercase tracking-wider mb-1">{payload[0].payload.name}</p>
                            <p className="text-xs font-bold text-secondary">Average Score: {payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {formattedSubjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Proctoring Integrity Summary */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-6 backdrop-blur-xl flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-black text-white">Exam Integrity Log</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Distribution of proctoring violations</p>
          </div>

          <div className="h-48 flex items-center justify-center relative">
            {totalAttempts === 0 ? (
              <p className="text-zinc-600 text-xs italic">No security logs recorded</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={securityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {securityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{tabSwitches}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Total Flags</span>
                </div>
              </>
            )}
          </div>

          {/* Breakdown labels */}
          <div className="mt-4 space-y-3 flex-1 flex flex-col justify-center">
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-zinc-400">Clean Submissions</span>
              </div>
              <span className="text-xs font-black text-white">
                {totalAttempts - tabSwitches > 0 ? totalAttempts - tabSwitches : 0} / {totalAttempts}
              </span>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-xs font-bold text-zinc-400">Tab Switch Violations</span>
              </div>
              <span className="text-xs font-black text-red-400">
                {tabSwitches} ({totalAttempts > 0 ? Math.round((tabSwitches / totalAttempts) * 100) : 0}%)
              </span>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-zinc-400">Fullscreen Violations</span>
              </div>
              <span className="text-xs font-black text-amber-400">{fullscreenExits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Exam List */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-black text-white">Curricular Assessments Inventory</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Overview of published and scheduled examinations</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search assessments..."
                className="bg-zinc-800 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-secondary/60 placeholder-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exams Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                {['Assessment Title', 'Subject', 'Target Grade', 'Duration', 'Passing Bounds', 'Scheduled Window', 'Status'].map(h => (
                  <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-zinc-600 font-bold text-xs italic">
                    No matching assessments found.
                  </td>
                </tr>
              ) : (
                filteredExams.map(exam => {
                  const startTime = new Date(exam.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                  const endTime = new Date(exam.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                  
                  return (
                    <tr key={exam.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-black text-white">{exam.title}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{exam.description || 'No description provided.'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-zinc-400 bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-lg">
                          {exam.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-500">
                        Grade {exam.gradeId}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-400">
                        {exam.duration} mins
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-zinc-500">
                          {exam.passingMarks} <span className="text-zinc-600">/ {exam.totalMarks}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-zinc-500">
                          <p>{startTime}</p>
                          <p className="text-[9px] text-zinc-600 mt-0.5">to {endTime}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                          exam.status === 'published' 
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {exam.status}
                        </span>
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

export default ExamAnalytics;
