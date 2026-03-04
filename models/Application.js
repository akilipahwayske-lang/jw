const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'],
        default: 'Pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent a candidate from applying to the same job multiple times
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
