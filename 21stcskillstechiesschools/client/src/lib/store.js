/**
 * store.js — Lightweight in-memory reactive store
 * Shared mutable state: users, notifications, community posts.
 * Components subscribe via React state; mutations trigger re-renders
 * through setter callbacks registered with subscribe().
 */

import { HUB_REGISTRY } from './mapping';

/** ── Distance Calculation (Haversine) ── */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/* ── Initial data ──────────────────────────────────────────────────────── */
const initialUsers = [
  { id: 'u0', name: 'Super Admin', email: 'superadmin@21stc.com', password: 'password123', role: 'admin', schoolId: null, status: 'active' },
  { id: 'u5', name: 'Hub Manager', email: 'hubadmin@21stc.com', password: 'password123', role: 'school-admin', schoolId: 'HUB-CH-01', status: 'active' },
  { id: 'u3', name: 'Ms. Kavitha', email: 'teacher@21stc.com', password: 'password123', role: 'teacher', schoolId: 'HUB-CH-01', status: 'active', grades: [6, 7, 8] },
  { id: 'u1', name: 'Arun Kumar', email: 'student@21stc.com', password: 'password123', role: 'student', schoolId: 'HUB-CH-01', status: 'active', grade: 7 },
  { id: 'u2', name: 'Priya Selvi', email: 'student2@21stc.com', password: 'password123', role: 'student', schoolId: 'HUB-CH-01', status: 'active', grade: 8 },
];

const initialNotifications = [
  { id: 'n1', title: 'Week 7 Unlocked', body: 'Neural Logic module is now available.', time: 'Just now', read: false, type: 'info' },
  { id: 'n2', title: 'Grade Received', body: 'You received an A on Week 6 assignment.', time: '2h ago', read: false, type: 'success' },
  { id: 'n3', title: 'License Expiry', body: 'LIC-MDU-2025-C1 expires in 30 days.', time: '1 day ago', read: true, type: 'warning' },
  { id: 'n4', title: 'New Hub Registered', body: 'HUB-MDU-03 added to the platform.', time: '3 days ago', read: true, type: 'info' },
];

const initialPosts = [
  { id: 1, author: 'Ms. Kavitha', role: 'teacher', avatar: 'K', time: '10m ago', likes: 24, comments: 8, tag: 'Announcement', body: 'Week 7 Neural Logic module is now live! Complete the theory section before Friday. 🚀', liked: false, schoolId: 'HUB-CH-01' },
  { id: 2, author: 'Arun Kumar', role: 'student', avatar: 'A', time: '1h ago', likes: 11, comments: 5, tag: 'Discussion', body: 'Has anyone tried connecting NodeMCU to a custom API? I got CORS errors. #IoT', liked: false, schoolId: 'HUB-CH-01' },
  { id: 3, author: 'Super Admin', role: 'admin', avatar: 'S', time: '3h ago', likes: 47, comments: 12, tag: 'Platform', body: 'New: the 36-week roadmap now shows your predicted completion date. Check your dashboard! 🎯', liked: false, schoolId: null },
  { id: 4, author: 'Priya Selvi', role: 'student', avatar: 'P', time: 'Yesterday', likes: 9, comments: 3, tag: 'Showcase', body: 'Finished my Smart Room Controller — controls lights, fan, and door via voice! 🏆', liked: false, schoolId: 'HUB-CBE-02' },
  { id: 5, author: 'Chennai Hub Admin', role: 'school-admin', avatar: 'C', time: '2d ago', likes: 31, comments: 7, tag: 'Event', body: 'Robotics Showcase is on May 25th! Grade 7 & 8 register by May 20. 🤖', liked: false, schoolId: 'HUB-CH-01' },
];

