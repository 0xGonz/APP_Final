import { PrismaClient } from '@prisma/client';
import { parseCSVFile } from '../utils/csvParser.js';
import logger from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Process uploaded CSV files and update database
 * @param {Object} uploadRecord - UploadHistory record
 * @param {Array} files - Array of uploaded files
 * @param {Function} emitProgress - WebSocket emit function
 * @returns {Promise<Object>} Processing result
 */
export async function processUploadedFiles(uploadRecord, files, emitProgress) {
  const uploadId = uploadRecord.id;
  let totalRecordsProcessed = 0;
  const errors = [];
  const processedClinics = new Set();

  try {
    logger.info(`Starting upload processing for upload ID: ${uploadId}`);
    emitProgress({ uploadId, status: 'processing', progress: 0 });

    // Update upload status to processing
    await prisma.uploadHistory.update({
      where: { id: uploadId },
      data: { status: 'processing' }
    });

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / files.length) * 100);

      try {
        logger.info(`Processing file ${i + 1}/${files.length}: ${file.originalname}`);
        emitProgress({
          uploadId,
          status: 'processing',
          progress,
          currentFile: file.originalname,
          message: `Processing ${file.originalname}...`
        });

        // Parse CSV file
        const parseResult = await parseCSVFile(file.path);

        // Extract data array and clinic name from parse result
        const records = parseResult?.data;
        const clinicNameFromFile = parseResult?.clinicName;

        if (!records || !Array.isArray(records) || records.length === 0) {
          errors.push({
            file: file.originalname,
            error: 'No valid records found in file. Check CSV format and data.'
          });
          continue;
        }

        logger.info(`Parsed ${records.length} records from ${file.originalname} (Clinic: ${clinicNameFromFile})`);

        // Process each record
        for (const record of records) {
          try {
            // Validate record
            const validationError = validateRecord(record);
            if (validationError) {
              errors.push({
                file: file.originalname,
                record: `${record.clinicName} - ${record.year}/${record.month}`,
                error: validationError
              });
              continue;
            }

            // Get or create clinic
            const clinic = await getOrCreateClinic(record.clinicName);
            processedClinics.add(clinic.id);

            // Create version snapshot before updating
            await createVersionSnapshot(clinic.id, record.year, record.month, uploadId);

            // Upsert financial record
            await upsertFinancialRecord(clinic.id, record);

            totalRecordsProcessed++;

            emitProgress({
              uploadId,
              status: 'processing',
              progress,
              recordsProcessed: totalRecordsProcessed,
              message: `Processed ${totalRecordsProcessed} records...`
            });

          } catch (recordError) {
            logger.error(`Error processing record: ${recordError.message}`);
            errors.push({
              file: file.originalname,
              record: `${record.clinicName} - ${record.year}/${record.month}`,
              error: recordError.message
            });
          }
        }

        // Clean up uploaded file
        await fs.unlink(file.path);

      } catch (fileError) {
        logger.error(`Error processing file ${file.originalname}: ${fileError.message}`);
        errors.push({
          file: file.originalname,
          error: fileError.message
        });
      }
    }

    // Update upload history with results
    const status = errors.length > 0 ? 'completed_with_errors' : 'completed';
    const errorMessage = errors.length > 0 ? JSON.stringify(errors, null, 2) : null;

    await prisma.uploadHistory.update({
      where: { id: uploadId },
      data: {
        status,
        recordsCount: totalRecordsProcessed,
        errorMessage,
        metadata: {
          filesProcessed: files.length,
          clinicsAffected: Array.from(processedClinics),
          errors: errors.length
        }
      }
    });

    const result = {
      success: errors.length === 0,
      recordsProcessed: totalRecordsProcessed,
      filesProcessed: files.length,
      clinicsAffected: processedClinics.size,
      errors
    };

    logger.info(`Upload processing completed. Records: ${totalRecordsProcessed}, Errors: ${errors.length}`);

    emitProgress({
      uploadId,
      status: 'completed',
      progress: 100,
      result
    });

    return result;

  } catch (error) {
    logger.error(`Critical error in upload processing: ${error.message}`);

    // Update upload history with failure
    await prisma.uploadHistory.update({
      where: { id: uploadId },
      data: {
        status: 'failed',
        errorMessage: error.message
      }
    });

    emitProgress({
      uploadId,
      status: 'failed',
      error: error.message
    });

    throw error;
  }
}

/**
 * Validate a financial record
 * @param {Object} record - Financial record to validate
 * @returns {string|null} Error message or null if valid
 */
function validateRecord(record) {
  if (!record.clinicName || record.clinicName.trim() === '') {
    return 'Clinic name is required';
  }

  if (!record.year || record.year < 2020 || record.year > 2030) {
    return `Invalid year: ${record.year}. Must be between 2020 and 2030`;
  }

  if (!record.month || record.month < 1 || record.month > 12) {
    return `Invalid month: ${record.month}. Must be between 1 and 12`;
  }

  // Future date validation removed - allows uploading projected/budgeted data
  // Users can upload data for upcoming months (e.g., end-of-month uploads for next month)

  return null;
}

