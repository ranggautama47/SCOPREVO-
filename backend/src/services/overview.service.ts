import { db } from '../config/database';
import { ProjectRow } from '../types/db.types';
export interface OverviewDTO {
  activeProjects: number; pendingConfirmations: number; revisionsUsed: number;
  recentProjects: { id: string; name: string; clientName: string; createdAt: Date }[];
}
const RECENT_PROJECT_LIMIT = 5;
export const overviewService = {
  async getOverview(accountId: string): Promise<OverviewDTO> {
    const [projectsResult, pendingResult, revisionsResult, recentResult] = await Promise.all([
      db.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM project WHERE account_id = $1`, [accountId]),
      db.query<{ count: string }>(`SELECT COUNT(rb.*)::text AS count FROM revision_batch rb JOIN project p ON p.id = rb.project_id WHERE p.account_id = $1 AND rb.status = ''PENDING_CONFIRMATION''`, [accountId]),
      db.query<{ count: string }>(`SELECT COUNT(rb.*)::text AS count FROM revision_batch rb JOIN project p ON p.id = rb.project_id WHERE p.account_id = $1 AND rb.status = ''APPROVED''`, [accountId]),
      db.query<ProjectRow>(`SELECT id, account_id, name, client_name, total_allowed_revisions, created_at FROM project WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2`, [accountId, RECENT_PROJECT_LIMIT]),
    ]);
    return {
      activeProjects: parseInt(projectsResult.rows[0]?.count ?? '0', 10),
      pendingConfirmations: parseInt(pendingResult.rows[0]?.count ?? '0', 10),
      revisionsUsed: parseInt(revisionsResult.rows[0]?.count ?? '0', 10),
      recentProjects: recentResult.rows.map((r) => ({ id: r.id, name: r.name, clientName: r.client_name, createdAt: r.created_at })),
    };
  },
};
