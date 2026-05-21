exports.validateExamPayload = (req, res, next) => {
    const { title, gradeId, subject, type, duration, totalMarks, passingMarks, startTime, endTime } = req.body;
    
    if (!title || !gradeId || !subject || !type || !duration || !totalMarks || !passingMarks || !startTime || !endTime) {
        return res.status(400).json({ error: "Missing required fields for exam configuration." });
    }
    
    if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({ error: "Start time must be before end time." });
    }
    
    next();
};
