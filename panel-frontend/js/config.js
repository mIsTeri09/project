// ================================================================
// BREAD C2 - Konfigurasi Global
// ================================================================

// GANTI DENGAN URL BACKEND REPLIT KAMU (tanpa trailing slash)
export const API_BASE = 'https://nama-repl-mu.username.repl.co';

// WebSocket URL (wss:// untuk secure, atau ws:// jika http)
export const WS_URL = API_BASE.replace('http', 'ws') + '/socket.io/update';
