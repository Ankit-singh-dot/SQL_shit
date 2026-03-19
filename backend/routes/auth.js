const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
    );
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        const user = await User.create({ username, email, password });
        const token = generateToken(user);

        res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
