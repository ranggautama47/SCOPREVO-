import { db } from '../config/database';
import { ProjectDocumentRow } from '../types/db.types';

export interface InsertDocumentMetadataData {
  projectId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

export const projectDocumentRepository = {
  async listByProjectId(projectId: string): Promise<ProjectDocumentRow[]> {
    const result = await db.query<ProjectDocumentRow>(
      `SELECT
         id, project_id, filename, mime_type, size_bytes, storage_path,
         extracted_text, extraction_status, extraction_error, created_at, updated_at
       FROM project_document
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId],
    );
    return result.rows;
  },

  async countByProjectId(projectId: string): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM project_document WHERE project_id = $1',
      [projectId],
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  },

  async insertMetadata(data: InsertDocumentMetadataData): Promise<ProjectDocumentRow> {
    const result = await db.query<ProjectDocumentRow>(
      `INSERT INTO project_document (project_id, filename, mime_type, size_bytes, storage_path, extraction_status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, project_id, filename, mime_type, size_bytes, storage_path,
                 extracted_text, extraction_status, extraction_error, created_at, updated_at`,
      [data.projectId, data.filename, data.mimeType, data.sizeBytes, data.storagePath],
    );
    return result.rows[0];
  },

  async deleteById(documentId: string): Promise<boolean> {
    const result = await db.query('DELETE FROM project_document WHERE id = $1', [documentId]);
    return (result.rowCount ?? 0) > 0;
  },
};