/**
 * Get or create clinic by name
 * @param {string} clinicName - Name of the clinic
 * @returns {Promise<Object>} Clinic record
 */
async function getOrCreateClinic(clinicName) {
  // Try to find existing clinic
  let clinic = await prisma.clinic.findFirst({
    where: {
      OR: [
        { name: clinicName },
        { name: { contains: clinicName, mode: 'insensitive' } }
      ]
    }
  });

  // If not found, create new clinic
  if (!clinic) {
    logger.info(`Creating new clinic: ${clinicName}`);
    clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        location: extractLocation(clinicName),
        active: true
      }
    });
  }

  return clinic;
}

/**
 * Extract location from clinic name
 * @param {string} clinicName - Clinic name
 * @returns {string} Location
 */
function extractLocation(clinicName) {
  // Extract location from names like "American Pain Partners LLC - Baytown"
  const parts = clinicName.split('-');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return clinicName;
}

/**
 * Create version snapshot before updating data
 * @param {string} clinicId - Clinic ID
 * @param {number} year - Year
 * @param {number} month - Month
 * @param {string} uploadId - Upload history ID
 */
async function createVersionSnapshot(clinicId, year, month, uploadId) {
  // Check if financial record exists
  const existingRecord = await prisma.financialRecord.findUnique({
    where: {
      clinicId_year_month: {
        clinicId,
        year,
        month
      }
    }
  });

  if (existingRecord) {
    // Get the latest version number
    const latestVersion = await prisma.dataVersion.findFirst({
      where: { clinicId, year, month },
      orderBy: { version: 'desc' }
    });

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Create version snapshot
    await prisma.dataVersion.create({
      data: {
        clinicId,
        year,
        month,
        version: newVersion,
        uploadHistoryId: uploadId,
        previousVersion: latestVersion?.id,
        data: existingRecord
      }
    });

    logger.info(`Created version snapshot v${newVersion} for clinic ${clinicId}, ${year}/${month}`);
  }
}

/**
 * Upsert financial record
 * @param {string} clinicId - Clinic ID
 * @param {Object} record - Parsed record data
 */
async function upsertFinancialRecord(clinicId, record) {
  // Create date from year and month
  const date = new Date(record.year, record.month - 1, 1);

  // Prepare data for upsert (remove clinicName as it's not a field)
  const { clinicName, ...recordData } = record;

  const data = {
    clinicId,
    year: record.year,
    month: record.month,
    date,
    ...recordData
  };

  await prisma.financialRecord.upsert({
    where: {
      clinicId_year_month: {
        clinicId,
        year: record.year,
        month: record.month
      }
    },
    update: data,
    create: data
  });

  logger.debug(`Upserted financial record for clinic ${clinicId}, ${record.year}/${record.month}`);
}

/**
 * Rollback to a specific version
 * @param {string} versionId - Version ID to rollback to
 * @returns {Promise<Object>} Result of rollback
 */
export async function rollbackToVersion(versionId) {
  try {
    // Get the version record
    const version = await prisma.dataVersion.findUnique({
      where: { id: versionId },
      include: { clinic: true }
    });

    if (!version) {
      throw new Error('Version not found');
    }

    logger.info(`Rolling back to version ${version.version} for clinic ${version.clinic.name}, ${version.year}/${version.month}`);

    // Create a new version snapshot of current state before rollback
    const currentRecord = await prisma.financialRecord.findUnique({
      where: {
        clinicId_year_month: {
          clinicId: version.clinicId,
          year: version.year,
          month: version.month
        }
      }
    });

    if (currentRecord) {
      const latestVersion = await prisma.dataVersion.findFirst({
        where: {
          clinicId: version.clinicId,
          year: version.year,
          month: version.month
        },
        orderBy: { version: 'desc' }
      });

      await prisma.dataVersion.create({
        data: {
          clinicId: version.clinicId,
          year: version.year,
          month: version.month,
          version: (latestVersion?.version || 0) + 1,
          data: currentRecord,
          previousVersion: latestVersion?.id
        }
      });
    }

    // Restore the data from the selected version
    const restoredData = version.data;
    const date = new Date(version.year, version.month - 1, 1);

    await prisma.financialRecord.upsert({
      where: {
        clinicId_year_month: {
          clinicId: version.clinicId,
          year: version.year,
          month: version.month
        }
      },
      update: {
        ...restoredData,
        date,
        updatedAt: new Date()
      },
      create: {
        ...restoredData,
        clinicId: version.clinicId,
        year: version.year,
        month: version.month,
        date
      }
    });

    logger.info(`Successfully rolled back to version ${version.version}`);

    return {
      success: true,
      clinic: version.clinic.name,
      year: version.year,
      month: version.month,
      version: version.version
    };

  } catch (error) {
    logger.error(`Rollback failed: ${error.message}`);
    throw error;
  }
}
