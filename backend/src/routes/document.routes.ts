import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadDocumentSchema, deleteDocumentSchema } from '../validators/document.schema';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:projectId/documents',
  validate(uploadDocumentSchema),
  documentController.listDocuments,
);

router.post(
  '/:projectId/documents',
  validate(uploadDocumentSchema),
  documentController.uploadDocument,
);

router.delete(
  '/:projectId/documents/:documentId',
  validate(deleteDocumentSchema),
  documentController.deleteDocument,
);

export default router;
