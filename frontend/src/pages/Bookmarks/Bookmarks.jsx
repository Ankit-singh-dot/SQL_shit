import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Bookmarks.scss';

const API = import.meta.env.VITE_API_URL;

const Bookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const token = localStorage.getItem('cipherToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }

        axios
            .get(`${API}/bookmarks`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setBookmarks(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token, navigate]);

    const handleRemove = async (id) => {
        try {
            await axios.delete(`${API}/bookmarks/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBookmarks((prev) => prev.filter((b) => b._id !== id));
        } catch {}
    };

    if (loading) return <div className="bm__loading">Loading…</div>;

    return (
        <div className="bm">
            <div className="bm__header">
                <h1>♥ Bookmarks</h1>
                <p className="bm__subtitle">Your saved assignments</p>
            </div>

            {bookmarks.length === 0 ? (
                <p className="bm__empty">
                    No bookmarks yet. Click the ♡ icon on any assignment to save it here.
                </p>
            ) : (
                <div className="bm__grid">
                    {bookmarks.map((a) => (
                        <div key={a._id} className="bm__card">
                            <div className="bm__card-top">
                                <span className={`bm__badge bm__badge--${a.difficulty.toLowerCase()}`}>
                                    {a.difficulty}
                                </span>
                                {a.category && (
                                    <span className="bm__cat">{a.category}</span>
                                )}
                            </div>
                            <h2 className="bm__card-title">{a.title}</h2>
                            <p className="bm__card-desc">{a.description}</p>
                            <div className="bm__card-actions">
                                <Link to={`/assignment/${a._id}`} className="bm__card-btn">
                                    Solve →
                                </Link>
                                <button
                                    className="bm__card-remove"
                                    onClick={() => handleRemove(a._id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Bookmarks;
