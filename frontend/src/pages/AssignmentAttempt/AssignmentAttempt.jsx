import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './AssignmentAttempt.scss';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const AssignmentAttempt = () => {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Editor state
    const [query, setQuery] = useState('SELECT ');
    const [executing, setExecuting] = useState(false);
    const [result, setResult] = useState(null);
    const [queryError, setQueryError] = useState(null);

    // Hint state
    const [hint, setHint] = useState(null);
    const [hintLoading, setHintLoading] = useState(false);

    // Panel toggle for mobile
    const [activePanel, setActivePanel] = useState('question');

    // Attempts
    const [attempts, setAttempts] = useState([]);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await axios.get(`${API}/assignments/${id}`);
                setAssignment(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load assignment');
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [id]);

    // Load saved attempts if logged in
    useEffect(() => {
        const token = localStorage.getItem('cipherToken');
        if (token && id) {
            axios
                .get(`${API}/attempts/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => setAttempts(res.data))
                .catch(() => { });
        }
    }, [id]);

    const handleExecute = async () => {
        if (!query.trim()) return;
        setExecuting(true);
        setResult(null);
        setQueryError(null);

        try {
            const res = await axios.post(`${API}/execute`, { query });
            setResult(res.data);
            setQueryError(null);

            // Save attempt if logged in
            const token = localStorage.getItem('cipherToken');
            if (token) {
                try {
                    const saved = await axios.post(
                        `${API}/attempts`,
                        { assignmentId: id, query, result: res.data, isCorrect: false },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setAttempts((prev) => [saved.data, ...prev]);
                } catch { }
            }
        } catch (err) {
            setQueryError(err.response?.data?.error || 'Query execution failed');
        } finally {
            setExecuting(false);
        }
    };

    const handleHint = async () => {
        setHintLoading(true);
        setHint(null);

        const tableInfo = assignment?.tables
            ?.map(
                (t) =>
                    `Table: ${t.tableName} — Columns: ${(t.columns || []).map((c) => `${c.name} (${c.type})`).join(', ')}`
            )
            .join('\n');

        try {
            const res = await axios.post(`${API}/hint`, {
                question: assignment?.description,
                userQuery: query,
                tableInfo,
            });
            setHint(res.data.hint);
        } catch (err) {
            setHint('Failed to get hint. Please try again.');
        } finally {
            setHintLoading(false);
        }
    };

    if (loading) return <div className="attempt__loading">Loading assignment...</div>;
    if (error) return <div className="attempt__error">{error}</div>;
    if (!assignment) return <div className="attempt__error">Assignment not found</div>;

    return (
        <div className="attempt">
            {/* Mobile panel tabs */}
            <div className="attempt__tabs">
                <button
                    className={`attempt__tab ${activePanel === 'question' ? 'attempt__tab--active' : ''}`}
                    onClick={() => setActivePanel('question')}
                >
                    Question
                </button>
                <button
                    className={`attempt__tab ${activePanel === 'data' ? 'attempt__tab--active' : ''}`}
                    onClick={() => setActivePanel('data')}
                >
                    Data
                </button>
                <button
                    className={`attempt__tab ${activePanel === 'editor' ? 'attempt__tab--active' : ''}`}
                    onClick={() => setActivePanel('editor')}
                >
                    Editor
                </button>
                <button
                    className={`attempt__tab ${activePanel === 'results' ? 'attempt__tab--active' : ''}`}
                    onClick={() => setActivePanel('results')}
                >
                    Results
                </button>
            </div>

            <div className="attempt__layout">
                {/* Left column: Question + Data */}
                <div className="attempt__left">
                    {/* Question Panel */}
                    <div className={`attempt__panel ${activePanel === 'question' ? 'attempt__panel--active' : ''}`}>
                        <div className="attempt__panel-header">
                            <Link to="/" className="attempt__back">← Back</Link>
                            <span className={`attempt__badge attempt__badge--${assignment.difficulty.toLowerCase()}`}>
                                {assignment.difficulty}
                            </span>
                        </div>
                        <h1 className="attempt__title">{assignment.title}</h1>
                        <p className="attempt__desc">{assignment.description}</p>

                        {/* Hint section */}
                        <div className="attempt__hint-section">
                            <button
                                className="attempt__hint-btn"
                                onClick={handleHint}
                                disabled={hintLoading}
                            >
                                {hintLoading ? 'Getting hint...' : '💡 Get Hint'}
                            </button>
                            {hint && (
                                <div className="attempt__hint-box">
                                    <strong>Hint:</strong> {hint}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sample Data Panel */}
                    <div className={`attempt__panel ${activePanel === 'data' ? 'attempt__panel--active' : ''}`}>
                        <h2 className="attempt__section-title">Sample Data</h2>
                        {assignment.tables?.map((table, i) => (
                            <div key={i} className="attempt__table-block">
                                <h3 className="attempt__table-name">{table.tableName}</h3>
                                <div className="attempt__table-wrap">
                                    <table className="attempt__table">
                                        <thead>
                                            <tr>
                                                {(table.columns || []).map((col, j) => (
                                                    <th key={j}>
                                                        {col.name}
                                                        <span className="attempt__col-type">{col.type}</span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(table.sampleData || []).map((row, ri) => (
                                                <tr key={ri}>
                                                    {(row || []).map((cell, ci) => (
                                                        <td key={ci}>{String(cell)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column: Editor + Results */}
                <div className="attempt__right">
                    {/* Editor Panel */}
                    <div className={`attempt__panel ${activePanel === 'editor' ? 'attempt__panel--active' : ''}`}>
                        <div className="attempt__editor-header">
                            <h2 className="attempt__section-title">SQL Editor</h2>
                            <button
                                className="attempt__execute-btn"
                                onClick={handleExecute}
                                disabled={executing}
                            >
                                {executing ? 'Running...' : '▶ Execute'}
                            </button>
                        </div>
                        <div className="attempt__editor-wrap">
                            <Editor
                                height="300px"
                                defaultLanguage="sql"
                                value={query}
                                onChange={(val) => setQuery(val || '')}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                    wordWrap: 'on',
                                }}
                            />
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className={`attempt__panel ${activePanel === 'results' ? 'attempt__panel--active' : ''}`}>
                        <h2 className="attempt__section-title">
                            Results
                            {result && <span className="attempt__row-count"> ({result.rowCount} rows)</span>}
                        </h2>

                        {queryError && <div className="attempt__query-error">{queryError}</div>}

                        {result && result.rows?.length > 0 && (
                            <div className="attempt__table-wrap">
                                <table className="attempt__table attempt__table--result">
                                    <thead>
                                        <tr>
                                            {result.columns.map((col, i) => (
                                                <th key={i}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.rows.map((row, ri) => (
                                            <tr key={ri}>
                                                {result.columns.map((col, ci) => (
                                                    <td key={ci}>{row[col] != null ? String(row[col]) : 'NULL'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {result && result.rows?.length === 0 && (
                            <p className="attempt__empty-result">Query returned no results.</p>
                        )}

                        {!result && !queryError && (
                            <p className="attempt__placeholder">Execute a query to see results here.</p>
                        )}
                    </div>

                    {/* Previous Attempts */}
                    {attempts.length > 0 && (
                        <div className="attempt__panel attempt__panel--always">
                            <h2 className="attempt__section-title">Previous Attempts</h2>
                            <div className="attempt__attempts-list">
                                {attempts.slice(0, 5).map((a, i) => (
                                    <div key={a._id || i} className="attempt__attempt-item">
                                        <code className="attempt__attempt-query">{a.query}</code>
                                        <span className="attempt__attempt-time">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignmentAttempt;
