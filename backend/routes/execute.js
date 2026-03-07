const router = require('express').Router();
const { getPGPool } = require('../config/db');

// Blocked keywords for safety
const BLOCKED_KEYWORDS = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE',
    'GRANT', 'REVOKE', 'COPY', 'EXECUTE', 'DO', 'CALL',
];

const sanitizeQuery = (query) => {
    const upper = query.toUpperCase().trim();

    // Must start with SELECT or WITH
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
        return { valid: false, message: 'Only SELECT queries are allowed.' };
    }

    for (const keyword of BLOCKED_KEYWORDS) {
        // Use word boundary check
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(upper)) {
            return { valid: false, message: `The keyword "${keyword}" is not allowed.` };
        }
    }

    // Block multiple statements
    const statements = query.split(';').filter(s => s.trim().length > 0);
    if (statements.length > 1) {
        return { valid: false, message: 'Only single statements are allowed.' };
    }

    return { valid: true };
};

// POST /api/execute
router.post('/', async (req, res) => {
    const { query } = req.body;

    if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Query is required.' });
    }

    // Sanitize
    const check = sanitizeQuery(query);
    if (!check.valid) {
        return res.status(400).json({ error: check.message });
    }

    const pool = getPGPool();
    const client = await pool.connect();

    try {
        // Set statement timeout (5 seconds)
        await client.query('SET statement_timeout = 4000');

        const result = await client.query(query);

        res.json({
            columns: result.fields.map(f => f.name),
            rows: result.rows,
            rowCount: result.rowCount,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
