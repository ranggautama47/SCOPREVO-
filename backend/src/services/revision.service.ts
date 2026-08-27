import { db } from '../config/database';
import { projectRepository } from '../repositories/project.repository';
import {
  revisionBatchRepository,
  revisionItemRepository,
} from '../repositories/revision.repository';
import { aiService } from './ai.service';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';
import { RevisionBatchRow, RevisionItemRow } from '../types/db.types';

export interface RevisionItemDTO {
  id: string;
  description: string;
  category: string | null;
  scopeStatus: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'NEEDS_REVIEW';
  reason: string | null;
}

export interface RevisionBatchDetailDTO {
  id: string;
  projectId: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'APPROVED';
  summary: string | null;
  items: RevisionItemDTO[];
}

export interface RevisionBatchListDTO {
  id: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'APPROVED';
  createdAt: Date;
  itemCount: number;
}

function toBatchDetailDTO(batch: RevisionBatchRow, items: RevisionItemRow[]): RevisionBatchDetailDTO {
  return {
    id: batch.id,
    projectId: batch.project_id,
    status: batch.status,
    summary: batch.ai_summary,
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

export const revisionService = {
  async createBatch(
    projectId: string,
    accountId: string,
    rawInput: string,
  ): Promise<RevisionBatchDetailDTO> {
    // 1. Verify project exists and belongs to the authenticated user
    const project = await projectRepository.findById(projectId);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Project not found.');
    }

    // 2. Quota gate: check remaining revisions (only APPROVED batches count)
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

    // 3. Call AI service (validated schema and model fallback/retry)
    const aiResult = await aiService.extractRevisions(rawInput);

    // 4. Persist atomically using a PostgreSQL transaction
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
      return toBatchDetailDTO(batch, items);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getBatchDetail(batchId: string, accountId: string): Promise<RevisionBatchDetailDTO> {
    const batch = await revisionBatchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Revision batch not found.');
    }

    const project = await projectRepository.findById(batch.project_id);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Revision batch not found.');
    }

    const items = await revisionItemRepository.findAllByBatchId(batchId);
    return toBatchDetailDTO(batch, items);
  },

  async listBatchesByProjectId(projectId: string, accountId: string): Promise<RevisionBatchListDTO[]> {
    // Verify project ownership
    const project = await projectRepository.findById(projectId);
    if (!project || project.account_id !== accountId) {
      throw new NotFoundError('Project not found.');
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

    return result.rows.map(toBatchListDTO);
  },
};
