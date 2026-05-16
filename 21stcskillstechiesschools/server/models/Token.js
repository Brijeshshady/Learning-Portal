const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    schoolId: { type: String, required: true },
    usage: { type: Number, default: 0 },
    limit: { type: Number, required: true },
    expiry: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Token', tokenSchema);
