const router = require('express').Router();
const Attempt = require('../models/Attempt');
const Assignment = require('../models/Assignment');
const { auth } = require('../middleware/auth');
const { getPGPool } = require('../config/db');

/**
 * Compare two query results to determine if they match.
 * Normalizes by sorting rows and comparing stringified versions.
 */
const compareResults = (userRows, expectedRows) => {
    if (!userRows || !expectedRows) return false;
    if (userRows.length !== expectedRows.length) return false;

    // Normalize: convert all values to strings and sort
    const normalize = (rows) => {
        return rows
            .map((row) => {
                const sorted = {};
                Object.keys(row)
                    .sort()
                    .forEach((key) => {
                        sorted[key.toLowerCase()] = String(row[key] ?? '').trim().toLowerCase();
                    });
                return JSON.stringify(sorted);
            })
            .sort();
    };

    const normUser = normalize(userRows);
    const normExpected = normalize(expectedRows);

    if (normUser.length !== normExpected.length) return false;
    for (let i = 0; i < normUser.length; i++) {
        if (normUser[i] !== normExpected[i]) return false;
    }
    return true;
};

// POST /api/attempts — save attempt with server-side verification
router.post('/', auth, async (req, res) => {
    const { assignmentId, query, result } = req.body;

    if (!assignmentId || !query) {
        return res.status(400).json({ error: 'assignmentId and query are required.' });
    }

    try {
        // Fetch the assignment to get the expected query
        const assignment = await Assignment.findById(assignmentId);
        let isCorrect = false;

        if (assignment && assignment.expectedQuery) {
            // Execute the expected query to get reference results
            const pool = getPGPool();
            const client = await pool.connect();
            try {
                await client.query('SET statement_timeout = 4000');
                const expectedResult = await client.query(assignment.expectedQuery);

                // Compare user's result with expected result
                if (result && result.rows) {
                    isCorrect = compareResults(result.rows, expectedResult.rows);
                }
            } catch (err) {
                // If expected query fails, can't verify — leave as false
                console.error('Verification error:', err.message);
            } finally {
                client.release();
            }
        }

        const attempt = await Attempt.create({
            userId: req.userId,
            assignmentId,
            query,
            result,
            isCorrect,
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
