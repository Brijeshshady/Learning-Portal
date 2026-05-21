const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

router.post('/submit', resultController.submitAttempt);
router.get('/student', resultController.getStudentResults);
router.get('/student/exam/:examId', resultController.getStudentResultByExam);
router.get('/attempts/exam/:examId', authorize('admin', 'school-admin', 'teacher'), resultController.getExamAttempts);
router.get('/attempts/eval/:attemptId', authorize('admin', 'school-admin', 'teacher'), resultController.getAttemptEvaluation);
router.post('/attempts/eval', authorize('admin', 'school-admin', 'teacher'), resultController.saveManualEvaluation);
router.get('/analytics', authorize('admin', 'school-admin'), resultController.getGlobalAnalytics);

module.exports = router;
