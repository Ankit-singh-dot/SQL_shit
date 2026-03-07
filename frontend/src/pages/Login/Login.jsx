import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.scss';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API}/auth/login`, form);
            localStorage.setItem('cipherToken', res.data.token);
            localStorage.setItem('cipherUser', JSON.stringify(res.data.user));
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth">
            <form className="auth__form" onSubmit={handleSubmit}>
                <h1 className="auth__title">Login</h1>
                <p className="auth__subtitle">Sign in to save your progress</p>

                {error && <div className="auth__error">{error}</div>}

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
                        placeholder="Your password"
                    />
                </div>

                <button className="auth__submit" type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Login'}
                </button>

                <p className="auth__footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
