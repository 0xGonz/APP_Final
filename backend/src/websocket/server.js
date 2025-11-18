import { WebSocketServer } from 'ws';
import logger from '../config/logger.js';

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
    logger.info(`WebSocket client connected: ${clientId}`);
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to upload progress service',
      timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug(`Received message from ${clientId}:`, data);

        // Echo back or handle specific message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        logger.error(`Error parsing WebSocket message: ${error.message}`);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${clientId}`);
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}: ${error.message}`);
      clients.delete(ws);
    });
  });

  logger.info('WebSocket server initialized on path /ws');
}

/**
 * Broadcast upload progress to all connected clients
 * @param {Object} data - Progress data to broadcast
 */
export function broadcastUploadProgress(data) {
  if (!wss) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  });

  let sentCount = 0;
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN = 1
      try {
        client.send(message);
        sentCount++;
      } catch (error) {
        logger.error(`Error sending message to client: ${error.message}`);
      }
    }
  });

  logger.debug(`Broadcast message sent to ${sentCount} clients`);
}

/**
 * Get count of connected clients
 * @returns {number} Number of connected clients
 */
export function getConnectedClientsCount() {
  return clients.size;
}

/**
 * Close all WebSocket connections
 */
export function closeAllConnections() {
  clients.forEach((client) => {
    try {
      client.close(1000, 'Server shutting down');
    } catch (error) {
      logger.error(`Error closing client connection: ${error.message}`);
    }
  });
  clients.clear();

  if (wss) {
    wss.close(() => {
      logger.info('WebSocket server closed');
    });
  }
}
