import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { db } from "../config/database";
import { NotFoundError, ForbiddenError } from "../middleware/error.middleware";
import { env } from "../config/env";
import WebSocket from "ws";
import { ProjectDocumentRow } from "../types/db.types";

if (!(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = WebSocket;
}

const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const MIME_TYPE_MAP: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "text/markdown": ".md",
};

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
];

export interface UploadResult {
  storagePath: string;
  mimeType: string;
  ext: string;
}

export interface DeleteResult {
  success: boolean;
}

export async function uploadDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
  projectId: string,
  documentId: string,
): Promise<UploadResult> {
  // 1. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `Invalid MIME type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
    );
  }

  // 2. Enforce 2 MB max size (defense in depth, also DB constraint)
  const maxSize = 2097152; // 2 * 1024 * 1024
  if (buffer.byteLength > maxSize) {
    throw new Error(
      `File size exceeds 2 MB limit (got ${buffer.byteLength} bytes)`,
    );
  }

  // 3. Determine file extension from MIME type
  const ext = MIME_TYPE_MAP[mimeType];

  // 4. Construct storage path: {projectId}/{documentId}{ext}
  const storagePath = `${projectId}/${documentId}${ext}`;

  // 5. Upload via service role (bypasses RLS, server-side only)
  const { error } = await supabase.storage
    .from("project-documents")
    .upload(storagePath, buffer, {
      cacheControl: "private, max-age=0",
      contentType: mimeType,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { storagePath, mimeType, ext };
}

let _testDeleteHook: ((storagePath: string) => Promise<DeleteResult>) | null =
  null;
export function setDeleteHookForTest(
  hook: ((storagePath: string) => Promise<DeleteResult>) | null,
): void {
  _testDeleteHook = hook;
}

export async function deleteDocumentObject(
  storagePath: string,
): Promise<DeleteResult> {
  if (_testDeleteHook) {
    return _testDeleteHook(storagePath);
  }
  const { error, data } = await supabase.storage
    .from("project-documents")
    .remove([storagePath]);

  if (error) {
    // Graceful: ignore "not found" errors; re-throw others
    if (
      error.message?.includes("not found") ||
      (error as any).code === "PGRST116"
    ) {
      return { success: true };
    }
    throw new Error(`Storage delete failed: ${error.message}`);
  }

  return { success: true };
}

export async function verifyProjectOwnership(
  projectId: string,
  accountId: string,
): Promise<void> {
  // Follow exact pattern from project.service.ts: get project then check account_id
  const { rows } = await db.query<{ id: string; account_id: string }>(
    "SELECT id, account_id FROM project WHERE id = $1 LIMIT 1",
    [projectId],
  );

  if (!rows.length) {
    throw new NotFoundError("Project not found.");
  }

  const project = rows[0];
  if (project.account_id !== accountId) {
    throw new NotFoundError("Project not found.");
  }
}
