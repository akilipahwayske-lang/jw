require('dotenv').config();
const express = require('express');
const dns = require('node:dns');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Force Node.js to use a specific DNS server for SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Error connecting to MongoDB:', err.message));

// Set EJS as the view engine
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'jobwhisper_super_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.default ? MongoStore.default.create({ mongoUrl: process.env.MONGODB_URI }) : MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Pass session and user data to all views
app.use(async (req, res, next) => {
    try {
        if (req.session.userId) {
            const User = require('./models/User');
            const user = await User.findById(req.session.userId);
            console.log('DEBUG: User fetched in middleware:', JSON.stringify(user, null, 2));
            res.locals.user = user;
        } else {
            res.locals.user = null;
        }
        next();
    } catch (err) {
        console.error('Error fetching user for locals:', err);
        res.locals.user = null;
        next();
    }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

app.use('/', authRoutes);
app.use('/', jobRoutes);
app.get('/', async (req, res) => {
    try {
        const Job = require('./models/Job');
        const jobs = await Job.find({}).populate('employer').sort({ postedAt: -1 }).limit(3);
        res.render('index', { jobs });
    } catch (err) {
        console.error(err);
        res.render('index', { jobs: [] });
    }
});

const { isAuthenticated, isEmployer } = require('./middleware/authMiddleware');

app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('login');
});

app.get('/signup', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('signup');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

// 404 Route
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
