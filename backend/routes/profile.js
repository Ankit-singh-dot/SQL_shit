const router = require('express').Router();
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const Assignment = require('../models/Assignment');
const { auth } = require('../middleware/auth');

// GET /api/profile — own profile with stats
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        // Compute stats
        const [totalAttempts, correctAttempts, solvedAssignments, recentAttempts] =
            await Promise.all([
                Attempt.countDocuments({ userId: req.userId }),
                Attempt.countDocuments({ userId: req.userId, isFullyCorrect: true }),
                Attempt.distinct('assignmentId', {
                    userId: req.userId,
                    isFullyCorrect: true,
                }),
                Attempt.find({ userId: req.userId })
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .populate('assignmentId', 'title difficulty category'),
            ]);

        // Per-difficulty breakdown
        const solvedIds = solvedAssignments;
        const solvedDocs = await Assignment.find(
            { _id: { $in: solvedIds } },
            'difficulty'
        );
        const difficultyBreakdown = { Easy: 0, Medium: 0, Hard: 0 };
        solvedDocs.forEach((a) => {
            difficultyBreakdown[a.difficulty] =
                (difficultyBreakdown[a.difficulty] || 0) + 1;
        });

        // Per-category breakdown
        const categoryBreakdown = {};
        const catDocs = await Assignment.find(
            { _id: { $in: solvedIds } },
            'category'
        );
        catDocs.forEach((a) => {
            const cat = a.category || 'Basics';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        });

        // Streak calculation (consecutive days with correct attempts)
        const correctDates = await Attempt.find(
            { userId: req.userId, isFullyCorrect: true },
            'createdAt'
        ).sort({ createdAt: -1 });

        let streak = 0;
        if (correctDates.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let checkDate = new Date(today);
            const dateSet = new Set(
                correctDates.map((a) => {
                    const d = new Date(a.createdAt);
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                })
            );

            // Check if today or yesterday had activity
            const todayStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
            const yesterday = new Date(checkDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

            if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
                streak = 0;
            } else {
                if (!dateSet.has(todayStr)) {
                    checkDate = yesterday;
                }
                while (true) {
                    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
                    if (dateSet.has(key)) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
        }

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            stats: {
                totalAttempts,
                correctAttempts,
                totalSolved: solvedAssignments.length,
                successRate:
                    totalAttempts > 0
                        ? Math.round((correctAttempts / totalAttempts) * 100)
                        : 0,
                streak,
                difficultyBreakdown,
                categoryBreakdown,
            },
            recentActivity: recentAttempts.map((a) => ({
                id: a._id,
                query: a.codingAnswers?.length > 0 ? a.codingAnswers[0].query : 'MCQ Submission',
                isCorrect: a.isFullyCorrect,
                createdAt: a.createdAt,
                assignment: a.assignmentId
                    ? {
                          title: a.assignmentId.title,
                          difficulty: a.assignmentId.difficulty,
                          category: a.assignmentId.category,
                      }
                    : null,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
