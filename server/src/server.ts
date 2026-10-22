import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { initSocketServer } from './sockets/socket.server';
import { SchedulingService } from './services/scheduling.service';

const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

// Periodic background job to recover expired pending bookings
const cleanupInterval = setInterval(async () => {
  try {
    await SchedulingService.cleanupExpiredPendingBookings();
  } catch (err) {
    // Suppress background errors
  }
}, 5 * 60 * 1000);

async function startServer() {
  try {
    await connectDatabase();
    getRedisClient();

    server.listen(env.PORT, env.HOST, () => {
      console.log(`🚀 Sports Management Platform Server running on http://${env.HOST}:${env.PORT}`);
      console.log(`📡 REST API endpoint: http://${env.HOST}:${env.PORT}/api/v1`);
      console.log(`⚙️  Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  clearInterval(cleanupInterval);

  server.close(async () => {
    console.log('HTTP and WebSocket servers closed.');
    try {
      await disconnectDatabase();
      const redis = getRedisClient();
      await redis.quit();
      console.log('Database and Redis connections closed. Exiting process.');
      process.exit(0);
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    console.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default server;
