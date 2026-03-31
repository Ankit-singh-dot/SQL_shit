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

    // Phase: 'mcq', 'coding', 'submitted'
    const [phase, setPhase] = useState('mcq');

    // Answers tracking
    const [mcqAnswers, setMcqAnswers] = useState([]);
    const [codingAnswers, setCodingAnswers] = useState([]);
    const [activeCodingIndex, setActiveCodingIndex] = useState(0);

    // Editor & Execution state for current coding question
    const [query, setQuery] = useState('SELECT ');
    const [executing, setExecuting] = useState(false);
    const [result, setResult] = useState(null);
    const [queryError, setQueryError] = useState(null);
    const [lastCorrect, setLastCorrect] = useState(null); // tracking verify
    const [verifying, setVerifying] = useState(false);

    // Timer status
    const [mcqTimedOut, setMcqTimedOut] = useState(false);
    const [codingTimedOut, setCodingTimedOut] = useState(false);

    // Post-submit
    const [submissionResult, setSubmissionResult] = useState(null);

    const token = localStorage.getItem('cipherToken');

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await axios.get(`${API}/assignments/${id}`);
                const data = res.data;
                setAssignment(data);
                
                // Initialize answers structures
                setMcqAnswers(data.mcqs?.map((_, i) => ({ questionIndex: i, selectedOptionIndex: -1 })) || []);
                setCodingAnswers(data.codingQuestions?.map((_, i) => ({ questionIndex: i, query: 'SELECT ' })) || []);

                // Determine initial phase
                if (data.mcqs && data.mcqs.length > 0) {
                    setPhase('mcq');
                } else if (data.codingQuestions && data.codingQuestions.length > 0) {
                    setPhase('coding');
                } else {
                    setPhase('submitted'); // Should not happen
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load assignment');
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [id]);

    useEffect(() => {
        // When activeCodingIndex changes, load saved query from draft
        if (assignment && assignment.codingQuestions && phase === 'coding') {
            const draft = codingAnswers.find(c => c.questionIndex === activeCodingIndex);
            setQuery(draft ? draft.query : 'SELECT ');
            setResult(null);
            setQueryError(null);
            setLastCorrect(null);
        }
    }, [activeCodingIndex, phase, assignment, codingAnswers]);

    const handleMcqSelect = (questionIndex, selectedOptionIndex) => {
        if (mcqTimedOut) return;
        setMcqAnswers(prev => prev.map(ans => 
            ans.questionIndex === questionIndex ? { ...ans, selectedOptionIndex } : ans
        ));
    };

    const handleQueryChange = (val) => {
        if (codingTimedOut) return;
        const newQuery = val || '';
        setQuery(newQuery);
        setCodingAnswers(prev => prev.map(ans => 
            ans.questionIndex === activeCodingIndex ? { ...ans, query: newQuery } : ans
        ));
    };

    const handleNextPhase = () => {
        if (assignment.codingQuestions && assignment.codingQuestions.length > 0) {
            setPhase('coding');
        } else {
            handleSubmit();
        }
    };

    const handleExecute = async () => {
        if (!query.trim() || codingTimedOut) return;
        setExecuting(true);
        setResult(null);
        setQueryError(null);
        setLastCorrect(null);

        try {
            const res = await axios.post(`${API}/execute`, { query });
            setResult(res.data);
            setQueryError(null);
        } catch (err) {
            setQueryError(err.response?.data?.error || 'Query execution failed');
        } finally {
            setExecuting(false);
        }
    };

    const handleVerify = async () => {
        if (!query.trim() || codingTimedOut || !token) return;
        setVerifying(true);
        try {
            const res = await axios.post(
                `${API}/attempts/verify`,
                { assignmentId: id, questionIndex: activeCodingIndex, query },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLastCorrect(res.data.isCorrect);
        } catch (err) {
            console.error('Verify failed', err);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async () => {
        if (!token) {
            alert("You must be logged in to submit.");
            return;
        }
        
        // Filter out unanswered MCQs
        const finalMcqAnswers = mcqAnswers.filter(m => m.selectedOptionIndex !== -1);
        
        try {
            const payload = { assignmentId: id, mcqAnswers: finalMcqAnswers, codingAnswers };
            const res = await axios.post(`${API}/attempts`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissionResult(res.data);
            setPhase('submitted');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit assignment');
        }
    };

    if (loading) return <div className="attempt__loading">Loading assignment...</div>;
    if (error) return <div className="attempt__error">{error}</div>;
    if (!assignment) return <div className="attempt__error">Assignment not found</div>;

    if (phase === 'submitted' && submissionResult) {
        return (
            <div className="attempt attempt--submitted" style={{ padding: '2rem', textAlign: 'center' }}>
                <Link to="/" className="attempt__back">← Back to Dashboard</Link>
                <h1>Assignment Completed!</h1>
                <div style={{ fontSize: '2rem', margin: '2rem 0', fontWeight: 'bold' }}>
                    Score: {submissionResult.score} / {submissionResult.totalMaxScore}
                </div>
                <p>Your submission has been securely recorded.</p>
            </div>
        );
    }

    return (
        <div className="attempt">
            {/* Header Area common to phases */}
            <div className="attempt__global-header" style={{ padding: '1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0 }}>{assignment.title}</h1>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Phase: {phase.toUpperCase()}</span>
                </div>
                <div>
                    {phase === 'mcq' && assignment.mcqTimeLimit > 0 && !mcqTimedOut && (
                        <Timer seconds={assignment.mcqTimeLimit} onTimeout={() => setMcqTimedOut(true)} />
                    )}
                    {phase === 'coding' && assignment.codingTimeLimit > 0 && !codingTimedOut && (
                        <Timer seconds={assignment.codingTimeLimit} onTimeout={() => setCodingTimedOut(true)} />
                    )}
                </div>
            </div>

            {/* MCQ Phase Layout */}
            {phase === 'mcq' && (
                <div className="attempt__layout" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
                    <div className="attempt__panel attempt__panel--active" style={{ width: '100%' }}>
                        <h2>Multiple Choice Section</h2>
                        {mcqTimedOut && <div className="attempt__verdict attempt__verdict--wrong">Time is up for the MCQ section!</div>}
                        
                        {(assignment.mcqs || []).map((mcq, i) => (
                            <div key={i} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                                <h3 style={{ marginTop: 0 }}>Q{i + 1}: {mcq.questionText}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {mcq.options.map((opt, oi) => (
                                        <label key={oi} style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input 
                                                type="radio" 
                                                name={`mcq-${i}`} 
                                                checked={mcqAnswers.find(a => a.questionIndex === i)?.selectedOptionIndex === oi}
                                                onChange={() => handleMcqSelect(i, oi)}
                                                disabled={mcqTimedOut}
                                            />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        <div style={{ textAlign: 'right' }}>
                            <button className="attempt__execute-btn" onClick={handleNextPhase}>
                                {assignment.codingQuestions?.length > 0 ? 'Next: Coding Section ➔' : 'Submit Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Coding Phase Layout */}
            {phase === 'coding' && (
                <div className="attempt__layout">
                    {/* Left column */}
                    <div className="attempt__left">
                        <div className="attempt__panel attempt__panel--active">
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
                                {(assignment.codingQuestions || []).map((_, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setActiveCodingIndex(i)}
                                        style={{
                                            padding: '0.5rem 1rem', 
                                            background: activeCodingIndex === i ? '#000' : '#fff',
                                            color: activeCodingIndex === i ? '#fff' : '#000',
                                            border: '1px solid #000', borderRadius: '4px', cursor: 'pointer'
                                        }}
                                    >
                                        Q{i + 1}
                                    </button>
                                ))}
                            </div>
                            
                            <h2 style={{marginTop: 0}}>Question {activeCodingIndex + 1}</h2>
                            <p className="attempt__desc">
                                {assignment.codingQuestions[activeCodingIndex]?.questionText}
                            </p>

                            {codingTimedOut && <div className="attempt__verdict attempt__verdict--wrong">Time is up! You can no longer edit queries.</div>}

                            <div style={{ marginTop: '2rem' }}>
                                <h3>Sample Data Schema</h3>
                                <SchemaVisualizer tables={assignment.tables} />
                            </div>

                            <div style={{ marginTop: '2rem' }} className="attempt__table-block">
                                <h3>Available Tables</h3>
                                {(assignment.tables || []).map((table, i) => (
                                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                                        <div className="attempt__table-name">{table.tableName}</div>
                                        <div className="attempt__table-wrap">
                                            <table className="attempt__table">
                                                <thead>
                                                    <tr>
                                                        {table.columns.map((col, ci) => (
                                                            <th key={ci}>
                                                                {col.name}
                                                                <span className="attempt__col-type">({col.type})</span>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {table.sampleData && table.sampleData.length > 0 ? (
                                                        table.sampleData.map((row, ri) => (
                                                            <tr key={ri}>
                                                                {row.map((val, vi) => (
                                                                    <td key={vi}>{String(val)}</td>
                                                                ))}
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={table.columns.length} style={{ textAlign: 'center', color: '#999' }}>
                                                                No sample data provided.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="attempt__right">
                        <div className="attempt__panel attempt__panel--active">
                            <div className="attempt__editor-header">
                                <h2 className="attempt__section-title">SQL Editor</h2>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="attempt__execute-btn" style={{ background: '#555' }} onClick={handleExecute} disabled={executing || codingTimedOut}>
                                        {executing ? '...' : '▶ Run'}
                                    </button>
                                    <button className="attempt__execute-btn" onClick={handleVerify} disabled={verifying || codingTimedOut}>
                                        {verifying ? '...' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                            <div className="attempt__editor-wrap" style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                                <Editor
                                    height="250px"
                                    defaultLanguage="sql"
                                    value={query}
                                    onChange={handleQueryChange}
                                    theme="vs-dark"
                                    options={{ minimap: { enabled: false }, fontSize: 14, tabSize: 2, readOnly: codingTimedOut }}
                                />
                            </div>
                        </div>

                        <div className="attempt__panel attempt__panel--active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="attempt__section-title">Results {result && <span style={{fontWeight: 'normal', fontSize:'0.9rem'}}>({result.rowCount} rows)</span>}</h2>
                                <button onClick={handleSubmit} style={{ padding: '0.5rem 1rem', background: 'green', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    Submit Assignment
                                </button>
                            </div>

                            {lastCorrect === true && <div className="attempt__verdict attempt__verdict--correct">✅ Verified Correct!</div>}
                            {lastCorrect === false && <div className="attempt__verdict attempt__verdict--wrong">❌ Incorrect query. Keep trying!</div>}
                            {queryError && <div className="attempt__query-error">{queryError}</div>}

                            {result && result.rows?.length > 0 && (
                                <div className="attempt__table-wrap">
                                    <table className="attempt__table attempt__table--result">
                                        <thead>
                                            <tr>{result.columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {result.rows.map((row, ri) => (
                                                <tr key={ri}>
                                                    {result.columns.map((col, ci) => <td key={ci}>{row[col] != null ? String(row[col]) : 'NULL'}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {result && result.rows?.length === 0 && <p className="attempt__empty-result">Query returned no results.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentAttempt;
