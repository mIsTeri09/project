// ================================================================
// BREAD C2 - Konfigurasi Global (Frontend)
// ================================================================

// 🔥 GANTI DENGAN URL RAILWAY BARU
export const API_BASE = 'https://project-production-82c9.up.railway.app';

// WebSocket URL (gunakan wss:// untuk secure)
export const WS_URL = API_BASE.replace('https', 'wss') + '/socket.io/update';

// Konfigurasi tambahan (opsional)
export const CONFIG = {
    heartbeatInterval: 15000,
    maxRetries: 3,
    timeout: 10000
};
