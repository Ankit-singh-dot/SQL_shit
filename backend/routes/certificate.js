const router = require('express').Router();
const Attempt = require('../models/Attempt');
const Assignment = require('../models/Assignment');
const { auth } = require('../middleware/auth');

// GET /api/certificate/:category — check if user completed all in category
router.get('/:category', auth, async (req, res) => {
    try {
        const category = req.params.category;

        // Get all assignments in this category
        const assignments = await Assignment.find({ category }, '_id');
        const totalInCategory = assignments.length;

        if (totalInCategory === 0) {
            return res.status(404).json({ error: 'No assignments in this category.' });
        }

        const assignmentIds = assignments.map((a) => a._id);

        // Get unique solved assignments by user in this category
        const solved = await Attempt.distinct('assignmentId', {
            userId: req.userId,
            assignmentId: { $in: assignmentIds },
            isCorrect: true,
        });

        const completed = solved.length >= totalInCategory;

        res.json({
            category,
            totalAssignments: totalInCategory,
            solved: solved.length,
            completed,
            earnedAt: completed ? new Date().toISOString() : null,
            username: req.user.username,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