const initialHubs = [
  {
    id: 'HUB-CH-01',
    name: 'Skillstech Central Tamil Nadu',
    studentLimit: 3000,
    location: 'Chennai',
    completion: '78%',
    maintenance: { active: false, until: null, message: '' },
    featureLimits: {
      examLimit: 50,
      storageLimit: 10,
      playgroundEnabled: true,
      certificateLimit: 200,
      communityAccess: true,
      maxTeachers: 15,
      dailyAiLimit: 200,
      maxExamAttempts: 3,
      sandboxTimeout: 5
    }
  },
  {
    id: 'HUB-CBE-02',
    name: 'Coimbatore Innovation Lab',
    studentLimit: 1500,
    location: 'Coimbatore',
    completion: '82%',
    maintenance: { active: false, until: null, message: '' },
    featureLimits: {
      examLimit: 50,
      storageLimit: 10,
      playgroundEnabled: true,
      certificateLimit: 200,
      communityAccess: true,
      maxTeachers: 15,
      dailyAiLimit: 200,
      maxExamAttempts: 3,
      sandboxTimeout: 5
    }
  },
];

const initialGrades = {};
const initialMaintenanceMode = false;

const initialAttendance = [
  { id: 'a1', studentId: 'u1', date: new Date().toISOString().split('T')[0], status: 'present', markedBy: 'u3' }
];

const initialLeaves = [
  { id: 'l1', studentId: 'u1', studentName: 'Arun Kumar', startDate: '2026-05-20', endDate: '2026-05-21', reason: 'Family function', status: 'pending', appliedAt: new Date().toISOString() }
];

const initialTeacherAttendance = [];

const initialSubmissions = [
  { id: 'sub_1', studentId: 'u1', studentName: 'Arun Kumar', week: 6, title: 'Neural Network Basics', submittedAt: '2h ago', status: 'pending', content: 'Neural network training loop implementation.' },
  { id: 'sub_2', studentId: 'u2', studentName: 'Priya Selvi', week: 6, title: 'Neural Network Basics', submittedAt: 'Yesterday', status: 'graded', content: 'Basic ML models implementation.' },
];

const initialCertificates = [
  { id: 'CERT-A1B2-C3D4', studentId: 'u1', studentName: 'Arun Kumar', schoolId: 'HUB-CH-01', title: 'AI Innovation Lab - Beginner', issuedBy: 'Super Admin', date: '2026-05-01' },
  { id: 'CERT-X9Y8-Z7W6', studentId: 'u2', studentName: 'Priya Selvi', schoolId: 'HUB-CH-01', title: 'Robotics Foundation', issuedBy: 'Hub Admin', date: '2026-04-15' },
];

/* ── Store state ───────────────────────────────────────────────────────── */
const STORAGE_KEY = 'learning_portal_state_v2';

// Load from localStorage or use initial
const loadState = () => {
  const defaultState = {
    users: initialUsers,
    notifications: initialNotifications,
    posts: initialPosts,
    hubs: initialHubs,
    grades: {},
    attendance: initialAttendance,
    leaves: initialLeaves,
    teacherAttendance: initialTeacherAttendance,
    submissions: initialSubmissions,
    certificates: initialCertificates,
    maintenanceMode: initialMaintenanceMode,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Merge saved state with defaults so new keys (e.g. submissions) are always present
      const parsed = JSON.parse(saved);
      const merged = { ...defaultState, ...parsed };

      // Force inject/update demo users to ensure they match the latest config
      initialUsers.forEach(demoUser => {
        const idx = merged.users.findIndex(u => u.email === demoUser.email);
        if (idx !== -1) merged.users[idx] = { ...merged.users[idx], ...demoUser };
        else merged.users.unshift(demoUser);
      });

      // Force sync hubs
      initialHubs.forEach(demoHub => {
        const idx = merged.hubs.findIndex(h => h.id === demoHub.id);
        if (idx !== -1) merged.hubs[idx] = { ...merged.hubs[idx], ...demoHub };
        else merged.hubs.unshift(demoHub);
      });

      // Ensure new keys that didn't exist in old cache are always present
      if (!merged.submissions || !Array.isArray(merged.submissions)) {
        merged.submissions = initialSubmissions;
      }
      if (!merged.certificates || !Array.isArray(merged.certificates)) {
        merged.certificates = initialCertificates;
      }
      // Ensure all leaves have studentName (backfill from users if missing)
      merged.leaves = merged.leaves.map(l => ({
        ...l,
        studentName: l.studentName || merged.users.find(u => u.id === l.studentId)?.name || 'Student'
      }));

      return merged;
    }
  } catch (e) {
    console.error('Failed to load store state', e);
  }
  return defaultState;
};

