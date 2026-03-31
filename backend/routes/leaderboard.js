const router = require('express').Router();
const Attempt = require('../models/Attempt');
const User = require('../models/User');

const mongoose = require('mongoose');

// GET /api/leaderboard — top users ranked by unique correct assignments or by specific assignment score
router.get('/', async (req, res) => {
    try {
        const { assignmentId } = req.query;
        let pipeline = [];
        let results = [];
        let totalAttempts = [];

        if (assignmentId) {
            // Assignment-specific leaderboard
            pipeline = [
                { $match: { assignmentId: new mongoose.Types.ObjectId(assignmentId) } },
                {
                    $group: {
                        _id: '$userId',
                        maxScore: { $max: '$score' },
                        totalMaxScore: { $first: '$totalMaxScore' },
                        isFullyCorrect: { $max: { $cond: ['$isFullyCorrect', 1, 0] } },
                    },
                },
                { $sort: { maxScore: -1 } },
                { $limit: 50 },
            ];

            results = await Attempt.aggregate(pipeline);

            const userIds = results.map((r) => r._id);
            totalAttempts = await Attempt.aggregate([
                { $match: { userId: { $in: userIds }, assignmentId: new mongoose.Types.ObjectId(assignmentId) } },
                { $group: { _id: '$userId', total: { $sum: 1 } } },
            ]);
        } else {
            // Global leaderboard
            pipeline = [
                { $match: { isFullyCorrect: true } },
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

            results = await Attempt.aggregate(pipeline);

            const userIds = results.map((r) => r._id);
            totalAttempts = await Attempt.aggregate([
                { $match: { userId: { $in: userIds } } },
                { $group: { _id: '$userId', total: { $sum: 1 } } },
            ]);
        }

        // Common map building for users and totals
        const userIdsToFetch = results.map((r) => r._id);
        const users = await User.find(
            { _id: { $in: userIdsToFetch } },
            'username createdAt'
        );
        const userMap = {};
        users.forEach((u) => {
            userMap[u._id.toString()] = u;
        });

        const totalMap = {};
        totalAttempts.forEach((t) => {
            totalMap[t._id.toString()] = t.total;
        });

        const leaderboard = results.map((r, i) => {
            const u = userMap[r._id.toString()];
            const total = totalMap[r._id.toString()] || 1;
            
            if (assignmentId) {
                return {
                    rank: i + 1,
                    userId: r._id,
                    username: u ? u.username : 'Unknown',
                    score: r.maxScore,
                    totalMaxScore: r.totalMaxScore,
                    totalAttempts: total,
                    fullyCorrect: r.isFullyCorrect === 1,
                    joinedAt: u ? u.createdAt : null,
                };
            } else {
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
            }
        });

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
