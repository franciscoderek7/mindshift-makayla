import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { logger } from './config/logger.mjs';

// Route imports
import authRoutes from './routes/auth.mjs';
import agentRoutes from './routes/agents.mjs';
import clientRoutes from './routes/clients.mjs';
import courseRoutes from './routes/courses.mjs';
import bookingRoutes from './routes/bookings.mjs';
import paymentRoutes from './routes/payments.mjs';
import webhookRoutes from './routes/webhooks.mjs';
import adminRoutes from './routes/admin.mjs';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.mjs';
import { rateLimiter } from './middleware/rateLimiter.mjs';

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// Redis Client
// ===========================================
let redisClient;
try {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => logger.warn('Redis connection error:', err.message));
  await redisClient.connect();
  logger.info('Redis connected');
} catch (err) {
  logger.warn('Redis unavailable — falling back to memory sessions:', err.message);
  redisClient = null;
}

// ===========================================
// Middleware Stack
// ===========================================
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// CORS — allow frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing — raw for Stripe webhooks, JSON for everything else
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
};

if (redisClient) {
  sessionConfig.store = new RedisStore({ client: redisClient });
}

app.use(session(sessionConfig));

// Rate limiting
app.use('/api/', rateLimiter);

// ===========================================
// Health Check
// ===========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mindshift-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    agents: {
      total: 8,
      active: 8,
      status: 'standby'
    }
  });
});

// ===========================================
// API Routes
// ===========================================
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);

// ===========================================
// 404 Handler
// ===========================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    docs: '/api/docs'
  });
});

// ===========================================
// Error Handler
// ===========================================
app.use(errorHandler);

// ===========================================
// Start Server
// ===========================================
app.listen(PORT, () => {
  logger.info(`MindShift API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  logger.info('8 agents on standby — awaiting activation');
});

export default app;
