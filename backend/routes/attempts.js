const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Attempt = require('../models/Attempt');

// Middleware to verify token
const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'No token provided.' });

    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// POST /api/attempts — save attempt
router.post('/', auth, async (req, res) => {
    const { assignmentId, query, result, isCorrect } = req.body;

    if (!assignmentId || !query) {
        return res.status(400).json({ error: 'assignmentId and query are required.' });
    }

    try {
        const attempt = await Attempt.create({
            userId: req.userId,
            assignmentId,
            query,
            result,
            isCorrect: isCorrect || false,
        });
        res.status(201).json(attempt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attempts/:assignmentId — get user attempts for assignment
router.get('/:assignmentId', auth, async (req, res) => {
    try {
        const attempts = await Attempt.find({
            userId: req.userId,
            assignmentId: req.params.assignmentId,
        }).sort({ createdAt: -1 });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
