import { db } from '../config/database';
import { projectRepository } from '../repositories/project.repository';
import {
  revisionBatchRepository,
  revisionItemRepository,
} from '../repositories/revision.repository';
import { aiService } from './ai.service';
import { NotFoundError } from '../middleware/error.middleware';
import { RevisionBatchRow, RevisionItemRow } from '../types/db.types';

export interface RevisionItemDTO {
  id: string;
  description: string;
  category: string | null;
  scopeStatus: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'NEEDS_REVIEW';
  reason: string | null;
  isCompleted: boolean;
}

export interface RevisionBatchDetailDTO {
  id: string;
  projectId: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'APPROVED';
  summary: string | null;
  magicToken: string;
  createdAt: Date;
  items: RevisionItemDTO[];
}

function toBatchDTO(batch: RevisionBatchRow, items: RevisionItemRow[]): RevisionBatchDetailDTO {
  return {
    id: batch.id,
    projectId: batch.project_id,
    status: batch.status,
    summary: batch.ai_summary,
    magicToken: batch.magic_token,
    createdAt: batch.created_at,
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      category: item.category,
      scopeStatus: item.scope_status,
      reason: item.reason,
      isCompleted: item.is_completed,
    })),
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

    // 2. Call AI service (validated schema and model fallback/retry)
    const aiResult = await aiService.extractRevisions(rawInput);

    // 3. Persist atomically using a PostgreSQL transaction
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
      return toBatchDTO(batch, items);
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
    return toBatchDTO(batch, items);
  },
};
