export type ScopeStatus = 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'NEEDS_REVIEW';

export type RevisionBatchStatus = 'DRAFT' | 'PENDING_CONFIRMATION' | 'APPROVED';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  account: UserAccount;
}

export interface Project {
  id: string;
  accountId: string;
  name: string;
  clientName: string;
  totalAllowedRevisions: number;
  usedRevisions: number;
  remainingRevisions: number;
  createdAt: string;
}

export interface RevisionItem {
  id: string;
  description: string;
  category: string | null;
  scopeStatus: ScopeStatus;
  reason: string | null;
}

export interface RevisionBatchSummary {
  id: string;
  status: RevisionBatchStatus;
  createdAt: string;
  itemCount: number;
}

export interface RevisionBatchDetail {
  id: string;
  projectId: string;
  status: RevisionBatchStatus;
  summary: string | null;
  createdAt: string;
  magicToken: string | null;
  items: RevisionItem[];
}

export interface ShareBatchResponse {
  batch: {
    id: string;
    status: RevisionBatchStatus;
    magicToken: string;
  };
}

export interface OverviewData {
  activeProjects: number;
  pendingConfirmations: number;
  revisionsUsed: number;
  recentProjects: {
    id: string;
    name: string;
    clientName: string;
    createdAt: string;
  }[];
  recentBatches: {
    id: string;
    projectId: string;
    projectName: string;
    status: RevisionBatchStatus;
    createdAt: string;
    itemCount: number;
  }[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PortalProject {
  name: string;
  clientName: string;
  usedRevisions: number;
  totalAllowedRevisions: number;
  remainingRevisions: number;
}

export interface PortalBatchResponse {
  batch: {
    id: string;
    projectId: string;
    status: RevisionBatchStatus;
    summary: string;
    createdAt: string;
    items: RevisionItem[];
    project: PortalProject;
  };
}
