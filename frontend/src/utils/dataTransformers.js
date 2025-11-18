/**
 * Data Transformation Utilities
 *
 * Modular utilities for transforming API responses into chart-ready data formats.
 * This layer decouples the API structure from UI components.
 */

import { format } from 'date-fns';

/**
 * Transform trends API response for chart consumption
 * @param {Array} trendsData - Raw trends data from API
 * @param {string} selectedMetric - The metric field to extract as 'value'
 * @returns {Array} Chart-ready data with date and value fields
 */
export const transformTrendsForChart = (trendsData, selectedMetric = 'totalIncome') => {
  if (!Array.isArray(trendsData) || trendsData.length === 0) {
    return [];
  }

  return trendsData.map((item) => {
    // Handle both the categoryValue field and direct metric fields
    const value = item.categoryValue !== undefined
      ? parseFloat(item.categoryValue)
      : parseFloat(item[selectedMetric] || 0);

    return {
      date: format(new Date(item.date), 'MMM yyyy'),
      value,
      year: item.year,
      month: item.month,
      rawData: item, // Preserve original data for debugging
    };
  });
};

/**
 * Transform growth API response to match expected format
 * @param {Object} growthData - Raw growth data from API
 * @returns {Object} Normalized growth data with monthOverMonth and yearOverYear
 */
export const transformGrowthData = (growthData) => {
  if (!growthData) {
    return {
      monthOverMonth: 0,
      yearOverYear: 0,
    };
  }

  // The API now returns monthOverMonth and yearOverYear at the top level
  // Use those directly for better performance and accuracy
  return {
    monthOverMonth: growthData.monthOverMonth || 0,
    yearOverYear: growthData.yearOverYear || 0,
    average: {
      monthOverMonth: growthData.summary?.averageMoMGrowth || 0,
      yearOverYear: growthData.summary?.averageYoYGrowth || 0,
    },
    rawData: growthData, // Preserve for advanced usage
  };
};

/**
 * Transform KPI data for display
 * @param {Object} kpiData - Raw KPI data from API
 * @returns {Object} Normalized KPI data
 */
export const transformKPIData = (kpiData) => {
  if (!kpiData) {
    return {
      totalRevenue: 0,
      netProfit: 0,
      grossMargin: 0,
      netMargin: 0,
      payrollPercentage: 0,
      recordCount: 0,
    };
  }

  return {
    totalRevenue: kpiData.totalRevenue || 0,
    netProfit: kpiData.netProfit || 0,
    grossMargin: kpiData.grossMargin || 0,
    netMargin: kpiData.netMargin || 0,
    payrollPercentage: kpiData.payrollPercentage || 0,
    recordCount: kpiData.recordCount || 0,
    rawData: kpiData,
  };
};

/**
 * Transform monthly performance data for charts
 * @param {Array} data - Raw financial records
 * @returns {Array} Chart-ready monthly performance data
 */
export const transformMonthlyPerformanceData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((item) => ({
    label: formatMonthLabel(item),
    year: item.year,
    month: item.month,
    totalIncome: Number(item.totalIncome || 0),
    totalExpenses: Number(item.totalExpenses || 0),
    netIncome: Number(item.netIncome || 0),
  }));
};

/**
 * Transform expense data for pie chart
 * @param {Object} financialData - Financial record with expense fields
 * @returns {Array} Chart-ready expense breakdown data
 */
export const transformExpenseBreakdown = (financialData) => {
  if (!financialData) {
    return [];
  }

  const expenseCategories = [
    { name: 'Payroll', value: Number(financialData.payrollExpense || 0) },
    { name: 'COGS', value: Number(financialData.totalCOGS || 0) },
    { name: 'Rent', value: Number(financialData.rentExpense || 0) },
    { name: 'Marketing', value: Number(financialData.advertisingExpense || 0) },
    { name: 'Insurance', value: Number(financialData.insuranceExpense || 0) },
    { name: 'Office', value: Number(financialData.officeExpense || 0) },
  ];

  // Filter out zero values
  return expenseCategories.filter(item => item.value > 0);
};

/**
 * Format month label helper
 * @param {Object} item - Object with year and month properties
 * @returns {string} Formatted month label (e.g., "Jan 2024")
 */
export const formatMonthLabel = (item) => {
  if (!item.year || !item.month) return '';
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${monthNames[item.month - 1]} ${item.year}`;
};

/**
 * Calculate average from chart data
 * @param {Array} chartData - Array with value property
 * @returns {number} Average value
 */
export const calculateAverage = (chartData) => {
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return 0;
  }

  const sum = chartData.reduce((total, item) => total + (item.value || 0), 0);
  return sum / chartData.length;
};

/**
 * Format currency helper
 * @param {number} value - Numeric value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format currency with accounting notation (parentheses for negatives)
 * @param {number} value - Numeric value to format
 * @returns {JSX.Element|string} Formatted currency with conditional styling
 */
export const formatCurrencyAccounting = (value) => {
  const num = Number(value);
  if (num < 0) {
    const formatted = formatCurrency(Math.abs(num));
    return `(${formatted})`;
  }
  return formatCurrency(num);
};

/**
 * Format percentage helper
 * @param {number} value - Numeric value to format
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value) => {
  return `${value?.toFixed(1)}%`;
};