let state = loadState();
const subscribers = new Set();

const notify = () => {
  subscribers.forEach((fn) => fn({ ...state }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save store state', e);
  }
};

// Sync across tabs in real-time
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY && e.newValue) {
    try {
      state = JSON.parse(e.newValue);
      subscribers.forEach((fn) => fn({ ...state }));
    } catch (err) {
      console.error('Failed to sync state across tabs', err);
    }
  }
});

/* ── Public API ────────────────────────────────────────────────────────── */
export const subscribe = (fn) => {
  subscribers.add(fn);
  fn({ ...state });
  return () => subscribers.delete(fn);
};

export const getState = () => ({ ...state });

// ── Users ──

/** Helper: get auth token for backend calls */
const _getToken = () => localStorage.getItem('userToken') || '';

/** Sync the in-memory store with the latest user list from MongoDB.
 *  Called by AuthContext on boot and after every successful login. */
export const syncUsersWithBackend = async () => {
  try {
    const token = _getToken();
    if (!token) return; // Not logged in yet
    const res = await fetch('/api/users', {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const dbUsers = await res.json();
      // Merge: keep any local-only users (id starts with 'local_') and overwrite the rest
      const localOnly = state.users.filter(u => String(u.id).startsWith('local_'));
      state = { ...state, users: [...dbUsers, ...localOnly] };
      notify();
    }
  } catch (err) {
    console.warn('[store] syncUsersWithBackend failed, using local state', err);
  }
};

export const addUser = async (user) => {
  // Check for duplicate email in local state first
  const exists = state.users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (exists) {
    addNotification({ title: 'Error', body: 'A user with this email already exists.', type: 'error' });
    throw new Error('User with this email already exists.');
  }

  // Enforce hub capacity if it's a student
  if (user.role === 'student' && user.schoolId) {
    const hub = state.hubs.find(h => h.id === user.schoolId);
    if (hub) {
      const studentCount = state.users.filter(u => u.schoolId === user.schoolId && u.role === 'student').length;
      if (studentCount >= hub.studentLimit) {
        addNotification({ title: 'Hub Capacity Reached', body: `Cannot add more students to ${hub.name}. Limit is ${hub.studentLimit}.`, type: 'error' });
        throw new Error(`Hub ${hub.name} has reached its student capacity of ${hub.studentLimit}.`);
      }
    }
  }

  // Try backend first
  try {
    const token = _getToken();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...user, password: user.password || 'password123' })
    });
    if (res.ok) {
      const created = await res.json();
      state = { ...state, users: [created, ...state.users] };
      addNotification({ title: 'User Added', body: `${created.name} was added as ${created.role}.`, type: 'success' });
      notify();
      return created;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user on server');
    }
  } catch (err) {
    // If it is a server validation error (e.g. duplicate), propagate it
    if (err.message && !err.message.includes('fetch')) throw err;
    // Network failure → fall back to local-only
    console.warn('[store] addUser backend failed, falling back to local', err);
  }

  const newUser = {
    password: 'password123',
    ...user,
    id: `u${Date.now()}`,
    status: 'active'
  };
  state = { ...state, users: [newUser, ...state.users] };
  addNotification({ title: 'User Added', body: `${user.name} was added as ${user.role}.`, type: 'success' });
  notify();
  return newUser;
};

