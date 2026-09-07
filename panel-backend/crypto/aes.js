const crypto = require('crypto');

const AES_KEY = Buffer.from(process.env.AES_KEY || '0123456789abcdef0123456789abcdef', 'utf8');

function encryptPayload(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { iv: iv.toString('base64'), data: encrypted, timestamp: Date.now() };
}

function decryptPayload(payload) {
    const iv = Buffer.from(payload.iv, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);
    let decrypted = decipher.update(payload.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

module.exports = { encryptPayload, decryptPayload };
