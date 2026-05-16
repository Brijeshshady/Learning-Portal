/**
 * store.js — Lightweight in-memory reactive store
 * Shared mutable state: users, notifications, community posts.
 * Components subscribe via React state; mutations trigger re-renders
 * through setter callbacks registered with subscribe().
 */

/* ── Initial data ──────────────────────────────────────────────────────── */
const initialUsers = [
  { id: 'u0', name: 'Super Admin',   email: 'superadmin@21stc.com', password: 'password123', role: 'admin',        schoolId: null,         status: 'active' },
  { id: 'u5', name: 'Hub Manager',   email: 'hubadmin@21stc.com',   password: 'password123', role: 'school-admin', schoolId: 'HUB-CH-01',  status: 'active' },
  { id: 'u4', name: 'Ms. Kavitha',   email: 'teacher@21stc.com',    password: 'password123', role: 'teacher',      schoolId: 'HUB-CH-01',  status: 'active' },
  { id: 'u1', name: 'Arun Kumar',    email: 'student@21stc.com',    password: 'password123', role: 'student',      schoolId: 'HUB-CH-01',  status: 'active' },
];

const initialNotifications = [
  { id: 'n1', title: 'Week 7 Unlocked',       body: 'Neural Logic module is now available.',  time: 'Just now',   read: false, type: 'info' },
  { id: 'n2', title: 'Grade Received',         body: 'You received an A on Week 6 assignment.', time: '2h ago',   read: false, type: 'success' },
  { id: 'n3', title: 'License Expiry',         body: 'LIC-MDU-2025-C1 expires in 30 days.',    time: '1 day ago', read: true,  type: 'warning' },
  { id: 'n4', title: 'New Hub Registered',     body: 'HUB-MDU-03 added to the platform.',      time: '3 days ago',read: true,  type: 'info' },
];

const initialPosts = [
  { id: 1, author: 'Ms. Kavitha',      role: 'teacher',       avatar: 'K', time: '10m ago',   likes: 24, comments: 8,  tag: 'Announcement', body: 'Week 7 Neural Logic module is now live! Complete the theory section before Friday. 🚀', liked: false },
  { id: 2, author: 'Arun Kumar',        role: 'student',       avatar: 'A', time: '1h ago',    likes: 11, comments: 5,  tag: 'Discussion',    body: 'Has anyone tried connecting NodeMCU to a custom API? I got CORS errors. #IoT', liked: false },
  { id: 3, author: 'Super Admin',       role: 'admin',         avatar: 'S', time: '3h ago',    likes: 47, comments: 12, tag: 'Platform',      body: 'New: the 36-week roadmap now shows your predicted completion date. Check your dashboard! 🎯', liked: false },
  { id: 4, author: 'Priya Selvi',       role: 'student',       avatar: 'P', time: 'Yesterday', likes: 9,  comments: 3,  tag: 'Showcase',      body: 'Finished my Smart Room Controller — controls lights, fan, and door via voice! 🏆', liked: false },
  { id: 5, author: 'Chennai Hub Admin', role: 'school-admin',  avatar: 'C', time: '2d ago',    likes: 31, comments: 7,  tag: 'Event',         body: 'Robotics Showcase is on May 25th! Grade 7 & 8 register by May 20. 🤖', liked: false },
];

const initialHubs = [
  { 
    id: 'HUB-CH-01',  
    name: 'Skillstech Central Tamil Nadu',  
    studentLimit: 3000, 
    location: 'Chennai',    
    completion: '78%',
    maintenance: { active: false, until: null, message: '' }
  },
  { 
    id: 'HUB-CBE-02', 
    name: 'Coimbatore Innovation Lab',       
    studentLimit: 1500, 
    location: 'Coimbatore', 
    completion: '82%',
    maintenance: { active: false, until: null, message: '' }
  },
];

const initialGrades = {};
const initialMaintenanceMode = false;



/* ── Store state ───────────────────────────────────────────────────────── */
const STORAGE_KEY = 'learning_portal_state';

// Load from localStorage or use initial
const loadState = () => {
  const defaultState = {
    users: initialUsers,
    notifications: initialNotifications,
    posts: initialPosts,
    hubs: initialHubs,
    grades: {},
    maintenanceMode: initialMaintenanceMode,
  };
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
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

/* ── Public API ────────────────────────────────────────────────────────── */
export const subscribe = (fn) => {
  subscribers.add(fn);
  fn({ ...state });
  return () => subscribers.delete(fn);
};

export const getState = () => ({ ...state });

// ── Users ──
export const addUser = (user) => {
  // Check for duplicate email
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

  const newUser = { 
    password: 'password123', // Default password for all new users
    ...user, 
    id: `u${Date.now()}`, 
    status: 'active' 
  };
  state = { ...state, users: [newUser, ...state.users] };
  addNotification({ title: 'User Added', body: `${user.name} was added as ${user.role}.`, type: 'success' });
  notify();
  return newUser;
};

export const updateUser = (id, patch) => {
  state = { ...state, users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) };
  notify();
};

export const removeUser = (id) => {
  const user = state.users.find((u) => u.id === id);
  state = { ...state, users: state.users.filter((u) => u.id !== id) };
  if (user) addNotification({ title: 'User Removed', body: `${user.name} was removed.`, type: 'warning' });
  notify();
};

// ── Notifications ──
export const addNotification = ({ title, body, type = 'info' }) => {
  const n = { id: `n${Date.now()}`, title, body, time: 'Just now', read: false, type };
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
export const addPost = ({ author, role, avatar, body, tag }) => {
  const post = { id: Date.now(), author, role, avatar, body, tag, time: 'Just now', likes: 0, comments: 0, liked: false };
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
export const submitGrade = (submissionId, grade) => {
  state = { ...state, grades: { ...state.grades, [submissionId]: grade } };
  addNotification({ title: 'Grade Submitted', body: `Grade ${grade} recorded for submission #${submissionId}.`, type: 'success' });
  notify();
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

export const setHubMaintenance = (hubId, maintenance) => {
  state = { 
    ...state, 
    hubs: state.hubs.map(h => h.id === hubId ? { ...h, maintenance } : h) 
  };
  addNotification({ 
    title: maintenance.active ? 'Hub Maintenance On' : 'Hub Maintenance Off', 
    body: `Maintenance status updated for hub ${hubId}.`, 
    type: maintenance.active ? 'warning' : 'success' 
  });
  notify();
};

export const removeHub = (id) => {
  state = { ...state, hubs: state.hubs.filter((h) => h.id !== id) };
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
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
