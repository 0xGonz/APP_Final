import { PrismaClient } from '@prisma/client';
import { processUploadedFiles, rollbackToVersion } from '../services/uploadProcessor.js';
import logger from '../config/logger.js';
import { broadcastUploadProgress } from '../websocket/server.js';

const prisma = new PrismaClient();

/**
 * POST /api/upload/csv
 * Upload CSV file(s) and process them
 */
export async function uploadCSV(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    logger.info(`Received upload request with ${files.length} file(s)`);

    // Calculate total file size
    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);

    // Create upload history record
    const uploadRecord = await prisma.uploadHistory.create({
      data: {
        filename: files.map(f => f.filename).join(', '),
        originalName: files.map(f => f.originalname).join(', '),
        fileSize: totalFileSize,
        uploadedBy: req.body.uploadedBy || 'anonymous',
        status: 'pending',
        metadata: {
          fileCount: files.length,
          fileNames: files.map(f => f.originalname)
        }
      }
    });

    logger.info(`Created upload record: ${uploadRecord.id}`);

    // Process files asynchronously
    setImmediate(async () => {
      try {
        await processUploadedFiles(uploadRecord, files, broadcastUploadProgress);
      } catch (error) {
        logger.error(`Async processing failed: ${error.message}`);
      }
    });

    // Return immediately with upload ID
    res.status(202).json({
      success: true,
      uploadId: uploadRecord.id,
      message: 'Upload accepted and processing started',
      filesCount: files.length
    });

  } catch (error) {
    logger.error(`Upload error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/upload/history
 * Get upload history with pagination
 */
export async function getUploadHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      prisma.uploadHistory.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          versions: {
            select: {
              id: true,
              clinicId: true,
              year: true,
              month: true
            }
          }
        }
      }),
      prisma.uploadHistory.count()
    ]);

    res.json({
      success: true,
      data: uploads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error(`Error fetching upload history: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/upload/:id
 * Get specific upload details
 */
export async function getUploadDetails(req, res) {
  try {
    const { id } = req.params;

    const upload = await prisma.uploadHistory.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                location: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    res.json({
      success: true,
      data: upload
    });

  } catch (error) {
    logger.error(`Error fetching upload details: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/upload/:id/rollback
 * Rollback to a specific version
 */
export async function rollbackUpload(req, res) {
  try {
    const { id } = req.params;
    const { versionId } = req.body;

    if (!versionId) {
      return res.status(400).json({
        success: false,
        error: 'Version ID is required'
      });
    }

    logger.info(`Rollback requested for version: ${versionId}`);

    const result = await rollbackToVersion(versionId);

    // Broadcast rollback event via WebSocket
    broadcastUploadProgress({
      type: 'rollback',
      versionId,
      ...result
    });

    res.json({
      success: true,
      data: result,
      message: 'Rollback completed successfully'
    });

  } catch (error) {
    logger.error(`Rollback error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/versions/:clinicId
 * Get version history for a specific clinic
 */
export async function getClinicVersions(req, res) {
  try {
    const { clinicId } = req.params;
    const { year, month } = req.query;

    const where = { clinicId };
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    const versions = await prisma.dataVersion.findMany({
      where,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        uploadHistory: {
          select: {
            id: true,
            originalName: true,
            createdAt: true,
            uploadedBy: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { version: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: versions,
      count: versions.length
    });

  } catch (error) {
    logger.error(`Error fetching clinic versions: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * DELETE /api/upload/:id
 * Delete an upload record (soft delete - mark as failed)
 */
export async function deleteUpload(req, res) {
  try {
    const { id } = req.params;

    const upload = await prisma.uploadHistory.findUnique({
      where: { id }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    // Update status to indicate deletion
    await prisma.uploadHistory.update({
      where: { id },
      data: {
        status: 'deleted',
        updatedAt: new Date()
      }
    });

    logger.info(`Upload ${id} marked as deleted`);

    res.json({
      success: true,
      message: 'Upload deleted successfully'
    });

  } catch (error) {
    logger.error(`Error deleting upload: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
