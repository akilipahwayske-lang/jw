const express = require('express');
const Job = require('../models/Job');
const { isAuthenticated, isEmployer } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ postedAt: -1 });
        res.render('jobs', { jobs });
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
        res.render('employer-dashboard', { jobs: myJobs });
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
        // Placeholder for candidate specific data (e.g., saved jobs, applications)
        // const applications = await Application.find({ candidate: req.session.userId });
        res.render('candidate-dashboard', { applications: [] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/post-job', isAuthenticated, isEmployer, (req, res) => {
    res.render('post-job');
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
