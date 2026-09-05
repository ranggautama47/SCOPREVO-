import { Request, Response, NextFunction } from 'express';
import multer, { memoryStorage } from 'multer';
import { documentService, DocumentResponse } from '../services/document.service';
import { AppError } from '../middleware/error.middleware';

const MAX_FILE_SIZE = 2097152;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

function requireAccountId(req: Request): string {
  const accountId = (req as any).accountId;
  if (!accountId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  return accountId;
}

function toResponse(row: DocumentResponse) {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    extractionStatus: row.extractionStatus,
    createdAt: row.createdAt,
  };
}

function validateProjectId(req: Request, res: Response, next: NextFunction): string {
  const { projectId } = req.params;
  if (!isValidUUID(projectId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid projectId format', 422);
  }
  return projectId;
}

function validateDocumentId(req: Request, res: Response, next: NextFunction): string {
  const { documentId } = req.params;
  if (!isValidUUID(documentId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid documentId format', 422);
  }
  return documentId;
}

const upload = multer({
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, _file, cb) => {
    cb(null, true);
  },
}).single('file');

export const documentController = {
  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const accountId = requireAccountId(req);
      const projectId = validateProjectId(req, res, next);
      const docs = await documentService.listDocuments(projectId, accountId);
      res.status(200).json({ documents: docs.map(toResponse) });
    } catch (err) {
      next(err);
    }
  },

  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    const typedReq = req as any;
    upload(typedReq, res, (err: any) => {
      try {
        if (err && err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('FILE_TOO_LARGE', 'File size exceeds 2 MB limit', 400));
        }
        if (err) {
          return next(new AppError('UPLOAD_ERROR', err.message, 400));
        }
        if (!typedReq.file) {
          return next(new AppError('NO_FILE', 'No file uploaded', 400));
        }

        const accountId = requireAccountId(req);
        const projectId = validateProjectId(req, res, next);
        const file = typedReq.file;

        documentService
          .uploadDocument({
            projectId,
            accountId,
            file: {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
          })
          .then((doc) => {
            res.status(201).json({ document: toResponse(doc) });
          })
          .catch(next);
      } catch (e) {
        next(e);
      }
    });
  },

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const accountId = requireAccountId(req);
      const projectId = validateProjectId(req, res, next);
      const documentId = validateDocumentId(req, res, next);
      await documentService.deleteDocument(projectId, documentId, accountId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};