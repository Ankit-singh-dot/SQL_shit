import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.scss';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('cipherUser');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('cipherToken');
        localStorage.removeItem('cipherUser');
        setUser(null);
        window.location.href = '/';
    };

    return (
        <nav className="navbar">
            <div className="navbar__container">
                <Link to="/" className="navbar__brand">
                    CipherSQLStudio
                </Link>

                <button
                    className="navbar__toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    ☰
                </button>

                <div className={`navbar__menu ${menuOpen ? 'navbar__menu--open' : ''}`}>
                    <Link to="/" className="navbar__link" onClick={() => setMenuOpen(false)}>
                        Assignments
                    </Link>
                    <Link to="/leaderboard" className="navbar__link" onClick={() => setMenuOpen(false)}>
                        🏆 Leaderboard
                    </Link>
                    <Link to="/sandbox" className="navbar__link" onClick={() => setMenuOpen(false)}>
                        🧪 Sandbox
                    </Link>
                    {user ? (
                        <>
                            <Link to="/bookmarks" className="navbar__link" onClick={() => setMenuOpen(false)}>
                                ♥ Bookmarks
                            </Link>
                            <Link to="/history" className="navbar__link" onClick={() => setMenuOpen(false)}>
                                📜 History
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="navbar__link navbar__link--admin" onClick={() => setMenuOpen(false)}>
                                    Admin
                                </Link>
                            )}
                            <Link to="/profile" className="navbar__link navbar__link--user" onClick={() => setMenuOpen(false)}>
                                {user.username}
                            </Link>
                            <button className="navbar__btn navbar__btn--outline" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="navbar__link" onClick={() => setMenuOpen(false)}>
                                Login
                            </Link>
                            <Link to="/signup" className="navbar__link" onClick={() => setMenuOpen(false)}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
