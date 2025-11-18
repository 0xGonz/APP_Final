import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { PrismaClient } from '@prisma/client';

// Import routes
import clinicsRouter from './controllers/clinics.js';
import financialsRouter from './controllers/financials.js';
import metricsRouter from './controllers/metrics.js';
import exportRouter from './controllers/export.js';
import systemRouter from './controllers/system.js';
import uploadRouter from './routes/upload.js';

// Import WebSocket server
import { initializeWebSocket, closeAllConnections } from './websocket/server.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
// Supports multiple origins for development and production deployments
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);

    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      console.warn(`[CORS] Allowed origins: ${corsOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
}));

// Log CORS configuration on startup
console.log('[CORS] Allowed origins:', corsOrigins.join(', '));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint - Enhanced for deployment verification
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      corsOrigins: corsOrigins,
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/clinics', clinicsRouter);
app.use('/api/financials', financialsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/export', exportRouter);
app.use('/api/system', systemRouter);
app.use('/api/upload', uploadRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  closeAllConnections();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  closeAllConnections();
  await prisma.$disconnect();
  process.exit(0);
});

// Create HTTP server and initialize WebSocket
const server = http.createServer(app);
initializeWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 APP23 Financial Dashboard API`);
  console.log('='.repeat(60));
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`WebSocket server: ws://localhost:${PORT}/ws`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API base: http://localhost:${PORT}/api`);
  console.log('='.repeat(60));
});

export { prisma };
export default app;
