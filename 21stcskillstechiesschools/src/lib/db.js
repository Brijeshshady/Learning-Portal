import { getState, addUser } from './store';

const API_BASE = '/api'; 

const getAuthHeaders = () => {
  const token = localStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const demoCertificates = [
  { id: 'CERT-A1B2-C3D4', studentId: 'USR-004', studentName: 'Arun Kumar', schoolId: 'HUB-CH-01', title: 'AI Innovation Lab - Beginner', issuedBy: 'Super Admin', date: '2026-05-01' },
  { id: 'CERT-X9Y8-Z7W6', studentId: 'USR-005', studentName: 'Priya Selvi', schoolId: 'HUB-CH-01', title: 'Robotics Foundation', issuedBy: 'Hub Admin', date: '2026-04-15' },
];

const dashboardStats = {
  student: {
    kpis: { progress: '65%', progressChange: '+8%', week: '7/36', weekChange: '+1 week', mastery: '72%', masteryChange: '+5%', score: 82, scoreChange: '+12' },
    weeklyData: [{ name: 'Wk1', score: 88 }, { name: 'Wk2', score: 76 }, { name: 'Wk3', score: 91 }, { name: 'Wk4', score: 65 }, { name: 'Wk5', score: 82 }, { name: 'Wk6', score: 95 }, { name: 'Wk7', score: 70 }],
    skillData: [{ name: 'AI', score: 72 }, { name: 'Coding', score: 88 }, { name: 'Logic', score: 45 }, { name: 'Problem', score: 92 }],
    baseActivities: [
      { name: 'Week 6 Assignment', action: 'Submitted — Neural Network Basics', time: '2h ago', tag: 'now', avatar: '✓', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' },
      { name: 'Week 7 Unlocked', action: 'You unlocked the Neural Logic module', time: 'Today', tag: 'recent', avatar: '🔓', avatarBg: 'bg-primary/20', avatarColor: 'text-primary' },
      { name: 'AI Lab Quiz', action: 'Score: 88/100 — Great work!', time: 'Yesterday', tag: 'older', avatar: 'Q', avatarBg: 'bg-secondary/20', avatarColor: 'text-secondary' },
      { name: 'Roadmap Milestone', action: 'Phase 1 complete — Foundations done', time: '3 days ago', tag: 'older', avatar: '🏆', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' }
    ]
  },
  teacher: {
    kpis: { avgProgress: '42%', progressChange: '+5%', atRisk: 8, atRiskChange: '-2', reviews: 24, reviewsChange: '+6', topSkill: 'Logic', topSkillScore: '88%' },
    weekTrendData: [{ name: 'Wk1', pct: 95 }, { name: 'Wk2', pct: 82 }, { name: 'Wk3', pct: 78 }, { name: 'Wk4', pct: 40 }, { name: 'Wk5', pct: 55 }, { name: 'Wk6', pct: 62 }, { name: 'Wk7', pct: 42 }],
    gradeBar: [{ name: 'Gr 6', score: 88 }, { name: 'Gr 7', score: 72 }, { name: 'Gr 8', score: 54 }, { name: 'Gr 9', score: 31 }],
    activities: [
      { name: 'Arun Kumar', action: 'Submitted AI Assignment', time: '10m ago', tag: 'now', avatar: 'A', avatarBg: 'bg-blue-500/20', avatarColor: 'text-blue-400' },
      { name: 'System Alert', action: '3 students flagged for review', time: '1h ago', tag: 'recent', avatar: '!', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' },
      { name: 'Priya Selvi', action: 'Achieved 100% in Logic Quiz', time: '3h ago', tag: 'older', avatar: 'P', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' }
    ]
  },
  'school-admin': {
    kpis: { activeStudents: '1,420', studentsChange: '+12%', avgAttendance: '94%', attendanceChange: '+2.1%', completionRate: '68%', completionChange: '+5%', activeTeachers: 42, teachersChange: '0' },
    hubTrendData: [{ name: 'Mon', active: 1200 }, { name: 'Tue', active: 1350 }, { name: 'Wed', active: 1410 }, { name: 'Thu', active: 1380 }, { name: 'Fri', active: 1420 }],
    gradeDistData: [{ name: 'Grade 6', val: 400 }, { name: 'Grade 7', val: 520 }, { name: 'Grade 8', val: 380 }, { name: 'Grade 9', val: 120 }],
    alerts: [
      { name: 'Capacity Warning', action: 'Grade 7 AI Lab reaching limit', time: 'Just now', tag: 'now', avatar: '!', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' },
      { name: 'Hardware Sync', action: '24 IoT kits offline in Wing B', time: '2h ago', tag: 'recent', avatar: '⚡', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' },
      { name: 'New Enrollment', action: '15 new students onboarded', time: 'Yesterday', tag: 'older', avatar: '+', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' }
    ]
  },
  admin: {
    kpis: { activeHubs: 12, hubsChange: '+2', totalStudents: '45.2K', studentsChange: '+15%', systemUptime: '99.9%', uptimeChange: '+0.1%', mrr: '$124K', mrrChange: '+8%' },
    enrollmentData: [{ name: 'Jan', value: 820 }, { name: 'Feb', value: 932 }, { name: 'Mar', value: 1100 }, { name: 'Apr', value: 1450 }, { name: 'May', value: 1800 }, { name: 'Jun', value: 2400 }, { name: 'Jul', value: 3200 }],
    performanceData: [{ name: 'Node A', cpu: 45, mem: 60 }, { name: 'Node B', cpu: 75, mem: 82 }, { name: 'Node C', cpu: 30, mem: 45 }, { name: 'DB Sync', cpu: 88, mem: 95 }],
    activities: [
      { name: 'System Update', action: 'v2.4.1 deployed successfully', time: '10m ago', tag: 'now', avatar: '↑', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' },
      { name: 'New Hub', action: 'Hub-BLR-04 initialized', time: '2h ago', tag: 'recent', avatar: '+', avatarBg: 'bg-blue-500/20', avatarColor: 'text-blue-400' },
      { name: 'Security Alert', action: 'Failed login spikes (blocked)', time: '5h ago', tag: 'older', avatar: '!', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' }
    ]
  }
};

const DB = {
  // ─── AUTH ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    console.log('[DB] Attempting login for:', email);
    
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[DB] API Login Success');
        return data.user;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Login failed');
      }
    } catch (err) {
      console.error('[DB] Login Error:', err.message);
      throw err;
    }
  },

  // ─── USERS ─────────────────────────────────────────────────────────────────
  getUser: async (email) => {
    try {
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    return null;
  },

  getUsersBySchool: async (schoolId) => {
    try {
      const res = await fetch(`${API_BASE}/users?schoolId=${encodeURIComponent(schoolId)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    // Demo fallback
    return [
      { id: 'USR-004', name: 'Arun Kumar',    role: 'student', grade: 7,  schoolId },
      { id: 'USR-005', name: 'Priya Selvi',   role: 'student', grade: 8,  schoolId },
      { id: 'USR-006', name: 'Karthik Raja',  role: 'student', grade: 6,  schoolId },
      { id: 'USR-003', name: 'Ms. Kavitha',   role: 'teacher', grades: [6, 7, 8], schoolId },
    ];
  },

  getAllUsers: async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    return [];
  },

  // ─── PROGRESS ──────────────────────────────────────────────────────────────
  getProgress: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/progress/${encodeURIComponent(userId)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    // Demo fallback
    return { userId, currentWeek: 7, completedWeeks: [1, 2, 3, 4, 5, 6], totalWeeks: 36 };
  },

  updateProgress: async (userId, update) => {
    try {
      const res = await fetch(`${API_BASE}/progress/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(update),
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    return { success: false };
  },

  // ─── SCHOOLS ───────────────────────────────────────────────────────────────
  getSchools: async () => {
    try {
      const res = await fetch(`${API_BASE}/schools`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    
    // Demo fallback from store
    try {
      return getState().hubs;
    } catch {
      return [
        { id: 'HUB-CH-01',  name: 'Skillstech Central Tamil Nadu',  studentLimit: 3000, location: 'Chennai' },
        { id: 'HUB-CBE-02', name: 'Coimbatore Innovation Lab',       studentLimit: 1500, location: 'Coimbatore' },
      ];
    }
  },

  updateSchool: async (schoolId, update) => {
    try {
      const res = await fetch(`${API_BASE}/schools/${encodeURIComponent(schoolId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(update),
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    return { success: false };
  },

  // ─── DASHBOARD STATS ───────────────────────────────────────────────────────
  getDashboardStats: async (role, id) => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats?role=${role}&id=${id || ''}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    
    // Demo fallback with dynamic calculation
    const baseStats = JSON.parse(JSON.stringify(dashboardStats[role] || dashboardStats['student']));
    
    try {
      const state = getState();
      
      if (role === 'admin') {
        baseStats.kpis.activeHubs = state.hubs.length;
        baseStats.kpis.totalStudents = state.users.filter(u => u.role === 'student').length;
      } else if (role === 'school-admin' && id) {
        const schoolUsers = state.users.filter(u => u.schoolId === id);
        baseStats.kpis.activeStudents = schoolUsers.filter(u => u.role === 'student').length;
        baseStats.kpis.activeTeachers = schoolUsers.filter(u => u.role === 'teacher').length;
      }
    } catch (e) {
      console.warn('[DB] Could not sync stats with store', e);
    }

    return baseStats;
  },

  // ─── TOKENS ────────────────────────────────────────────────────────────────
  getTokens: async () => {
    try {
      const res = await fetch(`${API_BASE}/tokens`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    return [];
  },

  // ─── CERTIFICATES ──────────────────────────────────────────────────────────
  getCertificates: async (filters = {}) => {
    try {
      const qs = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/certificates?${qs}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    
    // Filter demo fallback
    let result = [...demoCertificates];
    if (filters.studentId) result = result.filter(c => c.studentId === filters.studentId);
    if (filters.schoolId)  result = result.filter(c => c.schoolId === filters.schoolId);
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  issueCertificate: async (studentId, title, issuerName, schoolId) => {
    try {
      const res = await fetch(`${API_BASE}/certificates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ studentId, title, issuedBy: issuerName, schoolId }),
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    
    // Generate random 12-char alphanumeric ID in 3 blocks
    const generateBlock = () => Math.random().toString(36).substring(2, 6).toUpperCase().padStart(4, '0');
    const certId = `CERT-${generateBlock()}-${generateBlock()}`;
    
    // Get student name for demo
    const student = (await DB.getUsersBySchool(schoolId || 'HUB-CH-01')).find(u => u.id === studentId);
    const studentName = student ? student.name : 'Unknown Student';

    const cert = {
      id: certId,
      studentId,
      studentName,
      schoolId: schoolId || (student ? student.schoolId : null),
      title,
      issuedBy: issuerName,
      date: new Date().toISOString().split('T')[0]
    };
    
    demoCertificates.unshift(cert);
    return cert;
  },

  revokeCertificate: async (certId) => {
    try {
      const res = await fetch(`${API_BASE}/certificates/${encodeURIComponent(certId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    
    const idx = demoCertificates.findIndex(c => c.id === certId);
    if (idx !== -1) demoCertificates.splice(idx, 1);
    return { success: true };
  },

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  isWeekUnlocked: async (userId, _grade, weekNum) => {
    if (weekNum === 1) return true;
    const progress = await DB.getProgress(userId);
    return progress.completedWeeks.includes(weekNum - 1);
  },
};

// Keep window.DB for legacy compatibility (db.js is also still present)
if (typeof window !== 'undefined') window.DB = DB;

export default DB;
