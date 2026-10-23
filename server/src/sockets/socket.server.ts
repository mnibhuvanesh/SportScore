import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { env, trustedOriginsList } from '../config/env';
import { verifyAccessToken } from '../utils/security';
import { Match } from '../models/Match';

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: trustedOriginsList,
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // If Redis is configured, attach Redis adapter for multi-instance scaling
  try {
    const pubClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      console.warn('⚠️ Socket.IO pubClient Redis error:', err.message);
    });

    subClient.on('error', (err) => {
      console.warn('⚠️ Socket.IO subClient Redis error:', err.message);
    });

    Promise.all([
      new Promise<void>((resolve) => pubClient.once('ready', () => resolve())),
      new Promise<void>((resolve) => subClient.once('ready', () => resolve())),
    ])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('✅ Socket.IO Redis adapter connected');
      })
      .catch((err) => {
        console.warn('⚠️ Socket.IO Redis adapter setup failed:', err.message);
      });
  } catch (err) {
    console.warn('⚠️ Running standalone Socket.IO in-memory:', err);
  }

  // Socket middleware for optional auth (public scoreboards don't require auth, but private controls do)
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const payload = verifyAccessToken(token);
        (socket as any).user = payload;
      }
    } catch {
      // Allow unauthenticated connection for public spectator rooms
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    // Join tournament spectator room
    socket.on('join:tournament', (tournamentId: string) => {
      if (tournamentId) {
        socket.join(`tournament:${tournamentId}`);
      }
    });

    socket.on('leave:tournament', (tournamentId: string) => {
      if (tournamentId) {
        socket.leave(`tournament:${tournamentId}`);
      }
    });

    // Join specific match live scoring room
    socket.on('join:match', async (matchId: string) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);

      // Reconnection state reconciliation: immediately send latest match state
      try {
        const match = await Match.findById(matchId)
          .populate('homeTeamId', 'name code logoUrl')
          .populate('awayTeamId', 'name code logoUrl')
          .populate('venueId', 'name location');
        if (match) {
          socket.emit('match:state', match);
        }
      } catch (err) {
        console.error('Error fetching match state on join:', err);
      }
    });

    socket.on('leave:match', (matchId: string) => {
      if (matchId) {
        socket.leave(`match:${matchId}`);
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastMatchUpdate(matchId: string, eventName: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`match:${matchId}`).emit(eventName, data);
    if (data.tournamentId) {
      ioInstance.to(`tournament:${data.tournamentId}`).emit(eventName, data);
    }
  }
}
