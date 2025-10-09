require('dotenv').config();

// Validate environment variables before starting
const { validateEnvironment, getEnvironmentInfo } = require('./utils/env-validator');
validateEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { WebSocketServer } = require('ws');
const http = require('http');

const logger = require('./utils/logger');
const swaggerSpec = require('./utils/swagger');
const { initializeDatabase, closeDatabase } = require('./database/init');

// Routes
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const chatRoutes = require('./routes/chat');
const blogRoutes = require('./routes/blog');
const userRoutes = require('./routes/users');
const donationRoutes = require('./routes/donations');
const registrationRoutes = require('./routes/registration');
const messagesRoutes = require('./routes/messages');
const socialRoutes = require('./routes/social');
const forumCoreRoutes = require('./routes/forum-core');
const forumActionsRoutes = require('./routes/forum-actions');
const forumModerationRoutes = require('./routes/forum-moderation');
const forumAdminRoutes = require('./routes/forum-admin');
const healthRoutes = require('./routes/health');
const setupRoutes = require('./routes/setup');
const adminDiscordRoutes = require('./routes/admin-discord');
const featuresRoutes = require('./routes/features');
const adminFeaturesRoutes = require('./routes/admin-features');
const adminRegistrationRoutes = require('./routes/admin-registration');
const adminEmailRoutes = require('./routes/admin-email');
const userProfilesRoutes = require('./routes/user-profiles');
const forumSubscriptionsRoutes = require('./routes/forum-subscriptions');
const forumSearchRoutes = require('./routes/forum-search');
const adminAnalyticsRoutes = require('./routes/admin-analytics');
const adminScriptsRoutes = require('./routes/admin-scripts');
const moderatorRoutes = require('./routes/moderator');
const reputationLeaderboardRoutes = require('./routes/reputation-leaderboard');

// Services
const { startDiscordBot, stopDiscordBot } = require('./services/discord');
const rankExpirationService = require('./services/rankExpirationService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Database
initializeDatabase();

// Initialize Discord Bot (no-op if not configured)
(async () => { try { await startDiscordBot(); } catch (_) {} })();

// Initialize Rank Expiration Service
try {
  rankExpirationService.start();
  logger.info('✅ Rank expiration service initialized');
} catch (error) {
  logger.error('❌ Failed to start rank expiration service:', error);
}

// WebSocket Server for real-time chat
const wss = new WebSocketServer({ server, path: '/ws/chat' });
global.wss = wss;

// Optional: Sentry error tracking
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({ 
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development'
  });
  app.use(Sentry.Handlers.requestHandler());
  logger.info('✅ Sentry error tracking enabled');
}

// HTTP request logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev'));
}

app.use(helmet());

