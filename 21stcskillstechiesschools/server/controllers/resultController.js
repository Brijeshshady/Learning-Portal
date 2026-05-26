const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const resultService = require('../services/resultService');

exports.submitAttempt = async (req, res) => {
    try {
        const { attemptId, answers } = req.body;
        const attempt = await ExamAttempt.findOne({ id: attemptId, studentId: req.user.id });
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });
        
        attempt.answers = answers;
        attempt.submittedAt = new Date();
        attempt.status = 'submitted';
        await attempt.save();
        
        // Evaluate attempt (awaits so they get the results populated)
        await resultService.evaluateAttempt(attemptId);
        
        res.json({ message: "Exam submitted and evaluated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentResults = async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.user.id }).sort({ createdAt: -1 });
        const examIds = results.map(r => r.examId);
        const exams = await Exam.find({ id: { $in: examIds } });
        const examMap = new Map(exams.map(e => [e.id, e]));
        
        const resultsWithExam = results.map(r => {
            const exam = examMap.get(r.examId);
            return {
                ...r.toObject(),
                examTitle: exam ? exam.title : 'Unknown Exam',
                examSubject: exam ? exam.subject : 'General',
                examType: exam ? exam.type : 'mcq'
            };
        });
        
        res.json(resultsWithExam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentResultByExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const result = await Result.findOne({ examId, studentId: req.user.id });
        if (!result) return res.status(404).json({ error: "Result not found" });
        
        const exam = await Exam.findOne({ id: examId });
        const attempt = await ExamAttempt.findOne({ examId, studentId: req.user.id });
        const questions = await Question.find({ examId });
        
        res.json({
            result,
            exam,
            attempt,
            questions
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getExamAttempts = async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await Exam.findOne({ id: examId });
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        
        const attempts = await ExamAttempt.find({ examId });
        const studentIds = attempts.map(a => a.studentId);
        const students = await User.find({ id: { $in: studentIds } });
        const studentMap = new Map(students.map(s => [s.id, s]));
        
        const results = await Result.find({ examId });
        const resultMap = new Map(results.map(r => [r.studentId, r]));
        
        const attemptsWithStudent = attempts.map(a => {
            const student = studentMap.get(a.studentId);
            const resData = resultMap.get(a.studentId);
            return {
                ...a.toObject(),
                studentName: student ? student.name : 'Unknown Student',
                studentEmail: student ? student.email : '',
                percentage: resData ? resData.percentage : 0,
                marksObtained: resData ? resData.marksObtained : 0,
                totalMarks: resData ? resData.totalMarks : exam.totalMarks
            };
        });
        
        res.json(attemptsWithStudent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAttemptEvaluation = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const attempt = await ExamAttempt.findOne({ id: attemptId });
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });
        
        const exam = await Exam.findOne({ id: attempt.examId });
        const questions = await Question.find({ examId: attempt.examId });
        const student = await User.findOne({ id: attempt.studentId }).select('-password');
        const result = await Result.findOne({ examId: attempt.examId, studentId: attempt.studentId });
        
        res.json({
            attempt,
            exam,
            questions,
            student,
            result
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.saveManualEvaluation = async (req, res) => {
    try {
        const { attemptId, gradedAnswers } = req.body; // gradedAnswers: [{ questionId, score, feedback }]
        const attempt = await ExamAttempt.findOne({ id: attemptId });
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });
        
        const exam = await Exam.findOne({ id: attempt.examId });
        const questions = await Question.find({ examId: attempt.examId });
        const questionsMap = new Map(questions.map(q => [q.id, q]));
        
        // Update individual scores and feedback
        let totalScore = 0;
        let maxPossibleScore = 0;
        const topicCounts = {};
        const subject = exam.subject || 'General';
        
        const updatedAnswers = attempt.answers.map(ans => {
            const q = questionsMap.get(ans.questionId);
            if (!q) return ans;
            
            maxPossibleScore += q.marks;
            if (!topicCounts[subject]) {
                topicCounts[subject] = { correct: 0, total: q.marks };
            } else {
                topicCounts[subject].total += q.marks;
            }
            
            const override = gradedAnswers.find(g => g.questionId === ans.questionId);
            
            if (override) {
                const score = Number(override.score);
                const isCorrect = score >= q.marks / 2;
                totalScore += score;
                topicCounts[subject].correct += score;
                return {
                    questionId: ans.questionId,
                    answer: ans.answer,
                    isCorrect,
                    score,
                    feedback: override.feedback
                };
            } else {
                const score = ans.score || 0;
                totalScore += score;
                topicCounts[subject].correct += score;
                return ans;
            }
        });
        
        attempt.answers = updatedAnswers;
        attempt.score = totalScore;
        attempt.status = 'evaluated';
        await attempt.save();
        
        // Recalculate percentage
        const percentage = maxPossibleScore > 0 ? Number(((totalScore / maxPossibleScore) * 100).toFixed(2)) : 0;
        
        // Recalculate topic analysis
        const topicWiseAnalysis = Object.keys(topicCounts).map(topic => ({
            topic,
            correct: topicCounts[topic].correct,
            total: topicCounts[topic].total
        }));
        
        // Update/create Result record
        const resultId = `RES-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const result = await Result.findOneAndUpdate(
            { examId: attempt.examId, studentId: attempt.studentId },
            {
                $set: {
                    marksObtained: totalScore,
                    totalMarks: maxPossibleScore,
                    percentage,
                    remarks: `Manual grading completed by ${req.user.name}.`,
                    topicWiseAnalysis
                },
                $setOnInsert: {
                    id: resultId,
                    examId: attempt.examId,
                    studentId: attempt.studentId,
                    strengths: ["Robotics Basics"],
                    weakAreas: ["Complex Conditions"]
                }
            },
            { upsert: true, new: true }
        );
        
        res.json({ message: "Evaluation saved successfully", attempt, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGlobalAnalytics = async (req, res) => {
    try {
        // Only Admin or School Admin can access
        const filter = {};
        if (req.user.role === 'school-admin') {
            filter.schoolId = req.user.schoolId;
        } else if (req.user.role === 'admin' && req.query.schoolId) {
            filter.schoolId = req.query.schoolId;
        }
        
        const exams = await Exam.find(filter);
        const examIds = exams.map(e => e.id);
        
        const results = await Result.find({ examId: { $in: examIds } });
        const attempts = await ExamAttempt.find({ examId: { $in: examIds } });
        
        // Aggregations
        const totalExams = exams.length;
        const totalAttempts = attempts.length;
        const averagePercentage = results.length > 0
            ? Number((results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length).toFixed(2))
            : 0;
            
        // Security Flags Counter
        let tabSwitches = 0;
        let fullscreenExits = 0;
        attempts.forEach(a => {
            if (a.securityFlags) {
                tabSwitches += a.securityFlags.tabSwitches || 0;
                fullscreenExits += a.securityFlags.fullscreenExits || 0;
            }
        });
        
        // Subject Wise performance
        const subjectPerformanceMap = {};
        results.forEach(r => {
            const exam = exams.find(e => e.id === r.examId);
            if (exam) {
                const sub = exam.subject;
                if (!subjectPerformanceMap[sub]) {
                    subjectPerformanceMap[sub] = { sum: 0, count: 0 };
                }
                subjectPerformanceMap[sub].sum += r.percentage;
                subjectPerformanceMap[sub].count += 1;
            }
        });
        
        const subjectPerformance = Object.keys(subjectPerformanceMap).map(subject => ({
            subject,
            averageScore: Number((subjectPerformanceMap[subject].sum / subjectPerformanceMap[subject].count).toFixed(2))
        }));
        
        res.json({
            totalExams,
            totalAttempts,
            averagePercentage,
            securityViolations: {
                tabSwitches,
                fullscreenExits
            },
            subjectPerformance
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
