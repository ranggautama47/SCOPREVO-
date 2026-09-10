import { getRedisClient, isRedisReady } from '../config/redis';
import { logStructured } from '../utils/logger';

export interface CacheOptions {
  ttlSeconds: number;
}

export const cacheService = {
  /**
   * Generates a tenant-isolated cache key.
   */
  buildKey(accountId: string, resource: string, identifier?: string): string {
    if (identifier) {
      return `scoprevo:cache:account:${accountId}:${resource}:${identifier}`;
    }
    return `scoprevo:cache:account:${accountId}:${resource}`;
  },

  /**
   * Retrieves an item from cache. Safely falls back to null if Redis is unavailable or on error.
   */
  async get<T>(key: string, accountId?: string): Promise<T | null> {
    try {
      const ready = await isRedisReady();
      if (!ready) return null;

      const client = getRedisClient();
      const raw = await client.get(key);
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw) as T;
        return parsed;
      } catch (deserializationError) {
        logStructured('warn', {
          event: 'CACHE_DESERIALIZATION_ERROR',
          accountId,
          error: (deserializationError as Error).message,
          details: { key },
        });
        // Evict corrupted entry safely
        await client.del(key).catch(() => {});
        return null;
      }
    } catch (err) {
      logStructured('warn', {
        event: 'CACHE_REDIS_ERROR',
        operation: 'GET',
        accountId,
        error: (err as Error).message,
        details: { key },
      });
      return null;
    }
  },

  /**
   * Stores an item in cache with TTL. Safely catches errors if Redis is unavailable.
   */
  async set<T>(key: string, value: T, ttlSeconds: number, accountId?: string): Promise<void> {
    try {
      const ready = await isRedisReady();
      if (!ready) return;

      const client = getRedisClient();
      const raw = JSON.stringify(value);
      await client.set(key, raw, 'EX', ttlSeconds);
    } catch (err) {
      logStructured('warn', {
        event: 'CACHE_REDIS_ERROR',
        operation: 'SET',
        accountId,
        error: (err as Error).message,
        details: { key },
      });
    }
  },

  /**
   * Deletes specific cache keys.
   */
  async del(keys: string | string[], accountId?: string): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length === 0) return;

    try {
      const ready = await isRedisReady();
      if (!ready) return;

      const client = getRedisClient();
      await client.del(...keyArray);
    } catch (err) {
      logStructured('warn', {
        event: 'CACHE_INVALIDATION_ERROR',
        accountId,
        error: (err as Error).message,
        details: { keys: keyArray },
      });
    }
  },

  /**
   * Helper to invalidate multiple account-scoped resources deterministically.
   */
  async invalidateAccountResources(accountId: string, resources: string[]): Promise<void> {
    const keys = resources.map((r) => `scoprevo:cache:account:${accountId}:${r}`);
    await this.del(keys, accountId);
  },
};
