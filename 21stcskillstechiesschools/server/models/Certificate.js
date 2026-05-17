const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    schoolId: { type: String, required: true },
    title: { type: String, required: true },
    issuedBy: { type: String, required: true },
    date: { type: String, required: true },
}, {
    timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
