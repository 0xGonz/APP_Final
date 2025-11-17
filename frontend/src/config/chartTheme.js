/**
 * Unified Chart Theme Configuration
 *
 * Centralized chart styling based on Tailwind theme colors
 * Ensures visual consistency across all visualizations
 */

// Core Chart Colors - Aligned with Tailwind Theme
export const CHART_COLORS = {
  // Primary data visualization colors
  primary: '#2C5F7F',      // Navy - Primary brand
  primaryLight: '#3b82f6', // Blue for accents

  // Financial metrics
  income: '#3b82f6',       // Blue - Revenue/Income
  expenses: '#ef4444',     // Red - Expenses
  profit: '#10b981',       // Green - Profit/NOI
  cogs: '#f59e0b',         // Amber - COGS

  // Margins and percentages
  grossMargin: '#10b981',  // Green
  netMargin: '#8b5cf6',    // Purple

  // Success/Danger indicators
  success: '#2D7A5C',      // Sage green (theme)
  danger: '#C44536',       // Warm red (theme)

  // Neutral
  neutral: '#78716c',      // Warm gray
  background: '#f5f5f4',   // Warm gray light

  // Grid and borders
  grid: '#e5e7eb',         // Gray-200
  border: '#d1d5db',       // Gray-300
};

// Multi-Clinic Comparison Colors (6 distinct colors)
export const COMPARISON_COLORS = [
  '#2C5F7F', // Navy (primary)
  '#10b981', // Green (success)
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

// Chart Gradients (for Area charts)
export const CHART_GRADIENTS = {
  income: {
    id: 'gradientIncome',
    stops: [
      { offset: '5%', color: '#3b82f6', opacity: 0.8 },
      { offset: '95%', color: '#3b82f6', opacity: 0.3 },
    ],
  },
  expenses: {
    id: 'gradientExpenses',
    stops: [
      { offset: '5%', color: '#ef4444', opacity: 0.8 },
      { offset: '95%', color: '#ef4444', opacity: 0.3 },
    ],
  },
  profit: {
    id: 'gradientProfit',
    stops: [
      { offset: '5%', color: '#10b981', opacity: 0.8 },
      { offset: '95%', color: '#10b981', opacity: 0.3 },
    ],
  },
  primary: {
    id: 'gradientPrimary',
    stops: [
      { offset: '5%', color: '#2C5F7F', opacity: 0.8 },
      { offset: '95%', color: '#2C5F7F', opacity: 0.3 },
    ],
  },
};

// Shared Chart Configurations
export const CHART_CONFIG = {
  // Grid styling
  grid: {
    strokeDasharray: '3 3',
    stroke: CHART_COLORS.grid,
  },

  // Axis styling
  axis: {
    tick: { fontSize: 12, fill: '#6b7280' }, // gray-500
    stroke: '#9ca3af', // gray-400
  },

  // Tooltip styling
  tooltip: {
    contentStyle: {
      backgroundColor: 'white',
      border: `1px solid ${CHART_COLORS.border}`,
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    labelStyle: {
      color: '#111827', // gray-900
      fontWeight: 600,
    },
  },

  // Legend styling
  legend: {
    wrapperStyle: {
      paddingTop: '20px',
    },
    iconType: 'circle',
  },

  // Responsive container defaults
  container: {
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
  },
};

// Utility: Get color by index (for multi-series charts)
export const getColorByIndex = (index) => {
  return COMPARISON_COLORS[index % COMPARISON_COLORS.length];
};

// Utility: Format large numbers for axis (compact notation)
export const formatAxisValue = (value) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

// Utility: Format percentage for axis
export const formatAxisPercent = (value) => {
  return `${value.toFixed(0)}%`;
};

export default {
  CHART_COLORS,
  COMPARISON_COLORS,
  CHART_GRADIENTS,
  CHART_CONFIG,
  getColorByIndex,
  formatAxisValue,
  formatAxisPercent,
};
