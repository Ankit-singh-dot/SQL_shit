const router = require('express').Router();
const Attempt = require('../models/Attempt');
const { auth } = require('../middleware/auth');

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
