/**
 * Custom Hook: useFilteredData
 *
 * Provides client-side data filtering and validation for components.
 * This hook ensures that components always display data within the
 * selected date range, acting as a safety net for backend filtering.
 */

import { useMemo } from 'react';
import { validateAndFilterRecords, getDataRangeSummary } from '../utils/dataValidation';

/**
 * Filter and validate data within a date range
 *
 * @param {Array} data - Raw data from API
 * @param {string} startDate - Filter start date (YYYY-MM-DD)
 * @param {string} endDate - Filter end date (YYYY-MM-DD)
 * @param {Object} options - Additional options
 * @param {Array<string>} options.requiredFields - Required fields for validation
 * @param {boolean} options.logIssues - Whether to log validation issues
 * @returns {Object} Filtered data and metadata
 */
export const useFilteredData = (data, startDate, endDate, options = {}) => {
  const {
    requiredFields = [],
    logIssues = true,
  } = options;

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Validate and filter data
    const validated = validateAndFilterRecords(data, {
      startDate,
      endDate,
      requiredFields,
      logIssues,
    });

    return validated;
  }, [data, startDate, endDate, requiredFields, logIssues]);

  const summary = useMemo(() => {
    return getDataRangeSummary(filteredData);
  }, [filteredData]);

  return {
    data: filteredData,
    count: filteredData.length,
    summary,
    isEmpty: filteredData.length === 0,
  };
};

/**
 * Filter financial trends data
 *
 * @param {Object} trendsResponse - API response with trends array
 * @param {string} startDate - Filter start date
 * @param {string} endDate - Filter end date
 * @param {string} metricField - Field to use as primary metric
 * @returns {Object} Filtered trends and metadata
 */
export const useFilteredTrends = (trendsResponse, startDate, endDate, metricField = 'totalIncome') => {
  const trends = trendsResponse?.trends || [];

  const filteredTrends = useMemo(() => {
    return validateAndFilterRecords(trends, {
      startDate,
      endDate,
      requiredFields: [metricField],
      logIssues: true,
    });
  }, [trends, startDate, endDate, metricField]);

  const summary = useMemo(() => {
    return getDataRangeSummary(filteredTrends);
  }, [filteredTrends]);

  return {
    trends: filteredTrends,
    count: filteredTrends.length,
    summary,
    isEmpty: filteredTrends.length === 0,
  };
};

/**
 * Filter consolidated P&L data
 *
 * @param {Array} pnlData - Consolidated P&L data from API
 * @param {string} startDate - Filter start date
 * @param {string} endDate - Filter end date
 * @returns {Object} Filtered P&L data and metadata
 */
export const useFilteredPnL = (pnlData, startDate, endDate) => {
  const filteredData = useMemo(() => {
    if (!pnlData || !Array.isArray(pnlData)) {
      return [];
    }

    return validateAndFilterRecords(pnlData, {
      startDate,
      endDate,
      requiredFields: ['totalIncome', 'totalExpenses'],
      logIssues: true,
    });
  }, [pnlData, startDate, endDate]);

  const summary = useMemo(() => {
    return getDataRangeSummary(filteredData);
  }, [filteredData]);

  // Calculate aggregate totals
  const totals = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        periodCount: 0,
      };
    }

    return {
      totalIncome: filteredData.reduce((sum, item) => sum + Number(item.totalIncome || 0), 0),
      totalExpenses: filteredData.reduce((sum, item) => sum + Number(item.totalExpenses || 0), 0),
      netIncome: filteredData.reduce((sum, item) => sum + Number(item.netIncome || 0), 0),
      periodCount: filteredData.length,
    };
  }, [filteredData]);

  return {
    data: filteredData,
    count: filteredData.length,
    summary,
    totals,
    isEmpty: filteredData.length === 0,
  };
};

export default useFilteredData;
