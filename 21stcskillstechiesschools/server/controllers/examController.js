const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const examService = require('../services/examService');

exports.createExam = async (req, res) => {
    try {
        const id = `EXM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        
        // Ensure gradeId is stored as a number
        const gradeId = Number(req.body.gradeId);
        
        const exam = await Exam.create({
            ...req.body,
            id,
            gradeId,
            createdBy: req.user.id,
            schoolId: req.user.schoolId || req.body.schoolId || 'HUB-CH-01'
        });
        res.status(201).json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getExams = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'student') {
            filter.schoolId = req.user.schoolId;
            filter.gradeId = req.user.grade;
            filter.status = 'published';
        } else {
            // Teacher/School Admin/Super Admin
            if (req.user.schoolId) {
                filter.schoolId = req.user.schoolId;
            } else if (req.query.schoolId) {
                filter.schoolId = req.query.schoolId;
            }
            // For teachers, we could filter by grades, but let's let them see all exams of the school.
        }
        const exams = await Exam.find(filter).sort({ startTime: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findOne({ id: req.params.id });
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        
        // Data boundary validation
        if (req.user.role === 'student') {
            if (exam.schoolId !== req.user.schoolId || exam.gradeId !== req.user.grade || exam.status !== 'published') {
                return res.status(403).json({ error: "Unauthorized to access this exam" });
            }
        } else if (req.user.role !== 'admin') {
            // Teacher/School Admin must belong to the same school
            if (exam.schoolId !== req.user.schoolId) {
                return res.status(403).json({ error: "Unauthorized to access this exam" });
            }
        }
        
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addQuestions = async (req, res) => {
    try {
        const { examId, questions } = req.body;
        const exam = await Exam.findOne({ id: examId });
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        
        const createdQuestions = [];
        for (const q of questions) {
            const qId = `QST-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
            await Question.create({
                ...q,
                id: qId,
                examId,
                subject: exam.subject
            });
            createdQuestions.push(qId);
        }
        
        exam.questions.push(...createdQuestions);
        await exam.save();
        
        res.json({ message: "Questions added successfully", questionIds: createdQuestions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.aiGenerateQuestions = async (req, res) => {
    try {
        const { grade, subject, topic, difficulty, type, count } = req.body;
        const questions = await examService.generateAIQuestions({ grade, subject, topic, difficulty, type, count });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.startAttempt = async (req, res) => {
    try {
        const { examId } = req.body;
        const exam = await Exam.findOne({ id: examId });
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        
        // Check if attempt already exists
        let attempt = await ExamAttempt.findOne({ examId, studentId: req.user.id });
        if (attempt) {
            return res.json(attempt);
        }
        
        // Randomize question sequence for security
        let questionIds = [...exam.questions];
        questionIds.sort(() => Math.random() - 0.5);
        
        const attemptId = `ATT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        attempt = await ExamAttempt.create({
            id: attemptId,
            examId,
            studentId: req.user.id,
            answers: questionIds.map(qId => ({ questionId: qId, answer: '' })),
            securityFlags: {
                tabSwitches: 0,
                fullscreenExits: 0,
                ipAddress: req.ip || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            }
        });
        
        res.status(201).json(attempt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAttempt = async (req, res) => {
    try {
        const { examId } = req.params;
        const attempt = await ExamAttempt.findOne({ examId, studentId: req.user.id });
        if (!attempt) return res.status(404).json({ error: "Attempt session not found" });
        
        const questions = await Question.find({ examId });
        
        // Secure question delivery: filter out answers, explanations and private testcases
        const secureQuestions = questions.map(q => {
            const qObj = q.toObject();
            delete qObj.correctAnswer;
            delete qObj.explanation;
            if (qObj.codingDetails && qObj.codingDetails.testCases) {
                qObj.codingDetails.testCases = qObj.codingDetails.testCases.filter(tc => tc.isPublic);
            }
            return qObj;
        });
        
        res.json({ attempt, questions: secureQuestions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.autoSaveAttempt = async (req, res) => {
    try {
        const { attemptId, answers, securityFlags } = req.body;
        const attempt = await ExamAttempt.findOne({ id: attemptId, studentId: req.user.id });
        if (!attempt) return res.status(404).json({ error: "Attempt session not found" });
        
        if (attempt.status !== 'in-progress') {
            return res.status(400).json({ error: "Attempt is already submitted or evaluated" });
        }
        
        attempt.answers = answers;
        if (securityFlags) {
            attempt.securityFlags.tabSwitches = securityFlags.tabSwitches;
            attempt.securityFlags.fullscreenExits = securityFlags.fullscreenExits;
        }
        
        await attempt.save();
        res.json({ message: "Auto-saved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.publishExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await Exam.findOne({ id: examId });
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        
        exam.status = 'published';
        await exam.save();
        res.json({ message: "Exam published successfully", exam });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await Exam.findOneAndDelete({ id: examId });
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        
        // Clean up questions
        await Question.deleteMany({ examId });
        res.json({ message: "Exam and questions deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
