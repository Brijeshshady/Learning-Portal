const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    gradeId: { type: Number, required: true },
    subject: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'coding', 'descriptive', 'practical', 'mixed'], required: true },
    duration: { type: Number, required: true }, // in minutes
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    instructions: { type: String },
    questions: [{ type: String }], // Array of Question.id strings
    createdBy: { type: String, required: true }, // User.id (Teacher/Admin)
    schoolId: { type: String, required: true }, // School.id
    status: { type: String, enum: ['draft', 'published', 'completed'], default: 'draft' }
}, {
    timestamps: true
});

examSchema.index({ schoolId: 1, gradeId: 1, status: 1 });

module.exports = mongoose.model('Exam', examSchema);
