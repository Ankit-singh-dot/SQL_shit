import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManageTables.scss';

const API = import.meta.env.VITE_API_URL;

const TYPE_OPTIONS = ['INTEGER', 'TEXT', 'VARCHAR(255)', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'FLOAT', 'SERIAL'];

const emptyColumn = () => ({ name: '', type: 'INTEGER' });

const ManageTables = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        tableName: '',
        displayName: '',
        description: '',
        columns: [emptyColumn()],
        sampleData: [[]],
    });

    const navigate = useNavigate();
    const token = localStorage.getItem('cipherToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await axios.get(`${API}/admin/tables`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTables(res.data);
        } catch { }
        setLoading(false);
    };

    const resetForm = () => {
        setForm({ tableName: '', displayName: '', description: '', columns: [emptyColumn()], sampleData: [[]] });
        setEditId(null);
        setShowForm(false);
        setError('');
    };

    const handleEdit = (table) => {
        setForm({
            tableName: table.tableName,
            displayName: table.displayName || table.tableName,
            description: table.description || '',
            columns: table.columns.length > 0 ? table.columns : [emptyColumn()],
            sampleData: table.sampleData.length > 0 ? table.sampleData : [[]],
        });
        setEditId(table._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this table? This will also drop it from PostgreSQL.')) return;
        try {
            await axios.delete(`${API}/admin/tables/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTables((prev) => prev.filter((t) => t._id !== id));
        } catch (err) {
            alert(err.response?.data?.error || 'Delete failed');
        }
    };

    // Column helpers
    const updateColumn = (i, field, val) => {
        setForm((prev) => {
            const cols = [...prev.columns];
            cols[i] = { ...cols[i], [field]: val };
            return { ...prev, columns: cols };
        });
    };

    const addColumn = () => {
        setForm((prev) => ({
            ...prev,
            columns: [...prev.columns, emptyColumn()],
            sampleData: prev.sampleData.map((row) => [...row, '']),
        }));
    };

    const removeColumn = (i) => {
        if (form.columns.length <= 1) return;
        setForm((prev) => ({
            ...prev,
            columns: prev.columns.filter((_, idx) => idx !== i),
            sampleData: prev.sampleData.map((row) => row.filter((_, idx) => idx !== i)),
        }));
    };

    // Row helpers
    const addRow = () => {
        setForm((prev) => ({
            ...prev,
            sampleData: [...prev.sampleData, prev.columns.map(() => '')],
        }));
    };

    const removeRow = (i) => {
        if (form.sampleData.length <= 1) return;
        setForm((prev) => ({
            ...prev,
            sampleData: prev.sampleData.filter((_, idx) => idx !== i),
        }));
    };

    const updateCell = (ri, ci, val) => {
        setForm((prev) => {
            const data = prev.sampleData.map((r) => [...r]);
            data[ri][ci] = val;
            return { ...prev, sampleData: data };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        // Validate
        if (!form.tableName.trim()) { setError('Table name is required.'); setSaving(false); return; }
        if (form.columns.some((c) => !c.name.trim())) { setError('All columns need a name.'); setSaving(false); return; }

        const payload = {
            ...form,
            tableName: form.tableName.toLowerCase().replace(/\s+/g, '_'),
        };

        try {
            if (editId) {
                const res = await axios.put(`${API}/admin/tables/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTables((prev) => prev.map((t) => (t._id === editId ? res.data : t)));
            } else {
                const res = await axios.post(`${API}/admin/tables`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTables((prev) => [res.data, ...prev]);
            }
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="mt__loading">Loading…</div>;

    return (
        <div className="mt">
            <div className="mt__header">
                <div>
                    <h1>📋 Manage Tables</h1>
                    <p className="mt__subtitle">Shared table pool — create once, reuse across assignments</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="mt__cancel-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <button className="mt__add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                        + New Table
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <form className="mt__form" onSubmit={handleSubmit}>
                    <h2>{editId ? 'Edit Table' : 'Create New Table'}</h2>

                    {error && <div className="mt__error">{error}</div>}

                    <div className="mt__form-row">
                        <label className="mt__label">
                            Table Name (PostgreSQL)
                            <input
                                className="mt__input"
                                value={form.tableName}
                                onChange={(e) => setForm((p) => ({ ...p, tableName: e.target.value }))}
                                placeholder="e.g. employees"
                                disabled={!!editId}
                            />
                        </label>
                        <label className="mt__label">
                            Display Name
                            <input
                                className="mt__input"
                                value={form.displayName}
                                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                                placeholder="e.g. Employees"
                            />
                        </label>
                    </div>

                    <label className="mt__label">
                        Description
                        <input
                            className="mt__input"
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Brief description of the table"
                        />
                    </label>

                    {/* Columns */}
                    <div className="mt__section">
                        <h3>Columns</h3>
                        {form.columns.map((col, i) => (
                            <div key={i} className="mt__col-row">
                                <input
                                    className="mt__input mt__input--col"
                                    value={col.name}
                                    onChange={(e) => updateColumn(i, 'name', e.target.value)}
                                    placeholder="Column name"
                                />
                                <select
                                    className="mt__select"
                                    value={col.type}
                                    onChange={(e) => updateColumn(i, 'type', e.target.value)}
                                >
                                    {TYPE_OPTIONS.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                {form.columns.length > 1 && (
                                    <button type="button" className="mt__remove" onClick={() => removeColumn(i)}>×</button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="mt__small-btn" onClick={addColumn}>+ Column</button>
                    </div>

                    {/* Sample Data */}
                    <div className="mt__section">
                        <h3>Sample Data</h3>
                        <div className="mt__data-wrap">
                            <table className="mt__data-table">
                                <thead>
                                    <tr>
                                        {form.columns.map((col, i) => (
                                            <th key={i}>{col.name || `Col ${i + 1}`}</th>
                                        ))}
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.sampleData.map((row, ri) => (
                                        <tr key={ri}>
                                            {form.columns.map((_, ci) => (
                                                <td key={ci}>
                                                    <input
                                                        className="mt__cell-input"
                                                        value={row[ci] ?? ''}
                                                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                            <td>
                                                {form.sampleData.length > 1 && (
                                                    <button type="button" className="mt__remove" onClick={() => removeRow(ri)}>×</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" className="mt__small-btn" onClick={addRow}>+ Row</button>
                    </div>

                    <div className="mt__form-actions">
                        <button type="submit" className="mt__save-btn" disabled={saving}>
                            {saving ? 'Saving…' : editId ? 'Update Table' : 'Create Table'}
                        </button>
                        <button type="button" className="mt__cancel-btn" onClick={resetForm}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Table List */}
            {tables.length === 0 ? (
                <p className="mt__empty">No shared tables yet. Click "+ New Table" to get started.</p>
            ) : (
                <div className="mt__list">
                    {tables.map((t) => (
                        <div key={t._id} className="mt__card">
                            <div className="mt__card-header">
                                <strong className="mt__card-name">{t.tableName}</strong>
                                {t.displayName && t.displayName !== t.tableName && (
                                    <span className="mt__card-display">{t.displayName}</span>
                                )}
                            </div>
                            {t.description && <p className="mt__card-desc">{t.description}</p>}
                            <div className="mt__card-cols">
                                {t.columns.map((c, i) => (
                                    <span key={i} className="mt__card-col">
                                        {c.name} <small>{c.type}</small>
                                    </span>
                                ))}
                            </div>
                            <div className="mt__card-meta">
                                {t.sampleData.length} rows
                            </div>
                            <div className="mt__card-actions">
                                <button className="mt__edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                                <button className="mt__delete-btn" onClick={() => handleDelete(t._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageTables;
