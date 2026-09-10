import { apiClient, ApiError } from '../../api/client';
import { cacheRepository } from './cache.repository';
import {
  setOnline,
  setOffline,
  handleApiError,
  setUsingCachedData,
} from './network-state';
import type {
  OverviewData,
  Project,
  RevisionBatchSummary,
  RevisionBatchDetail,
} from '../../types/api';

export type ResourceType =
  | 'overview'
  | 'projects'
  | 'project'
  | 'project_batches'
  | 'batch';

export interface SwrOptions {
  force?: boolean;
}

function buildCacheKey(accountId: string, resourceType: string, resourceId?: string): string {
  if (resourceId) {
    return `${accountId}:${resourceType}:${resourceId}`;
  }
  return `${accountId}:${resourceType}`;
}

async function readCache<T>(accountId: string, resourceType: string, resourceId?: string): Promise<T | null> {
  const key = buildCacheKey(accountId, resourceType, resourceId);
  const record = await cacheRepository.get(key);
  if (!record) return null;
  try {
    const parsed = JSON.parse(record.data as string) as T;
    return parsed;
  } catch {
    await cacheRepository.del(key);
    return null;
  }
}

async function writeCache<T>(
  accountId: string,
  resourceType: string,
  data: T,
  resourceId?: string,
): Promise<void> {
  const key = buildCacheKey(accountId, resourceType, resourceId);
  const now = Date.now();
  await cacheRepository.set({
    key,
    accountId,
    resourceType,
    resourceId,
    data: JSON.stringify(data),
    updatedAt: now,
    lastSuccessfulFetchAt: now,
  });
}

export const swrService = {
  async fetchOverview(accountId: string, options: SwrOptions = {}): Promise<OverviewData> {
    const resourceType = 'overview';

    if (!options.force) {
      const cached = await readCache<OverviewData>(accountId, resourceType);
      if (cached) {
        setUsingCachedData(true);
      }
    }

    try {
      const data = await apiClient.overview.get();
      await writeCache(accountId, resourceType, data);
      setOnline();
      setUsingCachedData(false);
      return data;
    } catch (err) {
      const cached = await readCache<OverviewData>(accountId, resourceType);
      if (cached) {
        setUsingCachedData(true);
        handleApiError(err);
        return cached;
      }

      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setOffline();
      }

      throw err;
    }
  },

  async fetchProjects(accountId: string, options: SwrOptions = {}): Promise<Project[]> {
    const resourceType = 'projects';

    if (!options.force) {
      const cached = await readCache<{ projects: Project[] }>(accountId, resourceType);
      if (cached) {
        setUsingCachedData(true);
      }
    }

    try {
      const res = await apiClient.projects.list();
      await writeCache(accountId, resourceType, res);
      setOnline();
      setUsingCachedData(false);
      return res.projects;
    } catch (err) {
      const cached = await readCache<{ projects: Project[] }>(accountId, resourceType);
      if (cached) {
        setUsingCachedData(true);
        handleApiError(err);
        return cached.projects;
      }

      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setOffline();
      }

      throw err;
    }
  },

  async fetchProjectDetail(
    accountId: string,
    projectId: string,
    options: SwrOptions = {},
  ): Promise<Project> {
    const resourceType = 'project';

    if (!options.force) {
      const cached = await readCache<{ project: Project }>(accountId, resourceType, projectId);
      if (cached) {
        setUsingCachedData(true);
      }
    }

    try {
      const res = await apiClient.projects.getDetail(projectId);
      await writeCache(accountId, resourceType, res, projectId);
      setOnline();
      setUsingCachedData(false);
      return res.project;
    } catch (err) {
      const cached = await readCache<{ project: Project }>(accountId, resourceType, projectId);
      if (cached) {
        setUsingCachedData(true);
        handleApiError(err);
        return cached.project;
      }

      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setOffline();
      }

      throw err;
    }
  },

  async fetchProjectBatches(
    accountId: string,
    projectId: string,
    options: SwrOptions = {},
  ): Promise<RevisionBatchSummary[]> {
    const resourceType = 'project_batches';

    if (!options.force) {
      const cached = await readCache<{ batches: RevisionBatchSummary[] }>(
        accountId,
        resourceType,
        projectId,
      );
      if (cached) {
        setUsingCachedData(true);
      }
    }

    try {
      const res = await apiClient.projects.getBatches(projectId);
      await writeCache(accountId, resourceType, res, projectId);
      setOnline();
      setUsingCachedData(false);
      return res.batches;
    } catch (err) {
      const cached = await readCache<{ batches: RevisionBatchSummary[] }>(
        accountId,
        resourceType,
        projectId,
      );
      if (cached) {
        setUsingCachedData(true);
        handleApiError(err);
        return cached.batches;
      }

      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setOffline();
      }

      throw err;
    }
  },

  async fetchBatchDetail(
    accountId: string,
    batchId: string,
    options: SwrOptions = {},
  ): Promise<RevisionBatchDetail> {
    const resourceType = 'batch';

    if (!options.force) {
      const cached = await readCache<{ batch: RevisionBatchDetail }>(
        accountId,
        resourceType,
        batchId,
      );
      if (cached) {
        setUsingCachedData(true);
      }
    }

    try {
      const res = await apiClient.batches.getDetail(batchId);
      await writeCache(accountId, resourceType, res, batchId);
      setOnline();
      setUsingCachedData(false);
      return res.batch;
    } catch (err) {
      const cached = await readCache<{ batch: RevisionBatchDetail }>(
        accountId,
        resourceType,
        batchId,
      );
      if (cached) {
        setUsingCachedData(true);
        handleApiError(err);
        return cached.batch;
      }

      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setOffline();
      }

      throw err;
    }
  },

  async invalidateAccount(accountId: string): Promise<void> {
    await cacheRepository.delAllByAccount(accountId);
  },

  async invalidateResource(
    accountId: string,
    resourceType: ResourceType,
    resourceId?: string,
  ): Promise<void> {
    const key = buildCacheKey(accountId, resourceType, resourceId);
    await cacheRepository.del(key);
  },
};
