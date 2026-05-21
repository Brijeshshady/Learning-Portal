const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
    id:           { type: String, required: true, unique: true },
    title:        { type: String, required: true },
    description:  { type: String, required: true },
    severity:     { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    category:     { type: String, default: 'Other' },
    page:         { type: String, default: '' },
    reportedBy:   { type: String },
    reporterRole: { type: String },
    reporterName: { type: String },
    hubId:        { type: String },
    status:       { type: String, enum: ['open', 'acknowledged', 'in-progress', 'resolved', 'closed'], default: 'open' },
    createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Bug', bugSchema);
