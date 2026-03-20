import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import Timer from '../../components/Timer/Timer';
import SchemaVisualizer from '../../components/SchemaVisualizer/SchemaVisualizer';
import './AssignmentAttempt.scss';

const API = import.meta.env.VITE_API_URL || 'https://sql-shit.vercel.app/api';

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

    // Bookmark
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Solution comparison
    const [comparison, setComparison] = useState(null);
    const [comparing, setComparing] = useState(false);
    const [hasSolved, setHasSolved] = useState(false);
    const [lastCorrect, setLastCorrect] = useState(null);

    // Timer
    const [timedOut, setTimedOut] = useState(false);

    const token = localStorage.getItem('cipherToken');

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
        if (token && id) {
            axios
                .get(`${API}/attempts/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    setAttempts(res.data);
                    if (res.data.some((a) => a.isCorrect)) setHasSolved(true);
                })
                .catch(() => { });
        }
    }, [id, token]);

    // Check bookmark status
    useEffect(() => {
        if (token) {
            axios
                .get(`${API}/bookmarks`, { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => {
                    if (res.data.some((b) => b._id === id)) setIsBookmarked(true);
                })
                .catch(() => {});
        }
    }, [id, token]);

    const toggleBookmark = async () => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            if (isBookmarked) {
                await axios.delete(`${API}/bookmarks/${id}`, { headers });
                setIsBookmarked(false);
            } else {
                await axios.post(`${API}/bookmarks/${id}`, {}, { headers });
                setIsBookmarked(true);
            }
        } catch {}
    };

    const handleExecute = async () => {
        if (!query.trim() || timedOut) return;
        setExecuting(true);
        setResult(null);
        setQueryError(null);
        setLastCorrect(null);

        try {
            const res = await axios.post(`${API}/execute`, { query });
            setResult(res.data);
            setQueryError(null);

            // Save attempt if logged in — server verifies correctness
            if (token) {
                try {
                    const saved = await axios.post(
                        `${API}/attempts`,
                        { assignmentId: id, query, result: res.data },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setAttempts((prev) => [saved.data, ...prev]);
                    setLastCorrect(saved.data.isCorrect);
                    if (saved.data.isCorrect) setHasSolved(true);
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

    const handleCompare = async () => {
        if (!assignment?.expectedQuery) return;
        setComparing(true);
        setComparison(null);

        try {
            const tableInfo = assignment.tables
                ?.map((t) => `${t.tableName}: ${t.columns.map((c) => c.name).join(', ')}`)
                .join('; ');

            const res = await axios.post(`${API}/compare`, {
                studentQuery: query,
                expectedQuery: assignment.expectedQuery,
                question: assignment.description,
                tableInfo,
            });
            setComparison(res.data.comparison);
        } catch {
            setComparison('Failed to compare. Please try again.');
        } finally {
            setComparing(false);
        }
    };

    const handleTimeout = () => {
        setTimedOut(true);
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
                            {assignment.category && (
                                <span className="attempt__cat-badge">{assignment.category}</span>
                            )}
                            {token && (
                                <button className="attempt__bookmark-btn" onClick={toggleBookmark}>
                                    {isBookmarked ? '♥' : '♡'}
                                </button>
                            )}
                        </div>

                        {/* Timer */}
                        {assignment.timeLimit > 0 && !timedOut && (
                            <div className="attempt__timer-wrap">
                                <Timer seconds={assignment.timeLimit} onTimeout={handleTimeout} />
                            </div>
                        )}
                        {timedOut && (
                            <div className="attempt__timed-out">
                                ⏰ Time's up! You can still view the assignment but can't submit.
                            </div>
                        )}

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
                        {/* Schema Visualizer */}
                        <SchemaVisualizer tables={assignment.tables} />

                        <h2 className="attempt__section-title" style={{ marginTop: '1rem' }}>Sample Data</h2>
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
                                disabled={executing || timedOut}
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
                                    readOnly: timedOut,
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

                        {/* Verification Banner */}
                        {lastCorrect === true && (
                            <div className="attempt__verdict attempt__verdict--correct">
                                ✅ Correct! Your query returns the expected results.
                            </div>
                        )}
                        {lastCorrect === false && token && (
                            <div className="attempt__verdict attempt__verdict--wrong">
                                ❌ Not quite. The results don't match the expected output. Try again!
                            </div>
                        )}

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

                    {/* Solution Comparison */}
                    {assignment.expectedQuery && (
                        <div className="attempt__panel attempt__panel--always">
                            <h2 className="attempt__section-title">🔍 Compare Solution</h2>
                            <p className="attempt__compare-hint">
                                Compare your query with the reference solution using AI analysis.
                            </p>
                            <button
                                className="attempt__compare-btn"
                                onClick={handleCompare}
                                disabled={comparing || !query.trim()}
                            >
                                {comparing ? 'Analyzing…' : 'Compare with Reference'}
                            </button>
                            {comparison && (
                                <div className="attempt__comparison">
                                    {comparison}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Previous Attempts */}
                    {attempts.length > 0 && (
                        <div className="attempt__panel attempt__panel--always">
                            <h2 className="attempt__section-title">Previous Attempts</h2>
                            <div className="attempt__attempts-list">
                                {attempts.slice(0, 10).map((a, i) => (
                                    <div key={a._id || i} className={`attempt__attempt-item ${a.isCorrect ? 'attempt__attempt-item--correct' : ''}`}>
                                        <span className="attempt__attempt-status">
                                            {a.isCorrect ? '✅' : '❌'}
                                        </span>
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
