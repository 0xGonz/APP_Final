/**
 * Date Filtering Utilities
 *
 * Provides comprehensive date filtering logic that handles both:
 * - Date field filtering (with timezone awareness)
 * - Year/month range filtering (as backup validation)
 *
 * This ensures consistent filtering across all API endpoints and handles
 * edge cases like timezone issues and database field inconsistencies.
 */

/**
 * Build a comprehensive Prisma where clause for date range filtering
 *
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Object} Prisma where clause with date and year/month filters
 */
export function buildDateRangeFilter(startDate, endDate) {
  if (!startDate || !endDate) {
    return {};
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid date range provided:', { startDate, endDate });
    return {};
  }

  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1; // JavaScript months are 0-indexed
  const endYear = end.getFullYear();
  const endMonth = end.getMonth() + 1;

  // Build comprehensive filter with both date field and year/month validation
  return {
    AND: [
      // Primary filter: date field (with timezone handling)
      {
        date: {
          gte: new Date(startDate + 'T00:00:00.000Z'),
          lte: new Date(endDate + 'T23:59:59.999Z'),
        },
      },
      // Secondary validation: year/month range
      // This catches any records where the date field might not match year/month
      {
        OR: [
          // Records in start year: month >= startMonth
          {
            AND: [
              { year: startYear },
              { month: { gte: startMonth } },
            ],
          },
          // Records in end year: month <= endMonth
          {
            AND: [
              { year: endYear },
              { month: { lte: endMonth } },
            ],
          },
          // Records in years between start and end
          ...(endYear > startYear + 1 ? [{
            AND: [
              { year: { gt: startYear } },
              { year: { lt: endYear } },
            ],
          }] : []),
        ],
      },
    ],
  };
}

/**
 * Build a date range filter for single year filtering
 *
 * @param {number} year - The year to filter by
 * @returns {Object} Prisma where clause for year filtering
 */
export function buildYearFilter(year) {
  if (!year) {
    return {};
  }

  const yearInt = parseInt(year);
  if (isNaN(yearInt)) {
    console.warn('Invalid year provided:', year);
    return {};
  }

  return {
    year: yearInt,
  };
}

/**
 * Build a flexible date filter that handles both date range and year filtering
 *
 * @param {Object} params - Filter parameters
 * @param {string} params.startDate - Start date in YYYY-MM-DD format (optional)
 * @param {string} params.endDate - End date in YYYY-MM-DD format (optional)
 * @param {number} params.year - Year to filter by (optional)
 * @param {number} params.month - Month to filter by (optional, requires year)
 * @returns {Object} Prisma where clause
 */
export function buildFlexibleDateFilter({ startDate, endDate, year, month }) {
  // Priority 1: Date range filtering
  if (startDate && endDate) {
    return buildDateRangeFilter(startDate, endDate);
  }

  // Priority 2: Year filtering with optional month
  if (year) {
    const yearInt = parseInt(year);
    const filter = { year: yearInt };

    if (month) {
      const monthInt = parseInt(month);
      filter.month = monthInt;
    }

    return filter;
  }

  // No filtering
  return {};
}

/**
 * Validate that a record is within a date range
 * This is a client-side/post-query validation function
 *
 * @param {Object} record - Database record with year, month, and date fields
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {boolean} True if record is within range
 */
export function isRecordInDateRange(record, startDate, endDate) {
  if (!startDate || !endDate || !record) {
    return true; // No filter = include all
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Method 1: Check using the date field
  if (record.date) {
    const recordDate = new Date(record.date);
    if (recordDate >= start && recordDate <= end) {
      return true;
    }
  }

  // Method 2: Check using year/month fields as fallback
  if (record.year && record.month) {
    const startYear = start.getFullYear();
    const startMonth = start.getMonth() + 1;
    const endYear = end.getFullYear();
    const endMonth = end.getMonth() + 1;

    // Check if year/month is in range
    if (record.year < startYear || record.year > endYear) {
      return false;
    }

    if (record.year === startYear && record.month < startMonth) {
      return false;
    }

    if (record.year === endYear && record.month > endMonth) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Format a date range for logging/debugging
 *
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {string} Formatted date range string
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return 'No date filter';
  }
  return `${startDate} to ${endDate}`;
}
