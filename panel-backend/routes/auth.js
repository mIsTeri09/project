const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '48h' });
        res.json({ token, api_key: user.api_key, username: user.username });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
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

module.exports = router;
