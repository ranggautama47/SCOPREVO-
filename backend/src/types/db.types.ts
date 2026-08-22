// ============================================================
// src/types/db.types.ts
// ============================================================
export interface AccountRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}
export interface ProjectRow {
  id: string;
  account_id: string;
  name: string;
  client_name: string;
  total_allowed_revisions: number;
  created_at: Date;
}
export interface RevisionBatchRow {
  id: string;
  project_id: string;
  raw_input: string;
  ai_summary: string | null;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'APPROVED';
  magic_token: string;
  created_at: Date;
}
export interface RevisionItemRow {
  id: string;
  revision_batch_id: string;
  description: string;
  category: string | null;
  scope_status: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'NEEDS_REVIEW';
  reason: string | null;
  is_completed: boolean;
}
