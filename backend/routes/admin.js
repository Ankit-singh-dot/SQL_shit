const router = require('express').Router();
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const { auth, adminOnly } = require('../middleware/auth');
const { getPGPool } = require('../config/db');

// All admin routes require authentication + admin role
router.use(auth, adminOnly);

// ─── Helpers ──────────────────────────────────────────────

/**
 * Build SQL to CREATE a table and INSERT sample data based on the
 * assignment's table definitions. Used when creating/updating assignments.
 */
const buildTableSQL = (tables) => {
    const statements = [];

    for (const table of tables) {
        // Map our simple types to PG types
        const pgTypeMap = {
            INTEGER: 'INTEGER',
            VARCHAR: 'VARCHAR(255)',
            TEXT: 'TEXT',
            DATE: 'DATE',
            BOOLEAN: 'BOOLEAN',
            FLOAT: 'FLOAT',
            DECIMAL: 'DECIMAL',
        };

        const colDefs = table.columns
            .map((c) => `${c.name} ${pgTypeMap[c.type.toUpperCase()] || 'VARCHAR(255)'}`)
            .join(', ');

        statements.push(`DROP TABLE IF EXISTS ${table.tableName} CASCADE;`);
        statements.push(`CREATE TABLE ${table.tableName} (${colDefs});`);

        // Insert sample data
        if (table.sampleData && table.sampleData.length > 0) {
            const colNames = table.columns.map((c) => c.name).join(', ');

            for (const row of table.sampleData) {
                const values = row
                    .map((val) => {
                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'number') return val;
                        return `'${String(val).replace(/'/g, "''")}'`;
                    })
                    .join(', ');
                statements.push(
                    `INSERT INTO ${table.tableName} (${colNames}) VALUES (${values});`
                );
            }
        }
    }

    return statements.join('\n');
};

/**
 * Execute SQL on the PG sandbox to create/update tables.
 */
const syncPGTables = async (tables) => {
    const pool = getPGPool();
    const sql = buildTableSQL(tables);
    await pool.query(sql);
};

// ─── Stats ────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const [totalAssignments, totalUsers, totalAttempts, correctAttempts] =
            await Promise.all([
                Assignment.countDocuments(),
                User.countDocuments(),
                Attempt.countDocuments(),
                Attempt.countDocuments({ isCorrect: true }),
            ]);

        res.json({
            totalAssignments,
            totalUsers,
            totalAttempts,
            correctAttempts,
            successRate:
                totalAttempts > 0
                    ? Math.round((correctAttempts / totalAttempts) * 100)
                    : 0,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Assignment CRUD ──────────────────────────────────────

// GET /api/admin/assignments
router.get('/assignments', async (req, res) => {
    try {
        const assignments = await Assignment.find().sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/assignments/:id
router.get('/assignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment)
            return res.status(404).json({ error: 'Assignment not found' });
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/assignments
router.post('/assignments', async (req, res) => {
    const { title, description, difficulty, tables, expectedQuery, hints } =
        req.body;

    if (!title || !description || !tables || tables.length === 0) {
        return res
            .status(400)
            .json({ error: 'title, description, and at least one table are required.' });
    }

    try {
        // 1. Save to MongoDB
        const assignment = await Assignment.create({
            title,
            description,
            difficulty: difficulty || 'Easy',
            tables,
            expectedQuery: expectedQuery || '',
            hints: hints || [],
        });

        // 2. Create PG tables with sample data
        await syncPGTables(tables);

        res.status(201).json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/assignments/:id
router.put('/assignments/:id', async (req, res) => {
    const { title, description, difficulty, tables, expectedQuery, hints } =
        req.body;

    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment)
            return res.status(404).json({ error: 'Assignment not found' });

        // Update fields
        if (title) assignment.title = title;
        if (description) assignment.description = description;
        if (difficulty) assignment.difficulty = difficulty;
        if (hints) assignment.hints = hints;
        if (expectedQuery !== undefined) assignment.expectedQuery = expectedQuery;

        // If tables changed, re-sync PG
        if (tables && tables.length > 0) {
            assignment.tables = tables;
            await syncPGTables(tables);
        }

        await assignment.save();
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/assignments/:id
router.delete('/assignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment)
            return res.status(404).json({ error: 'Assignment not found' });

        // Drop associated PG tables
        const pool = getPGPool();
        for (const table of assignment.tables) {
            await pool.query(
                `DROP TABLE IF EXISTS ${table.tableName} CASCADE;`
            );
        }

        // Remove from MongoDB
        await assignment.deleteOne();

        // Also remove related attempts
        await Attempt.deleteMany({ assignmentId: req.params.id });

        res.json({ message: 'Assignment deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
