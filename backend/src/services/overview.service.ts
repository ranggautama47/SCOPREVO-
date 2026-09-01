import { db } from '../config/database';
import { ProjectRow } from '../types/db.types';
export interface OverviewDTO {
  activeProjects: number; pendingConfirmations: number; revisionsUsed: number;
  recentProjects: { id: string; name: string; clientName: string; createdAt: Date }[];
  recentBatches: { id: string; projectId: string; projectName: string; status: string; createdAt: Date; itemCount: number }[];
}
const RECENT_PROJECT_LIMIT = 5;
export const overviewService = {
  async getOverview(accountId: string): Promise<OverviewDTO> {
    const [projectsResult, pendingResult, revisionsResult, recentResult, recentBatchesResult] = await Promise.all([
      db.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM project WHERE account_id = $1`, [accountId]),
      db.query<{ count: string }>(`SELECT COUNT(rb.*)::text AS count FROM revision_batch rb JOIN project p ON p.id = rb.project_id WHERE p.account_id = $1 AND rb.status = 'PENDING_CONFIRMATION'`, [accountId]),
      db.query<{ count: string }>(`SELECT COUNT(rb.*)::text AS count FROM revision_batch rb JOIN project p ON p.id = rb.project_id WHERE p.account_id = $1 AND rb.status = 'APPROVED'`, [accountId]),
      db.query<ProjectRow>(`SELECT id, account_id, name, client_name, total_allowed_revisions, created_at FROM project WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2`, [accountId, RECENT_PROJECT_LIMIT]),
      db.query<{ id: string; project_id: string; project_name: string; status: string; created_at: Date; item_count: string }>(
        `SELECT 
          rb.id, 
          rb.project_id, 
          p.name AS project_name, 
          rb.status::text AS status, 
          rb.created_at,
          COUNT(ri.id)::text AS item_count
         FROM revision_batch rb
         JOIN project p ON p.id = rb.project_id
         LEFT JOIN revision_item ri ON ri.revision_batch_id = rb.id
         WHERE p.account_id = $1
         GROUP BY rb.id, p.name
         ORDER BY rb.created_at DESC
         LIMIT 5`,
        [accountId]
      ),
    ]);
    return {
      activeProjects: parseInt(projectsResult.rows[0]?.count ?? '0', 10),
      pendingConfirmations: parseInt(pendingResult.rows[0]?.count ?? '0', 10),
      revisionsUsed: parseInt(revisionsResult.rows[0]?.count ?? '0', 10),
      recentProjects: recentResult.rows.map((r) => ({ id: r.id, name: r.name, clientName: r.client_name, createdAt: r.created_at })),
      recentBatches: recentBatchesResult.rows.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name,
        status: r.status,
        createdAt: r.created_at,
        itemCount: parseInt(r.item_count ?? '0', 10),
      })),
    };
  },
};
