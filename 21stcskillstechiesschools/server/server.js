require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const School = require('./models/School');
const Token = require('./models/Token');
const Progress = require('./models/Progress');
const Certificate = require('./models/Certificate');
const aiManager = require('./services/aiManager');
const Rollout = require('./models/Rollout');
const Bug = require('./models/Bug');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8102;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/21stc_portal';
const JWT_SECRET = process.env.JWT_SECRET || '21stc_super_secret_key_2024';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production mode!');
}

const escapeRegex = (string) => {
    return string ? string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : '';
};

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findOne({ id: decoded.id }).select('-password');
            if (!req.user) return res.status(401).json({ error: 'User no longer exists' });
            return next();
        } catch (error) {
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

// ── DATABASE ────────────────────────────────────────────────────────────────

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));

async function seedDatabase() {
    try {
        console.log("Syncing demo data with security...");
        
        const schools = [
            { 
                id: 'HUB-CH-01', 
                name: '21stc Chennai Hub', 
                plan: 'Enterprise', 
                studentLimit: 5000, 
                aiLimit: 20000, 
                status: 'active',
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
                name: '21stc Coimbatore Hub', 
                plan: 'Pro', 
                studentLimit: 2000, 
                aiLimit: 10000, 
                status: 'active',
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
            }
        ];
        for (const s of schools) {
            await School.findOneAndUpdate({ id: s.id }, s, { upsert: true });
        }

        const users = [
            { id: 'u0', email: 'superadmin@21stc.com', password: 'password123', role: 'admin', name: 'Super Admin', schoolId: null },
            { id: 'u5', email: 'hubadmin@21stc.com', password: 'password123', role: 'school-admin', name: 'Chennai Hub Admin', schoolId: 'HUB-CH-01' },
            { id: 'u3', email: 'teacher@21stc.com', password: 'password123', role: 'teacher', name: 'Ms. Kavitha', schoolId: 'HUB-CH-01', grades: [6, 7] },
            { id: 'u1', email: 'student@21stc.com', password: 'password123', role: 'student', name: 'Arun Kumar', schoolId: 'HUB-CH-01', grade: 7 },
            { id: 'u2', email: 'student2@21stc.com', password: 'password123', role: 'student', name: 'Priya Selvi', schoolId: 'HUB-CH-01', grade: 8 }
        ];
        
        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
            } else {
                // Force update demo credentials to match aligned list
                exists.id = u.id;
                exists.email = u.email;
                exists.name = u.name;
                exists.role = u.role;
                exists.schoolId = u.schoolId;
                if (u.grades) exists.grades = u.grades;
                if (u.grade) exists.grade = u.grade;
                await exists.save();
            }
        }

        const tokens = [
            { code: 'CPS-TN-2024', schoolId: 'HUB-CH-01', usage: 2845, limit: 3000, expiry: new Date('2025-12-31') },
            { code: 'LAB-CBE-99', schoolId: 'HUB-CBE-02', usage: 1240, limit: 1500, expiry: new Date('2025-06-30') }
        ];
        for (const t of tokens) {
            await Token.findOneAndUpdate({ code: t.code }, t, { upsert: true });
        }

        // Seed Rollouts (Updates)
        const rollouts = [
            {
                id: 'RL-SAMPLE-00',
                version: 'v2.4.0',
                title: 'v2.4.0 Performance Improvement',
                description: 'Initial release of the 36-week roadmap, telemetry checks, and attendance modules.',
                channel: 'stable',
                targetHubs: [],
                status: 'applied',
                scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                createdBy: 'Super Admin',
                changelog: ['Added 36-week learning roadmap', 'Integrated attendance geofencing', 'Added teacher panels']
            },
            {
                id: 'RL-SAMPLE-01',
                version: 'v2.5.0',
                title: 'v2.5.0 Stability & Coding Playground',
                description: 'This update rolls out the interactive Coding Playground and security hardening for user management.',
                channel: 'stable',
                targetHubs: [],
                status: 'applied',
                scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                createdBy: 'Super Admin',
                changelog: ['Added interactive student coding playground', 'Secured user query endpoints', 'Fixed CSV export functionality']
            },
            {
                id: 'RL-SAMPLE-02',
                version: 'v2.6.0',
                title: 'v2.6.0 Advanced AI & Multi-Model Integration',
                description: 'This update upgrades the core AI engines to Gemini 3.5 Flash and introduces advanced multi-model capabilities.',
                channel: 'stable',
                targetHubs: [],
                status: 'scheduled',
                scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdBy: 'Super Admin',
                changelog: ['Upgraded AI model to Gemini 3.5 Flash', 'Added key rotation telemetry dashboards', 'Optimized database index lookups']
            }
        ];
        for (const r of rollouts) {
            await Rollout.findOneAndUpdate({ id: r.id }, r, { upsert: true });
        }

        console.log("Database synced successfully.");
    } catch (err) {
        console.error("Error syncing database:", err);
    }
}

