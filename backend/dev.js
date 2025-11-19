import http from 'http';
import app, { prisma } from './src/server.js';
import { initializeWebSocket, closeAllConnections } from './src/websocket/server.js';

const PORT = process.env.PORT || 3001;

// Create HTTP server and initialize WebSocket
const server = http.createServer(app);
initializeWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 APP23 Financial Dashboard API - LOCAL DEV`);
  console.log('='.repeat(60));
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`WebSocket server: ws://localhost:${PORT}/ws`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API base: http://localhost:${PORT}/api`);
  console.log('='.repeat(60));
});

// Enhanced graceful shutdown for local dev
const shutdown = async () => {
  console.log('\n\nShutting down gracefully...');
  closeAllConnections();
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
  console.log('Database disconnected');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
