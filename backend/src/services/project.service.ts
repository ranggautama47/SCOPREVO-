import { db } from '../config/database';
import { projectRepository, ProjectWithQuota } from '../repositories/project.repository';
import { revisionBatchRepository } from '../repositories/revision.repository';
import { projectDocumentRepository } from '../repositories/project-document.repository';
import { deleteDocumentObject } from './storage.service';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.schema';
import { ProjectStatus } from '../types/db.types';
import { cacheService } from './cache.service';

export interface ProjectDTO {
  id: string;
  accountId: string;
  name: string;
  clientName: string;
  totalAllowedRevisions: number;
  usedRevisions: number;
  remainingRevisions: number;
  status: ProjectStatus;
  createdAt: Date;
}

const PROJECT_LIST_TTL = 30; // 30 seconds
const PROJECT_DETAIL_TTL = 60; // 60 seconds

function toDTO(row: ProjectWithQuota): ProjectDTO {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    clientName: row.client_name,
    totalAllowedRevisions: row.total_allowed_revisions,
    usedRevisions: row.used_revisions,
    remainingRevisions: row.remaining_revisions,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const projectService = {
  async createProject(accountId: string, input: CreateProjectInput): Promise<ProjectDTO> {
    const row = await projectRepository.create({
      accountId,
      name: input.name,
      clientName: input.clientName,
      totalAllowedRevisions: input.totalAllowedRevisions,
    });

    // Invalidate affected caches: projects list and overview
    await cacheService.invalidateAccountResources(accountId, ['projects', 'overview']);

    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      clientName: row.client_name,
      totalAllowedRevisions: row.total_allowed_revisions,
      usedRevisions: 0,
      remainingRevisions: row.total_allowed_revisions,
      status: row.status,
      createdAt: row.created_at,
    };
  },

  async listProjects(accountId: string): Promise<ProjectDTO[]> {
    const cacheKey = cacheService.buildKey(accountId, 'projects');
    const cached = await cacheService.get<ProjectDTO[]>(cacheKey, accountId);
    if (cached) {
      return cached;
    }

    const rows = await projectRepository.findAllByAccountId(accountId);
    const result = rows.map(toDTO);

    await cacheService.set(cacheKey, result, PROJECT_LIST_TTL, accountId);
    return result;
  },

  async getProject(projectId: string, accountId: string): Promise<ProjectDTO> {
    // 1. Authorization: Fetch metadata or project from DB to verify ownership FIRST
    const cacheKey = cacheService.buildKey(accountId, 'project', projectId);
    const cached = await cacheService.get<ProjectDTO>(cacheKey, accountId);
    if (cached) {
      // Re-verify that cached object matches authorized accountId
      if (cached.accountId === accountId) {
        return cached;
      }
    }

    const row = await projectRepository.findById(projectId);
    if (!row) throw new NotFoundError('Project not found.');
    if (row.account_id !== accountId) throw new NotFoundError('Project not found.');

    const dto = toDTO(row);
    await cacheService.set(cacheKey, dto, PROJECT_DETAIL_TTL, accountId);
    return dto;
  },

  async updateProject(
    projectId: string,
    accountId: string,
    input: UpdateProjectInput,
  ): Promise<ProjectDTO> {
    const existing = await projectRepository.findById(projectId);
    if (!existing) throw new NotFoundError('Project not found.');
    if (existing.account_id !== accountId) throw new NotFoundError('Project not found.');

    // Handle status transition (if requested)
    if (input.status !== undefined) {
      await transitionStatus(existing, input.status);
    }

    // Apply non-status updates (name, clientName, totalAllowedRevisions), if any
    const hasFieldUpdates =
      input.name !== undefined ||
      input.clientName !== undefined ||
      input.totalAllowedRevisions !== undefined;
    if (hasFieldUpdates) {
      const updated = await projectRepository.update(projectId, {
        name: input.name,
        clientName: input.clientName,
        totalAllowedRevisions: input.totalAllowedRevisions,
      });
      if (!updated) throw new NotFoundError('Project not found after update.');
    }

    const refreshed = await projectRepository.findById(projectId);
    if (!refreshed) throw new NotFoundError('Project not found.');
    const result = toDTO(refreshed);

    // Invalidate affected caches: project detail, projects list, and overview
    await cacheService.del(
      [
        cacheService.buildKey(accountId, 'project', projectId),
        cacheService.buildKey(accountId, 'projects'),
        cacheService.buildKey(accountId, 'overview'),
      ],
      accountId,
    );

    return result;
  },

  async deleteProject(projectId: string, accountId: string): Promise<void> {
    const existing = await projectRepository.findById(projectId);
    if (!existing) throw new NotFoundError('Project not found.');
    if (existing.account_id !== accountId) throw new NotFoundError('Project not found.');

    // 1. Read storage paths BEFORE DB transaction (for post-commit cleanup)
    const storagePaths = await projectDocumentRepository.listStoragePathsByProjectId(projectId);

    // 2. DB transaction: delete items → batches → documents → project
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await revisionBatchRepository.deleteAllItemsForProjectWithClient(client, projectId);
      await revisionBatchRepository.deleteAllBatchesForProjectWithClient(client, projectId);
      await projectDocumentRepository.deleteAllForProjectWithClient(client, projectId);
      const deleted = await projectRepository.deleteWithClient(client, projectId);
      if (!deleted) {
        await client.query('ROLLBACK');
        throw new NotFoundError('Project not found.');
      }
      await client.query('COMMIT');
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore rollback errors */
      }
      throw err;
    } finally {
      client.release();
    }

    // 3. Post-commit storage cleanup (Case C: log but don't fail)
    if (storagePaths.length > 0) {
      for (const storagePath of storagePaths) {
        try {
          await deleteDocumentObject(storagePath);
        } catch (err) {
          console.error(
            `[STORAGE_CLEANUP_FAILED] projectId=${projectId} storagePath=${storagePath} error=${(err as Error).message}`,
          );
        }
      }
    }

    // 4. Invalidate affected caches: project detail, projects list, overview, project batches
    await cacheService.del(
      [
        cacheService.buildKey(accountId, 'project', projectId),
        cacheService.buildKey(accountId, 'projects'),
        cacheService.buildKey(accountId, 'overview'),
        cacheService.buildKey(accountId, 'project', `${projectId}:batches`),
      ],
      accountId,
    );
  },
};

