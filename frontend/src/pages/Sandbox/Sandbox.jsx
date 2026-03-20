import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './Sandbox.scss';

const API = import.meta.env.VITE_API_URL;

const Sandbox = () => {
    const [tables, setTables] = useState([]);
    const [query, setQuery] = useState('SELECT ');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        axios
            .get(`${API}/sandbox/tables`)
            .then((res) => setTables(res.data))
            .catch(() => {});
    }, []);

    const handleExecute = async () => {
        if (!query.trim()) return;
        setExecuting(true);
        setResult(null);
        setError(null);

        try {
            const res = await axios.post(`${API}/execute`, { query });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Query failed');
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="sandbox">
            {/* Sidebar — Table List */}
            <aside className={`sandbox__sidebar ${sidebarOpen ? '' : 'sandbox__sidebar--closed'}`}>
                <div className="sandbox__sidebar-header">
                    <h2>Tables</h2>
                    <button
                        className="sandbox__sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>
                {sidebarOpen && (
                    <div className="sandbox__tables">
                        {tables.length === 0 && (
                            <p className="sandbox__empty-tables">No tables found</p>
                        )}
                        {tables.map((t) => (
                            <div key={t.tableName} className="sandbox__table-item">
                                <strong className="sandbox__table-name">{t.tableName}</strong>
                                <ul className="sandbox__columns">
                                    {t.columns.map((c) => (
                                        <li key={c.name}>
                                            {c.name}{' '}
                                            <span className="sandbox__col-type">{c.type}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </aside>

            {/* Main Area */}
            <div className="sandbox__main">
                <div className="sandbox__editor-section">
                    <div className="sandbox__editor-header">
                        <h1>🧪 SQL Sandbox</h1>
                        <button
                            className="sandbox__run-btn"
                            onClick={handleExecute}
                            disabled={executing}
                        >
                            {executing ? 'Running…' : '▶ Execute'}
                        </button>
                    </div>
                    <div className="sandbox__editor-wrap">
                        <Editor
                            height="250px"
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

                <div className="sandbox__results">
                    <h2>
                        Results
                        {result && <span className="sandbox__row-count"> ({result.rowCount} rows)</span>}
                    </h2>

                    {error && <div className="sandbox__error">{error}</div>}

                    {result && result.rows?.length > 0 && (
                        <div className="sandbox__table-wrap">
                            <table className="sandbox__result-table">
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
                                                <td key={ci}>
                                                    {row[col] != null ? String(row[col]) : 'NULL'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {result && result.rows?.length === 0 && (
                        <p className="sandbox__no-results">Query returned no results.</p>
                    )}

                    {!result && !error && (
                        <p className="sandbox__placeholder">
                            Write any SQL query and hit Execute. Explore the tables in the sidebar!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sandbox;
