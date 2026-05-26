const aiManager = require('./aiManager');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');

/**
 * AI Question Generator
 */
exports.generateAIQuestions = async ({ grade, subject, topic, difficulty, type, count = 5 }) => {
    const prompt = `
        Generate exactly ${count} exam questions for Grade ${grade} students on the topic "${topic}" in the subject "${subject}".
        The difficulty must be "${difficulty}" and the type of questions must be "${type}".
        
        You must return exactly a JSON array containing questions matching this schema. Do not add markdown around it, return pure JSON.
        
        Schema rules:
        - If type is "mcq", you must provide an "options" array with exactly 4 strings, and a "correctAnswer" which must match exactly one of the options.
        - If type is "descriptive", "options" must be empty, and "correctAnswer" should be grading rubric/ideal answer instructions.
        - If type is "coding", "options" must be empty, "correctAnswer" must be the sample correct code solution, and you MUST populate "codingDetails" with "starterCode" (boilerplate) and "testCases" (at least 2 cases, each having "input", "expectedOutput" and "isPublic" boolean).
        
        Target Schema format:
        [
            {
                "question": "What is ...?",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "A",
                "difficulty": "${difficulty}",
                "explanation": "Explanation here",
                "codingDetails": {
                    "starterCode": "def solve():\\n    pass",
                    "testCases": [
                        { "input": "5", "expectedOutput": "10", "isPublic": true }
                    ]
                }
            }
        ]
    `;

    try {
        const aiResponse = await aiManager.getBalancedResponse(prompt, {
            name: "Exam Generator Assistant",
            role: "teacher",
            grade: grade || 7
        });
        
        let rawText = aiResponse.text || aiResponse;
        if (typeof rawText === 'object') {
            rawText = JSON.stringify(rawText);
        }
        
        // Clean markdown backticks if returned by the model
        if (rawText.includes("```")) {
            const start = rawText.indexOf('[');
            const end = rawText.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                rawText = rawText.substring(start, end + 1);
            }
        }
        
        return JSON.parse(rawText);
    } catch (err) {
        console.error("[EXAM SERVICE] Question Gen Error:", err.message);
        // Return local mock questions list as fallback if the AI key limits or network fails
        return Array.from({ length: count }, (_, i) => ({
            question: `Mock Question ${i + 1} regarding ${topic} (Gemini fallback mode)`,
            options: type === 'mcq' ? ["Option A", "Option B", "Option C", "Option D"] : [],
            correctAnswer: type === 'mcq' ? "Option A" : "Sample ideal answer response.",
            difficulty,
            explanation: "This is a placeholder explanation because the live AI pipeline is cooling down.",
            codingDetails: type === 'coding' ? {
                starterCode: "def process_data(val):\n    # Write code here\n    return val * 2\n",
                testCases: [
                    { input: "2", expectedOutput: "4", isPublic: true },
                    { input: "10", expectedOutput: "20", isPublic: true }
                ]
            } : null
        }));
    }
};

/**
 * Runs coding solutions against test cases using Gemini code-run simulation
 */
exports.runCodingTests = async (code, testCases) => {
    let passed = 0;
    const feedback = [];
    
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const evaluationPrompt = `
            Act as a secure sandboxed programming compiler and execute this code.
            
            Code to run:
            \`\`\`python
            ${code}
            \`\`\`
            
            Standard input passed: "${tc.input}"
            Expected output: "${tc.expectedOutput}"
            
            Verify if running this code with the input produces the expected output.
            You must return exactly a JSON response object:
            {
                "passed": true/false,
                "actualOutput": "actual output text here",
                "error": "compiler error message if syntax is invalid or crashes"
            }
        `;
        
        try {
            const aiEval = await aiManager.getBalancedResponse(evaluationPrompt, { name: "Code Evaluator Core", role: "admin" });
            let rawText = aiEval.text || aiEval;
            if (typeof rawText === 'object') {
                rawText = JSON.stringify(rawText);
            }
            if (rawText.includes("```")) {
                const start = rawText.indexOf('{');
                const end = rawText.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    rawText = rawText.substring(start, end + 1);
                }
            }
            
            const result = JSON.parse(rawText);
            if (result.passed) {
                passed++;
            }
            feedback.push({
                testCaseIndex: i,
                passed: result.passed,
                actualOutput: result.actualOutput || '',
                expectedOutput: tc.expectedOutput,
                error: result.error || null
            });
        } catch (e) {
            // Mark as failed when AI pipeline is offline (no insecure substring matching fallback)
            feedback.push({
                testCaseIndex: i,
                passed: false,
                actualOutput: 'AI evaluation offline',
                expectedOutput: tc.expectedOutput,
                error: 'AI coding evaluation service is currently offline. Marked for manual review.'
            });
        }
    }
    
    return {
        passedAll: testCases.length > 0 ? passed === testCases.length : false,
        scorePercent: testCases.length > 0 ? (passed / testCases.length) * 100 : 0,
        feedback
    };
};
