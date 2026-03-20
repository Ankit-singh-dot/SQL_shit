const router = require('express').Router();
const Attempt = require('../models/Attempt');
const User = require('../models/User');

// GET /api/leaderboard — top users ranked by unique correct assignments
router.get('/', async (req, res) => {
    try {
        const pipeline = [
            { $match: { isCorrect: true } },
            {
                $group: {
                    _id: '$userId',
                    solvedAssignments: { $addToSet: '$assignmentId' },
                    totalCorrect: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 1,
                    solved: { $size: '$solvedAssignments' },
                    totalCorrect: 1,
                },
            },
            { $sort: { solved: -1, totalCorrect: -1 } },
            { $limit: 50 },
        ];

        const results = await Attempt.aggregate(pipeline);

        // Get user details
        const userIds = results.map((r) => r._id);
        const users = await User.find(
            { _id: { $in: userIds } },
            'username createdAt'
        );
        const userMap = {};
        users.forEach((u) => {
            userMap[u._id.toString()] = u;
        });

        // Also get total attempts per user for success rate
        const totalAttempts = await Attempt.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: '$userId', total: { $sum: 1 } } },
        ]);
        const totalMap = {};
        totalAttempts.forEach((t) => {
            totalMap[t._id.toString()] = t.total;
        });

        const leaderboard = results.map((r, i) => {
            const u = userMap[r._id.toString()];
            const total = totalMap[r._id.toString()] || 1;
            return {
                rank: i + 1,
                userId: r._id,
                username: u ? u.username : 'Unknown',
                solved: r.solved,
                totalCorrect: r.totalCorrect,
                totalAttempts: total,
                successRate: Math.round((r.totalCorrect / total) * 100),
                joinedAt: u ? u.createdAt : null,
            };
        });

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
