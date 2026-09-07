const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

router.post('/login', async (req, res) => {
    console.log('🔹 Login route hit'); // <-- LOG PERTAMA
    try {
        const { username, password } = req.body;
        console.log('📩 Received:', { username, password }); // <-- LOG BODY

        if (!username || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const db = getDb();
        if (!db) {
            console.log('❌ Database not initialized');
            return res.status(500).json({ error: 'Database not ready' });
        }

        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            console.log('❌ Invalid password for:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '48h' });
        console.log('✅ Login success for:', username);
        res.json({ token, api_key: user.api_key, username: user.username });
    } catch (e) {
        console.error('🔥 Login error:', e.message);
        console.error(e.stack);
        res.status(500).json({ error: 'Server error: ' + e.message });
    }
});

router.post('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (e) {
        res.status(401).json({ valid: false });
    }
});

console.log('✅ Auth routes loaded');
module.exports = router;
