require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const School = require('./models/School');
const Token = require('./models/Token');

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
