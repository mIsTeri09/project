const express = require('express');
const router = express.Router();
const { getDb } = require('./db');

router.get('/:uuid', async (req, res) => {
    try {
        const db = getDb();
        const logs = await db.all(`
            SELECT * FROM logs WHERE target_uuid = ? ORDER BY timestamp DESC LIMIT 100
        `, [req.params.uuid]);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
