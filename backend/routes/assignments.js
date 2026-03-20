const router = require('express').Router();
const Assignment = require('../models/Assignment');

// GET /api/assignments — list all (with optional category filter)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        const assignments = await Assignment.find(
            filter,
            'title description difficulty category timeLimit createdAt'
        ).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/assignments/:id — single assignment
router.get('/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
