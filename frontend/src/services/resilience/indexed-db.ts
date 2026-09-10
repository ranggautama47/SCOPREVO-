import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const SCHEMA_VERSION = 1;
export const DB_NAME = 'scoprevo_client_db';
export const CACHE_STORE = 'resource_cache';

export interface CacheRecord {
  key: string;
  accountId: string;
  resourceType: string;
  resourceId?: string;
  data: unknown;
  updatedAt: number;
  lastSuccessfulFetchAt: number;
  schemaVersion: number;
}

interface ScoprevoDB extends DBSchema {
  [CACHE_STORE]: {
    key: string;
    value: CacheRecord;
    indexes: {
      byAccount: string;
      byAccountResource: [string, string];
    };
  };
}

let _db: IDBPDatabase<ScoprevoDB> | null = null;

export async function getDb(): Promise<IDBPDatabase<ScoprevoDB>> {
  if (_db) return _db;

  _db = await openDB<ScoprevoDB>(DB_NAME, SCHEMA_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      store.createIndex('byAccount', 'accountId');
      store.createIndex('byAccountResource', ['accountId', 'resourceType']);
    },
  });

  return _db;
}

export async function resetDb(): Promise<void> {
  if (_db) {
    _db.close();
    _db = null;
  }
  const db = await getDb();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  await tx.store.clear();
  await tx.done;
}
