const mongoose = require('mongoose');
const { Pool } = require('pg');

let pgPool;

const connectMongo = async () => {
    await mongoose.connect(process.env.MONGO_URI);
};

const connectPG = () => {
    if (!pgPool) {
        pgPool = new Pool({
            connectionString: process.env.PG_URI,
        });
    }
    return pgPool;
};

const getPGPool = () => {
    if (!pgPool) {
        pgPool = new Pool({
            connectionString: process.env.PG_URI,
        });
    }
    return pgPool;
};

module.exports = { connectMongo, connectPG, getPGPool };
