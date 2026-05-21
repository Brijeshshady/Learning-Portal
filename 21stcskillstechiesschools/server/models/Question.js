const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    input: { type: String },
    expectedOutput: { type: String },
    isPublic: { type: Boolean, default: true }
});

const questionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    examId: { type: String, required: true }, // Exam.id
    type: { type: String, enum: ['mcq', 'coding', 'descriptive'], required: true },
    question: { type: String, required: true },
    options: [{ type: String }], // Optional (for MCQ)
    correctAnswer: { type: String }, // MCQ correct option index/text, Coding expected output logic or starter template check, Descriptive essay guidelines
    marks: { type: Number, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    explanation: { type: String },
    
    // Coding details
    codingDetails: {
        starterCode: { type: String },
        testCases: [testCaseSchema]
    }
}, {
    timestamps: true
});

questionSchema.index({ examId: 1 });

module.exports = mongoose.model('Question', questionSchema);
