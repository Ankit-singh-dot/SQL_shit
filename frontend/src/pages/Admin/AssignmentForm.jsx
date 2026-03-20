import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AssignmentForm.scss';

const API = import.meta.env.VITE_API_URL;

const COLUMN_TYPES = ['INTEGER', 'VARCHAR', 'TEXT', 'DATE', 'BOOLEAN', 'FLOAT', 'DECIMAL'];

const emptyTable = () => ({
    tableName: '',
    columns: [{ name: '', type: 'INTEGER' }],
    sampleData: [['']],
});

const AssignmentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        title: '',
        description: '',
        difficulty: 'Easy',
        category: 'Basics',
        timeLimit: 0,
        tableMode: 'custom',
        sharedTableNames: [],
        tables: [emptyTable()],
        expectedQuery: '',
        hints: [''],
    });
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [sharedTables, setSharedTables] = useState([]);

    const token = localStorage.getItem('cipherToken');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('cipherUser') || '{}');
        if (user.role !== 'admin') {
            navigate('/');
            return;
        }

        if (isEdit) {
            axios
                .get(`${API}/admin/assignments/${id}`, { headers })
                .then((res) => {
                    const a = res.data;
                    setForm({
                        title: a.title,
                        description: a.description,
                        difficulty: a.difficulty,
                        category: a.category || 'Basics',
                        timeLimit: a.timeLimit || 0,
                        tableMode: a.tableMode || 'custom',
                        sharedTableNames: a.sharedTableNames || [],
                        tables: a.tables,
                        expectedQuery: a.expectedQuery || '',
                        hints: a.hints.length > 0 ? a.hints : [''],
                    });
                })
                .catch(() => setError('Failed to load assignment'))
                .finally(() => setLoading(false));
        }

        // Fetch shared tables for the dropdown
        axios
            .get(`${API}/admin/tables`, { headers })
            .then((res) => setSharedTables(res.data))
            .catch(() => {});
    }, [id, isEdit, navigate]);

    // ─── Field handlers ──────────────────

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // ─── Table handlers ──────────────────

    const addTable = () => {
        setForm((prev) => ({ ...prev, tables: [...prev.tables, emptyTable()] }));
    };

    const removeTable = (ti) => {
        setForm((prev) => ({
            ...prev,
            tables: prev.tables.filter((_, i) => i !== ti),
        }));
    };

    const updateTableName = (ti, name) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            tables[ti] = { ...tables[ti], tableName: name };
            return { ...prev, tables };
        });
    };

    // ─── Column handlers ─────────────────

    const addColumn = (ti) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            tables[ti] = {
                ...tables[ti],
                columns: [...tables[ti].columns, { name: '', type: 'INTEGER' }],
                sampleData: tables[ti].sampleData.map((row) => [...row, '']),
            };
            return { ...prev, tables };
        });
    };

    const removeColumn = (ti, ci) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            tables[ti] = {
                ...tables[ti],
                columns: tables[ti].columns.filter((_, i) => i !== ci),
                sampleData: tables[ti].sampleData.map((row) =>
                    row.filter((_, i) => i !== ci)
                ),
            };
            return { ...prev, tables };
        });
    };

    const updateColumn = (ti, ci, field, value) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            const cols = [...tables[ti].columns];
            cols[ci] = { ...cols[ci], [field]: value };
            tables[ti] = { ...tables[ti], columns: cols };
            return { ...prev, tables };
        });
    };

    // ─── Sample data handlers ────────────

    const addRow = (ti) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            const newRow = tables[ti].columns.map(() => '');
            tables[ti] = {
                ...tables[ti],
                sampleData: [...tables[ti].sampleData, newRow],
            };
            return { ...prev, tables };
        });
    };

    const removeRow = (ti, ri) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            tables[ti] = {
                ...tables[ti],
                sampleData: tables[ti].sampleData.filter((_, i) => i !== ri),
            };
            return { ...prev, tables };
        });
    };

    const updateCell = (ti, ri, ci, value) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            const data = tables[ti].sampleData.map((row) => [...row]);
            data[ri][ci] = value;
            tables[ti] = { ...tables[ti], sampleData: data };
            return { ...prev, tables };
        });
    };

    // ─── Hint handlers ───────────────────

    const addHint = () => {
        setForm((prev) => ({ ...prev, hints: [...prev.hints, ''] }));
    };

    const removeHint = (i) => {
        setForm((prev) => ({
            ...prev,
            hints: prev.hints.filter((_, idx) => idx !== i),
        }));
    };

    const updateHint = (i, value) => {
        setForm((prev) => {
            const hints = [...prev.hints];
            hints[i] = value;
            return { ...prev, hints };
        });
    };

    // ─── Submit ──────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        // Clean up empty hints
        const payload = {
            ...form,
            hints: form.hints.filter((h) => h.trim()),
            // Only send relevant table data based on mode
            ...(form.tableMode === 'existing'
                ? { sharedTableNames: form.sharedTableNames, tables: [] }
                : { tables: form.tables, sharedTableNames: [] }),
        };

        try {
            if (isEdit) {
                await axios.put(`${API}/admin/assignments/${id}`, payload, { headers });
            } else {
                await axios.post(`${API}/admin/assignments`, payload, { headers });
            }
            navigate('/admin/assignments');
        } catch (err) {
            setError(err.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="aform__loading">Loading…</div>;

    return (
        <div className="aform">
            <div className="aform__header">
                <h1>{isEdit ? 'Edit Assignment' : 'New Assignment'}</h1>
                <Link to="/admin/assignments" className="aform__back">
                    ← Back
                </Link>
            </div>

            {error && <div className="aform__error">{error}</div>}

            <form onSubmit={handleSubmit} className="aform__form">
                {/* ── Basic Fields ── */}
                <div className="aform__section">
                    <h2>Details</h2>

                    <label className="aform__label">
                        Title
                        <input
                            type="text"
                            className="aform__input"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            required
                        />
                    </label>

                    <label className="aform__label">
                        Description
                        <textarea
                            className="aform__textarea"
                            rows={3}
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            required
                        />
                    </label>

                    <label className="aform__label">
                        Difficulty
                        <select
                            className="aform__select"
                            value={form.difficulty}
                            onChange={(e) => updateField('difficulty', e.target.value)}
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </label>

                    <label className="aform__label">
                        Category
                        <select
                            className="aform__select"
                            value={form.category}
                            onChange={(e) => updateField('category', e.target.value)}
                        >
                            <option value="Basics">Basics</option>
                            <option value="Filtering">Filtering</option>
                            <option value="Aggregation">Aggregation</option>
                            <option value="Joins">Joins</option>
                            <option value="Subqueries">Subqueries</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </label>

                    <label className="aform__label">
                        Time Limit (seconds, 0 = no timer)
                        <input
                            type="number"
                            className="aform__input"
                            value={form.timeLimit}
                            onChange={(e) => updateField('timeLimit', parseInt(e.target.value) || 0)}
                            min="0"
                            step="30"
                        />
                    </label>

                    <label className="aform__label">
                        Expected Query (reference solution)
                        <textarea
                            className="aform__textarea aform__textarea--code"
                            rows={2}
                            value={form.expectedQuery}
                            onChange={(e) => updateField('expectedQuery', e.target.value)}
                            placeholder="SELECT * FROM ..."
                        />
                    </label>
                </div>

                {/* ── Tables ── */}
                <div className="aform__section">
                    <div className="aform__section-header">
                        <h2>Tables</h2>
                    </div>

                    {/* Toggle: Existing vs Custom */}
                    <div className="aform__mode-toggle">
                        <button
                            type="button"
                            className={`aform__mode-btn ${form.tableMode === 'existing' ? 'aform__mode-btn--active' : ''}`}
                            onClick={() => updateField('tableMode', 'existing')}
                        >
                            📋 Use Existing Tables
                        </button>
                        <button
                            type="button"
                            className={`aform__mode-btn ${form.tableMode === 'custom' ? 'aform__mode-btn--active' : ''}`}
                            onClick={() => updateField('tableMode', 'custom')}
                        >
                            🛠 Create Custom Tables
                        </button>
                    </div>

                    {/* Existing Tables — Checkbox list */}
                    {form.tableMode === 'existing' && (
                        <div className="aform__shared-tables">
                            {sharedTables.length === 0 ? (
                                <p className="aform__shared-empty">
                                    No shared tables yet. <a href="/admin/tables">Create one first →</a>
                                </p>
                            ) : (
                                <>
                                    <p className="aform__shared-hint">Select tables this assignment will use:</p>
                                    <div className="aform__shared-grid">
                                        {sharedTables.map((st) => (
                                            <label key={st._id} className="aform__shared-item">
                                                <input
                                                    type="checkbox"
                                                    checked={form.sharedTableNames.includes(st.tableName)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            updateField('sharedTableNames', [...form.sharedTableNames, st.tableName]);
                                                        } else {
                                                            updateField('sharedTableNames', form.sharedTableNames.filter((n) => n !== st.tableName));
                                                        }
                                                    }}
                                                />
                                                <div className="aform__shared-info">
                                                    <strong>{st.displayName || st.tableName}</strong>
                                                    <span className="aform__shared-tname">{st.tableName}</span>
                                                    <span className="aform__shared-cols">
                                                        {st.columns.map((c) => c.name).join(', ')}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Custom Tables — Original table builder */}
                    {form.tableMode === 'custom' && (
                        <>
                            <div className="aform__section-header" style={{ marginTop: '1rem' }}>
                                <span></span>
                                <button type="button" className="aform__add-btn" onClick={addTable}>
                                    + Add Table
                                </button>
                            </div>
                            {form.tables.map((table, ti) => (
                                <div key={ti} className="aform__table-block">
                                    <div className="aform__table-header">
                                        <input
                                            type="text"
                                            className="aform__input"
                                            placeholder="Table name (e.g. employees)"
                                            value={table.tableName}
                                            onChange={(e) => updateTableName(ti, e.target.value)}
                                            required
                                        />
                                        {form.tables.length > 1 && (
                                            <button
                                                type="button"
                                                className="aform__remove-btn"
                                                onClick={() => removeTable(ti)}
                                            >
                                                Remove Table
                                            </button>
                                        )}
                                    </div>

                                    {/* Columns */}
                                    <h3>Columns</h3>
                                    <div className="aform__columns">
                                        {table.columns.map((col, ci) => (
                                            <div key={ci} className="aform__col-row">
                                                <input
                                                    type="text"
                                                    className="aform__input"
                                                    placeholder="Column name"
                                                    value={col.name}
                                                    onChange={(e) =>
                                                        updateColumn(ti, ci, 'name', e.target.value)
                                                    }
                                                    required
                                                />
                                                <select
                                                    className="aform__select"
                                                    value={col.type}
                                                    onChange={(e) =>
                                                        updateColumn(ti, ci, 'type', e.target.value)
                                                    }
                                                >
                                                    {COLUMN_TYPES.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                                {table.columns.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="aform__icon-btn"
                                                        onClick={() => removeColumn(ti, ci)}
                                                        title="Remove column"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="aform__add-btn aform__add-btn--small"
                                            onClick={() => addColumn(ti)}
                                        >
                                            + Column
                                        </button>
                                    </div>

                                    {/* Sample Data */}
                                    <h3>Sample Data</h3>
                                    <div className="aform__data-wrap">
                                        <table className="aform__data-table">
                                            <thead>
                                                <tr>
                                                    {table.columns.map((col, ci) => (
                                                        <th key={ci}>{col.name || `Col ${ci + 1}`}</th>
                                                    ))}
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.sampleData.map((row, ri) => (
                                                    <tr key={ri}>
                                                        {row.map((cell, ci) => (
                                                            <td key={ci}>
                                                                <input
                                                                    type="text"
                                                                    className="aform__cell-input"
                                                                    value={cell}
                                                                    onChange={(e) =>
                                                                        updateCell(ti, ri, ci, e.target.value)
                                                                    }
                                                                />
                                                            </td>
                                                        ))}
                                                        <td>
                                                            {table.sampleData.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    className="aform__icon-btn"
                                                                    onClick={() => removeRow(ti, ri)}
                                                                    title="Remove row"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button
                                            type="button"
                                            className="aform__add-btn aform__add-btn--small"
                                            onClick={() => addRow(ti)}
                                        >
                                            + Row
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* ── Hints ── */}
                <div className="aform__section">
                    <div className="aform__section-header">
                        <h2>Hints</h2>
                        <button type="button" className="aform__add-btn" onClick={addHint}>
                            + Add Hint
                        </button>
                    </div>

                    {form.hints.map((hint, i) => (
                        <div key={i} className="aform__hint-row">
                            <input
                                type="text"
                                className="aform__input"
                                placeholder={`Hint ${i + 1}`}
                                value={hint}
                                onChange={(e) => updateHint(i, e.target.value)}
                            />
                            {form.hints.length > 1 && (
                                <button
                                    type="button"
                                    className="aform__icon-btn"
                                    onClick={() => removeHint(i)}
                                    title="Remove hint"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Submit ── */}
                <div className="aform__footer">
                    <button type="submit" className="aform__submit" disabled={saving}>
                        {saving ? 'Saving…' : isEdit ? 'Update Assignment' : 'Create Assignment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AssignmentForm;
