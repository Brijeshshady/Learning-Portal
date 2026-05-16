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
        
        // Return a gracefully structured error response
        return {
            text: `I encountered a momentary glitch in my neural network ($${err.message}). How else can I assist you with your Grade ${userContext.grade} studies?`,
            suggestions: ["Try again", "Go to Dashboard", "View Roadmap"],
            richContent: {
                type: "insight",
                title: "System Alert",
                content: "The AI Mentor is currently experiencing high load or connectivity issues. Please try again in a few moments."
            }
        };
    }
};

module.exports = { getAIResponse };
