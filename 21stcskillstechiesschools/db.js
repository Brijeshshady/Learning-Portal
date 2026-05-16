/**
 * 21stc Persistent Data Engine (db.js)
 * Refactored to interface with Node.js/Express + MongoDB Backend
 */

const API_BASE = 'http://localhost:5000/api';

const DB = {
    // Authenticate user
    login: async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                return data.user;
            }
        } catch (apiErr) {
            console.warn("API Offline, falling back to local demo state...");
        }

        // FALLBACK: Resilient demo credentials (if API is down or invalid)
        const demoUsers = [
            { email: 'admin@21stc.com', password: 'admin123', role: 'admin', name: 'Super Admin' },
            { email: 'chennai.admin@21stc.school', password: 'school123', role: 'school-admin', name: 'Chennai Hub Admin' },
            { email: 'kavitha.t@21stc.school', password: 'teacher123', role: 'teacher', name: 'Ms. Kavitha' },
            { email: 'arun.s@21stc.school', password: 'student123', role: 'student', name: 'Arun Kumar' }
        ];

        const user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) return user;

        throw new Error('Invalid credentials');
    },

    // USER ACTIONS
    getUser: async (email) => {
        const res = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`);
        return await res.json();
    },

    getUsersBySchool: async (schoolId) => {
        const res = await fetch(`${API_BASE}/users?schoolId=${encodeURIComponent(schoolId)}`);
        return await res.json();
    },

    getAllUsers: async () => {
        const res = await fetch(`${API_BASE}/users`);
        return await res.json();
    },

    // PROGRESS ACTIONS
    getProgress: async (userId) => {
        const res = await fetch(`${API_BASE}/progress/${encodeURIComponent(userId)}`);
        return await res.json();
    },

    updateProgress: async (userId, update) => {
        const res = await fetch(`${API_BASE}/progress/${encodeURIComponent(userId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update)
        });
        return await res.json();
    },

    // SCHOOL ACTIONS
    getSchools: async () => {
        const res = await fetch(`${API_BASE}/schools`);
        return await res.json();
    },
    
    updateSchool: async (schoolId, update) => {
        const res = await fetch(`${API_BASE}/schools/${encodeURIComponent(schoolId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update)
        });
        return await res.json();
    },

    // TOKEN ACTIONS
    getTokens: async () => {
        const res = await fetch(`${API_BASE}/tokens`);
        return await res.json();
    },

    // LOGIC: Unlock Check
    isWeekUnlocked: async (userId, grade, weekNum) => {
        if (weekNum === 1) return true;
        const progress = await DB.getProgress(userId);
        return progress.completedWeeks.includes(weekNum - 1);
    }
};

window.DB = DB;
