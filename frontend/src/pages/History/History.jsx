import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './History.scss';

const API = import.meta.env.VITE_API_URL;

const History = () => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, correct, incorrect
    const navigate = useNavigate();

    const token = localStorage.getItem('cipherToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }

        // We'll use the profile endpoint's recent activity (or pull from attempts)
        axios
            .get(`${API}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setAttempts(res.data.recentActivity || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token, navigate]);

    const filtered = attempts.filter((a) => {
        if (filter === 'correct') return a.isCorrect;
        if (filter === 'incorrect') return !a.isCorrect;
        return true;
    });

    if (loading) return <div className="history__loading">Loading…</div>;

    return (
        <div className="history">
            <div className="history__header">
                <h1>📜 Query History</h1>
                <div className="history__filters">
                    {['all', 'correct', 'incorrect'].map((f) => (
                        <button
                            key={f}
                            className={`history__filter ${filter === f ? 'history__filter--active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <p className="history__empty">
                    {filter === 'all'
                        ? 'No attempts yet.'
                        : `No ${filter} attempts.`}
                </p>
            ) : (
                <div className="history__list">
                    {filtered.map((a) => (
                        <div key={a.id} className="history__item">
                            <div className="history__item-status">
                                <span
                                    className={`history__dot ${a.isCorrect ? 'history__dot--correct' : 'history__dot--wrong'}`}
                                />
                            </div>
                            <div className="history__item-body">
                                <div className="history__item-top">
                                    <span className="history__item-title">
                                        {a.assignment?.title || 'Deleted Assignment'}
                                    </span>
                                    {a.assignment?.difficulty && (
                                        <span className={`history__badge history__badge--${a.assignment.difficulty.toLowerCase()}`}>
                                            {a.assignment.difficulty}
                                        </span>
                                    )}
                                    {a.assignment?.category && (
                                        <span className="history__cat">{a.assignment.category}</span>
                                    )}
                                </div>
                                <code className="history__query">{a.query}</code>
                                <span className="history__time">
                                    {new Date(a.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
