import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AssignmentList.scss';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const AssignmentList = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await axios.get(`${API}/assignments`);
                setAssignments(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load assignments');
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, []);

    if (loading) return <div className="assignment-list__loading">Loading assignments...</div>;
    if (error) return <div className="assignment-list__error">{error}</div>;

    return (
        <div className="assignment-list">
            <div className="assignment-list__header">
                <h1 className="assignment-list__title">SQL Assignments</h1>
                <p className="assignment-list__subtitle">
                    Select an assignment to practice your SQL skills
                </p>
            </div>

            <div className="assignment-list__grid">
                {assignments.map((a) => (
                    <Link to={`/assignment/${a._id}`} key={a._id} className="assignment-card">
                        <div className="assignment-card__header">
                            <span className={`assignment-card__badge assignment-card__badge--${a.difficulty.toLowerCase()}`}>
                                {a.difficulty}
                            </span>
                        </div>
                        <h2 className="assignment-card__title">{a.title}</h2>
                        <p className="assignment-card__desc">{a.description}</p>
                        <div className="assignment-card__footer">
                            <span className="assignment-card__action">Start →</span>
                        </div>
                    </Link>
                ))}
            </div>

            {assignments.length === 0 && (
                <p className="assignment-list__empty">No assignments available yet.</p>
            )}
        </div>
    );
};

export default AssignmentList;