export const updateUser = async (id, patch) => {
  const originalUser = state.users.find((u) => u.id === id);
  if (!originalUser) return;

  // Optimistic local update
  state = { ...state, users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) };
  notify();

  // Sync to backend
  try {
    const token = _getToken();
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }
  } catch (err) {
    console.warn('[store] updateUser backend failed, reverting changes', err);
    // Revert optimistic update
    state = { ...state, users: state.users.map((u) => (u.id === id ? originalUser : u)) };
    notify();
    throw err;
  }
};

export const removeUser = async (id) => {
  const user = state.users.find((u) => u.id === id);
  if (!user) return;

  // Optimistic local removal
  state = { ...state, users: state.users.filter((u) => u.id !== id) };
  notify();

  // Sync to backend
  try {
    const token = _getToken();
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }
    addNotification({ title: 'User Removed', body: `${user.name} was removed.`, type: 'warning' });
  } catch (err) {
    console.warn('[store] removeUser backend failed, reverting changes', err);
    // Revert optimistic removal by restoring the user
    state = { ...state, users: [user, ...state.users] };
    notify();
    throw err;
  }
};

// ── Notifications ──
export const addNotification = ({ title, body, type = 'info', targetUser = null, targetRole = null }) => {
  const n = { id: `n${Date.now()}`, title, body, time: 'Just now', read: false, type, targetUser, targetRole };
  state = { ...state, notifications: [n, ...state.notifications] };
  notify();
};

export const markAllRead = () => {
  state = { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
  notify();
};

export const markRead = (id) => {
  state = { ...state, notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) };
  notify();
};

// ── Posts ──
export const addPost = ({ author, role, avatar, body, tag, schoolId }) => {
  const post = { id: Date.now(), author, role, avatar, body, tag, schoolId, time: 'Just now', likes: 0, comments: 0, liked: false };
  state = { ...state, posts: [post, ...state.posts] };
  notify();
  return post;
};

export const toggleLike = (postId) => {
  state = {
    ...state,
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ),
  };
  notify();
};

// ── Grades ──
export const submitGrade = (submissionId, grade, feedback = '') => {
  const sub = state.submissions.find(s => s.id === submissionId);
  state = {
    ...state,
    grades: { ...state.grades, [submissionId]: grade },
    submissions: state.submissions.map(s => s.id === submissionId ? { ...s, status: 'graded', feedback } : s)
  };
  // Notify the teacher/admin who graded
  addNotification({ title: 'Grade Submitted', body: `Grade ${grade} recorded for ${sub?.studentName || 'student'}.`, type: 'success' });
  // Notify the student directly
  if (sub?.studentId) {
    addNotification({
      title: '🎓 Grade Received!',
      body: `You received ${grade} for Week ${sub.week}: "${sub.title}". Feedback: ${feedback || 'None'}`,
      type: 'success',
      targetUser: sub.studentId
    });
  }
  notify();
};

export const requestRevision = (submissionId, feedback = '') => {
  const sub = state.submissions.find(s => s.id === submissionId);
  const newGrades = { ...state.grades };
  delete newGrades[submissionId];

  state = {
    ...state,
    grades: newGrades,
    submissions: state.submissions.map(s => s.id === submissionId ? { ...s, status: 'needs_revision', feedback } : s)
  };

  // Notify the student directly
  if (sub?.studentId) {
    addNotification({
      title: '⚠️ Revision Requested',
      body: `Your teacher requested a revision for "${sub.title}". Feedback: ${feedback}`,
      type: 'warning',
      targetUser: sub.studentId
    });
  }
  notify();
};

export const reassignGrade = (submissionId, grade, feedback = '') => submitGrade(submissionId, grade, feedback);

