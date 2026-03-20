import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.scss';

const API = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('cipherUser') || '{}');
        if (user.role !== 'admin') {
            navigate('/');
            return;
        }

        const token = localStorage.getItem('cipherToken');
        axios
            .get(`${API}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setStats(res.data))
            .catch((err) => setError(err.response?.data?.error || 'Failed to load stats'))
            .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) return <div className="admin-dash__loading">Loading…</div>;
    if (error) return <div className="admin-dash__error">{error}</div>;

    return (
        <div className="admin-dash">
            <div className="admin-dash__header">
                <h1>Admin Dashboard</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/admin/assignments" className="admin-dash__btn">
                        Manage Assignments
                    </Link>
                    <Link to="/admin/tables" className="admin-dash__btn">
                        📋 Manage Tables
                    </Link>
                </div>
            </div>

            <div className="admin-dash__grid">
                <div className="admin-dash__card">
                    <span className="admin-dash__card-value">{stats.totalAssignments}</span>
                    <span className="admin-dash__card-label">Assignments</span>
                </div>
                <div className="admin-dash__card">
                    <span className="admin-dash__card-value">{stats.totalUsers}</span>
                    <span className="admin-dash__card-label">Users</span>
                </div>
                <div className="admin-dash__card">
                    <span className="admin-dash__card-value">{stats.totalAttempts}</span>
                    <span className="admin-dash__card-label">Total Attempts</span>
                </div>
                <div className="admin-dash__card">
                    <span className="admin-dash__card-value">{stats.successRate}%</span>
                    <span className="admin-dash__card-label">Success Rate</span>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
