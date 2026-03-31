const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to req.
 */
const auth = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'No token provided.' });

    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ error: 'User not found.' });
        req.userId = decoded.id;
        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

/**
 * Require admin role. Must be used AFTER auth middleware.
 */
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

/**
 * Require teacher or admin role. Must be used AFTER auth middleware.
 */
const teacherOrAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Teacher or Admin access required.' });
    }
    next();
};

module.exports = { auth, adminOnly, teacherOrAdmin };
