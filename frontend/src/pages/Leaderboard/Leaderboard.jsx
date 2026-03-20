import { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.scss';

const API = import.meta.env.VITE_API_URL;

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentUser = JSON.parse(localStorage.getItem('cipherUser') || '{}');

    useEffect(() => {
        axios
            .get(`${API}/leaderboard`)
            .then((res) => setLeaders(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="lb__loading">Loading…</div>;

    return (
        <div className="lb">
            <div className="lb__header">
                <h1>🏆 Leaderboard</h1>
                <p className="lb__subtitle">Top SQL problem solvers</p>
            </div>

            {leaders.length === 0 ? (
                <p className="lb__empty">No data yet. Be the first to solve an assignment!</p>
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
                                <div className="lb__podium-solved">{u.solved} solved</div>
                                <div className="lb__podium-rate">{u.successRate}% success</div>
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
                                    <th>Solved</th>
                                    <th>Correct</th>
                                    <th>Total</th>
                                    <th>Rate</th>
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
                                        <td><strong>{u.solved}</strong></td>
                                        <td>{u.totalCorrect}</td>
                                        <td>{u.totalAttempts}</td>
                                        <td>{u.successRate}%</td>
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
