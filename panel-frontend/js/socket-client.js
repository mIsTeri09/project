// ================================================================
// BREAD C2 - WebSocket Client (Real-time)
// ================================================================

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

export function initSocket(url) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        return socket;
    }

    console.log('🔌 Connecting to WebSocket:', url);
    socket = new WebSocket(url);

    socket.onopen = () => {
        console.log('✅ WebSocket connected');
        reconnectAttempts = 0;
        // Kirim pesan register (opsional, karena backend sudah handle)
        // Bisa kirim token jika diperlukan
        socket.send(JSON.stringify({ type: 'register', token: localStorage.getItem('token') }));
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            // Handle berbagai tipe pesan dari server
            if (data.type === 'target_update') {
                // Emit event untuk app.js
                document.dispatchEvent(new CustomEvent('target_update', { detail: data }));
            } else if (data.type === 'command_result') {
                document.dispatchEvent(new CustomEvent('command_result', { detail: data }));
            } else {
                console.log('📨 WebSocket message:', data);
            }
        } catch (e) {
            console.warn('WebSocket message parse error:', e);
        }
    };

    socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };

    socket.onclose = () => {
        console.warn('🔴 WebSocket closed');
        if (reconnectAttempts < MAX_RECONNECT) {
            reconnectAttempts++;
            setTimeout(() => {
                console.log(`🔄 Reconnecting attempt ${reconnectAttempts}...`);
                initSocket(url);
            }, 3000 * reconnectAttempts);
        } else {
            console.error('❌ Max reconnect attempts reached.');
        }
    };

    return socket;
}

// Fungsi untuk mengirim perintah via WebSocket (jika dibutuhkan)
export function sendCommandViaSocket(command, targetUuid, params = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not ready, command will be sent via REST.');
        return false;
    }
    const payload = {
        type: 'command',
        target_uuid: targetUuid,
        command: command,
        params: params,
        token: localStorage.getItem('token')
    };
    socket.send(JSON.stringify(payload));
    return true;
}
