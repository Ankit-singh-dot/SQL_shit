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

const emptyMcq = () => ({
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
});

const emptyCodingQuestion = () => ({
    questionText: '',
    expectedQuery: '',
    hints: ['']
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
        mcqTimeLimit: 0,
        codingTimeLimit: 0,
        tableMode: 'custom',
        sharedTableNames: [],
        tables: [emptyTable()],
        mcqs: [],
        codingQuestions: [emptyCodingQuestion()],
    });
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [sharedTables, setSharedTables] = useState([]);

    const token = localStorage.getItem('cipherToken');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('cipherUser') || '{}');
        if (user.role !== 'admin' && user.role !== 'teacher') {
            navigate('/');
            return;
        }

        if (isEdit) {
            axios
                .get(`${API}/admin/assignments/${id}`, { headers })
                .then((res) => {
                    const a = res.data;
                    setForm({
                        title: a.title || '',
                        description: a.description || '',
                        difficulty: a.difficulty || 'Easy',
                        category: a.category || 'Basics',
                        mcqTimeLimit: a.mcqTimeLimit || 0,
                        codingTimeLimit: a.codingTimeLimit || 0,
                        tableMode: a.tableMode || 'custom',
                        sharedTableNames: a.sharedTableNames || [],
                        tables: a.tables || [],
                        mcqs: a.mcqs?.length ? a.mcqs : [],
                        codingQuestions: a.codingQuestions?.length ? a.codingQuestions : [emptyCodingQuestion()],
                    });
                })
                .catch(() => setError('Failed to load assignment'))
                .finally(() => setLoading(false));
        }

        axios
            .get(`${API}/admin/tables`, { headers })
            .then((res) => setSharedTables(res.data))
            .catch(() => {});
    }, [id, isEdit, navigate]);

    // ─── Field handlers ──────────────────
    const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    // ─── Table handlers ──────────────────
    const addTable = () => setForm((prev) => ({ ...prev, tables: [...prev.tables, emptyTable()] }));
    const removeTable = (ti) => setForm((prev) => ({ ...prev, tables: prev.tables.filter((_, i) => i !== ti) }));
    const updateTableName = (ti, name) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            tables[ti] = { ...tables[ti], tableName: name };
            return { ...prev, tables };
        });
    };

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
                sampleData: tables[ti].sampleData.map((row) => row.filter((_, i) => i !== ci)),
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

    const addRow = (ti) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            tables[ti] = { ...tables[ti], sampleData: [...tables[ti].sampleData, tables[ti].columns.map(() => '')] };
            return { ...prev, tables };
        });
    };
    const removeRow = (ti, ri) => {
        setForm((prev) => {
            const tables = [...prev.tables];
            tables[ti] = { ...tables[ti], sampleData: tables[ti].sampleData.filter((_, i) => i !== ri) };
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

    // ─── MCQ Handlers ──────────────────
    const addMcq = () => setForm(prev => ({ ...prev, mcqs: [...prev.mcqs, emptyMcq()] }));
    const removeMcq = (mi) => setForm(prev => ({ ...prev, mcqs: prev.mcqs.filter((_, i) => i !== mi) }));
    const updateMcq = (mi, field, value) => {
        setForm(prev => {
            const mcqs = [...prev.mcqs];
            mcqs[mi] = { ...mcqs[mi], [field]: value };
            return { ...prev, mcqs };
        });
    };
    const updateMcqOption = (mi, optIndex, value) => {
        setForm(prev => {
            const mcqs = [...prev.mcqs];
            const options = [...mcqs[mi].options];
            options[optIndex] = value;
            mcqs[mi] = { ...mcqs[mi], options };
            return { ...prev, mcqs };
        });
    };

    // ─── Coding Questions Handlers ─────
    const addCodingQuestion = () => setForm(prev => ({ ...prev, codingQuestions: [...prev.codingQuestions, emptyCodingQuestion()] }));
    const removeCodingQuestion = (ci) => setForm(prev => ({ ...prev, codingQuestions: prev.codingQuestions.filter((_, i) => i !== ci) }));
    const updateCodingQuestion = (ci, field, value) => {
        setForm(prev => {
            const cq = [...prev.codingQuestions];
            cq[ci] = { ...cq[ci], [field]: value };
            return { ...prev, codingQuestions: cq };
        });
    };
    const addHint = (ci) => {
        setForm(prev => {
            const cq = [...prev.codingQuestions];
            cq[ci].hints = [...cq[ci].hints, ''];
            return { ...prev, codingQuestions: cq };
        });
    };
    const removeHint = (ci, hi) => {
        setForm(prev => {
            const cq = [...prev.codingQuestions];
            cq[ci].hints = cq[ci].hints.filter((_, idx) => idx !== hi);
            return { ...prev, codingQuestions: cq };
        });
    };
    const updateHint = (ci, hi, value) => {
        setForm(prev => {
            const cq = [...prev.codingQuestions];
            cq[ci].hints[hi] = value;
            return { ...prev, codingQuestions: cq };
        });
    };

    // ─── Submit ──────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        const payload = {
            ...form,
            codingQuestions: form.codingQuestions.map(cq => ({
                ...cq,
                hints: cq.hints.filter(h => h.trim())
            })),
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
                <Link to="/admin/assignments" className="aform__back">← Back</Link>
            </div>

            {error && <div className="aform__error">{error}</div>}

            <form onSubmit={handleSubmit} className="aform__form">
                {/* ── Basic Fields ── */}
                <div className="aform__section">
                    <h2>Details</h2>

                    <label className="aform__label">
                        Title
                        <input type="text" className="aform__input" value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
                    </label>

                    <label className="aform__label">
                        Description
                        <textarea className="aform__textarea" rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} required />
                    </label>

                    <label className="aform__label">
                        Difficulty
                        <select className="aform__select" value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value)}>
                            <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                        </select>
                    </label>

                    <label className="aform__label">
                        Category
                        <select className="aform__select" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                            <option value="Basics">Basics</option><option value="Filtering">Filtering</option>
                            <option value="Aggregation">Aggregation</option><option value="Joins">Joins</option>
                            <option value="Subqueries">Subqueries</option><option value="Advanced">Advanced</option>
                        </select>
                    </label>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label className="aform__label" style={{ flex: 1 }}>
                            MCQ Time Limit (Minutes, 0 = no timer)
                            <input type="number" className="aform__input" value={Math.floor(form.mcqTimeLimit / 60)} onChange={(e) => updateField('mcqTimeLimit', (parseInt(e.target.value) || 0) * 60)} min="0" step="1" />
                        </label>
                        <label className="aform__label" style={{ flex: 1 }}>
                            Coding Time Limit (Minutes, 0 = no timer)
                            <input type="number" className="aform__input" value={Math.floor(form.codingTimeLimit / 60)} onChange={(e) => updateField('codingTimeLimit', (parseInt(e.target.value) || 0) * 60)} min="0" step="1" />
                        </label>
                    </div>
                </div>

                {/* ── Sections ── */}

                {/* MCQs */}
                <div className="aform__section">
                    <div className="aform__section-header">
                        <h2>Multiple Choice Questions</h2>
                        <button type="button" className="aform__add-btn" onClick={addMcq}>+ Add MCQ</button>
                    </div>
                    {form.mcqs.map((mcq, mi) => (
                        <div key={mi} className="aform__table-block">
                            <div className="aform__table-header">
                                <h3>MCQ {mi + 1}</h3>
                                <button type="button" className="aform__remove-btn" onClick={() => removeMcq(mi)}>Remove MCQ</button>
                            </div>
                            <label className="aform__label">
                                Question Text
                                <textarea className="aform__textarea" rows={2} value={mcq.questionText} onChange={(e) => updateMcq(mi, 'questionText', e.target.value)} required />
                            </label>
                            <div className="aform__options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {mcq.options.map((opt, oi) => (
                                    <label key={oi} className="aform__label">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="radio" name={`mcq-${mi}-correct`} checked={mcq.correctOptionIndex === oi} onChange={() => updateMcq(mi, 'correctOptionIndex', oi)} />
                                            Option {oi + 1} {mcq.correctOptionIndex === oi && "(Correct)"}
                                        </div>
                                        <input type="text" className="aform__input" value={opt} onChange={(e) => updateMcqOption(mi, oi, e.target.value)} required />
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coding Questions */}
                <div className="aform__section">
                    <div className="aform__section-header">
                        <h2>Coding Questions</h2>
                        <button type="button" className="aform__add-btn" onClick={addCodingQuestion}>+ Add Query</button>
                    </div>
                    {form.codingQuestions.map((cq, ci) => (
                        <div key={ci} className="aform__table-block">
                            <div className="aform__table-header">
                                <h3>Query {ci + 1}</h3>
                                {form.codingQuestions.length > 1 && (
                                    <button type="button" className="aform__remove-btn" onClick={() => removeCodingQuestion(ci)}>Remove Query</button>
                                )}
                            </div>
                            <label className="aform__label">
                                Question Text
                                <textarea className="aform__textarea" rows={2} value={cq.questionText} onChange={(e) => updateCodingQuestion(ci, 'questionText', e.target.value)} required />
                            </label>
                            <label className="aform__label">
                                Expected Query (Solution)
                                <textarea className="aform__textarea aform__textarea--code" rows={2} value={cq.expectedQuery} onChange={(e) => updateCodingQuestion(ci, 'expectedQuery', e.target.value)} required />
                            </label>
                            <div>
                                <h4>Hints</h4>
                                {cq.hints.map((hint, hi) => (
                                    <div key={hi} className="aform__hint-row" style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <input type="text" className="aform__input" value={hint} onChange={(e) => updateHint(ci, hi, e.target.value)} placeholder={`Hint ${hi + 1}`} />
                                        <button type="button" className="aform__icon-btn" onClick={() => removeHint(ci, hi)}>✕</button>
                                    </div>
                                ))}
                                <button type="button" className="aform__add-btn aform__add-btn--small" onClick={() => addHint(ci)}>+ Hint</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Tables ── */}
                <div className="aform__section">
                    <div className="aform__section-header"><h2>Tables</h2></div>
                    <div className="aform__mode-toggle">
                        <button type="button" className={`aform__mode-btn ${form.tableMode === 'existing' ? 'aform__mode-btn--active' : ''}`} onClick={() => updateField('tableMode', 'existing')}>📋 Use Existing Tables</button>
                        <button type="button" className={`aform__mode-btn ${form.tableMode === 'custom' ? 'aform__mode-btn--active' : ''}`} onClick={() => updateField('tableMode', 'custom')}>🛠 Create Custom Tables</button>
                    </div>

                    {form.tableMode === 'existing' && (
                        <div className="aform__shared-tables">
                            {sharedTables.length === 0 ? (
                                <p className="aform__shared-empty">No shared tables yet. <a href="/admin/tables">Create one first →</a></p>
                            ) : (
                                <>
                                    <p className="aform__shared-hint">Select tables this assignment will use:</p>
                                    <div className="aform__shared-grid">
                                        {sharedTables.map((st) => (
                                            <label key={st._id} className="aform__shared-item">
                                                <input type="checkbox" checked={form.sharedTableNames.includes(st.tableName)} onChange={(e) => updateField('sharedTableNames', e.target.checked ? [...form.sharedTableNames, st.tableName] : form.sharedTableNames.filter((n) => n !== st.tableName))} />
                                                <div className="aform__shared-info">
                                                    <strong>{st.displayName || st.tableName}</strong>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {form.tableMode === 'custom' && (
                        <>
                            <div className="aform__section-header" style={{ marginTop: '1rem' }}><button type="button" className="aform__add-btn" onClick={addTable}>+ Add Table</button></div>
                            {form.tables.map((table, ti) => (
                                <div key={ti} className="aform__table-block">
                                    <div className="aform__table-header">
                                        <input type="text" className="aform__input" placeholder="Table name (e.g. employees)" value={table.tableName} onChange={(e) => updateTableName(ti, e.target.value)} required />
                                        {form.tables.length > 1 && <button type="button" className="aform__remove-btn" onClick={() => removeTable(ti)}>Remove Table</button>}
                                    </div>
                                    <h3>Columns</h3>
                                    <div className="aform__columns">
                                        {table.columns.map((col, ci) => (
                                            <div key={ci} className="aform__col-row">
                                                <input type="text" className="aform__input" placeholder="Column name" value={col.name} onChange={(e) => updateColumn(ti, ci, 'name', e.target.value)} required />
                                                <select className="aform__select" value={col.type} onChange={(e) => updateColumn(ti, ci, 'type', e.target.value)}>
                                                    {COLUMN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                {table.columns.length > 1 && <button type="button" className="aform__icon-btn" onClick={() => removeColumn(ti, ci)}>✕</button>}
                                            </div>
                                        ))}
                                        <button type="button" className="aform__add-btn aform__add-btn--small" onClick={() => addColumn(ti)}>+ Column</button>
                                    </div>
                                    <h3>Sample Data</h3>
                                    <div className="aform__data-wrap">
                                        <table className="aform__data-table">
                                            <thead>
                                                <tr>{table.columns.map((col, ci) => (<th key={ci}>{col.name || `Col ${ci + 1}`}</th>))}<th></th></tr>
                                            </thead>
                                            <tbody>
                                                {table.sampleData.map((row, ri) => (
                                                    <tr key={ri}>
                                                        {row.map((cell, ci) => (
                                                            <td key={ci}><input type="text" className="aform__cell-input" value={cell} onChange={(e) => updateCell(ti, ri, ci, e.target.value)} /></td>
                                                        ))}
                                                        <td>{table.sampleData.length > 1 && <button type="button" className="aform__icon-btn" onClick={() => removeRow(ti, ri)}>✕</button>}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button type="button" className="aform__add-btn aform__add-btn--small" onClick={() => addRow(ti)}>+ Row</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

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
