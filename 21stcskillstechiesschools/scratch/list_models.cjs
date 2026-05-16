const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.AI_KEY_1;

async function listModels() {
    console.log("Fetching available models for AI_KEY_1...");
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // The listModels method is not directly on genAI in the new SDK
        // We use the REST API via fetch or check the docs
        // Actually, the simplest way is to check the error message or try a few
        
        // Let's try the common ones
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
        
        for (let m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`✅ Model '${m}' is AVAILABLE`);
            } catch (e) {
                console.log(`❌ Model '${m}' is NOT AVAILABLE (${e.message.split('\n')[0]})`);
            }
        }
    } catch (err) {
        console.error("List Models Failed:", err.message);
    }
}

listModels();
