const mongoose = require('../server/node_modules/mongoose');
const Exam = require('../server/models/Exam');
const Question = require('../server/models/Question');

async function main() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/21stc_portal');
        console.log("Connected to MongoDB.");

        // 1. Clean up any existing test exam
        const examId = "EXM-TEST-PROCTOR";
        await Exam.deleteOne({ id: examId });
        await Question.deleteMany({ examId });
        console.log("Cleaned up old test exam if any.");

        // 2. Create the questions
        const questionsData = [
            {
                id: 'QST-PROCTOR-MCQ',
                examId,
                type: 'mcq',
                question: 'Which of the following is used to define a block of code in Python?',
                options: ['Curly braces', 'Parentheses', 'Indentation', 'Quotation marks'],
                correctAnswer: 'Indentation',
                marks: 10,
                difficulty: 'easy',
                explanation: 'Python uses indentation to indicate blocks of code instead of curly braces or parentheses.'
            },
            {
                id: 'QST-PROCTOR-CODING',
                examId,
                type: 'coding',
                question: 'Write a Python function `double_value(x)` that returns twice the input value.',
                options: [],
                correctAnswer: 'def double_value(x):\n    return x * 2',
                marks: 20,
                difficulty: 'medium',
                explanation: 'The function should accept x as parameter and return x multiplied by 2.',
                codingDetails: {
                    starterCode: 'def double_value(x):\n    # Write your code here\n    pass',
                    testCases: [
                        { input: '5', expectedOutput: '10', isPublic: true },
                        { input: '12', expectedOutput: '24', isPublic: false }
                    ]
                }
            },
            {
                id: 'QST-PROCTOR-DESC',
                examId,
                type: 'descriptive',
                question: 'Explain the difference between a sensor and an actuator in robotics, giving one example of each.',
                options: [],
                correctAnswer: 'Sensors act as inputs, measuring or detecting changes in the physical environment (e.g. Ultrasonic sensor measuring distance). Actuators act as outputs, converting energy into physical movement or actions (e.g. Servo motor moving a robot arm).',
                marks: 20,
                difficulty: 'medium',
                explanation: 'Sensors receive information (inputs), whereas actuators perform physical work (outputs).'
            }
        ];

        const createdQuestions = [];
        for (const q of questionsData) {
            const qDoc = await Question.create(q);
            createdQuestions.push(qDoc.id);
            console.log(`Created question: ${qDoc.id} (${qDoc.type})`);
        }

        // 3. Create the Exam
        const examData = {
            id: examId,
            title: 'Proctored Assessment: Robotics & Python Basics',
            description: 'This is a sandbox practice exam designed to test the proctoring enforcement mechanism (fullscreen block, tab switches, and fullscreen exits) and manual grading.',
            gradeId: 7, // Arun Kumar (student@21stc.com) is in Grade 7
            subject: 'Robotics & Python',
            type: 'mixed',
            duration: 30, // 30 minutes
            totalMarks: 50,
            passingMarks: 20,
            startTime: new Date(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Active for 7 days
            instructions: 'Please ensure you are in a quiet room. You must remain in Fullscreen mode during the entire assessment. Any exits or tab switches will be logged in the system.',
            questions: createdQuestions,
            createdBy: 'u3', // Ms. Kavitha (teacher@21stc.com)
            schoolId: 'HUB-CH-01', // Chennai Hub
            status: 'published'
        };

        const examDoc = await Exam.create(examData);
        console.log(`Created published Exam: ${examDoc.title} (${examDoc.id})`);
        console.log("\n-----------------------------------------");
        console.log("TEST EXAM SEEDED SUCCESSFULLY!");
        console.log("-----------------------------------------");
        console.log("To test as student:");
        console.log("  - Login Email: student@21stc.com");
        console.log("  - Password:    password123");
        console.log("  - Start the exam from the Assessments tab.");
        console.log("To grade as teacher:");
        console.log("  - Login Email: teacher@21stc.com");
        console.log("  - Password:    password123");
        console.log("  - Manage the exam and manual override scores in the Grading Workspace.");
        console.log("-----------------------------------------");
        
    } catch (err) {
        console.error("Error creating test exam:", err);
    } finally {
        await mongoose.disconnect();
    }
}

main();
