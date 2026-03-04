const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { isAuthenticated, isEmployer } = require('../middleware/authMiddleware');

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

        const jobs = await Job.find(queryObj).sort({ postedAt: -1 });
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

        res.render('employer-dashboard', { jobs: myJobs, applicationCounts: countMap });
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
        const applications = await Application.find({ candidate: req.session.userId })
            .populate('job')
            .sort({ appliedAt: -1 });

        res.render('candidate-dashboard', { applications });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/post-job', isAuthenticated, isEmployer, (req, res) => {
    res.render('post-job');
});

router.post('/apply/:jobId', isAuthenticated, async (req, res) => {
    if (req.session.userRole === 'employer') {
        return res.status(403).send('Employers cannot apply for jobs.');
    }

    try {
        const jobId = req.params.jobId;
        const candidateId = req.session.userId;

        // Check if application already exists
        const existingApplication = await Application.findOne({ candidate: candidateId, job: jobId });
        if (existingApplication) {
            // Redirect back to job details to prevent duplicate
            return res.redirect(`/job-detail/${jobId}`);
        }

        const application = new Application({
            candidate: candidateId,
            job: jobId
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
        const { title, location, type, salary, description, requirements } = req.body;

        let reqArray = [];
        if (requirements) {
            reqArray = requirements.split(',').map(r => r.trim());
        }

        const newJob = new Job({
            title,
            company: res.locals.user ? 'Your Company' : 'Employer', // Alternatively get from user profile
            location,
            type,
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

module.exports = router;
