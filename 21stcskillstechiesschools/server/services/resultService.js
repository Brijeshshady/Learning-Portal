const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const User = require('../models/User');
const examService = require('./examService');
const aiManager = require('./aiManager');

/**
 * Evaluates an exam attempt session and creates/updates a Result report
 */
exports.evaluateAttempt = async (attemptId) => {
    try {
        const attempt = await ExamAttempt.findOne({ id: attemptId });
        if (!attempt) return console.error(`[RESULT SERVICE] Attempt ${attemptId} not found`);
        
        const exam = await Exam.findOne({ id: attempt.examId });
        const subject = exam ? exam.subject : 'General';
        
        const student = await User.findOne({ id: attempt.studentId });
        const studentGrade = student ? student.grade : 7;
        
        const questions = await Question.find({ examId: attempt.examId });
        const questionsMap = new Map(questions.map(q => [q.id, q]));
        
        let totalScore = 0;
        let maxPossibleScore = 0;
        const evaluatedAnswers = [];
        const topicCounts = {}; // { subject: { correct: 0, total: 0 } }
        
        for (const ans of attempt.answers) {
            const q = questionsMap.get(ans.questionId);
            if (!q) continue;
            
            maxPossibleScore += q.marks;
            // Use exam's subject as the topic category
            if (!topicCounts[subject]) {
                topicCounts[subject] = { correct: 0, total: q.marks };
            } else {
                topicCounts[subject].total += q.marks;
            }
            
            let isCorrect = false;
            let score = 0;
            let feedback = '';
            
            if (q.type === 'mcq') {
                isCorrect = ans.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                score = isCorrect ? q.marks : 0;
                totalScore += score;
                if (isCorrect) topicCounts[subject].correct += q.marks;
                
                evaluatedAnswers.push({
                    questionId: ans.questionId,
                    answer: ans.answer,
                    isCorrect,
                    score,
                    feedback: isCorrect ? "Correct answer!" : `Incorrect. Correct answer was: ${q.correctAnswer}`
                });
            } else if (q.type === 'coding') {
                // Call coding test case runner
                const testCases = q.codingDetails?.testCases || [];
                const runResults = await examService.runCodingTests(ans.answer, testCases);
                
                isCorrect = runResults.passedAll;
                score = Math.round((runResults.scorePercent / 100) * q.marks);
                totalScore += score;
                topicCounts[subject].correct += score;
                
                const failedCount = runResults.feedback.filter(f => !f.passed).length;
                feedback = isCorrect 
                    ? "Excellent! All test cases passed successfully." 
                    : `Passed ${runResults.feedback.length - failedCount}/${runResults.feedback.length} test cases.`;
                
                evaluatedAnswers.push({
                    questionId: ans.questionId,
                    answer: ans.answer,
                    isCorrect,
                    score,
                    feedback: `${feedback}\n${JSON.stringify(runResults.feedback, null, 2)}`
                });
            } else if (q.type === 'descriptive') {
                // Call AI to grade descriptive answer
                const aiPrompt = `
                    Evaluate this student descriptive answer against the question criteria.
                    
                    Question: "${q.question}"
                    Grading Rubric/Ideal Guidelines: "${q.correctAnswer}"
                    Student Answer: "${ans.answer}"
                    Maximum Possible Marks: ${q.marks}
                    
                    Return exactly a JSON response object. Do not add markdown backticks around it:
                    {
                        "score": number (0 to ${q.marks}),
                        "feedback": "constructive, encouraging feedback text",
                        "isCorrect": true/false
                    }
                `;
                
                try {
                    const aiRes = await aiManager.getBalancedResponse(aiPrompt, {
                        name: "Descriptive Grader Core",
                        role: "teacher",
                        grade: studentGrade
                    });
                    
                    let rawText = aiRes.text || aiRes;
                    if (typeof rawText === 'object') rawText = JSON.stringify(rawText);
                    
                    if (rawText.includes("```")) {
                        const start = rawText.indexOf('{');
                        const end = rawText.lastIndexOf('}');
                        if (start !== -1 && end !== -1) {
                            rawText = rawText.substring(start, end + 1);
                        }
                    }
                    
                    const evalObj = JSON.parse(rawText);
                    score = evalObj.score;
                    feedback = evalObj.feedback;
                    isCorrect = evalObj.isCorrect;
                } catch (e) {
                    // Fallback local scoring if external service is cooling down
                    score = ans.answer.length > 20 ? Math.round(q.marks * 0.7) : 0;
                    feedback = "Descriptive answer marked via local length filter (AI pipeline offline).";
                    isCorrect = score >= q.marks / 2;
                }
                
                totalScore += score;
                topicCounts[subject].correct += score;
                evaluatedAnswers.push({
                    questionId: ans.questionId,
                    answer: ans.answer,
                    isCorrect,
                    score,
                    feedback
                });
            }
        }
        
        attempt.answers = evaluatedAnswers;
        attempt.score = totalScore;
        attempt.status = 'evaluated';
        await attempt.save();
        
        // Calculate percentages
        const percentage = maxPossibleScore > 0 ? Number(((totalScore / maxPossibleScore) * 100).toFixed(2)) : 0;
        
        // Compile weak areas and strengths using AI
        let strengths = ["Robotics Basics"];
        let weakAreas = ["Complex Conditions"];
        let remarks = "Exam scoring completed successfully.";
        
        const analysisPrompt = `
            Analyze this student's exam performance:
            Total Marks Obtained: ${totalScore} of ${maxPossibleScore} (${percentage}%)
            Detailed Answers: ${JSON.stringify(evaluatedAnswers.map(a => {
                const q = questionsMap.get(a.questionId);
                return {
                    question: q?.question,
                    topic: subject,
                    maxMarks: q?.marks,
                    scoreAwarded: a.score,
                    isCorrect: a.isCorrect
                };
            }))}
            
            Identify specific strengths (concepts they understand well) and weak areas (concepts they struggled with).
            Return exactly a JSON response object. Do not add markdown backticks around it:
            {
                "strengths": ["topic 1", "topic 2"],
                "weakAreas": ["topic 1", "topic 2"],
                "remarks": "Overall feedback remarks."
            }
        `;
        
        try {
            const aiAnalysis = await aiManager.getBalancedResponse(analysisPrompt, {
                name: "Insights Builder Core",
                role: "teacher",
                grade: studentGrade
            });
            
            let rawText = aiAnalysis.text || aiAnalysis;
            if (typeof rawText === 'object') rawText = JSON.stringify(rawText);
            
            if (rawText.includes("```")) {
                const start = rawText.indexOf('{');
                const end = rawText.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    rawText = rawText.substring(start, end + 1);
                }
            }
            
            const analysis = JSON.parse(rawText);
            strengths = analysis.strengths || strengths;
            weakAreas = analysis.weakAreas || weakAreas;
            remarks = analysis.remarks || remarks;
        } catch (e) {
            console.error("[RESULT SERVICE] Insights parsing failed. Using fallbacks.", e);
        }
        
        // Construct topic analysis array
        const topicWiseAnalysis = Object.keys(topicCounts).map(topic => ({
            topic,
            correct: topicCounts[topic].correct,
            total: topicCounts[topic].total
        }));
        
        const resultId = `RES-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        
        // Update/create Result record
        await Result.findOneAndUpdate(
            { examId: attempt.examId, studentId: attempt.studentId },
            {
                id: resultId,
                examId: attempt.examId,
                studentId: attempt.studentId,
                marksObtained: totalScore,
                totalMarks: maxPossibleScore,
                percentage,
                remarks,
                strengths,
                weakAreas,
                topicWiseAnalysis
            },
            { upsert: true, new: true }
        );
        
        console.log(`[RESULT SERVICE] Evaluation completed for attempt ${attemptId}. Score: ${totalScore}/${maxPossibleScore}`);
    } catch (err) {
        console.error("[RESULT SERVICE] Critical evaluation crash:", err);
    }
};
