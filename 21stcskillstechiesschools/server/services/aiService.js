const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const getAIResponse = async (userMessage, userContext, apiKey) => {
    try {
        if (!apiKey || apiKey.includes("your_key")) {
            throw new Error("No valid API key provided");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Use Gemini 3.1 Flash Lite as requested
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const { name, grade, role } = userContext;

        const systemInstruction = `
            You are the "21stc AI Mentor" for the 21st Century Learning Portal.
            Your tone is professional, futuristic, and encouraging.
            
            USER PROFILE:
            - Name: ${name}
            - Grade: ${grade}
            - Role: ${role}
            
            KNOWLEDGE BASE (21stc Curriculum):
            - Week 1-12: Robotics Foundation (Sensors, Actuators, Circuitry).
            - Week 13-24: Python for AI (Variables, Logic, Data Science).
            - Week 25-36: Advanced AI (Neural Networks, NLP, Computer Vision).
            
            TASK:
            Answer the user's message accurately. If they ask about their current studies, refer to the knowledge base above.
            Always provide a structured response in the following JSON format:
            {
                "text": "Your helpful response in Markdown",
                "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"],
                "richContent": {
                    "type": "insight" | "module_overview" | null,
                    "title": "Short title",
                    "content": "Additional details or specific concept explanation",
                    "completion": number (0-100, optional progress indicator)
                }
            }
        `;

        const result = await model.generateContent(`${systemInstruction}\n\nUser Message: "${userMessage}"`);
        const responseText = result.response.text();
        
        console.log("[AI SERVICE] Raw Response:", responseText);

        try {
            // Since we used responseMimeType: application/json, it should be pure JSON
            const data = JSON.parse(responseText);
            
            // Ensure suggestions is always an array
            if (!Array.isArray(data.suggestions)) {
                data.suggestions = ["Tell me more", "Next topic", "Explore Library"];
            }
            
            return data;
        } catch (e) {
            console.error("[AI SERVICE] JSON Parse Error. Attempting Regex Recovery.");
            const start = responseText.indexOf('{');
            const end = responseText.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                const recovered = JSON.parse(responseText.substring(start, end + 1));
                return recovered;
            }
            throw e;
        }
    } catch (err) {
        console.error("[AI SERVICE] Fatal Error:", err.message);
        
        // Smart Local Fallback Response Generator for Offline/Mock-Key support
        try {
            return generateMockResponse(userMessage, userContext, err.message);
        } catch (fallbackErr) {
            return {
                text: `I encountered a momentary glitch in my neural network (${err.message}). How else can I assist you with your Grade ${userContext.grade} studies?`,
                suggestions: ["Try again", "Go to Dashboard", "View Roadmap"],
                richContent: {
                    type: "insight",
                    title: "System Alert",
                    content: "The AI Mentor is currently experiencing high load or connectivity issues. Please try again in a few moments."
                }
            };
        }
    }
};

const generateMockResponse = (userMessage, userContext, errMessage) => {
    const msg = userMessage.toLowerCase();
    const { name, grade, role } = userContext;

    let text = `Hi ${name}! I am your AI Mentor. It looks like my high-speed connection is offline (${errMessage || 'Service Cooldown'}), but my local neural processor is active! How can I help you with your Grade ${grade} studies today?`;
    let suggestions = ["Tell me about Python", "What is Robotics?", "What are Neural Networks?", "View my weekly roadmap"];
    let richContent = null;

    if (msg.includes("python") || msg.includes("loop") || msg.includes("variable") || msg.includes("code") || msg.includes("program")) {
        text = `### 🐍 Master Python Programming!\n\nHi ${name}! Python is the language of AI. In Grade ${grade}, you'll learn about variables, loops, logic, and simple lists. Here's a quick example of a loop in Python:\n\n\`\`\`python\n# Printing numbers 1 to 5\nfor i in range(1, 6):\n    print("Step:", i)\n\`\`\`\n\nWhat topic would you like to explore next?`;
        suggestions = ["What is a Variable?", "Explain If-Else Logic", "Python Functions", "Go to AI Lab"];
        richContent = {
            type: "module_overview",
            title: "Python Foundations",
            content: "Learn variables, conditional loops, functions, and data operations.",
            completion: 45,
            concepts: ["Variables & Types", "Conditional Logic", "For/While Loops", "Defining Functions"]
        };
    } else if (msg.includes("robot") || msg.includes("sensor") || msg.includes("actuator") || msg.includes("circuit") || msg.includes("hardware")) {
        text = `### 🤖 Robotics Foundation!\n\nRobotics connects computer code with the physical world. In the **21stc Curriculum**, you'll master:\n\n1. **Sensors**: Inputs like Ultrasonic (distance) and Light sensors.\n2. **Microcontrollers**: The brain (like Arduino or Raspberry Pi).\n3. **Actuators**: Outputs like Servos and Motors.\n\nWould you like to build a virtual sensor circuit today?`;
        suggestions = ["How Ultrasonic Sensors work", "What is a Servo Motor?", "Arduino Programming", "Go to Projects"];
        richContent = {
            type: "module_overview",
            title: "Robotics Foundation",
            content: "Master hardware components, circuitry, microcontrollers, and servo motors.",
            completion: 75,
            concepts: ["Sensor Inputs", "Arduino Sketching", "Voltage & Resistance", "Servo Control"]
        };
    } else if (msg.includes("neural") || msg.includes("ai") || msg.includes("learning") || msg.includes("intelligence") || msg.includes("nlp") || msg.includes("vision")) {
        text = `### 🧠 Neural Networks & Advanced AI!\n\nAI replicates human intelligence. **Neural Networks** are inspired by the human brain, using interconnected nodes (neurons) arranged in layers to recognize patterns in data.\n\n* **Input Layer**: Receives features (e.g. image pixels).\n* **Hidden Layers**: Extracts patterns.\n* **Output Layer**: Makes predictions.\n\nLet's discuss how computer vision detects objects!`;
        suggestions = ["What is Computer Vision?", "How Neural Networks learn", "What is NLP?", "View My Roadmap"];
        richContent = {
            type: "insight",
            title: "AI & Neural Networks",
            content: "Deep learning relies on layered neural networks to process multidimensional data such as visual frames and textual tokens.",
            completion: 20
        };
    } else if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey") || msg.includes("help")) {
        text = `### 👋 Hello, ${name}!\n\nWelcome to your **21stc AI Mentor** space. I am here to guide you step-by-step through our advanced tech syllabus:\n\n* 🤖 **Weeks 1-12**: Robotics Foundation.\n* 🐍 **Weeks 13-24**: Python for AI.\n* 🧠 **Weeks 25-36**: Advanced AI & Neural Networks.\n\nAsk me any question about your studies or click a suggestion below to get started!`;
        suggestions = ["Tell me about Python", "What is Robotics?", "What are Neural Networks?", "My Weekly Roadmap"];
    }

    return { text, suggestions, richContent };
};

module.exports = { getAIResponse };
