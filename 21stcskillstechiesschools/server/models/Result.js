const mongoose = require('mongoose');

const topicAnalysisSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
});

const resultSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    examId: { type: String, required: true },
    studentId: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    rank: { type: Number },
    percentile: { type: Number },
    remarks: { type: String },
    strengths: [{ type: String }],
    weakAreas: [{ type: String }],
    topicWiseAnalysis: [topicAnalysisSchema]
}, {
    timestamps: true
});

resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
