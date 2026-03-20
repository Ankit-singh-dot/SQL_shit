const router = require('express').Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// All bookmark routes require auth
router.use(auth);

// GET /api/bookmarks — get user's bookmarked assignments
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate(
            'bookmarks',
            'title description difficulty category'
        );
        res.json(user.bookmarks || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/bookmarks/:assignmentId — add bookmark
router.post('/:assignmentId', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (user.bookmarks.includes(req.params.assignmentId)) {
            return res.json({ message: 'Already bookmarked.' });
        }
        user.bookmarks.push(req.params.assignmentId);
        await user.save();
        res.status(201).json({ message: 'Bookmarked.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/bookmarks/:assignmentId — remove bookmark
router.delete('/:assignmentId', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.bookmarks = user.bookmarks.filter(
            (id) => id.toString() !== req.params.assignmentId
        );
        await user.save();
        res.json({ message: 'Bookmark removed.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