/**
 * Internal helper: validates and executes a status transition.
 * Throws NotFoundError on ownership mismatch (anti-enumeration).
 * Throws ConflictError on invalid transition or pending-batch guard.
 */
async function transitionStatus(
  existing: ProjectWithQuota,
  nextStatus: ProjectStatus,
): Promise<void> {
  const currentStatus: ProjectStatus = existing.status;

  // No-op transition: same status → just return without DB write
  if (currentStatus === nextStatus) return;

  if (nextStatus === 'COMPLETED') {
    if (currentStatus !== 'ACTIVE') {
      throw new ConflictError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${currentStatus} to COMPLETED.`,
      );
    }
    // Guard: PENDING_CONFIRMATION blocks completion
    const pendingCount = await projectRepository.countPendingConfirmationBatches(existing.id);
    if (pendingCount > 0) {
      throw new ConflictError(
        'PROJECT_HAS_PENDING_BATCH',
        'Cannot complete project while a batch is pending client confirmation.',
        { pendingConfirmationBatches: pendingCount },
      );
    }
    await projectRepository.updateStatus(existing.id, 'COMPLETED');
    return;
  }

  if (nextStatus === 'ACTIVE') {
    if (currentStatus !== 'COMPLETED') {
      throw new ConflictError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${currentStatus} to ACTIVE.`,
      );
    }
    await projectRepository.updateStatus(existing.id, 'ACTIVE');
    return;
  }

  // Should never reach here because of Zod enum, but guard for type-safety
  throw new ConflictError('INVALID_STATUS_TRANSITION', `Unsupported target status: ${nextStatus}.`);
}
