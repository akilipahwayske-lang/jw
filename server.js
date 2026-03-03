require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

const dns = require('dns');
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

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/jobs', (req, res) => {
    res.render('jobs');
});

app.get('/job-detail', (req, res) => {
    res.render('job-detail');
});

app.get('/employer-dashboard', (req, res) => {
    res.render('employer-dashboard');
});

app.get('/candidate-dashboard', (req, res) => {
    res.render('candidate-dashboard');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/post-job', (req, res) => {
    res.render('post-job');
});

// 404 Route
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
