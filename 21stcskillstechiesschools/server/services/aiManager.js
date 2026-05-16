const { getAIResponse } = require('./aiService');

/**
 * AI Manager
 * Manages 5 API "Slots" to bypass individual rate limits (5 prompts/min).
 * Total Capacity: 25 prompts/min.
 */
class AIManager {
    constructor() {
        this.slots = [
            { id: 1, key: process.env.AI_KEY_1, usage: [], limit: 5 },
            { id: 2, key: process.env.AI_KEY_2, usage: [], limit: 5 },
            { id: 3, key: process.env.AI_KEY_3, usage: [], limit: 5 },
            { id: 4, key: process.env.AI_KEY_4, usage: [], limit: 5 },
            { id: 5, key: process.env.AI_KEY_5, usage: [], limit: 5 }
        ];
        this.COOLDOWN_MS = 60000; // 1 minute interval
    }

    /**
     * Finds an available slot or returns the wait time
     */
    getAvailableSlot() {
        const now = Date.now();
        
        for (let slot of this.slots) {
            // Clean up old usage timestamps (older than 1 minute)
            slot.usage = slot.usage.filter(timestamp => (now - timestamp) < this.COOLDOWN_MS);
            
            if (slot.usage.length < slot.limit) {
                return slot;
            }
        }
        return null;
    }

    /**
     * Executes a chat request using the best available slot
     */
    async getBalancedResponse(message, userContext) {
        const slot = this.getAvailableSlot();
        
        if (!slot) {
            console.warn("[AI MANAGER] All API slots exhausted. Capacity reached (25 req/min).");
            return {
                text: "My neural circuits are a bit busy right now due to high demand! Please wait a few seconds and try again.",
                suggestions: ["Try again in 10s", "Browse Syllabus"]
            };
        }

        // Record usage
        slot.usage.push(Date.now());
        console.log(`[AI MANAGER] Using Slot ${slot.id}. Usage: ${slot.usage.length}/${slot.limit} | Key: ${slot.key?.substring(0, 8)}...`);

        try {
            return await getAIResponse(message, userContext, slot.key);
        } catch (err) {
            console.error(`[AI MANAGER] Error in Slot ${slot.id}:`, err.message);
            throw err;
        }
    }
}

module.exports = new AIManager();