export const submitAssignment = (submission) => {
  const existingIndex = state.submissions.findIndex(
    s => s.studentId === submission.studentId && s.title === submission.title
  );

  let newSub;
  if (existingIndex !== -1) {
    const existing = state.submissions[existingIndex];
    newSub = {
      ...existing,
      submittedAt: 'Just now',
      status: 'pending',
      content: submission.content,
      attachment: submission.attachment || null,
      feedback: '' // clear feedback on resubmission
    };

    const newGrades = { ...state.grades };
    delete newGrades[existing.id];

    const updatedSubmissions = [...state.submissions];
    updatedSubmissions[existingIndex] = newSub;

    state = {
      ...state,
      submissions: updatedSubmissions,
      grades: newGrades
    };
  } else {
    newSub = {
      id: `sub_${Date.now()}`,
      submittedAt: 'Just now',
      status: 'pending',
      ...submission
    };
    state = { ...state, submissions: [newSub, ...state.submissions] };
  }

  // Notify all teachers in the same school
  const teachersInSchool = state.users.filter(u => u.role === 'teacher' && u.schoolId === submission.schoolId);
  teachersInSchool.forEach(t => {
    addNotification({
      title: '📋 New Submission',
      body: `${submission.studentName || 'A student'} submitted Week ${submission.week}: "${submission.title}".`,
      type: 'info',
      targetUser: t.id
    });
  });
  notify();
  return newSub;
};



// ── Hubs ──
export const addHub = (hub) => {
  const newHub = {
    ...hub,
    id: hub.id || `HUB-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    completion: '0%',
    status: 'active'
  };
  state = { ...state, hubs: [...state.hubs, newHub] };
  addNotification({ title: 'New Hub Registered', body: `${hub.name} has been added to the network.`, type: 'success' });
  notify();
  return newHub;
};

export const updateHub = (id, patch) => {
  state = { ...state, hubs: state.hubs.map((h) => (h.id === id ? { ...h, ...patch } : h)) };
  notify();
};

export const setHubs = (hubs) => {
  state = { ...state, hubs };
  notify();
};

export const setHubMaintenance = (hubId, active, until = null, message = '') => {
  const hub = state.hubs.find(h => h.id === hubId);
  if (hub) {
    state = {
      ...state,
      hubs: state.hubs.map(h =>
        h.id === hubId
          ? { ...h, maintenance: { active, until, message } }
          : h
      )
    };
    notify();
    addNotification({
      title: active ? 'Hub Lockdown Activated' : 'Hub Lockdown Deactivated',
      body: active ? `${hub.name} is now locked down.` : `${hub.name} is back online.`,
      type: active ? 'warning' : 'success'
    });
  }
};

/* ── Attendance tracking ────────────────────────────────────────────────── */
export const markAttendance = (studentId, date, status, teacherId) => {
  const exists = state.attendance.find(a => a.studentId === studentId && a.date === date);

  if (exists) {
    state = {
      ...state,
      attendance: state.attendance.map(a =>
        (a.studentId === studentId && a.date === date)
          ? { ...a, status, markedBy: teacherId }
          : a
      )
    };
  } else {
    const newRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      date,
      status,
      markedBy: teacherId
    };
    state = { ...state, attendance: [newRecord, ...state.attendance] };
  }
  notify();
};

// ── Leaves ──
export const applyLeave = (leaveData) => {
  const newLeave = {
    id: `leave_${Date.now()}`,
    status: 'pending',
    appliedAt: new Date().toISOString(),
    ...leaveData
  };
  state = { ...state, leaves: [newLeave, ...state.leaves] };
  // Notify all teachers in the same school
  const teachersInSchool = state.users.filter(u =>
    (u.role === 'teacher' || u.role === 'school-admin') &&
    u.schoolId === leaveData.schoolId
  );
  teachersInSchool.forEach(t => {
    addNotification({
      title: '📅 Leave Request',
      body: `${leaveData.studentName || 'A student'} applied for leave from ${leaveData.startDate} to ${leaveData.endDate}.`,
      type: 'warning',
      targetUser: t.id
    });
  });
  notify();
  return newLeave;
};

export const updateLeaveStatus = (leaveId, status, reviewerName = '') => {
  const leave = state.leaves.find(l => l.id === leaveId);
  state = {
    ...state,
    leaves: state.leaves.map(l => l.id === leaveId ? { ...l, status, reviewedAt: new Date().toISOString(), reviewedBy: reviewerName } : l)
  };
  // Notify the student about the decision
  if (leave?.studentId) {
    const icon = status === 'approved' ? '✅' : '❌';
    addNotification({
      title: `${icon} Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      body: status === 'approved'
        ? `Your leave from ${leave.startDate} to ${leave.endDate} has been approved.`
        : `Your leave request from ${leave.startDate} to ${leave.endDate} was not approved.`,
      type: status === 'approved' ? 'success' : 'warning',
      targetUser: leave.studentId
    });
  }
  notify();
};

