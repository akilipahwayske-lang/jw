const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, companyName, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).send('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUserData = {
            username: email.split('@')[0] + Math.floor(Math.random() * 1000), // Simple username generator
            email,
            password: hashedPassword,
            role,
            profile: {
                firstName,
                lastName
            }
        };

        if (role === 'employer' && companyName) {
            newUserData.profile.companyName = companyName;
        }

        user = new User(newUserData);
        await user.save();

        // Create session
        req.session.userId = user._id;
        req.session.userRole = user.role;

        // Redirect based on role
        if (role === 'employer') {
            res.redirect('/employer-dashboard');
        } else {
            res.redirect('/candidate-dashboard');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error during signup');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Invalid credentials');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // Create session
        req.session.userId = user._id;
        req.session.userRole = user.role;

        // Redirect based on role
        if (user.role === 'employer') {
            res.redirect('/employer-dashboard');
        } else {
            res.redirect('/candidate-dashboard');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during login');
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
