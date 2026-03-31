import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.scss';

const API = import.meta.env.VITE_API_URL || 'https://sql-shit.vercel.app/api';

const Signup = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'user', 
        adminCode: '' 
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setForm({ ...form, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API}/auth/signup`, form);
            localStorage.setItem('cipherToken', res.data.token);
            localStorage.setItem('cipherUser', JSON.stringify(res.data.user));
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth">
            <form className="auth__form" onSubmit={handleSubmit}>
                <h1 className="auth__title">Sign Up</h1>
                <p className="auth__subtitle">Create an account to save your progress</p>

                {error && <div className="auth__error">{error}</div>}

                <div className="auth__roles">
                    <button 
                        type="button" 
                        className={`auth__role-btn ${form.role === 'user' ? 'auth__role-btn--active' : ''}`}
                        onClick={() => handleRoleSelect('user')}
                    >
                        Student
                    </button>
                    <button 
                        type="button" 
                        className={`auth__role-btn ${form.role === 'teacher' ? 'auth__role-btn--active' : ''}`}
                        onClick={() => handleRoleSelect('teacher')}
                    >
                        Teacher
                    </button>
                </div>

                <div className="auth__field">
                    <label className="auth__label" htmlFor="username">Username</label>
                    <input
                        id="username"
                        className="auth__input"
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        placeholder="Your username"
                    />
                </div>

                <div className="auth__field">
                    <label className="auth__label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        className="auth__input"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                    />
                </div>

                <div className="auth__field">
                    <label className="auth__label" htmlFor="password">Password</label>
                    <input
                        id="password"
                        className="auth__input"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                    />
                </div>

                {/* Secret Admin Field - reveals only if user types "admin" in username */}
                {form.username.toLowerCase() === 'admin' && (
                    <div className="auth__field">
                        <label className="auth__label" htmlFor="adminCode">Secret Admin Code</label>
                        <input
                            id="adminCode"
                            className="auth__input"
                            type="password"
                            name="adminCode"
                            value={form.adminCode}
                            onChange={handleChange}
                            placeholder="Enter the secret keyword"
                        />
                    </div>
                )}

                <button className="auth__submit" type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                </button>

                <p className="auth__footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;
