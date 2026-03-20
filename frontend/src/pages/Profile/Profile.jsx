import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Profile.scss';

const API = import.meta.env.VITE_API_URL;

const Profile = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [certificates, setCertificates] = useState([]);
    const navigate = useNavigate();

    const token = localStorage.getItem('cipherToken');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        axios
            .get(`${API}/profile`, { headers })
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
            .finally(() => setLoading(false));

        // Check certificates for all categories
        const categories = ['Basics', 'Filtering', 'Aggregation', 'Joins', 'Subqueries', 'Advanced'];
        Promise.all(
            categories.map((cat) =>
                axios
                    .get(`${API}/certificate/${cat}`, { headers })
                    .then((res) => res.data)
                    .catch(() => null)
            )
        ).then((results) => {
            setCertificates(results.filter((r) => r && r.completed));
        });
    }, [token, navigate]);

    if (loading) return <div className="profile__loading">Loading…</div>;
    if (error) return <div className="profile__error">{error}</div>;
    if (!data) return null;

    const { user, stats, recentActivity } = data;
    const maxDifficulty = Math.max(
        stats.difficultyBreakdown.Easy || 0,
        stats.difficultyBreakdown.Medium || 0,
        stats.difficultyBreakdown.Hard || 0,
        1
    );

    return (
        <div className="profile">
            <div className="profile__header">
                <div className="profile__avatar">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="profile__info">
                    <h1>{user.username}</h1>
                    <p className="profile__email">{user.email}</p>
                    <p className="profile__joined">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="profile__stats">
                <div className="profile__stat">
                    <span className="profile__stat-value">{stats.totalSolved}</span>
                    <span className="profile__stat-label">Solved</span>
                </div>
                <div className="profile__stat">
                    <span className="profile__stat-value">{stats.totalAttempts}</span>
                    <span className="profile__stat-label">Attempts</span>
                </div>
                <div className="profile__stat">
                    <span className="profile__stat-value">{stats.successRate}%</span>
                    <span className="profile__stat-label">Success</span>
                </div>
                <div className="profile__stat">
                    <span className="profile__stat-value">{stats.streak}🔥</span>
                    <span className="profile__stat-label">Streak</span>
                </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="profile__section">
                <h2>Difficulty Breakdown</h2>
                <div className="profile__bars">
                    {['Easy', 'Medium', 'Hard'].map((d) => (
                        <div key={d} className="profile__bar-row">
                            <span className="profile__bar-label">{d}</span>
                            <div className="profile__bar-track">
                                <div
                                    className={`profile__bar-fill profile__bar-fill--${d.toLowerCase()}`}
                                    style={{
                                        width: `${((stats.difficultyBreakdown[d] || 0) / maxDifficulty) * 100}%`,
                                    }}
                                />
                            </div>
                            <span className="profile__bar-count">
                                {stats.difficultyBreakdown[d] || 0}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(stats.categoryBreakdown).length > 0 && (
                <div className="profile__section">
                    <h2>Categories Mastered</h2>
                    <div className="profile__tags">
                        {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
                            <span key={cat} className="profile__tag">
                                {cat} <strong>{count}</strong>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
                <div className="profile__section">
                    <h2>🎓 Certificates Earned</h2>
                    <div className="profile__certs">
                        {certificates.map((cert) => (
                            <div key={cert.category} className="profile__cert">
                                <span className="profile__cert-icon">🏆</span>
                                <div>
                                    <strong>{cert.category}</strong>
                                    <p>
                                        {cert.solved}/{cert.totalAssignments} completed
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="profile__section">
                <h2>Recent Activity</h2>
                {recentActivity.length === 0 ? (
                    <p className="profile__empty">No activity yet. <Link to="/">Solve an assignment!</Link></p>
                ) : (
                    <div className="profile__activity">
                        {recentActivity.map((a) => (
                            <div key={a.id} className="profile__activity-item">
                                <span
                                    className={`profile__activity-dot ${a.isCorrect ? 'profile__activity-dot--correct' : ''}`}
                                />
                                <div className="profile__activity-info">
                                    <span className="profile__activity-title">
                                        {a.assignment?.title || 'Deleted Assignment'}
                                    </span>
                                    <code className="profile__activity-query">{a.query}</code>
                                </div>
                                <span className="profile__activity-time">
                                    {new Date(a.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
