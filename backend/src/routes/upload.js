import express from 'express';
import { uploadMultiple } from '../middleware/upload.js';
import {
  uploadCSV,
  getUploadHistory,
  getUploadDetails,
  rollbackUpload,
  getClinicVersions,
  deleteUpload
} from '../controllers/upload.js';

const router = express.Router();

// POST /api/upload/csv - Upload CSV files
router.post('/csv', uploadMultiple, uploadCSV);

// GET /api/upload/history - Get upload history
router.get('/history', getUploadHistory);

// GET /api/upload/:id - Get upload details
router.get('/:id', getUploadDetails);

// POST /api/upload/:id/rollback - Rollback to version
router.post('/:id/rollback', rollbackUpload);

// DELETE /api/upload/:id - Delete upload
router.delete('/:id', deleteUpload);

// GET /api/versions/:clinicId - Get version history for clinic
router.get('/versions/:clinicId', getClinicVersions);

export default router;
