const router = require('express').Router();
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const SharedTable = require('../models/SharedTable');
const { auth, teacherOrAdmin, adminOnly } = require('../middleware/auth');
const { getPGPool } = require('../config/db');

// All admin routes require authentication + teacherOrAdmin role
router.use(auth, teacherOrAdmin);

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
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const assignments = await Assignment.find(query).sort({ createdAt: -1 });
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
        if (req.user.role !== 'admin' && String(assignment.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/assignments
router.post('/assignments', async (req, res) => {
    const { title, description, difficulty, category, mcqTimeLimit, codingTimeLimit, tables, mcqs, codingQuestions, tableMode, sharedTableNames } =
        req.body;

    try {
        let finalTables = tables || [];

        // If using existing shared tables, fetch them
        if (tableMode === 'existing' && sharedTableNames && sharedTableNames.length > 0) {
            const shared = await SharedTable.find({ tableName: { $in: sharedTableNames } });
            finalTables = shared.map((t) => ({
                tableName: t.tableName,
                columns: t.columns,
                sampleData: t.sampleData,
            }));
        }

        if (finalTables.length === 0) {
            return res.status(400).json({ error: 'At least one table is required.' });
        }

        // 1. Save to MongoDB
        const assignment = await Assignment.create({
            title,
            description,
            difficulty: difficulty || 'Easy',
            category: category || 'Basics',
            mcqTimeLimit: mcqTimeLimit || 0,
            codingTimeLimit: codingTimeLimit || 0,
            tables: finalTables,
            tableMode: tableMode || 'custom',
            sharedTableNames: tableMode === 'existing' ? sharedTableNames : [],
            mcqs: mcqs || [],
            codingQuestions: codingQuestions || [],
            createdBy: req.user._id,
        });

        // 2. Only create PG tables for custom mode (shared tables already exist)
        if (tableMode !== 'existing') {
            await syncPGTables(finalTables);
        }

        res.status(201).json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/assignments/:id
router.put('/assignments/:id', async (req, res) => {
    const { title, description, difficulty, category, mcqTimeLimit, codingTimeLimit, tables, mcqs, codingQuestions, tableMode, sharedTableNames } =
        req.body;

    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment)
            return res.status(404).json({ error: 'Assignment not found' });
        if (req.user.role !== 'admin' && String(assignment.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update fields
        if (title) assignment.title = title;
        if (description) assignment.description = description;
        if (difficulty) assignment.difficulty = difficulty;
        if (category) assignment.category = category;
        if (mcqTimeLimit !== undefined) assignment.mcqTimeLimit = mcqTimeLimit;
        if (codingTimeLimit !== undefined) assignment.codingTimeLimit = codingTimeLimit;
        if (mcqs) assignment.mcqs = mcqs;
        if (codingQuestions) assignment.codingQuestions = codingQuestions;

        // Handle table mode change or table update
        if (tableMode) assignment.tableMode = tableMode;

        if (tableMode === 'existing' && sharedTableNames && sharedTableNames.length > 0) {
            assignment.sharedTableNames = sharedTableNames;
            const shared = await SharedTable.find({ tableName: { $in: sharedTableNames } });
            assignment.tables = shared.map((t) => ({
                tableName: t.tableName,
                columns: t.columns,
                sampleData: t.sampleData,
            }));
        } else if (tables && tables.length > 0) {
            assignment.tables = tables;
            assignment.sharedTableNames = [];
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
        if (req.user.role !== 'admin' && String(assignment.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Only drop PG tables if they were custom (not shared)
        if (assignment.tableMode !== 'existing') {
            const pool = getPGPool();
            for (const table of assignment.tables) {
                // Check if this table is a shared table — don't drop it
                const isShared = await SharedTable.findOne({ tableName: table.tableName });
                if (!isShared) {
                    await pool.query(`DROP TABLE IF EXISTS ${table.tableName} CASCADE;`);
                }
            }
        }

        await assignment.deleteOne();
        await Attempt.deleteMany({ assignmentId: req.params.id });

        res.json({ message: 'Assignment deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Shared Table CRUD ────────────────────────────────────

// GET /api/admin/tables — list all shared tables
router.get('/tables', async (req, res) => {
    try {
        const tables = await SharedTable.find().sort({ createdAt: -1 });
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/tables/:id
router.get('/tables/:id', async (req, res) => {
    try {
        const table = await SharedTable.findById(req.params.id);
        if (!table) return res.status(404).json({ error: 'Table not found' });
        res.json(table);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/tables — create a shared table
router.post('/tables', async (req, res) => {
    const { tableName, displayName, columns, sampleData, description } = req.body;

    if (!tableName || !columns || columns.length === 0) {
        return res.status(400).json({ error: 'tableName and columns are required.' });
    }

    try {
        // Save to MongoDB
        const table = await SharedTable.create({
            tableName: tableName.toLowerCase().replace(/\s+/g, '_'),
            displayName: displayName || tableName,
            columns,
            sampleData: sampleData || [],
            description: description || '',
        });

        // Create in PostgreSQL
        await syncPGTables([{ tableName: table.tableName, columns, sampleData: sampleData || [] }]);

        res.status(201).json(table);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'A table with this name already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/tables/:id — update shared table
router.put('/tables/:id', async (req, res) => {
    const { columns, sampleData, description, displayName } = req.body;

    try {
        const table = await SharedTable.findById(req.params.id);
        if (!table) return res.status(404).json({ error: 'Table not found' });

        if (columns) table.columns = columns;
        if (sampleData) table.sampleData = sampleData;
        if (description !== undefined) table.description = description;
        if (displayName) table.displayName = displayName;

        await table.save();

        // Re-sync PostgreSQL
        await syncPGTables([{ tableName: table.tableName, columns: table.columns, sampleData: table.sampleData }]);

        res.json(table);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/tables/:id
router.delete('/tables/:id', async (req, res) => {
    try {
        const table = await SharedTable.findById(req.params.id);
        if (!table) return res.status(404).json({ error: 'Table not found' });

        // Check if any assignments reference this table
        const usedBy = await Assignment.countDocuments({ sharedTableNames: table.tableName });
        if (usedBy > 0) {
            return res.status(400).json({
                error: `Cannot delete — ${usedBy} assignment(s) use this table. Remove the table from those assignments first.`,
            });
        }

        // Drop from PostgreSQL
        const pool = getPGPool();
        await pool.query(`DROP TABLE IF EXISTS ${table.tableName} CASCADE;`);

        await table.deleteOne();
        res.json({ message: 'Table deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
