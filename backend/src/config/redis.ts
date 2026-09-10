import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logStructured } from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    connectTimeout: 2000,
    retryStrategy(times) {
      // Exponential backoff with a cap of 3 seconds
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
  };

  redisClient = new Redis(env.REDIS_URL, options);

  redisClient.on('error', (err) => {
    // Avoid unhandled error crashes; log structured warning
    logStructured('warn', {
      event: 'REDIS_CLIENT_ERROR',
      error: err.message,
    });
  });

  redisClient.on('connect', () => {
    if (env.NODE_ENV !== 'test') {
      console.log('[REDIS] Connected successfully.');
    }
  });

  return redisClient;
}

export async function isRedisReady(): Promise<boolean> {
  if (!env.REDIS_ENABLED) return false;
  const client = getRedisClient();
  return client.status === 'ready' || client.status === 'connect';
}

export function setTestRedisClient(customClient: Redis | null): void {
  redisClient = customClient;
}
