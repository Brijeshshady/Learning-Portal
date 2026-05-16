const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    currentWeek: { type: Number, default: 1 },
    completedWeeks: [{ type: Number }],
    skills: {
        logic: { type: Number, default: 0 },
        coding: { type: Number, default: 0 },
        ai: { type: Number, default: 0 },
        iot: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 },
        ethics: { type: Number, default: 0 }
    },
    timeSpent: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', progressSchema);
