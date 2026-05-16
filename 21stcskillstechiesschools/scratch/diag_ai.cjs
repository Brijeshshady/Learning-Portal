const API = 'http://127.0.0.1:5000/api/ai/chat';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUxIiwiaWF0IjoxNzc4OTUzNjczLCJleHAiOjE3ODE1NDU2NzN9.1bPLseqzKeYYImfaMpchNIMFa7eCLIHGogFolWSh-rE';

async function testAI() {
    console.log("Sending AI request...");
    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: "What is AI?" })
        });
        const data = await res.json();
        console.log("AI Response Received:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Test Failed:", err.message);
    }
}

testAI();
