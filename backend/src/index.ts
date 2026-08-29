import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import sosRoutes from './routes/sos.routes';
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.dashboardOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/sos', sosRoutes);

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