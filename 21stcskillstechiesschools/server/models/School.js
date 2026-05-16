const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], required: true },
    studentLimit: { type: Number, required: true },
    aiLimit: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('School', schoolSchema);
