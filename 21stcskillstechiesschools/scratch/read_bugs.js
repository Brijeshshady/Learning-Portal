const mongoose = require('../server/node_modules/mongoose');
const Bug = require('../server/models/Bug');

async function main() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/21stc_portal');
        console.log("Connected to MongoDB.");
        
        const bugs = await Bug.find({}).sort({ createdAt: -1 });
        console.log(`Found ${bugs.length} bug reports:`);
        console.log(JSON.stringify(bugs, null, 2));
    } catch (err) {
        console.error("Error reading bugs:", err);
    } finally {
        await mongoose.disconnect();
    }
}

main();
