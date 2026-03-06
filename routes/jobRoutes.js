const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { isAuthenticated, isEmployer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/jobs', async (req, res) => {
    try {
        const { search, location, cat, type } = req.query;
        let queryObj = {};

        if (search) {
            // Very simple text search on title or description
            queryObj.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        if (location) {
            queryObj.location = { $regex: location, $options: 'i' };
        }

        if (type) {
            // type could be a string or array of strings if multiple are checked
            if (Array.isArray(type)) {
                queryObj.type = { $in: type };
            } else {
                queryObj.type = type;
            }
        }

        if (cat) {
            if (Array.isArray(cat)) {
                queryObj.category = { $in: cat };
            } else {
                queryObj.category = cat;
            }
        }

        const jobs = await Job.find(queryObj).populate('employer').sort({ postedAt: -1 });
        res.render('jobs', { jobs, query: req.query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/job-detail/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('employer');
        if (!job) {
            return res.status(404).send('Job not found');
        }
        res.render('job-detail', { job });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/employer-dashboard', isAuthenticated, isEmployer, async (req, res) => {
    try {
        const myJobs = await Job.find({ employer: req.session.userId }).sort({ postedAt: -1 });

        // Calculate application counts per job
        const jobIds = myJobs.map(job => job._id);
        const appCounts = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: '$job', count: { $sum: 1 } } }
        ]);

        const countMap = {};
        appCounts.forEach(item => {
            countMap[item._id.toString()] = item.count;
        });

        // Stats for dashboard
        const activeJobsCount = myJobs.length;
        const totalApplicants = await Application.countDocuments({ job: { $in: jobIds } });
        const shortlistedCount = await Application.countDocuments({
            job: { $in: jobIds },
            status: 'Shortlisted'
        });

        res.render('employer-dashboard', {
            jobs: myJobs,
            applicationCounts: countMap,
            stats: {
                activeJobs: activeJobsCount,
                totalApplicants: totalApplicants,
                shortlisted: shortlistedCount
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/employer/job/:id/applicants', isAuthenticated, isEmployer, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, employer: req.session.userId });
        if (!job) {
            return res.status(404).send('Job not found or unauthorized');
        }

        const applications = await Application.find({ job: job._id }).populate('candidate').sort({ appliedAt: -1 });

        res.render('employer-applicants', { job, applications });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/candidate-dashboard', isAuthenticated, async (req, res) => {
    if (req.session.userRole === 'employer') {
        return res.redirect('/employer-dashboard');
    }

    try {
        const [applications, fullUser] = await Promise.all([
            Application.find({ candidate: req.session.userId })
                .populate('job')
                .sort({ appliedAt: -1 }),
            User.findById(req.session.userId)
        ]);

        res.render('candidate-dashboard', {
            applications,
            stats: {
                appliedJobs: applications.length,
                savedJobs: fullUser ? (fullUser.savedJobs ? fullUser.savedJobs.length : 0) : 0,
                profileViews: fullUser ? (fullUser.profileViews || 0) : 0
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/post-job', isAuthenticated, isEmployer, (req, res) => {
    res.render('post-job');
});

router.post('/apply/:jobId', isAuthenticated, upload.single('resume'), async (req, res) => {
    if (req.session.userRole === 'employer') {
        return res.status(403).send('Employers cannot apply for jobs.');
    }

    try {
        const jobId = req.params.jobId;
        const candidateId = req.session.userId;
        const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : null;

        // Check if application already exists
        const existingApplication = await Application.findOne({ candidate: candidateId, job: jobId });
        if (existingApplication) {
            // Redirect back to job details to prevent duplicate
            return res.redirect(`/job-detail/${jobId}`);
        }

        const application = new Application({
            candidate: candidateId,
            job: jobId,
            resumePath: resumePath
        });

        await application.save();
        res.redirect('/candidate-dashboard');

    } catch (err) {
        console.error('Apply error:', err);
        // MongoDB duplicate key error (code 11000) will be caught here as well
        if (err.code === 11000) {
            return res.redirect(`/job-detail/${req.params.jobId}`);
        }
        res.status(500).send('Server Error applying to job');
    }
});

router.post('/post-job', isAuthenticated, isEmployer, async (req, res) => {
    try {
        const { title, location, type, category, salary, description, requirements } = req.body;
        const employer = await User.findById(req.session.userId);

        let reqArray = [];
        if (requirements) {
            reqArray = requirements.split(',').map(r => r.trim());
        }

        const newJob = new Job({
            title,
            company: employer.profile.companyName || 'Employer',
            location,
            type,
            category,
            salary,
            description,
            requirements: reqArray,
            employer: req.session.userId
        });

        await newJob.save();
        res.redirect('/employer-dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error posting job');
    }
});

// Update Application Status
router.post('/application/:id/status', isAuthenticated, isEmployer, async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.id).populate('job');

        // Security check: only the employer of the job can update status
        if (application.job.employer.toString() !== req.session.userId) {
            return res.status(403).send('Unauthorized');
        }

        application.status = status;
        await application.save();

        res.redirect(`/employer/job/${application.job._id}/applicants`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating status');
    }
});

// Save / Unsave a Job (toggle)
router.post('/job/save/:jobId', isAuthenticated, async (req, res) => {
    if (req.session.userRole === 'employer') return res.status(403).send('Forbidden');
    try {
        const user = await User.findById(req.session.userId);
        const jobId = req.params.jobId;
        const alreadySaved = user.savedJobs.some(id => id.toString() === jobId);

        if (alreadySaved) {
            await User.findByIdAndUpdate(req.session.userId, { $pull: { savedJobs: jobId } });
        } else {
            await User.findByIdAndUpdate(req.session.userId, { $addToSet: { savedJobs: jobId } });
        }

        res.redirect(`/job-detail/${jobId}`);
    } catch (err) {
        console.error('Save job error:', err);
        res.status(500).send('Server Error');
    }
});

// Saved Jobs Page
router.get('/saved-jobs', isAuthenticated, async (req, res) => {
    if (req.session.userRole === 'employer') return res.redirect('/employer-dashboard');
    try {
        const user = await User.findById(req.session.userId).populate('savedJobs');
        res.render('saved-jobs', { savedJobs: user.savedJobs || [] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// View Candidate Profile (employer-facing, increments view count)
router.get('/candidate/:id/profile', isAuthenticated, isEmployer, async (req, res) => {
    try {
        const candidate = await User.findByIdAndUpdate(
            req.params.id,
            { $inc: { profileViews: 1 } },
            { new: true }
        );
        if (!candidate || candidate.role !== 'candidate') {
            return res.status(404).send('Candidate not found');
        }
        res.render('candidate-profile-view', { candidate });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
