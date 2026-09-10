import { getDb, SCHEMA_VERSION, CACHE_STORE, type CacheRecord } from './indexed-db';

export const cacheRepository = {
  async get(key: string): Promise<CacheRecord | null> {
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readonly');
      const record = await tx.store.get(key);
      await tx.done;
      return record ?? null;
    } catch {
      return null;
    }
  },

  async set(record: Omit<CacheRecord, 'schemaVersion'>): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      const fullRecord: CacheRecord = {
        ...record,
        schemaVersion: SCHEMA_VERSION,
        updatedAt: record.updatedAt,
        lastSuccessfulFetchAt: record.lastSuccessfulFetchAt,
      };
      await tx.store.put(fullRecord);
      await tx.done;
    } catch {
    }
  },

  async getManyByAccount(accountId: string): Promise<CacheRecord[]> {
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readonly');
      const records = await tx.store.index('byAccount').getAll(accountId);
      await tx.done;
      return records;
    } catch {
      return [];
    }
  },

  async getManyByAccountAndResource(
    accountId: string,
    resourceType: string,
  ): Promise<CacheRecord[]> {
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readonly');
      const records = await tx.store
        .index('byAccountResource')
        .getAll([accountId, resourceType]);
      await tx.done;
      return records;
    } catch {
      return [];
    }
  },

  async del(key: string): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      await tx.store.delete(key);
      await tx.done;
    } catch {
    }
  },

  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      for (const key of keys) {
        await tx.store.delete(key);
      }
      await tx.done;
    } catch {
    }
  },

  async delAllByAccount(accountId: string): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      const keys = await tx.store.index('byAccount').getAllKeys(accountId);
      for (const key of keys) {
        await tx.store.delete(key);
      }
      await tx.done;
    } catch {
    }
  },

  async clear(): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch {
    }
  },
};

export async function purgeCache(): Promise<void> {
  await cacheRepository.clear();
}
