import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AssignmentList.scss';

const API = import.meta.env.VITE_API_URL || 'https://sql-shit.vercel.app/api';
const CATEGORIES = ['All', 'Basics', 'Filtering', 'Aggregation', 'Joins', 'Subqueries', 'Advanced'];

const AssignmentList = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

    const token = localStorage.getItem('cipherToken');

    useEffect(() => {
        fetchAssignments();
        if (token) fetchBookmarks();
    }, [activeCategory]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const params = activeCategory !== 'All' ? `?category=${activeCategory}` : '';
            const res = await axios.get(`${API}/assignments${params}`);
            setAssignments(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookmarks = async () => {
        try {
            const res = await axios.get(`${API}/bookmarks`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBookmarkedIds(new Set(res.data.map((b) => b._id)));
        } catch {}
    };

    const toggleBookmark = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        try {
            if (bookmarkedIds.has(id)) {
                await axios.delete(`${API}/bookmarks/${id}`, { headers });
                setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
            } else {
                await axios.post(`${API}/bookmarks/${id}`, {}, { headers });
                setBookmarkedIds((prev) => new Set(prev).add(id));
            }
        } catch {}
    };

    if (error) return <div className="assignment-list__error">{error}</div>;

    return (
        <div className="assignment-list">
            <div className="assignment-list__header">
                <h1 className="assignment-list__title">SQL Assignments</h1>
                <p className="assignment-list__subtitle">
                    Select an assignment to practice your SQL skills
                </p>
            </div>

            {/* Category Filter */}
            <div className="assignment-list__filters">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`assignment-list__filter ${activeCategory === cat ? 'assignment-list__filter--active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="assignment-list__loading">Loading assignments...</div>
            ) : (
                <div className="assignment-list__grid">
                    {assignments.map((a) => (
                        <Link to={`/assignment/${a._id}`} key={a._id} className="assignment-card">
                            <div className="assignment-card__header">
                                <span className={`assignment-card__badge assignment-card__badge--${a.difficulty.toLowerCase()}`}>
                                    {a.difficulty}
                                </span>
                                {a.category && (
                                    <span className="assignment-card__cat">{a.category}</span>
                                )}
                                {(a.mcqTimeLimit > 0 || a.codingTimeLimit > 0) && (
                                    <span className="assignment-card__timer">⏱ {Math.floor(((a.mcqTimeLimit || 0) + (a.codingTimeLimit || 0)) / 60)}m</span>
                                )}
                                {token && (
                                    <button
                                        className="assignment-card__bookmark"
                                        onClick={(e) => toggleBookmark(e, a._id)}
                                        title={bookmarkedIds.has(a._id) ? 'Remove bookmark' : 'Bookmark'}
                                    >
                                        {bookmarkedIds.has(a._id) ? '♥' : '♡'}
                                    </button>
                                )}
                            </div>
                            <h2 className="assignment-card__title">{a.title}</h2>
                            <p className="assignment-card__desc">{a.description}</p>
                            <div className="assignment-card__footer">
                                <span className="assignment-card__action">Start →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && assignments.length === 0 && (
                <p className="assignment-list__empty">
                    No assignments found{activeCategory !== 'All' ? ` in ${activeCategory}` : ''}.
                </p>
            )}
        </div>
    );
};

export default AssignmentList;
