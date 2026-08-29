import { PoolClient } from 'pg';
import { db } from '../config/database';
import { RevisionBatchRow, RevisionItemRow } from '../types/db.types';

export interface CreateBatchData {
  projectId: string;
  rawInput: string;
  aiSummary: string;
}

export interface CreateItemData {
  revisionBatchId: string;
  description: string;
  category: string | null;
  scopeStatus: RevisionItemRow['scope_status'];
  reason: string | null;
  isCompleted?: boolean;
}

export const revisionBatchRepository = {
  async createWithClient(
    client: PoolClient,
    data: CreateBatchData,
  ): Promise<RevisionBatchRow> {
    const result = await client.query<RevisionBatchRow>(
      `INSERT INTO revision_batch (project_id, raw_input, ai_summary, status)
       VALUES ($1, $2, $3, 'DRAFT')
       RETURNING id, project_id, raw_input, ai_summary, status, magic_token, created_at`,
      [data.projectId, data.rawInput, data.aiSummary],
    );
    return result.rows[0];
  },

  async findById(batchId: string): Promise<RevisionBatchRow | null> {
    const result = await db.query<RevisionBatchRow>(
      `SELECT id, project_id, raw_input, ai_summary, status, magic_token, created_at
       FROM revision_batch WHERE id = $1 LIMIT 1`,
      [batchId],
    );
    return result.rows[0] ?? null;
  },

  async findByMagicToken(magicToken: string): Promise<RevisionBatchRow | null> {
    const result = await db.query<RevisionBatchRow>(
      `SELECT id, project_id, raw_input, ai_summary, status, magic_token, created_at
       FROM revision_batch WHERE magic_token = $1 LIMIT 1`,
      [magicToken],
    );
    return result.rows[0] ?? null;
  },

  async findAllByProjectId(projectId: string): Promise<RevisionBatchRow[]> {
    const result = await db.query<RevisionBatchRow>(
      `SELECT id, project_id, raw_input, ai_summary, status, magic_token, created_at
       FROM revision_batch WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId],
    );
    return result.rows;
  },

  async transitionStatus(
    batchId: string,
    fromStatus: RevisionBatchRow['status'],
    toStatus: RevisionBatchRow['status'],
  ): Promise<RevisionBatchRow | null> {
    const result = await db.query<RevisionBatchRow>(
      `UPDATE revision_batch SET status = $1 WHERE id = $2
       AND status = $3
       RETURNING id, project_id, raw_input, ai_summary, status, magic_token, created_at`,
      [toStatus, batchId, fromStatus],
    );
    return result.rows[0] ?? null;
  },
};

export const revisionItemRepository = {
  async createWithClient(
    client: PoolClient,
    data: CreateItemData,
  ): Promise<RevisionItemRow> {
    const result = await client.query<RevisionItemRow>(
      `INSERT INTO revision_item (revision_batch_id, description, category, scope_status, reason, is_completed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, revision_batch_id, description, category, scope_status, reason, is_completed`,
      [
        data.revisionBatchId,
        data.description,
        data.category,
        data.scopeStatus,
        data.reason,
        data.isCompleted ?? false,
      ],
    );
    return result.rows[0];
  },

  async findAllByBatchId(batchId: string): Promise<RevisionItemRow[]> {
    const result = await db.query<RevisionItemRow>(
      `SELECT id, revision_batch_id, description, category, scope_status, reason, is_completed
       FROM revision_item WHERE revision_batch_id = $1 ORDER BY id ASC`,
      [batchId],
    );
    return result.rows;
  },
};
