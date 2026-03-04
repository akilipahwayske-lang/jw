require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB Atlas for Seeding');
        await Job.deleteMany({}); // clear jobs

        const jobsData = [
            {
                title: 'Senior Frontend Developer',
                company: 'TechCorp Innovations',
                location: 'Remote, US',
                type: 'Full-time',
                description: 'We are looking for an experienced frontend developer to lead our web app development.',
                requirements: ['React', 'Next.js', 'TypeScript', 'CSS/SCSS'],
                salary: '$120,000 - $150,000'
            },
            {
                title: 'Backend Node.js Engineer',
                company: 'Fintech Solutions',
                location: 'New York, NY',
                type: 'Full-time',
                description: 'Join our core infrastructure team building scalable APIs.',
                requirements: ['Node.js', 'Express', 'MongoDB', 'Redis'],
                salary: '$130,000 - $160,000'
            },
            {
                title: 'UI/UX Designer',
                company: 'Creative Agency',
                location: 'London, UK (Hybrid)',
                type: 'Part-time',
                description: 'We need a creative designer to craft beautiful, user-centric interfaces.',
                requirements: ['Figma', 'Adobe Creative Suite', 'Prototyping'],
                salary: '£40,000 - £60,000 (Pro-rata)'
            }
        ];

        await Job.insertMany(jobsData);
        console.log('Dummy jobs seeded successfully!');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