export const cancelLeave = (leaveId, studentId) => {
  const leave = state.leaves.find(l => l.id === leaveId);
  if (!leave || leave.studentId !== studentId || leave.status !== 'pending') return;
  state = {
    ...state,
    leaves: state.leaves.filter(l => l.id !== leaveId)
  };
  addNotification({ title: 'Leave Cancelled', body: 'Your leave request has been cancelled.', type: 'info' });
  notify();
};

// ── Teacher Attendance ──
export const teacherCheckIn = (teacherId, mode = 'onsite', coords = null) => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const now = d.toLocaleTimeString();

  // Geofencing for On-Site Mode
  if (mode === 'onsite') {
    const user = state.users.find(u => u.id === teacherId);
    const hub = HUB_REGISTRY[user?.schoolId];

    if (hub?.coords && coords) {
      const distance = calculateDistance(coords.lat, coords.lng, hub.coords.lat, hub.coords.lng);
      if (distance > 0.5) { // > 500 meters
        throw new Error('NOT_IN_HUB_LOCATION');
      }
    }
  }

  const exists = state.teacherAttendance.find(a => a.teacherId === teacherId && a.date === today);

  if (!exists) {
    const record = {
      id: `tatt_${Date.now()}`,
      teacherId,
      date: today,
      checkIn: now,
      mode,
      status: 'present'
    };
    state = { ...state, teacherAttendance: [record, ...state.teacherAttendance] };
    notify();
    addNotification({ title: 'Check-In Successful', body: `Good morning! You checked in (${mode}) at ${now}.`, type: 'success' });
  } else {
    throw new Error('You have already checked in today.');
  }
};

export const teacherCheckOut = (teacherId) => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const now = d.toLocaleTimeString();

  const exists = state.teacherAttendance.find(a => a.teacherId === teacherId && a.date === today);
  if (!exists) {
    throw new Error('You have not checked in today.');
  }
  if (exists.checkOut) {
    throw new Error('You have already checked out today.');
  }

  state = {
    ...state,
    teacherAttendance: state.teacherAttendance.map(a =>
      (a.teacherId === teacherId && a.date === today)
        ? { ...a, checkOut: now }
        : a
    )
  };
  notify();
  addNotification({ title: 'Check-Out Successful', body: `Have a great evening! You checked out at ${now}.`, type: 'info' });
};

export const removeHub = (id) => {
  state = { ...state, hubs: state.hubs.filter((h) => h.id !== id) };
  notify();
};

// ── Certificates ──
export const addCertificate = (cert) => {
  state = { ...state, certificates: [cert, ...state.certificates] };
  notify();
  return cert;
};

export const removeCertificate = (id) => {
  state = { ...state, certificates: state.certificates.filter((c) => c.id !== id) };
  notify();
};

// ── Maintenance Mode ──
export const setMaintenanceMode = (enabled) => {
  state = { ...state, maintenanceMode: enabled };
  notify();
};

// ── License keys ──
export const generateLicenseKey = (hubId) => {
  const key = `LIC-${hubId}-${Date.now().toString(36).toUpperCase()}`;
  addNotification({ title: 'License Key Generated', body: key, type: 'success' });
  return key;
};

// ── CSV export helper ──
export const exportCSV = (rows, filename = 'export.csv') => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]).join(',');
  const body = rows.map((r) => Object.values(r).map((v) => `"${v ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
