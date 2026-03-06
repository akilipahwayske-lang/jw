const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['candidate', 'employer', 'admin'], default: 'candidate' },
    profile: {
        firstName: String,
        lastName: String,
        bio: String,
        resumeUrl: String,
        companyName: String,
        companyLogo: String
    },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    profileViews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
