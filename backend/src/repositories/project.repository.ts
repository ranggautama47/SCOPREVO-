import { db } from '../config/database';
import { ProjectRow } from '../types/db.types';
export interface ProjectWithQuota extends ProjectRow {
  used_revisions: number;
  remaining_revisions: number;
}
export const projectRepository = {
  async findAllByAccountId(accountId: string): Promise<ProjectWithQuota[]> {
    const result = await db.query<ProjectWithQuota>(
`SELECT
         p.id, p.account_id, p.name, p.client_name, p.total_allowed_revisions, p.created_at,
         COALESCE((SELECT COUNT(*)::int FROM revision_batch rb WHERE rb.project_id = p.id AND rb.status = 'APPROVED'), 0) AS used_revisions,
         p.total_allowed_revisions - COALESCE((SELECT COUNT(*)::int FROM revision_batch rb WHERE rb.project_id = p.id AND rb.status = 'APPROVED'), 0) AS remaining_revisions
       FROM project p WHERE p.account_id = $1 ORDER BY p.created_at DESC`,
      [accountId],
    );
    return result.rows;
  },
  async findById(projectId: string): Promise<ProjectWithQuota | null> {
    const result = await db.query<ProjectWithQuota>(
`SELECT
         p.id, p.account_id, p.name, p.client_name, p.total_allowed_revisions, p.created_at,
         COALESCE((SELECT COUNT(*)::int FROM revision_batch rb WHERE rb.project_id = p.id AND rb.status = 'APPROVED'), 0) AS used_revisions,
         p.total_allowed_revisions - COALESCE((SELECT COUNT(*)::int FROM revision_batch rb WHERE rb.project_id = p.id AND rb.status = 'APPROVED'), 0) AS remaining_revisions
       FROM project p WHERE p.id = $1 LIMIT 1`,
      [projectId],
    );
    return result.rows[0] ?? null;
  },
  async create(data: { accountId: string; name: string; clientName: string; totalAllowedRevisions: number }): Promise<ProjectRow> {
    const result = await db.query<ProjectRow>(
      `INSERT INTO project (account_id, name, client_name, total_allowed_revisions) VALUES ($1, $2, $3, $4)
       RETURNING id, account_id, name, client_name, total_allowed_revisions, created_at`,
      [data.accountId, data.name, data.clientName, data.totalAllowedRevisions],
    );
    return result.rows[0];
  },
  async update(projectId: string, data: { name?: string; clientName?: string; totalAllowedRevisions?: number }): Promise<ProjectRow | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    if (data.name !== undefined) { setClauses.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.clientName !== undefined) { setClauses.push(`client_name = $${paramIndex++}`); values.push(data.clientName); }
    if (data.totalAllowedRevisions !== undefined) { setClauses.push(`total_allowed_revisions = $${paramIndex++}`); values.push(data.totalAllowedRevisions); }
    if (setClauses.length === 0) return null;
    values.push(projectId);
    const result = await db.query<ProjectRow>(
      `UPDATE project SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, account_id, name, client_name, total_allowed_revisions, created_at`,
      values,
    );
    return result.rows[0] ?? null;
  },
  async delete(projectId: string): Promise<boolean> {
    const result = await db.query('DELETE FROM project WHERE id = $1', [projectId]);
    return (result.rowCount ?? 0) > 0;
  },
  async countRevisionBatches(projectId: string): Promise<number> {
    const result = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM revision_batch WHERE project_id = $1', [projectId]);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  },
};
