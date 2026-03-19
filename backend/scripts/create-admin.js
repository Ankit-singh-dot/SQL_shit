/**
 * Create an admin user from the command line.
 * Usage: node scripts/create-admin.js <username> <email> <password>
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const createAdmin = async () => {
    const [,, username, email, password] = process.argv;

    if (!username || !email || !password) {
        console.error('Usage: node scripts/create-admin.js <username> <email> <password>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        let user = await User.findOne({ email });

        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`Updated existing user "${user.username}" to admin.`);
        } else {
            user = await User.create({ username, email, password, role: 'admin' });
            console.log(`Created admin user "${user.username}".`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

createAdmin();
