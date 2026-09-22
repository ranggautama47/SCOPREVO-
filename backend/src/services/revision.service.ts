import { db } from '../config/database';
import { projectRepository } from '../repositories/project.repository';
import {
  revisionBatchRepository,
  revisionItemRepository,
} from '../repositories/revision.repository';
import { projectDocumentRepository } from '../repositories/project-document.repository';
import { aiService, type ByokOptions } from './ai.service';
import { aiQuotaService } from './aiQuota.service';
import { NotFoundError, ConflictError, ByokAuthFailedError } from '../middleware/error.middleware';
import { env } from '../config/env';
import { RevisionBatchRow, RevisionItemRow, ProjectDocumentRow } from '../types/db.types';
import { cacheService } from './cache.service';

export interface RevisionItemDTO {
  id: string;
  description: string;
  category: string | null;
  scopeStatus: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'NEEDS_REVIEW';
  reason: string | null;
}

export interface ResolveItemScopeResult {
  item: RevisionItemDTO;
}

export interface RevisionBatchDetailDTO {
  id: string;
  projectId: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'APPROVED';
  summary: string | null;
  items: RevisionItemDTO[];
  magicToken?: string;
}

export interface RevisionBatchListDTO {
  id: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'APPROVED';
  createdAt: Date;
  itemCount: number;
}

const BATCH_LIST_TTL = 60;
const BATCH_DETAIL_TTL = 60;

function toBatchDetailDTO(batch: RevisionBatchRow, items: RevisionItemRow[]): RevisionBatchDetailDTO {
  return {
    id: batch.id,
    projectId: batch.project_id,
    status: batch.status,
    summary: batch.ai_summary,
    ...(batch.status === 'PENDING_CONFIRMATION' && batch.magic_token
      ? { magicToken: batch.magic_token }
      : {}),
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      category: item.category,
      scopeStatus: item.scope_status,
      reason: item.reason,
    })),
  };
}

function toBatchListDTO(batch: RevisionBatchRow & { item_count: string }): RevisionBatchListDTO {
  return {
    id: batch.id,
    status: batch.status,
    createdAt: batch.created_at,
    itemCount: parseInt(batch.item_count, 10),
  };
}

async function buildDocumentContext(projectId: string): Promise<string> {
  const docs = await projectDocumentRepository.listByProjectId(projectId);
  const completed = docs
    .filter((d: ProjectDocumentRow) => d.extraction_status === 'completed' && d.extracted_text !== null)
    .sort((a: ProjectDocumentRow, b: ProjectDocumentRow) => a.created_at.getTime() - b.created_at.getTime());

  if (completed.length === 0) return '';

  const parts: string[] = [];
  let totalChars = 0;
  for (const doc of completed) {
    const text = doc.extracted_text ?? '';
    const truncated = text.slice(0, 8_000);
    if (totalChars + truncated.length > 24_000) {
      const remaining = 24_000 - totalChars;
      if (remaining > 0) {
        parts.push(`=== DOCUMENT: ${doc.filename} ===\n${truncated.slice(0, remaining)}`);
        totalChars += remaining;
      }
      break;
    }
    parts.push(`=== DOCUMENT: ${doc.filename} ===\n${truncated}`);
    totalChars += truncated.length;
  }

  return parts.join('\n\n');
}

