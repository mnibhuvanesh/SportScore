import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, trustedOriginsList } from './config/env';

// Import route modules
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import tournamentRoutes from './routes/tournament.routes';
import teamRoutes from './routes/team.routes';
import registrationRoutes from './routes/registration.routes';
import matchRoutes from './routes/match.routes';
import venueRoutes from './routes/venue.routes';
import sportRoutes from './routes/sport.routes';
import { SearchController } from './controllers/search.controller';
import { NotificationController } from './controllers/notification.controller';
import publicRoutes from './routes/public.routes';
import { authenticate } from './middleware/auth.middleware';

export const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by client or reverse proxy
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
      if (!origin || trustedOriginsList.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev convenience, or restrict
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// NoSQL Injection sanitization middleware: strips keys starting with $ or containing .
function sanitizeNoSQL(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeNoSQL);

  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Filter out operators like $gt, $where, etc.
    }
    clean[key] = sanitizeNoSQL(value);
  }
  return clean;
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeNoSQL(req.body);
  if (req.query) req.query = sanitizeNoSQL(req.query);
  next();
});

// API v1 Router
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// Mount resource routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/tournaments', tournamentRoutes);
apiRouter.use('/teams', teamRoutes);
apiRouter.use('/registrations', registrationRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/venues', venueRoutes);
apiRouter.use('/sports', sportRoutes);
apiRouter.use('/public', publicRoutes);

// Global search route
apiRouter.get('/search', SearchController.globalSearch);

// Notifications routes
apiRouter.get('/notifications', authenticate, NotificationController.listNotifications);
apiRouter.patch('/notifications/:id/read', authenticate, NotificationController.markAsRead);
apiRouter.post('/notifications/read-all', authenticate, NotificationController.markAllAsRead);

// Mount under /api/v1
app.use('/api/v1', apiRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Requested resource does not exist' },
  });
});

// Global Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred'
      : err.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
});
