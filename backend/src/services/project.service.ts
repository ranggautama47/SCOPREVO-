import { projectRepository, ProjectWithQuota } from '../repositories/project.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../middleware/error.middleware';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.schema';
export interface ProjectDTO {
  id: string; accountId: string; name: string; clientName: string;
  totalAllowedRevisions: number; usedRevisions: number; remainingRevisions: number; createdAt: Date;
}
function toDTO(row: ProjectWithQuota): ProjectDTO {
  return {
    id: row.id, accountId: row.account_id, name: row.name, clientName: row.client_name,
    totalAllowedRevisions: row.total_allowed_revisions, usedRevisions: row.used_revisions,
    remainingRevisions: row.remaining_revisions, createdAt: row.created_at,
  };
}
export const projectService = {
  async createProject(accountId: string, input: CreateProjectInput): Promise<ProjectDTO> {
    const row = await projectRepository.create({ accountId, name: input.name, clientName: input.clientName, totalAllowedRevisions: input.totalAllowedRevisions });
    return { id: row.id, accountId: row.account_id, name: row.name, clientName: row.client_name, totalAllowedRevisions: row.total_allowed_revisions, usedRevisions: 0, remainingRevisions: row.total_allowed_revisions, createdAt: row.created_at };
  },
  async listProjects(accountId: string): Promise<ProjectDTO[]> {
    const rows = await projectRepository.findAllByAccountId(accountId);
    return rows.map(toDTO);
  },
  async getProject(projectId: string, accountId: string): Promise<ProjectDTO> {
    const row = await projectRepository.findById(projectId);
    if (!row) throw new NotFoundError('Project not found.');
    if (row.account_id !== accountId) throw new NotFoundError('Project not found.');
    return toDTO(row);
  },
  async updateProject(projectId: string, accountId: string, input: UpdateProjectInput): Promise<ProjectDTO> {
const existing = await projectRepository.findById(projectId);
    if (!existing) throw new NotFoundError('Project not found.');
    if (existing.account_id !== accountId) throw new NotFoundError('Project not found.');
    const updated = await projectRepository.update(projectId, { name: input.name, clientName: input.clientName, totalAllowedRevisions: input.totalAllowedRevisions });
    if (!updated) throw new NotFoundError('Project not found after update.');
    const refreshed = await projectRepository.findById(projectId);
    if (!refreshed) throw new NotFoundError('Project not found.');
    return toDTO(refreshed);
  },
  async deleteProject(projectId: string, accountId: string): Promise<void> {
const existing = await projectRepository.findById(projectId);
    if (!existing) throw new NotFoundError('Project not found.');
    if (existing.account_id !== accountId) throw new NotFoundError('Project not found.');
    const batchCount = await projectRepository.countRevisionBatches(projectId);
    if (batchCount > 0) {
      throw new ConflictError('PROJECT_NOT_EMPTY', 'Project cannot be deleted because it contains revision history.');
    }
    await projectRepository.delete(projectId);
  },
};
