const mongoose = require('mongoose');

const rolloutSchema = new mongoose.Schema({
    id:          { type: String, required: true, unique: true },
    version:     { type: String, required: true },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    channel:     { type: String, enum: ['beta', 'stable'], default: 'stable' },
    targetHubs:  [{ type: String }],
    status:      { type: String, enum: ['pending', 'scheduled', 'applied', 'rolled-back'], default: 'pending' },
    scheduledAt: { type: Date },
    appliedAt:   { type: Date },
    createdBy:   { type: String },
    changelog:   [{ type: String }],
    createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rollout', rolloutSchema);
