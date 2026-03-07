const router = require('express').Router();
const Assignment = require('../models/Assignment');

// GET /api/assignments — list all
router.get('/', async (req, res) => {
    try {
        const assignments = await Assignment.find({}, 'title description difficulty createdAt');
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