// ── ROUTES ──────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Case-insensitive exact match
        const user = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });
        
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    schoolId: user.schoolId,
                    token: token
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role, schoolId, grade } = req.body;
        const exists = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });
        if (exists) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }
        
        // Generate custom id
        const id = `u${Date.now()}`;
        
        const user = await User.create({
            id,
            name,
            email,
            password,
            role: role || 'student',
            schoolId: schoolId || null,
            grade: grade || 6,
            status: 'active'
        });
        
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                schoolId: user.schoolId,
                token: token
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Protected routes
app.get('/api/users', protect, async (req, res) => {
    try {
        const { schoolId } = req.query;
        let filter = {};
        if (req.user.role !== 'admin') {
            // Non-admins are strictly locked to their own school's user list
            filter.schoolId = req.user.schoolId;
        } else {
            // Admins can search within a school or fetch all
            if (schoolId) filter.schoolId = schoolId;
        }
        const users = await User.find(filter).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lookup user by email (must be declared before dynamic /:id routes)
app.get('/api/users/by-email/:email', protect, async (req, res) => {
    try {
        const user = await User.findOne({ email: decodeURIComponent(req.params.email) }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Data boundary validation
        if (req.user.role !== 'admin' && user.schoolId !== req.user.schoolId) {
            return res.status(403).json({ error: 'Unauthorized to view this user' });
        }
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', protect, authorize('admin', 'school-admin'), async (req, res) => {
    try {
        const { name, email, password, role, schoolId, grade, status } = req.body;
        const exists = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });
        if (exists) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }
        
        let targetSchoolId = schoolId;
        // School-admin security checks
        if (req.user.role === 'school-admin') {
            targetSchoolId = req.user.schoolId;
            if (role === 'admin') {
                return res.status(403).json({ error: 'School administrators cannot create super admin users' });
            }
        }
        
        const id = `u${Date.now()}`;
        const user = await User.create({
            id,
            name,
            email,
            password: password || 'password123',
            role,
            schoolId: targetSchoolId || null,
            grade: role === 'student' ? (grade || 6) : null,
            status: status || 'active'
        });
        
        const userRes = user.toObject();
        delete userRes.password;
        res.status(201).json(userRes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', protect, async (req, res) => {
    try {
        const { name, email, role, schoolId, grade, status, password } = req.body;
        const user = await User.findOne({ id: req.params.id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Authorization check
        if (req.user.role !== 'admin') {
            if (req.user.role === 'school-admin') {
                if (user.schoolId !== req.user.schoolId || (schoolId && schoolId !== req.user.schoolId)) {
                    return res.status(403).json({ error: 'Not authorized to modify this user' });
                }
                if (role && role !== user.role) {
                    return res.status(403).json({ error: 'School administrators cannot change user roles' });
                }
            } else {
                // Regular user can only modify self
                if (user.id !== req.user.id) {
                    return res.status(403).json({ error: 'Not authorized to modify this user' });
                }
                if (role && role !== user.role) {
                    return res.status(403).json({ error: 'You cannot change your own role' });
                }
                if (schoolId !== undefined && schoolId !== user.schoolId) {
                    return res.status(403).json({ error: 'You cannot change your school' });
                }
            }
        }
        
        if (name) user.name = name;
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const emailExists = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });
            if (emailExists) {
                return res.status(400).json({ error: 'A user with this email already exists' });
            }
            user.email = email;
        }
        if (role && req.user.role === 'admin') user.role = role; // only superadmin can change roles
        if (schoolId !== undefined && (req.user.role === 'admin' || req.user.role === 'school-admin')) user.schoolId = schoolId;
        if (grade !== undefined) user.grade = grade;
        if (status && (req.user.role === 'admin' || req.user.role === 'school-admin')) user.status = status;
        if (password) user.password = password; // pre-save will hash
        
        await user.save();
        const userRes = user.toObject();
        delete userRes.password;
        res.json(userRes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', protect, authorize('admin', 'school-admin'), async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (req.user.role === 'school-admin' && user.schoolId !== req.user.schoolId) {
            return res.status(403).json({ error: 'Not authorized to delete this user' });
        }
        
        if (user.email === 'superadmin@21stc.com') {
            return res.status(400).json({ error: 'Cannot delete the primary Super Admin account' });
        }
        
        await User.deleteOne({ id: req.params.id });
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/dashboard/stats', protect, async (req, res) => {
    try {
        let role = req.user.role;
        if (req.user.role === 'admin' && req.query.role) {
            role = req.query.role;
        }
        let id = req.query.id;
        if (req.user.role === 'school-admin') {
            id = req.user.schoolId;
        } else if (req.user.role === 'student') {
            id = req.user.id;
        }

        
        // Base dashboard stats structures (mirrors client-side db.js stats template)
        const studentStats = {
            kpis: { progress: '65%', progressChange: '+8%', week: '7/36', weekChange: '+1 week', mastery: '72%', masteryChange: '+5%', score: 82, scoreChange: '+12' },
            weeklyData: [{ name: 'Wk1', score: 88 }, { name: 'Wk2', score: 76 }, { name: 'Wk3', score: 91 }, { name: 'Wk4', score: 65 }, { name: 'Wk5', score: 82 }, { name: 'Wk6', score: 95 }, { name: 'Wk7', score: 70 }],
            skillData: [{ name: 'AI', score: 72 }, { name: 'Coding', score: 88 }, { name: 'Logic', score: 45 }, { name: 'Problem', score: 92 }],
            baseActivities: [
                { name: 'Week 6 Assignment', action: 'Submitted — Neural Network Basics', time: '2h ago', tag: 'now', avatar: '✓', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' },
                { name: 'Week 7 Unlocked', action: 'You unlocked the Neural Logic module', time: 'Today', tag: 'recent', avatar: '🔓', avatarBg: 'bg-primary/20', avatarColor: 'text-primary' },
                { name: 'AI Lab Quiz', action: 'Score: 88/100 — Great work!', time: 'Yesterday', tag: 'older', avatar: 'Q', avatarBg: 'bg-secondary/20', avatarColor: 'text-secondary' },
                { name: 'Roadmap Milestone', action: 'Phase 1 complete — Foundations done', time: '3 days ago', tag: 'older', avatar: '🏆', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' }
            ]
        };

        const teacherStats = {
            kpis: { avgProgress: '42%', progressChange: '+5%', atRisk: 8, atRiskChange: '-2', reviews: 24, reviewsChange: '+6', topSkill: 'Logic', topSkillScore: '88%' },
            weekTrendData: [{ name: 'Wk1', pct: 95 }, { name: 'Wk2', pct: 82 }, { name: 'Wk3', pct: 78 }, { name: 'Wk4', pct: 40 }, { name: 'Wk5', pct: 55 }, { name: 'Wk6', pct: 62 }, { name: 'Wk7', pct: 42 }],
            gradeBar: [{ name: 'Gr 6', score: 88 }, { name: 'Gr 7', score: 72 }, { name: 'Gr 8', score: 54 }, { name: 'Gr 9', score: 31 }],
            activities: [
                { name: 'Arun Kumar', action: 'Submitted AI Assignment', time: '10m ago', tag: 'now', avatar: 'A', avatarBg: 'bg-blue-500/20', avatarColor: 'text-blue-400' },
                { name: 'System Alert', action: '3 students flagged for review', time: '1h ago', tag: 'recent', avatar: '!', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' },
                { name: 'Priya Selvi', action: 'Achieved 100% in Logic Quiz', time: '3h ago', tag: 'older', avatar: 'P', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' }
            ]
        };

        const schoolAdminStats = {
            kpis: { activeStudents: '1,420', studentsChange: '+12%', avgAttendance: '94%', attendanceChange: '+2.1%', completionRate: '68%', completionChange: '+5%', activeTeachers: 42, teachersChange: '0' },
            hubTrendData: [{ name: 'Mon', active: 1200 }, { name: 'Tue', active: 1350 }, { name: 'Wed', active: 1410 }, { name: 'Thu', active: 1380 }, { name: 'Fri', active: 1420 }],
            gradeDistData: [{ name: 'Grade 6', val: 400 }, { name: 'Grade 7', val: 520 }, { name: 'Grade 8', val: 380 }, { name: 'Grade 9', val: 120 }],
            alerts: [
                { name: 'Capacity Warning', action: 'Grade 7 AI Lab reaching limit', time: 'Just now', tag: 'now', avatar: '!', avatarBg: 'bg-amber-500/20', avatarColor: 'text-amber-400' },
                { name: 'Hardware Sync', action: '24 IoT kits offline in Wing B', time: '2h ago', tag: 'recent', avatar: '⚡', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' },
                { name: 'New Enrollment', action: '15 new students onboarded', time: 'Yesterday', tag: 'older', avatar: '+', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' }
            ],
            hubLoadMetrics: {
                aiQuotaUsed: 14245,
                aiQuotaLimit: 20000,
                activeClients: 342,
                maxClients: 500,
                routerCpu: 42,
                routerMem: 58,
                iotStatus: { online: 58, total: 60 }
            }
        };

        const adminStats = {
            kpis: { activeHubs: 12, hubsChange: '+2', totalStudents: '45.2K', studentsChange: '+15%', systemUptime: '99.9%', uptimeChange: '+0.1%', mrr: '$124K', mrrChange: '+8%' },
            enrollmentData: [{ name: 'Jan', value: 820 }, { name: 'Feb', value: 932 }, { name: 'Mar', value: 1100 }, { name: 'Apr', value: 1450 }, { name: 'May', value: 1800 }, { name: 'Jun', value: 2400 }, { name: 'Jul', value: 3200 }],
            performanceData: [
                { name: 'Node A (Chennai Core)', cpu: 45, mem: 60, connections: 840, latency: 12, disk: 18, status: 'healthy' },
                { name: 'Node B (Coimbatore Core)', cpu: 75, mem: 82, connections: 1202, latency: 38, disk: 44, status: 'warning' },
                { name: 'Node C (Regional Router)', cpu: 30, mem: 45, connections: 450, latency: 15, disk: 12, status: 'healthy' },
                { name: 'DB Sync (Master Node)', cpu: 88, mem: 95, connections: 345, latency: 45, disk: 78, status: 'critical' }
            ],
            aiUsageStats: {
                totalRequests: 84293,
                totalTokens: 14283921,
                costSavingsPct: 92,
                averageLatencyMs: 142,
                keysStatus: [
                    { slot: 1, key: 'AIzaSyBW...tYx1', limit: 200, used: 142, rate: '71%', status: 'active' },
                    { slot: 2, key: 'AIzaSyAS...uR88', limit: 200, used: 198, rate: '99%', status: 'active' },
                    { slot: 3, key: 'AIzaSyKP...xX90', limit: 200, used: 45,  rate: '22%', status: 'active' },
                    { slot: 4, key: 'AIzaSyTR...kP12', limit: 200, used: 0,   rate: '0%',  status: 'active' },
                    { slot: 5, key: 'AIzaSyLM...uV34', limit: 200, used: 0,   rate: '0%',  status: 'suspended' }
                ]
            },
            activities: [
                { name: 'System Update', action: 'v2.5.0 deployed successfully', time: '10m ago', tag: 'now', avatar: '↑', avatarBg: 'bg-emerald-500/20', avatarColor: 'text-emerald-400' },
                { name: 'New Hub', action: 'Hub-BLR-04 initialized', time: '2h ago', tag: 'recent', avatar: '+', avatarBg: 'bg-blue-500/20', avatarColor: 'text-blue-400' },
                { name: 'Security Alert', action: 'Failed login spikes (blocked)', time: '5h ago', tag: 'older', avatar: '!', avatarBg: 'bg-red-500/20', avatarColor: 'text-red-400' }
            ]
        };

        if (role === 'admin') {
            const activeHubs = await School.countDocuments();
            const totalStudents = await User.countDocuments({ role: 'student' });
            adminStats.kpis.activeHubs = activeHubs;
            adminStats.kpis.totalStudents = totalStudents.toLocaleString();
            return res.json(adminStats);
        }
        
        if (role === 'school-admin') {
            const schoolId = id || req.user.schoolId;
            const activeStudents = await User.countDocuments({ schoolId, role: 'student' });
            const activeTeachers = await User.countDocuments({ schoolId, role: 'teacher' });
            
            const grade6 = await User.countDocuments({ schoolId, role: 'student', grade: 6 });
            const grade7 = await User.countDocuments({ schoolId, role: 'student', grade: 7 });
            const grade8 = await User.countDocuments({ schoolId, role: 'student', grade: 8 });
            const grade9 = await User.countDocuments({ schoolId, role: 'student', grade: 9 });

            schoolAdminStats.kpis.activeStudents = activeStudents.toLocaleString();
            schoolAdminStats.kpis.activeTeachers = activeTeachers;
            schoolAdminStats.gradeDistData = [
                { name: 'Grade 6', val: grade6 },
                { name: 'Grade 7', val: grade7 },
                { name: 'Grade 8', val: grade8 },
                { name: 'Grade 9', val: grade9 }
            ];
            return res.json(schoolAdminStats);
        }
        
        if (role === 'teacher') {
            const schoolId = req.user.schoolId;
            const activeStudents = await User.countDocuments({ schoolId, role: 'student' });
            
            // Calculate average progress from Progress model
            const students = await User.find({ schoolId, role: 'student' });
            const studentIds = students.map(s => s.id);
            const progresses = await Progress.find({ userId: { $in: studentIds } });
            let avgProgressPct = 0;
            if (progresses.length > 0) {
                const totalCompleted = progresses.reduce((sum, p) => sum + (p.completedWeeks ? p.completedWeeks.length : 0), 0);
                avgProgressPct = Math.round((totalCompleted / (progresses.length * 36)) * 100);
            } else {
                avgProgressPct = 42; // default fallback
            }

            teacherStats.kpis.avgProgress = `${avgProgressPct}%`;
            teacherStats.kpis.reviews = await User.countDocuments({ schoolId, role: 'student', status: 'inactive' });
            
            return res.json(teacherStats);
        }
        
        if (role === 'student') {
            const studentId = id || req.user.id;
            const progress = await Progress.findOne({ userId: studentId });
            const completedWeeksCount = progress ? (progress.completedWeeks ? progress.completedWeeks.length : 0) : 0;
            const progressPct = Math.round((completedWeeksCount / 36) * 100);
            
            studentStats.kpis.progress = `${progressPct}%`;
            studentStats.kpis.week = `${progress ? progress.currentWeek : 1}/36`;
            return res.json(studentStats);
        }

        res.status(400).json({ error: 'Invalid role for dashboard statistics request' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Certificates
app.get('/api/certificates', protect, async (req, res) => {
    try {
        const { schoolId, studentId } = req.query;
        let filter = {};
        if (schoolId) filter.schoolId = schoolId;
        if (studentId) filter.studentId = studentId;
        const certs = await Certificate.find(filter).sort({ date: -1 });
        res.json(certs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/certificates', protect, async (req, res) => {
    try {
        const { studentId, title, issuedBy, schoolId } = req.body;
        
        const generateBlock = () => Math.random().toString(36).substring(2, 6).toUpperCase().padStart(4, '0');
        const certId = `CERT-${generateBlock()}-${generateBlock()}`;
        
        const student = await User.findOne({ id: studentId });
        const studentName = student ? student.name : 'Unknown Student';

        const cert = await Certificate.create({
            id: certId,
            studentId,
            studentName,
            schoolId: schoolId || (student ? student.schoolId : 'HUB-CH-01'),
            title,
            issuedBy,
            date: new Date().toISOString().split('T')[0]
        });
        
        res.status(201).json(cert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/certificates/:id', protect, authorize('admin', 'school-admin', 'teacher'), async (req, res) => {
    try {
        const cert = await Certificate.findOne({ id: req.params.id });
        if (!cert) return res.status(404).json({ error: 'Certificate not found' });
        
        if (req.user.role !== 'admin' && cert.schoolId !== req.user.schoolId) {
            return res.status(403).json({ error: 'Unauthorized to delete this certificate' });
        }
        
        await Certificate.deleteOne({ id: req.params.id });
        res.json({ success: true, message: 'Certificate deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/schools', protect, async (req, res) => {
    try {
        const schools = await School.find();
        res.json(schools);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/schools/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const school = await School.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, upsert: true });
        res.json(school);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/progress/:userId', protect, async (req, res) => {
    try {
        // Only allow user to see their own progress or teacher/admin
        if (req.user.role === 'student' && req.user.id !== req.params.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        let progress = await Progress.findOne({ userId: req.params.userId });
        if (!progress) {
            progress = await Progress.create({ userId: req.params.userId });
        }
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/progress/:userId', protect, async (req, res) => {
    try {
        if (req.user.role === 'student' && req.user.id !== req.params.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const progress = await Progress.findOneAndUpdate({ userId: req.params.userId }, req.body, { new: true, upsert: true });
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tokens', protect, authorize('admin', 'school-admin'), async (req, res) => {
    try {
        const tokens = await Token.find();
        res.json(tokens);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/profile', protect, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (name) user.name = name;
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const exists = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });
            if (exists) {
                return res.status(400).json({ error: 'A user with this email already exists' });
            }
            user.email = email;
        }
        
        await user.save();
        res.json({ name: user.name, email: user.email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── CODE PLAYGROUND ENDPOINT ─────────────────────────────────────────────
app.post('/api/ai/execute-code', protect, async (req, res) => {
    try {
        const { code, language, action } = req.body;
        if (!code || !language || !action) {
            return res.status(400).json({ error: 'Missing required parameters: code, language, action' });
        }
        const result = await aiManager.getBalancedCodeExecution(code, language, action);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ROLLOUT ENDPOINTS ────────────────────────────────────────────────────
app.get('/api/rollouts', protect, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const rollouts = await Rollout.find().sort({ createdAt: -1 });
            return res.json(rollouts);
        } else if (req.user.role === 'school-admin') {
            // Find rollouts that apply to their hub (empty list means all hubs)
            const rollouts = await Rollout.find({
                $or: [
                    { targetHubs: { $exists: true, $size: 0 } },
                    { targetHubs: req.user.schoolId }
                ]
            }).sort({ createdAt: -1 });
            return res.json(rollouts);
        } else {
            return res.status(403).json({ error: 'Unauthorized to view rollouts' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/rollouts', protect, authorize('admin'), async (req, res) => {
    try {
        const { version, title, description, channel, targetHubs, scheduledAt, changelog } = req.body;
        
        // Auto-calculate scheduled time for next midnight if not provided
        let targetSchedule = scheduledAt;
        if (!targetSchedule) {
            const midnight = new Date();
            midnight.setDate(midnight.getDate() + 1);
            midnight.setHours(0, 0, 0, 0);
            targetSchedule = midnight;
        }

        const rollout = await Rollout.create({
            id: `RL-${Date.now()}`,
            version,
            title,
            description,
            channel: channel || 'stable',
            targetHubs: targetHubs || [],
            status: 'scheduled',
            scheduledAt: targetSchedule,
            createdBy: req.user.name,
            changelog: changelog || []
        });

        res.status(201).json(rollout);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/rollouts/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const rollout = await Rollout.findOne({ id: req.params.id });
        if (!rollout) return res.status(404).json({ error: 'Rollout not found' });
        
        rollout.status = status;
        if (status === 'applied') {
            rollout.appliedAt = new Date();
        }
        await rollout.save();
        res.json(rollout);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/rollouts/pending', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) return res.json({ pending: false });
        
        // Check for any scheduled rollout targeting this school
        const scheduled = await Rollout.findOne({
            status: 'scheduled',
            $or: [
                { targetHubs: { $exists: true, $size: 0 } },
                { targetHubs: schoolId }
            ]
        });
        
        if (scheduled) {
            return res.json({ pending: true, rollout: scheduled });
        }
        res.json({ pending: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auto-apply scheduled rollouts when their time passes
setInterval(async () => {
    try {
        const now = new Date();
        const pendingApplications = await Rollout.find({
            status: 'scheduled',
            scheduledAt: { $lte: now }
        });
        for (const r of pendingApplications) {
            r.status = 'applied';
            r.appliedAt = now;
            await r.save();
            console.log(`[ROLLOUT AUTO-APPLY] Applied scheduled rollout ${r.version} (${r.title})`);
        }
    } catch (err) {
        console.error('[ROLLOUT AUTO-APPLY ERROR]:', err);
    }
}, 30000);

// ── BUG REPORT ENDPOINTS ─────────────────────────────────────────────────
app.post('/api/bugs', protect, async (req, res) => {
    try {
        const { title, description, severity, category, page } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }
        
        const bug = await Bug.create({
            id: `BUG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            title,
            description,
            severity: severity || 'medium',
            category: category || 'Other',
            page: page || '',
            reportedBy: req.user.id,
            reporterRole: req.user.role,
            reporterName: req.user.name,
            hubId: req.user.schoolId || null
        });

        res.status(201).json(bug);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/bugs', protect, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const bugs = await Bug.find().sort({ createdAt: -1 });
            return res.json(bugs);
        } else if (req.user.role === 'school-admin') {
            const bugs = await Bug.find({ hubId: req.user.schoolId }).sort({ createdAt: -1 });
            return res.json(bugs);
        } else {
            const bugs = await Bug.find({ reportedBy: req.user.id }).sort({ createdAt: -1 });
            return res.json(bugs);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/bugs/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const bug = await Bug.findOne({ id: req.params.id });
        if (!bug) return res.status(404).json({ error: 'Bug not found' });
        
        bug.status = status;
        await bug.save();
        res.json(bug);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── EXAMS MODULE ─────────────────────────────────────────────────────────
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');

app.use('/api/exams', protect, examRoutes);
app.use('/api/results', protect, resultRoutes);

// AI Chat Route
app.post('/api/ai/chat', protect, async (req, res) => {
    try {
        const { message } = req.body;
        const userContext = {
            name: req.user.name,
            grade: req.user.grade || 7,
            role: req.user.role,
            dynamicContext: {}
        };

        // Fetch dynamic context based on user roles
        if (req.user.role === 'admin') {
            const schoolCount = await School.countDocuments();
            const userCount = await User.countDocuments();
            const tokenCount = await Token.countDocuments();
            userContext.dynamicContext = {
                schoolCount,
                userCount,
                tokenCount,
                systemStats: {
                    nodes: [
                        { name: "Node-Alpha-East", status: "healthy", cpu: 42, memory: 58, disk: 34 },
                        { name: "Node-Beta-West", status: "healthy", cpu: 31, memory: 62, disk: 45 },
                        { name: "Node-Gamma-South", status: "warning", cpu: 89, memory: 91, disk: 78 }
                    ],
                    activeKeys: 5,
                    gatewayStatus: "online",
                    cacheSize: "2.4 GB",
                    dbStatus: "optimized",
                }
            };
        } else if (req.user.role === 'school-admin') {
            const school = await School.findOne({ id: req.user.schoolId });
            const studentCount = await User.countDocuments({ schoolId: req.user.schoolId, role: 'student' });
            const teacherCount = await User.countDocuments({ schoolId: req.user.schoolId, role: 'teacher' });
            const tokens = await Token.find({ schoolId: req.user.schoolId });
            
            userContext.dynamicContext = {
                hubName: school ? school.name : "Unknown Hub",
                plan: school ? school.plan : "N/A",
                studentLimit: school ? school.studentLimit : 0,
                aiLimit: school ? school.aiLimit : 0,
                studentCount,
                teacherCount,
                tokens: tokens.map(t => ({
                    code: t.code,
                    usage: t.usage,
                    limit: t.limit,
                    expiry: t.expiry
                }))
            };
        } else if (req.user.role === 'teacher') {
            const studentCount = await User.countDocuments({ schoolId: req.user.schoolId, role: 'student' });
            const certificatesIssued = await Certificate.countDocuments({ schoolId: req.user.schoolId });
            const school = await School.findOne({ id: req.user.schoolId });
            
            userContext.dynamicContext = {
                hubName: school ? school.name : "Unknown Hub",
                studentCount,
                certificatesIssued,
                grades: req.user.grades || []
            };
        }

        const response = await aiManager.getBalancedResponse(message, userContext);
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
