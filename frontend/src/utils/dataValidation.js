/**
 * Data Validation and Filtering Utilities
 *
 * Provides client-side data validation and filtering to ensure components
 * only display data within the selected date range. This acts as a safety net
 * for the backend filtering and ensures data consistency across all components.
 */

/**
 * Validate that a record is within a date range
 *
 * @param {Object} record - Financial record with year, month, and/or date fields
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {boolean} True if record is within range
 */
export const isRecordInDateRange = (record, startDate, endDate) => {
  if (!record || !startDate || !endDate) {
    return true; // No filter = include all
  }

  const filterStart = new Date(startDate);
  const filterEnd = new Date(endDate);

  // Method 1: Check using the date field if available
  if (record.date) {
    const recordDate = new Date(record.date);
    return recordDate >= filterStart && recordDate <= filterEnd;
  }

  // Method 2: Check using year/month fields as fallback
  if (record.year !== undefined && record.month !== undefined) {
    // Construct date from year/month (using first day of month)
    const recordDate = new Date(`${record.year}-${String(record.month).padStart(2, '0')}-01`);
    return recordDate >= filterStart && recordDate <= filterEnd;
  }

  // If no date information available, exclude the record
  console.warn('[DataValidation] Record missing date information:', record);
  return false;
};

/**
 * Filter an array of records to only include those within a date range
 *
 * @param {Array} records - Array of financial records
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {boolean} logFiltered - Whether to log filtered-out records
 * @returns {Array} Filtered array of records
 */
export const filterRecordsByDateRange = (records, startDate, endDate, logFiltered = false) => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  if (!startDate || !endDate) {
    return records; // No filter applied
  }

  return records.filter((record) => {
    const isInRange = isRecordInDateRange(record, startDate, endDate);

    if (!isInRange && logFiltered) {
      console.warn(
        `[DataValidation] Filtered out: ${record.year || 'N/A'}-${record.month || 'N/A'} ` +
        `(outside range ${startDate} to ${endDate})`
      );
    }

    return isInRange;
  });
};

/**
 * Validate that financial data has required fields
 *
 * @param {Object} record - Financial record to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {boolean} True if all required fields are present
 */
export const validateFinancialRecord = (record, requiredFields = []) => {
  if (!record || typeof record !== 'object') {
    return false;
  }

  // Check for basic date fields
  const hasDateInfo = record.date || (record.year && record.month);
  if (!hasDateInfo) {
    console.warn('[DataValidation] Record missing date information:', record);
    return false;
  }

  // Check for required fields if specified
  if (requiredFields.length > 0) {
    const missingFields = requiredFields.filter((field) => !(field in record));
    if (missingFields.length > 0) {
      console.warn('[DataValidation] Record missing required fields:', missingFields, record);
      return false;
    }
  }

  return true;
};

/**
 * Validate and clean financial records array
 *
 * @param {Array} records - Array of financial records
 * @param {Object} options - Validation options
 * @param {string} options.startDate - Filter start date
 * @param {string} options.endDate - Filter end date
 * @param {Array<string>} options.requiredFields - Required fields for each record
 * @param {boolean} options.logIssues - Whether to log validation issues
 * @returns {Array} Cleaned and validated records
 */
export const validateAndFilterRecords = (records, options = {}) => {
  const {
    startDate,
    endDate,
    requiredFields = [],
    logIssues = false,
  } = options;

  if (!Array.isArray(records)) {
    if (logIssues) {
      console.error('[DataValidation] Expected array, got:', typeof records);
    }
    return [];
  }

  // Step 1: Validate records structure
  let validRecords = records.filter((record) =>
    validateFinancialRecord(record, requiredFields)
  );

  // Step 2: Filter by date range if provided
  if (startDate && endDate) {
    validRecords = filterRecordsByDateRange(validRecords, startDate, endDate, logIssues);
  }

  return validRecords;
};

/**
 * Transform and validate trend data for charts
 *
 * @param {Array} trends - Raw trend data from API
 * @param {Object} options - Transformation options
 * @param {string} options.startDate - Filter start date
 * @param {string} options.endDate - Filter end date
 * @param {string} options.metricField - Field to extract as value
 * @param {boolean} options.logIssues - Whether to log validation issues
 * @returns {Array} Transformed and validated trend data
 */
export const transformAndValidateTrends = (trends, options = {}) => {
  const {
    startDate,
    endDate,
    metricField = 'totalIncome',
    logIssues = false,
  } = options;

  // Validate and filter
  const validTrends = validateAndFilterRecords(trends, {
    startDate,
    endDate,
    requiredFields: [metricField],
    logIssues,
  });

  // Transform for chart consumption
  return validTrends.map((item) => ({
    ...item,
    value: Number(item[metricField] || 0),
    label: item.label || formatMonthLabel(item),
  }));
};

/**
 * Format month label from year/month
 *
 * @param {Object} item - Object with year and month properties
 * @returns {string} Formatted month label (e.g., "Jan 2024")
 */
const formatMonthLabel = (item) => {
  if (!item || !item.year || !item.month) {
    return 'Unknown';
  }

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return `${monthNames[item.month - 1]} ${item.year}`;
};

/**
 * Validate KPI data structure
 *
 * @param {Object} kpiData - KPI data object
 * @returns {boolean} True if valid
 */
export const validateKPIData = (kpiData) => {
  if (!kpiData || typeof kpiData !== 'object') {
    console.warn('[DataValidation] Invalid KPI data:', kpiData);
    return false;
  }

  const expectedFields = ['totalRevenue', 'grossMargin', 'netMargin'];
  const hasRequiredFields = expectedFields.every((field) => field in kpiData);

  if (!hasRequiredFields) {
    console.warn('[DataValidation] KPI data missing required fields:', kpiData);
    return false;
  }

  return true;
};

/**
 * Get date range summary from filtered data
 *
 * @param {Array} records - Filtered financial records
 * @returns {Object} Summary with earliest and latest dates
 */
export const getDataRangeSummary = (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      count: 0,
      earliestDate: null,
      latestDate: null,
      yearRange: null,
    };
  }

  // Find min and max dates
  const dates = records
    .map((r) => {
      if (r.date) return new Date(r.date);
      if (r.year && r.month) {
        return new Date(`${r.year}-${String(r.month).padStart(2, '0')}-01`);
      }
      return null;
    })
    .filter(Boolean);

  if (dates.length === 0) {
    return {
      count: records.length,
      earliestDate: null,
      latestDate: null,
      yearRange: null,
    };
  }

  const earliestDate = new Date(Math.min(...dates));
  const latestDate = new Date(Math.max(...dates));

  return {
    count: records.length,
    earliestDate: earliestDate.toISOString().split('T')[0],
    latestDate: latestDate.toISOString().split('T')[0],
    yearRange: `${earliestDate.getFullYear()}-${latestDate.getFullYear()}`,
  };
};
