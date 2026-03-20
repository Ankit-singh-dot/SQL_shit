const express = require('express');
const dotenv = require('dotenv');
const { connectMongo, connectPG } = require('./config/db');

dotenv.config();

const app = express();

// Manual CORS middleware (Express 5 compatible)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4000',
    'https://sql-shit.vercel.app',
    'https://grand-puffpuff-04a88e.netlify.app',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});
app.use(express.json());

// Lazy DB connection middleware (connects once on first request)
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectMongo();
      connectPG();
      dbConnected = true;
    } catch (err) {
      console.error('DB connection error:', err.message);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }
  next();
});

// Routes
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/execute', require('./routes/execute'));
app.use('/api/hint', require('./routes/hint'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/compare', require('./routes/compare'));
app.use('/api/sandbox', require('./routes/sandbox'));
app.use('/api/certificate', require('./routes/certificate'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
