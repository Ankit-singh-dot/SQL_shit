import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManageAssignments.scss';

const API = import.meta.env.VITE_API_URL;

const ManageAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('cipherToken');
    const user = JSON.parse(localStorage.getItem('cipherUser') || '{}');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (user.role !== 'admin' && user.role !== 'teacher') {
            navigate('/');
            return;
        }
        fetchAssignments();
    }, [navigate]);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get(`${API}/admin/assignments`, { headers });
            setAssignments(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

        try {
            await axios.delete(`${API}/admin/assignments/${id}`, { headers });
            setAssignments((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            alert(err.response?.data?.error || 'Delete failed');
        }
    };

    if (loading) return <div className="manage__loading">Loading…</div>;
    if (error) return <div className="manage__error">{error}</div>;

    return (
        <div className="manage">
            <div className="manage__header">
                <h1>Manage Assignments</h1>
                <div className="manage__actions">
                    {user.role === 'admin' && (
                        <Link to="/admin" className="manage__btn manage__btn--outline">
                            ← Dashboard
                        </Link>
                    )}
                    {user.role === 'teacher' && (
                        <>
                            <Link to="/admin/tables" className="manage__btn manage__btn--outline">
                                📋 Manage Tables
                            </Link>
                            <Link to="/admin/assignments/new" className="manage__btn">
                                + New Assignment
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {assignments.length === 0 ? (
                <p className="manage__empty">
                    No assignments yet.{' '}
                    <Link to="/admin/assignments/new">Create one</Link>
                </p>
            ) : (
                <div className="manage__table-wrap">
                    <table className="manage__table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Difficulty</th>
                                <th>Content</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr key={a._id}>
                                    <td className="manage__title-cell">{a.title}</td>
                                    <td>
                                        <span className={`manage__badge manage__badge--${a.difficulty.toLowerCase()}`}>
                                            {a.difficulty}
                                        </span>
                                    </td>
                                    <td>{a.mcqs?.length || 0} MCQs, {a.codingQuestions?.length || 0} Queries</td>
                                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                                    <td className="manage__actions-cell">
                                        <Link
                                            to={`/admin/assignments/edit/${a._id}`}
                                            className="manage__action-btn"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            className="manage__action-btn manage__action-btn--danger"
                                            onClick={() => handleDelete(a._id, a.title)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageAssignments;
