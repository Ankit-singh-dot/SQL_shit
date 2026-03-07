const express = require('express');
const dotenv = require('dotenv');
const { connectMongo, connectPG } = require('./config/db');

dotenv.config();

const app = express();

// Manual CORS middleware (Express 5 compatible)
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});
app.use(express.json());

// Routes
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/execute', require('./routes/execute'));
app.use('/api/hint', require('./routes/hint'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attempts', require('./routes/attempts'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectMongo();
    console.log('MongoDB connected');

    const pgPool = connectPG();
    // Test PG connection
    const client = await pgPool.connect();
    console.log('PostgreSQL connected');
    client.release();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
