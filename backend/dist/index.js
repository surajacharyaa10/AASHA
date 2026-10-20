"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const sos_routes_1 = __importDefault(require("./routes/sos.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const teamRegistration_routes_1 = __importDefault(require("./routes/teamRegistration.routes"));
const dispatch_routes_1 = __importDefault(require("./routes/dispatch.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const weather_routes_1 = __importDefault(require("./routes/weather.routes"));
const disaster_routes_1 = __importDefault(require("./routes/disaster.routes"));
const resources_routes_1 = __importDefault(require("./routes/resources.routes"));
const news_routes_1 = __importDefault(require("./routes/news.routes"));
const investigation_routes_1 = __importDefault(require("./routes/investigation.routes"));
const sockets_1 = require("./sockets");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const sosWorker_1 = require("./workers/sosWorker");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [config_1.config.dashboardOrigin, 'http://localhost:3001'],
        methods: ['GET', 'POST']
    }
});
// Rate limiting — generous for file uploads
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: 'Too many requests from this IP'
});
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Allow Cloudinary CDN URLs to load
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));
// Handle preflight for all routes
app.options('*', (0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
app.use(limiter);
// Make io accessible to routes
app.set('io', io);
// Setup local uploads directory
const uploadsDir = path_1.default.join(__dirname, '../public/uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir));
// Routes
app.use('/api/sos', sos_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/team-registrations', teamRegistration_routes_1.default);
app.use('/api/dispatch', dispatch_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/weather', weather_routes_1.default);
app.use('/api/disasters', disaster_routes_1.default);
app.use('/api/resources', resources_routes_1.default);
app.use('/api/news', news_routes_1.default);
app.use('/api/investigations', investigation_routes_1.default);
// Root path handler
app.get('/', (req, res) => {
    res.json({
        message: 'Aasha BLE Mesh SOS Backend API',
        status: 'running',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            sos: '/api/sos'
        }
    });
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Socket.io setup
(0, sockets_1.setupSockets)(io);
// Start server
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        await (0, redis_1.connectRedis)();
        await (0, sosWorker_1.startSosWorker)();
        httpServer.listen(config_1.config.port, () => {
            console.log(`Backend server running on port ${config_1.config.port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
