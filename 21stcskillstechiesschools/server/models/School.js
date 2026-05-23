const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], required: true },
    studentLimit: { type: Number, required: true },
    aiLimit: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    location: { type: String },
    mapsLink: { type: String },
    maintenance: {
        active: { type: Boolean, default: false },
        until: { type: String },
        message: { type: String }
    },
    featureLimits: {
        examLimit:          { type: Number, default: 50 },
        storageLimit:       { type: Number, default: 10 },
        playgroundEnabled:  { type: Boolean, default: true },
        certificateLimit:   { type: Number, default: 200 },
        communityAccess:    { type: Boolean, default: true },
        maxTeachers:        { type: Number, default: 15 },
        dailyAiLimit:       { type: Number, default: 200 },
        maxExamAttempts:    { type: Number, default: 3 },
        sandboxTimeout:     { type: Number, default: 5 },
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('School', schoolSchema);
