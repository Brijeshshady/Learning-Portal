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

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8102;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/21stc_portal';
const JWT_SECRET = process.env.JWT_SECRET || '21stc_super_secret_key_2024';

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
            { id: 'HUB-CH-01', name: '21stc Chennai Hub', plan: 'Enterprise', studentLimit: 5000, aiLimit: 20000, status: 'active' },
            { id: 'HUB-CBE-02', name: '21stc Coimbatore Hub', plan: 'Pro', studentLimit: 2000, aiLimit: 10000, status: 'active' }
        ];
        for (const s of schools) {
            await School.findOneAndUpdate({ id: s.id }, s, { upsert: true });
        }

        const users = [
            { id: 'u0', email: 'superadmin@21stc.com', password: 'password123', role: 'admin', name: 'Super Admin', schoolId: null },
            { id: 'u5', email: 'hubadmin@21stc.com', password: 'password123', role: 'school-admin', name: 'Chennai Hub Admin', schoolId: 'HUB-CH-01' },
            { id: 'u3', email: 'teacher@21stc.com', password: 'password123', role: 'teacher', name: 'Ms. Kavitha', schoolId: 'HUB-CH-01', grades: [6, 7] },
            { id: 'u4', email: 'student@21stc.com', password: 'password123', role: 'student', name: 'Arun Kumar', schoolId: 'HUB-CH-01', grade: 7 }
        ];
        
        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
            } else {
                // Force update demo credentials to match aligned list
                exists.email = u.email;
                exists.name = u.name;
                exists.role = u.role;
                exists.schoolId = u.schoolId;
                exists.password = u.password; // Trigger re-hash via pre-save hook
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
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        
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

// Protected routes
app.get('/api/users', protect, async (req, res) => {
    try {
        const { schoolId } = req.query;
        // Teachers/SchoolAdmins can only see their school's users
        if (req.user.role !== 'admin' && schoolId && schoolId !== req.user.schoolId) {
            return res.status(403).json({ error: 'Unauthorized access to this school' });
        }
        const filter = schoolId ? { schoolId } : {};
        const users = await User.find(filter).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:email', protect, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
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
        if (email) user.email = email;
        
        await user.save();
        res.json({ name: user.name, email: user.email });
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
