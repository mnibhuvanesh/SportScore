import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env if present, otherwise fallback to defaults
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default('0.0.0.0'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  API_BASE_URL: z.string().default('http://localhost:5000/api/v1'),
  TRUSTED_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),

  // Database
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/sports_platform'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().default(50),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().default(5),

  // Redis
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  REDIS_KEY_PREFIX: z.string().default('sports:'),

  // Auth & Secrets
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_REMEMBER_ME_EXPIRES_IN: z.string().default('30d'),

  // Cookies
  COOKIE_SECRET: z.string().min(16),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  // Security thresholds
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  LOGIN_MAX_FAILED_ATTEMPTS: z.coerce.number().default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().default(15),
  PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES: z.coerce.number().default(30),
  INVITATION_TOKEN_EXPIRATION_DAYS: z.coerce.number().default(7),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(500),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),

  LOG_LEVEL: z.string().default('debug'),
  ADMIN_NAME: z.string().default('Platform Administrator'),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().optional().transform((val) => (val && val.trim().length >= 10 ? val.trim() : undefined)),
  DEMO_ADMIN_PASSWORD: z.string().optional().transform((val) => val?.trim() || undefined),
  DEMO_ORGANIZER_PASSWORD: z.string().optional().transform((val) => val?.trim() || undefined),
  DEMO_COACH_PASSWORD: z.string().optional().transform((val) => val?.trim() || undefined),
  DEMO_ATHLETE_PASSWORD: z.string().optional().transform((val) => val?.trim() || undefined),
  DEMO_SCORER_PASSWORD: z.string().optional().transform((val) => val?.trim() || undefined),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export const trustedOriginsList = env.TRUSTED_ORIGINS.split(',').map((o) => o.trim());
