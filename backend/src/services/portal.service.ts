import { projectRepository } from '../repositories/project.repository';
import {
  revisionBatchRepository,
  revisionItemRepository,
} from '../repositories/revision.repository';
import { revisionService } from './revision.service';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';
import { RevisionBatchRow, RevisionItemRow, ProjectRow } from '../types/db.types';

interface PortalBatchItem {
  id: string;
  description: string;
  category: string | null;
  scopeStatus: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'NEEDS_REVIEW';
  reason: string | null;
}

interface PortalBatchProject {
  name: string;
  clientName: string;
  usedRevisions: number;
  totalAllowedRevisions: number;
  remainingRevisions: number;
}

interface PortalBatchDetail {
  id: string;
  projectId: string;
  status: 'PENDING_CONFIRMATION' | 'APPROVED';
  summary: string;
  createdAt: string;
  items: PortalBatchItem[];
  project: PortalBatchProject;
}

function toPortalBatchItem(item: RevisionItemRow): PortalBatchItem {
  return {
    id: item.id,
    description: item.description,
    category: item.category,
    scopeStatus: item.scope_status,
    reason: item.reason,
  };
}

async function getProjectWithQuota(projectId: string): Promise<PortalBatchProject> {
  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }
  const usedRevisions = await projectRepository.countApprovedBatches(projectId);
  const totalAllowed = project.total_allowed_revisions;
  return {
    name: project.name,
    clientName: project.client_name,
    usedRevisions,
    totalAllowedRevisions: totalAllowed,
    remainingRevisions: totalAllowed - usedRevisions,
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const portalService = {
  async getBatchByToken(magicToken: string): Promise<PortalBatchDetail> {
    if (!isUuid(magicToken)) {
      throw new NotFoundError('Revision batch not found.');
    }
    const batch = await revisionBatchRepository.findByMagicToken(magicToken);
    if (!batch) {
      throw new NotFoundError('Revision batch not found.');
    }

    if (batch.status === 'DRAFT') {
      throw new NotFoundError('Revision batch not found.');
    }

    const items = await revisionItemRepository.findAllByBatchId(batch.id);
    const project = await getProjectWithQuota(batch.project_id);

    return {
      id: batch.id,
      projectId: batch.project_id,
      status: batch.status,
      summary: batch.ai_summary ?? '',
      createdAt: batch.created_at.toISOString(),
      items: items.map(toPortalBatchItem),
      project,
    };
  },

  async confirmByToken(magicToken: string): Promise<{ id: string; status: 'APPROVED' }> {
    if (!isUuid(magicToken)) {
      throw new NotFoundError('Revision batch not found.');
    }
    const result = await revisionService.confirmBatch(magicToken);
    return { id: result.id, status: 'APPROVED' as const };
  },
};
