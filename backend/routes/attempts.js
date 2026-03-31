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

// POST /api/attempts/verify — check a single coding query without saving
router.post('/verify', auth, async (req, res) => {
    const { assignmentId, questionIndex, query, result } = req.body;
    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment || !assignment.codingQuestions[questionIndex]) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        const question = assignment.codingQuestions[questionIndex];
        const pool = getPGPool();
        const client = await pool.connect();
        let isCorrect = false;
        
        try {
            await client.query('SET statement_timeout = 4000');
            const expectedResult = await client.query(question.expectedQuery);
            const userResult = await client.query(query);
            isCorrect = compareResults(userResult.rows, expectedResult.rows);
        } catch (err) {
            // Execution failed or parse error, so it's incorrect
        } finally {
            client.release();
        }
        
        res.json({ isCorrect });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/attempts — submit entire assignment
router.post('/', auth, async (req, res) => {
    const { assignmentId, mcqAnswers, codingAnswers } = req.body;

    if (!assignmentId) {
        return res.status(400).json({ error: 'assignmentId is required.' });
    }

    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

        let score = 0;
        let totalMaxScore = (assignment.mcqs?.length || 0) + (assignment.codingQuestions?.length || 0);

        // Process MCQs
        const processedMcqs = (mcqAnswers || []).map(ans => {
            const question = assignment.mcqs[ans.questionIndex];
            const isCorrect = question && question.correctOptionIndex === ans.selectedOptionIndex;
            if (isCorrect) score += 1;
            return {
                questionIndex: ans.questionIndex,
                selectedOptionIndex: ans.selectedOptionIndex,
                isCorrect: !!isCorrect
            };
        });

        // Process Coding Questions
        const pool = getPGPool();
        const client = await pool.connect();
        const processedCoding = [];

        try {
            await client.query('SET statement_timeout = 4000');
            for (const ans of (codingAnswers || [])) {
                const question = assignment.codingQuestions[ans.questionIndex];
                let isCorrect = false;

                if (question && question.expectedQuery && ans.query) {
                    try {
                        const expectedResult = await client.query(question.expectedQuery);
                        const userResult = await client.query(ans.query);
                        isCorrect = compareResults(userResult.rows, expectedResult.rows);
                    } catch (err) {
                        isCorrect = false; // execution failed
                    }
                }
                
                if (isCorrect) score += 1;
                processedCoding.push({
                    questionIndex: ans.questionIndex,
                    query: ans.query,
                    isCorrect: !!isCorrect
                });
            }
        } finally {
            client.release();
        }

        const attempt = await Attempt.create({
            userId: req.userId,
            assignmentId,
            mcqAnswers: processedMcqs,
            codingAnswers: processedCoding,
            score,
            totalMaxScore,
            isFullyCorrect: totalMaxScore > 0 && score === totalMaxScore
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
