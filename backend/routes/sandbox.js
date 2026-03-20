const router = require('express').Router();
const { getPGPool } = require('../config/db');

// GET /api/sandbox/tables — list all PG tables with columns
router.get('/tables', async (req, res) => {
    try {
        const pool = getPGPool();

        // Get all user-created tables (exclude system tables)
        const tablesResult = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        const tables = [];
        for (const row of tablesResult.rows) {
            const colResult = await pool.query(`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position;
            `, [row.table_name]);

            tables.push({
                tableName: row.table_name,
                columns: colResult.rows.map((c) => ({
                    name: c.column_name,
                    type: c.data_type.toUpperCase(),
                })),
            });
        }

        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
