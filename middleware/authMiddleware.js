module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.session && req.session.userId) {
            return next();
        }
        res.redirect('/login');
    },
    isEmployer: (req, res, next) => {
        if (req.session && req.session.userRole === 'employer') {
            return next();
        }
        res.redirect('/employer-dashboard'); // Or maybe a 403 page
    }
};
