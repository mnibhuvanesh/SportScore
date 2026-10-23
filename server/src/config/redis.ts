import Redis, { Redis as RedisClient } from 'ioredis';
import { env } from './env';

class MemoryRedisStore {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const val = current ? parseInt(current, 10) + 1 : 1;
    this.store.set(key, { value: val.toString() });
    return val;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    const results: string[] = [];
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        results.push(key);
      }
    }
    return results;
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    return 'OK';
  }
}

export type IRedis = RedisClient | MemoryRedisStore;

let redisClientInstance: IRedis;
let isRealRedis = false;

export function getRedisClient(): IRedis {
  if (redisClientInstance) {
    return redisClientInstance;
  }

  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying quickly in test/dev if offline
        return Math.min(times * 200, 1000);
      },
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis successfully');
      isRealRedis = true;
    });

    client.on('error', (err) => {
      if (!isRealRedis && env.NODE_ENV !== 'production') {
        // Suppress repeated logs if running in dev without Redis daemon
      } else {
        console.warn('⚠️ Redis connection warning:', err.message);
      }
    });

    redisClientInstance = client;
    return client;
  } catch (err) {
    console.warn('⚠️ Falling back to memory Redis adapter:', err);
    redisClientInstance = new MemoryRedisStore();
    return redisClientInstance;
  }
}

export function isUsingRealRedis(): boolean {
  return isRealRedis;
}
