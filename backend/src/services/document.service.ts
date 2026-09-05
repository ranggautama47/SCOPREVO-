import { randomUUID } from 'crypto';
import { projectDocumentRepository, InsertDocumentMetadataData } from '../repositories/project-document.repository';
import { verifyProjectOwnership, uploadDocumentBuffer, deleteDocumentObject } from './storage.service';
import { validateMagicBytes, extractTextFromDocument } from './parsing.service';
import { AppError } from '../middleware/error.middleware';

export interface DocumentResponse {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  extractionStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface UploadDocumentInput {
  projectId: string;
  accountId: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

export const documentService = {
  async listDocuments(projectId: string, accountId: string): Promise<DocumentResponse[]> {
    await verifyProjectOwnership(projectId, accountId);
    const rows = await projectDocumentRepository.listByProjectId(projectId);
    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      extractionStatus: row.extraction_status,
      createdAt: row.created_at,
    }));
  },

  async uploadDocument(input: UploadDocumentInput): Promise<DocumentResponse> {
    const { projectId, accountId, file } = input;

    // 1. Verify project ownership
    await verifyProjectOwnership(projectId, accountId);

    // 2. Check document count limit (max 3)
    const existingCount = await projectDocumentRepository.countByProjectId(projectId);
    if (existingCount >= 3) {
      throw new AppError('DOCUMENT_LIMIT_REACHED', 'Maximum 3 documents per project', 409);
    }

    // 3. Validate magic bytes
    try {
      validateMagicBytes(file.buffer, file.mimetype);
    } catch (err) {
      throw new AppError('INVALID_FILE_FORMAT', (err as Error).message, 400);
    }

    // 4. Extract text (may fail, but file still stored)
    let extractionStatus: 'pending' | 'completed' | 'failed' = 'pending';
    let extractionError: string | null = null;
    let extractedText: string | null = null;

    // Use a type guard to narrow the type
    const isCompletedOrFailed = (status: 'pending' | 'completed' | 'failed'): status is 'completed' | 'failed' => {
      return status === 'completed' || status === 'failed';
    };

    try {
      const result = await extractTextFromDocument(file.buffer, file.mimetype);
      extractedText = result.extractedText;
      extractionStatus = result.isTruncated ? 'completed' : 'completed';
      // Note: we don't store extractedText in DB per requirement (only metadata)
    } catch (err) {
      extractionStatus = 'failed';
      extractionError = (err as Error).message;
    }

    // 5. Generate document ID and upload to storage
    const documentId = randomUUID();
    let storagePath: string;

    try {
      const uploadResult = await uploadDocumentBuffer(
        file.buffer,
        file.mimetype,
        projectId,
        documentId,
      );
      storagePath = uploadResult.storagePath;
    } catch (err) {
      throw new AppError('STORAGE_UPLOAD_FAILED', (err as Error).message, 500);
    }

    // 6. Insert DB row
    const metadata: InsertDocumentMetadataData = {
      projectId,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath,
    };

    let dbRow;
    try {
      dbRow = await projectDocumentRepository.insertMetadata({
        ...metadata,
        // We need to add extraction_status and extraction_error to insertMetadata
        // But the repository insertMetadata doesn't accept those. We'll need to modify repository or do a separate update.
        // Actually the repository insertMetadata only inserts the metadata fields. The extraction_status defaults to 'pending' in DB.
        // We'll insert then update extraction_status and extraction_error if needed.
      });
    } catch (err) {
      // 7. Orphan cleanup: delete storage object if DB insert fails
      await deleteDocumentObject(storagePath).catch(() => {});
      throw new AppError('DATABASE_INSERT_FAILED', (err as Error).message, 500);
    }

    // Update extraction status and error if parsing failed or completed
    if (isCompletedOrFailed(extractionStatus)) {
      // We need a method to update extraction status. Let's add a simple update via repository.
      // For now, we can do a direct DB update using the pool.
      // But to keep repository pattern, we'll add an updateExtractionStatus method to repository later.
      // Quick fix: use the db pool from config/database.
      const { db } = await import('../config/database');
      await db.query(
        `UPDATE project_document SET extraction_status = $1, extraction_error = $2 WHERE id = $3`,
        [extractionStatus, extractionError, dbRow.id],
      );
    }

    return {
      id: dbRow.id,
      filename: dbRow.filename,
      mimeType: dbRow.mime_type,
      sizeBytes: dbRow.size_bytes,
      extractionStatus: dbRow.extraction_status,
      createdAt: dbRow.created_at,
    };
  },

  async deleteDocument(projectId: string, documentId: string, accountId: string): Promise<void> {
    await verifyProjectOwnership(projectId, accountId);

    // Get document to verify it belongs to project and get storage path
    const { db } = await import('../config/database');
    const docResult = await db.query<{ storage_path: string; project_id: string }>(
      `SELECT storage_path, project_id FROM project_document WHERE id = $1 LIMIT 1`,
      [documentId],
    );

    if (!docResult.rows.length) {
      throw new AppError('NOT_FOUND', 'Document not found', 404);
    }

    const doc = docResult.rows[0];
    if (doc.project_id !== projectId) {
      throw new AppError('NOT_FOUND', 'Document not found', 404);
    }

    // Delete from storage
    try {
      await deleteDocumentObject(doc.storage_path);
    } catch (err) {
      // Storage delete failed, don't delete DB row to avoid dangling reference
      throw new AppError('STORAGE_DELETE_FAILED', 'Failed to delete file from storage', 500);
    }

    // Delete DB row
    const deleted = await projectDocumentRepository.deleteById(documentId);
    if (!deleted) {
      // This shouldn't happen if storage delete succeeded, but log it
      console.error('Document deleted from storage but not from DB:', documentId);
    }
  },
};