// CORS configuration - support multiple origins
const allowedOrigins = [
  process.env.CLIENT_URL || 'https://vonix.network',
  'https://vonix.network',
  'http://vonix.network',
  'https://api.vonix.network',
  'http://api.vonix.network',
  'https://localhost:3000',
  'http://localhost:3000',
  'http://vonix.network:3000',
  'http://localhost:3001',
  'https://localhost:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      logger.info(`CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      logger.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2000, // Reasonable limit for normal usage
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2000, // Increased from 500 to 2000 for authenticated users
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Keep login attempts low for security
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.use('/api/auth', generalLimiter, authRoutes);
app.use('/api/servers', generalLimiter, serverRoutes);
app.use('/api/chat', generalLimiter, chatRoutes);
app.use('/api/blog', generalLimiter, blogRoutes);
app.use('/api/users', authLimiter, userRoutes);
app.use('/api/donations', authLimiter, donationRoutes);
app.use('/api/registration', authRouteLimiter, registrationRoutes);
app.use('/api/messages', authLimiter, messagesRoutes);
app.use('/api/social', generalLimiter, socialRoutes);
app.use('/api/forum', generalLimiter, forumCoreRoutes);
app.use('/api/forum/actions', authLimiter, forumActionsRoutes);
app.use('/api/forum-mod', authLimiter, forumModerationRoutes);
app.use('/api/forum-admin', authLimiter, forumAdminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/admin/discord', authLimiter, adminDiscordRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/admin/features', authLimiter, adminFeaturesRoutes);
app.use('/api/admin/registration', authLimiter, adminRegistrationRoutes);
app.use('/api/admin/email', authLimiter, adminEmailRoutes);
app.use('/api/admin/analytics', authLimiter, adminAnalyticsRoutes);
app.use('/api/admin/scripts', authLimiter, adminScriptsRoutes);
app.use('/api/moderator', authLimiter, moderatorRoutes);
app.use('/api/user-profiles', generalLimiter, userProfilesRoutes);
app.use('/api/forum/subscriptions', authLimiter, forumSubscriptionsRoutes);
app.use('/api/forum/search', generalLimiter, forumSearchRoutes);
app.use('/api/reputation', generalLimiter, reputationLeaderboardRoutes);

// Legacy health endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  logger.info(`WebSocket client connected from: ${clientIp}`);
  logger.debug(`Total WebSocket clients: ${wss.clients.size}`);

  // Send a welcome message to confirm connection
  ws.send(JSON.stringify({
    id: 0,
    author_name: 'System',
    author_avatar: 'https://ui-avatars.com/api/?name=System&background=6366f1&color=fff',
    content: 'Connected to Vonix.Network chat!',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    logger.debug(`WebSocket message received from ${clientIp}: ${message.toString().substring(0, 100)}`);
  });

  ws.on('error', (error) => {
    logger.error(`WebSocket client error from ${clientIp}:`, error);
  });

  ws.on('close', () => {
    logger.info(`WebSocket client disconnected from: ${clientIp}`);
    logger.debug(`Remaining WebSocket clients: ${wss.clients.size}`);
  });
});

// Broadcast function for Discord messages
global.broadcastChatMessage = (message) => {
  const WebSocket = require('ws');
  const clientCount = Array.from(wss.clients).filter(c => c.readyState === WebSocket.OPEN).length;
  logger.info(`Broadcasting chat message to ${clientCount} connected clients`);
  logger.debug(`Message details: ${JSON.stringify(message)}`);
  
  let sentCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        logger.error('Error sending message to WebSocket client:', error);
      }
    }
  });
  logger.debug(`Successfully broadcast to ${sentCount} clients`);
};

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling (must be last)
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const errorResponse = {
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message
  };
  
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  const envInfo = getEnvironmentInfo();
  
  logger.info('='.repeat(60));
  logger.info('🚀 Vonix Network Server Started');
  logger.info('='.repeat(60));
  logger.info(`Environment: ${envInfo.nodeEnv}`);
  logger.info(`Port: ${PORT}`);
  logger.info(`API: http://localhost:${PORT}/api`);
  logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`Health: http://localhost:${PORT}/api/health`);
  logger.info(`WebSocket: ws://localhost:${PORT}/ws/chat`);
  logger.info(`Client URL: ${envInfo.clientUrl}`);
  logger.info(`Discord: ${envInfo.hasDiscord ? 'Enabled' : 'Disabled'}`);
  logger.info(`Sentry: ${envInfo.hasSentry ? 'Enabled' : 'Disabled'}`);
  logger.info('='.repeat(60));
  
  // Console output for visibility on startup
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🌐 Server ready at http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs\n`);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close WebSocket connections
    wss.clients.forEach((client) => {
      client.close();
    });
    logger.info('WebSocket connections closed');
    
    // Close database
    closeDatabase();
    
    // Close Discord bot
    (async () => { try { await stopDiscordBot(); logger.info('Discord bot disconnected'); } catch (_) {} })();
    
    // Stop rank expiration service
    try {
      rankExpirationService.stop();
      logger.info('Rank expiration service stopped');
    } catch (error) {
      logger.error('Error stopping rank expiration service:', error);
    }
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection in production, just log it
  if (process.env.NODE_ENV !== 'production') {
    gracefulShutdown('unhandledRejection');
  }
});
