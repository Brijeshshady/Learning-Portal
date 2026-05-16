require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const School = require('./models/School');
const Token = require('./models/Token');
const Progress = require('./models/Progress');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/21stc_portal';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Database Seeding Logic (To replace the db.js localStorage init)
async function seedDatabase() {
    try {
        console.log("Syncing demo data...");
        
        // Ensure Schools
        const schools = [
            { id: 'HUB-CH-01', name: '21stc Chennai Hub', plan: 'Enterprise', studentLimit: 5000, aiLimit: 20000, status: 'active' },
            { id: 'HUB-CBE-02', name: '21stc Coimbatore Hub', plan: 'Pro', studentLimit: 2000, aiLimit: 10000, status: 'active' }
        ];
        for (const s of schools) {
            await School.findOneAndUpdate({ id: s.id }, s, { upsert: true });
        }

        // Ensure Users (Demo Credentials)
        const users = [
            { id: 'u1', email: 'admin@21stc.com', password: 'admin123', role: 'admin', name: 'Super Admin', schoolId: 'global' },
            { id: 'u2', email: 'chennai.admin@21stc.school', password: 'school123', role: 'school-admin', name: 'Chennai Hub Admin', schoolId: 'HUB-CH-01' },
            { id: 'u3', email: 'kavitha.t@21stc.school', password: 'teacher123', role: 'teacher', name: 'Ms. Kavitha', schoolId: 'HUB-CH-01', grades: [6, 7] },
            { id: 'u4', email: 'arun.s@21stc.school', password: 'student123', role: 'student', name: 'Arun Kumar', schoolId: 'HUB-CH-01', grade: 7 }
        ];
        for (const u of users) {
            await User.findOneAndUpdate({ email: u.email }, u, { upsert: true });
        }

        // Ensure Tokens
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

// Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const { schoolId } = req.query;
        const filter = schoolId ? { schoolId } : {};
        const users = await User.find(filter);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/schools', async (req, res) => {
    try {
        const schools = await School.find();
        res.json(schools);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/schools/:id', async (req, res) => {
    try {
        const school = await School.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, upsert: true });
        res.json(school);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/progress/:userId', async (req, res) => {
    try {
        let progress = await Progress.findOne({ userId: req.params.userId });
        if (!progress) {
            progress = await Progress.create({ userId: req.params.userId });
        }
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/progress/:userId', async (req, res) => {
    try {
        const progress = await Progress.findOneAndUpdate({ userId: req.params.userId }, req.body, { new: true, upsert: true });
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tokens', async (req, res) => {
    try {
        const tokens = await Token.find();
        res.json(tokens);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
