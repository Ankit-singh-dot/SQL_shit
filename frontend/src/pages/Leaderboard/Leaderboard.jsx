import { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.scss';

const API = import.meta.env.VITE_API_URL;

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState('');
    const [loading, setLoading] = useState(true);

    const currentUser = JSON.parse(localStorage.getItem('cipherUser') || '{}');

    // Fetch assignments list once
    useEffect(() => {
        axios
            .get(`${API}/assignments`)
            .then((res) => setAssignments(res.data))
            .catch(() => {});
    }, []);

    // Fetch leaderboard
    useEffect(() => {
        setLoading(true);
        const url = selectedAssignment
            ? `${API}/leaderboard?assignmentId=${selectedAssignment}`
            : `${API}/leaderboard`;
        axios
            .get(url)
            .then((res) => setLeaders(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [selectedAssignment]);

    const handleAssignmentChange = (e) => setSelectedAssignment(e.target.value);

    return (
        <div className="lb">
            <div className="lb__header">
                <h1>🏆 Leaderboard</h1>
                <p className="lb__subtitle">Top SQL problem solvers</p>
                <div style={{ marginTop: '1rem' }}>
                    <select
                        value={selectedAssignment}
                        onChange={handleAssignmentChange}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', width: '100%', maxWidth: '300px' }}
                    >
                        <option value="">🌎 Global Overall</option>
                        {assignments.map(a => (
                            <option key={a._id} value={a._id}>{a.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="lb__loading">Loading…</div>
            ) : leaders.length === 0 ? (
                <p className="lb__empty">No data yet. Be the first to solve!</p>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    <div className="lb__podium">
                        {leaders.slice(0, 3).map((u, i) => (
                            <div
                                key={u.userId}
                                className={`lb__podium-item lb__podium-item--${i + 1} ${
                                    u.userId === currentUser.id ? 'lb__podium-item--me' : ''
                                }`}
                            >
                                <div className="lb__podium-rank">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                </div>
                                <div className="lb__podium-name">{u.username}</div>
                                {selectedAssignment ? (
                                    <>
                                        <div className="lb__podium-solved">Score: {u.score}/{u.totalMaxScore}</div>
                                        <div className="lb__podium-rate">Fully Correct: {u.fullyCorrect ? 'Yes' : 'No'}</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="lb__podium-solved">{u.solved} solved</div>
                                        <div className="lb__podium-rate">{u.successRate}% success</div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Full Table */}
                    <div className="lb__table-wrap">
                        <table className="lb__table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>User</th>
                                    {selectedAssignment ? (
                                        <>
                                            <th>Score</th>
                                            <th>Max Score</th>
                                            <th>Full Credit?</th>
                                        </>
                                    ) : (
                                        <>
                                            <th>Solved</th>
                                            <th>Correct</th>
                                            <th>Rate</th>
                                        </>
                                    )}
                                    <th>Total Attempts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaders.map((u) => (
                                    <tr
                                        key={u.userId}
                                        className={u.userId === currentUser.id ? 'lb__row--me' : ''}
                                    >
                                        <td className="lb__rank">{u.rank}</td>
                                        <td className="lb__name">{u.username}</td>
                                        {selectedAssignment ? (
                                            <>
                                                <td><strong>{u.score}</strong></td>
                                                <td>{u.totalMaxScore}</td>
                                                <td>{u.fullyCorrect ? '✅' : '❌'}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td><strong>{u.solved}</strong></td>
                                                <td>{u.totalCorrect}</td>
                                                <td>{u.successRate}%</td>
                                            </>
                                        )}
                                        <td>{u.totalAttempts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Leaderboard;