export const revisionService = {
  async createBatch(
    projectId: string,
    accountId: string,
    rawInput: string,
    byok?: ByokOptions,
  ): Promise<RevisionBatchDetailDTO> {
    // 1. Verify project exists and belongs to the authenticated user
    const project = await projectRepository.findById(projectId);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Project not found.');
    }

    // 2. Completed-project guard: reject BEFORE quota check and BEFORE AI call
    if (project.status === 'COMPLETED') {
      throw new ConflictError(
        'PROJECT_COMPLETED',
        'Cannot create revision batch for a completed project. Reopen the project first.',
      );
    }

    // 3. Quota gate: check remaining revisions (only APPROVED batches count)
    const usedRevisions = await projectRepository.countApprovedBatches(projectId);
    const totalAllowed = project.total_allowed_revisions;
    const remaining = totalAllowed - usedRevisions;

    if (remaining <= 0) {
      throw new ConflictError(
        'QUOTA_EXHAUSTED',
        'No revision quota remaining.',
        { used: usedRevisions, allowed: totalAllowed, remaining: 0 }
      );
    }

    // 4. Server-side AI quota: consume 1 from monthly account limit BEFORE AI call
    //    Skip when BYOK is active - user's own key doesn't consume server quota
    if (!byok) {
      await aiQuotaService.consume(accountId);
    }

    // 5. Call AI service (validated schema and model fallback/retry)
    let context = '';
    if (env.ENABLE_PROJECT_CONTEXT) {
      try {
        context = await buildDocumentContext(projectId);
      } catch (err) {
        console.warn('[DOCUMENT CONTEXT] Failed to fetch documents, falling back to no-context AI call:', err);
      }
    }

    let aiResult: Awaited<ReturnType<typeof aiService.extractRevisions>>;
    try {
      aiResult = context
        ? await aiService.extractRevisions(rawInput, context, byok)
        : await aiService.extractRevisions(rawInput, undefined, byok);
    } catch (err) {
      if (err instanceof ByokAuthFailedError) {
        throw err;
      }
      console.warn('[AI] Primary/fallback failed, retrying without project context');
      aiResult = await aiService.extractRevisions(rawInput, undefined, byok);
    }

    // 6. Persist atomically using a PostgreSQL transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const batch = await revisionBatchRepository.createWithClient(client, {
        projectId,
        rawInput,
        aiSummary: aiResult.summary,
      });

      const items: RevisionItemRow[] = [];
      for (const itemData of aiResult.items) {
        const item = await revisionItemRepository.createWithClient(client, {
          revisionBatchId: batch.id,
          description: itemData.description,
          category: itemData.category,
          scopeStatus: itemData.scopeStatus,
          reason: itemData.reason,
        });
        items.push(item);
      }

      await client.query('COMMIT');

      // 6. Invalidate affected caches: project detail, project batches list, overview
      await cacheService.del(
        [
          cacheService.buildKey(accountId, 'project', projectId),
          cacheService.buildKey(accountId, 'project', `${projectId}:batches`),
          cacheService.buildKey(accountId, 'overview'),
        ],
        accountId,
      );

      return toBatchDetailDTO(batch, items);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async shareBatch(batchId: string, accountId: string): Promise<{ id: string; status: RevisionBatchDetailDTO['status']; magicToken: string }> {
    const batch = await revisionBatchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Revision batch not found.');
    }

    const project = await projectRepository.findById(batch.project_id);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Revision batch not found.');
    }

    if (project.status === 'COMPLETED') {
      throw new ConflictError(
        'PROJECT_COMPLETED',
        'Cannot share a batch for a completed project. Reopen the project first.',
      );
    }

    if (batch.status !== 'DRAFT') {
      throw new ConflictError('INVALID_STATE', 'Batch is not in DRAFT status.');
    }

    const unresolvedCount = await revisionItemRepository.countUnresolvedScopeItems(batchId);
    if (unresolvedCount > 0) {
      throw new ConflictError('UNRESOLVED_SCOPE_ITEMS', 'Resolve all NEEDS_REVIEW items before sharing.');
    }

    const updatedBatch = await revisionBatchRepository.transitionStatus(
      batchId,
      'DRAFT',
      'PENDING_CONFIRMATION',
    );
    if (!updatedBatch) {
      const currentBatch = await revisionBatchRepository.findById(batchId);
      if (currentBatch && currentBatch.status !== 'DRAFT') {
        throw new ConflictError('INVALID_STATE', 'Batch is not in DRAFT status.');
      }
      throw new NotFoundError('Revision batch not found.');
    }

    // Invalidate caches: batch detail, project batches list, overview
    await cacheService.del(
      [
        cacheService.buildKey(accountId, 'batch', batchId),
        cacheService.buildKey(accountId, 'project', `${batch.project_id}:batches`),
        cacheService.buildKey(accountId, 'overview'),
      ],
      accountId,
    );

    return {
      id: updatedBatch.id,
      status: updatedBatch.status,
      magicToken: updatedBatch.magic_token,
    };
  },

  async resolveItemScope(
    batchId: string,
    itemId: string,
    accountId: string,
    scopeStatus: RevisionItemDTO['scopeStatus'],
    reason?: string,
  ): Promise<ResolveItemScopeResult> {
    const batch = await revisionBatchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Revision batch not found.');
    }

    const project = await projectRepository.findById(batch.project_id);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Revision batch not found.');
    }

    if (project.status === 'COMPLETED') {
      throw new ConflictError(
        'PROJECT_COMPLETED',
        'Cannot resolve scope for a completed project. Reopen the project first.',
      );
    }

    if (batch.status !== 'DRAFT' && batch.status !== 'PENDING_CONFIRMATION') {
      throw new ConflictError('INVALID_STATE', 'Batch is not in a resolvable status.');
    }

    const item = await revisionItemRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Revision item not found.');
    }

    if (item.revision_batch_id !== batchId) {
      throw new NotFoundError('Revision item not found.');
    }

    if (item.scope_status !== 'NEEDS_REVIEW') {
      throw new ConflictError('INVALID_STATE', 'Item already resolved');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      let reasonToStore: string | null = null;
      if (scopeStatus === 'OUT_OF_SCOPE') {
        if (!reason || reason.trim().length === 0) {
          throw new ConflictError('VALIDATION_ERROR', 'Reason is required for OUT_OF_SCOPE.');
        }
        reasonToStore = reason.trim();
      } else if (scopeStatus === 'IN_SCOPE') {
        reasonToStore = null;
      }

      const updatedItem = await revisionItemRepository.updateScopeWithClient(
        client,
        itemId,
        scopeStatus,
        reasonToStore,
      );
      if (!updatedItem) {
        throw new ConflictError('INVALID_STATE', 'Item already resolved by another session');
      }

      await client.query('COMMIT');

      // Invalidate batch detail cache
      await cacheService.del(
        cacheService.buildKey(accountId, 'batch', batchId),
        accountId,
      );

      return {
        item: {
          id: updatedItem.id,
          description: updatedItem.description,
          category: updatedItem.category,
          scopeStatus: updatedItem.scope_status,
          reason: updatedItem.reason,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async confirmBatch(magicToken: string): Promise<{ id: string; status: RevisionBatchDetailDTO['status'] }> {
    const batch = await revisionBatchRepository.findByMagicToken(magicToken);
    if (!batch) {
      throw new NotFoundError('Revision batch not found.');
    }

    if (batch.status !== 'PENDING_CONFIRMATION') {
      throw new ConflictError('INVALID_STATE', 'Batch is not pending confirmation.');
    }

    const unresolvedCount = await revisionItemRepository.countUnresolvedScopeItems(batch.id);
    if (unresolvedCount > 0) {
      throw new ConflictError('UNRESOLVED_SCOPE_ITEMS', 'Resolve all NEEDS_REVIEW items before confirmation.');
    }

    const updatedBatch = await revisionBatchRepository.transitionStatus(
      batch.id,
      'PENDING_CONFIRMATION',
      'APPROVED',
    );
    if (!updatedBatch) {
      const currentBatch = await revisionBatchRepository.findByMagicToken(magicToken);
      if (currentBatch && currentBatch.status !== 'PENDING_CONFIRMATION') {
        throw new ConflictError('INVALID_STATE', 'Batch is not pending confirmation.');
      }
      throw new NotFoundError('Revision batch not found.');
    }

    // Lookup project to find account_id for invalidating tenant cache
    const project = await projectRepository.findById(batch.project_id);
    if (project) {
      await cacheService.del(
        [
          cacheService.buildKey(project.account_id, 'batch', batch.id),
          cacheService.buildKey(project.account_id, 'project', project.id),
          cacheService.buildKey(project.account_id, 'project', `${project.id}:batches`),
          cacheService.buildKey(project.account_id, 'overview'),
        ],
        project.account_id,
      );
    }

    return {
      id: updatedBatch.id,
      status: updatedBatch.status,
    };
  },

  async getBatchDetail(batchId: string, accountId: string): Promise<RevisionBatchDetailDTO> {
    const cacheKey = cacheService.buildKey(accountId, 'batch', batchId);
    const cached = await cacheService.get<RevisionBatchDetailDTO>(cacheKey, accountId);
    if (cached) {
      return cached;
    }

    const batch = await revisionBatchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Revision batch not found.');
    }

    const project = await projectRepository.findById(batch.project_id);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Revision batch not found.');
    }

    const items = await revisionItemRepository.findAllByBatchId(batchId);
    const dto = toBatchDetailDTO(batch, items);

    await cacheService.set(cacheKey, dto, BATCH_DETAIL_TTL, accountId);
    return dto;
  },

  async listBatchesByProjectId(projectId: string, accountId: string): Promise<RevisionBatchListDTO[]> {
    // 1. Verify project ownership FIRST
    const project = await projectRepository.findById(projectId);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Project not found.');
    }

    const cacheKey = cacheService.buildKey(accountId, 'project', `${projectId}:batches`);
    const cached = await cacheService.get<RevisionBatchListDTO[]>(cacheKey, accountId);
    if (cached) {
      return cached;
    }

    // Query batches with item count using LEFT JOIN - no N+1
    const result = await db.query<RevisionBatchRow & { item_count: string }>(
      `SELECT
         rb.id, rb.project_id, rb.raw_input, rb.ai_summary, rb.status, rb.magic_token, rb.created_at,
         COUNT(ri.id)::text AS item_count
       FROM revision_batch rb
       LEFT JOIN revision_item ri ON ri.revision_batch_id = rb.id
       WHERE rb.project_id = $1
       GROUP BY rb.id
       ORDER BY rb.created_at DESC`,
      [projectId]
    );

    const dtoList = result.rows.map(toBatchListDTO);
    await cacheService.set(cacheKey, dtoList, BATCH_LIST_TTL, accountId);
    return dtoList;
  },
};
