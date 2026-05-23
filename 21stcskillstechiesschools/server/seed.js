require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const School = require('./models/School');
const Token = require('./models/Token');
const Rollout = require('./models/Rollout');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/21stc_portal';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB for standalone seeding...');
        await seedDatabase();
        console.log('Seeding complete. Exiting.');
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB connection error during seeding:', err);
        process.exit(1);
    });

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
                exists.password = u.password; // Trigger re-hash via pre-save hook
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
