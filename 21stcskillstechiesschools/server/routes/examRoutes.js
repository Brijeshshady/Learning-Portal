const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { validateExamPayload } = require('../validators/examValidator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Inline authorization helper if needed, but we can also count on what is imported/defined in server.js.
// Since server.js mounts routes under protect, we'll assume req.user is set. We'll implement a local authorize middleware here to be safe and modular.
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

router.post('/', authorize('admin', 'school-admin', 'teacher'), validateExamPayload, examController.createExam);
router.get('/', examController.getExams);
router.post('/questions', authorize('admin', 'school-admin', 'teacher'), examController.addQuestions);
router.post('/generate-ai', authorize('admin', 'school-admin', 'teacher'), examController.aiGenerateQuestions);
router.post('/attempts/start', examController.startAttempt);
router.get('/attempts/:examId', examController.getAttempt);
router.post('/attempts/save', examController.autoSaveAttempt);
router.get('/:id', examController.getExamById);
router.put('/:examId/publish', authorize('admin', 'school-admin', 'teacher'), examController.publishExam);
router.delete('/:examId', authorize('admin', 'school-admin', 'teacher'), examController.deleteExam);

module.exports = router;
