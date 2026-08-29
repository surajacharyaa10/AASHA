import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import sosRoutes from './routes/sos.routes';
import notificationRoutes from './routes/notification.routes';
import teamRegistrationRoutes from './routes/teamRegistration.routes';
import dispatchRoutes from './routes/dispatch.routes';
import analyticsRoutes from './routes/analytics.routes';
import { setupSockets } from './sockets';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { startSosWorker } from './workers/sosWorker';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.dashboardOrigin,
    methods: ['GET', 'POST']
  }
});

// Rate limiting — generous for file uploads
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Too many requests from this IP'
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow Cloudinary CDN URLs to load
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));
// Handle preflight for all routes
app.options('*', cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(limiter);

// Make io accessible to routes
app.set('io', io);

// Setup local uploads directory
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/sos', sosRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/team-registrations', teamRegistrationRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/analytics', analyticsRoutes);

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
setupSockets(io);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    await startSosWorker();

    httpServer.listen(config.port, () => {
      console.log(`Backend server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();