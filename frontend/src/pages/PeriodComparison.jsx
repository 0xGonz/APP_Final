import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Check, X, Download } from 'lucide-react';
import { clinicsAPI, financialsAPI, systemAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ExportButton from '../components/ExportButton';
import ChartCard from '../components/shared/ChartCard';
import ChartControls from '../components/charts/ChartControls';
import FlexibleComparisonChart from '../components/charts/FlexibleComparisonChart';
import { formatCurrency, formatCurrencyAccounting } from '../utils/dataTransformers';
import { useDateFilter } from '../context/DateFilterContext';
import { LINE_ITEMS, getAllLineItems } from '../config/lineItems';

/**
 * Calculate percentage variance between two values
 */
const calculateVariance = (current, previous) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return null; // Avoid division by zero
  if (!previous || !current) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Format variance for display with color coding
 */
const formatVariance = (variance, isExpense = false) => {
  if (variance === null || variance === undefined) {
    return {
      display: 'N/A',
      colorClass: 'text-gray-400',
      icon: '',
    };
  }

  // For expenses, negative variance is good (cost reduction)
  const isPositive = isExpense ? variance < 0 : variance >= 0;

  return {
    display: `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`,
    colorClass: isPositive ? 'text-success-600 font-semibold' : 'text-danger-600 font-semibold',
    icon: isPositive ? ' ▲' : ' ▼',
    value: variance,
  };
};

/**
 * Determine if a line item is an expense type
 */
const isExpenseLineItem = (itemKey) => {
  const expenseKeys = ['totalCOGS', 'totalExpenses'];
  const cogsItems = LINE_ITEMS.cogs ? Object.keys(LINE_ITEMS.cogs.items) : [];
  const expenseItems = LINE_ITEMS.expenses ? Object.keys(LINE_ITEMS.expenses.items) : [];

  return expenseKeys.includes(itemKey) || cogsItems.includes(itemKey) || expenseItems.includes(itemKey);
};

const PeriodComparison = () => {
  const { 
    startDate: currentStart, 
    endDate: currentEnd, 
    selectedPreset,
    isLoadingDataDate 
  } = useDateFilter();

  // State for selected clinics (multiple selection like Clinic Comparison)
  const [selectedClinics, setSelectedClinics] = useState([]);

  // State for selected comparison periods (not including current period)
  const [comparisonPeriods, setComparisonPeriods] = useState([]);

  // State for selected line items to compare
  const [selectedLineItems, setSelectedLineItems] = useState([]);

  // State for table view (monthly breakdown vs totals)
  const [tableView, setTableView] = useState('monthly'); // 'monthly' or 'totals'

  // State for chart type and stacking
  const [chartType, setChartType] = useState('bar');
  const [isStacked, setIsStacked] = useState(true);

  // Fetch all clinics
  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: clinicsAPI.getAll,
  });

  // Fetch available data range to determine which years to offer
  const { data: dataRange, isLoading: dataRangeLoading } = useQuery({
    queryKey: ['data-range'],
    queryFn: systemAPI.getDataRange,
  });

  // Calculate isFullYear early so it's available in JSX
  const isFullYear = currentStart && currentEnd ? (() => {
    const currentStartDate = parseISO(currentStart);
    const currentEndDate = parseISO(currentEnd);
    const startMonth = currentStartDate.getMonth();
    const startDay = currentStartDate.getDate();
    const endMonth = currentEndDate.getMonth();
    const endDay = currentEndDate.getDate();
    return startMonth === 0 && startDay === 1 && endMonth === 11 && endDay === 31;
  })() : false;

  // Calculate periods safely
  let currentPeriod = null;
  let allPeriods = [];
  let availableComparisonPeriods = [];

  // Only generate periods if data is loaded
  if (!isLoadingDataDate && currentStart && currentEnd) {
    // Current period object (always included)
    currentPeriod = {
      label: selectedPreset === 'custom'
        ? `Current (${format(parseISO(currentStart), 'MMM yyyy')} - ${format(parseISO(currentEnd), 'MMM yyyy')})`
        : `Current (${selectedPreset.toUpperCase().replace(/-/g, ' ')})`,
      startDate: currentStart,
      endDate: currentEnd,
      isCurrent: true,
    };

    // Dynamic comparison periods based on current period's date range
    // This ensures apples-to-apples comparison across years
    const currentStartDate = parseISO(currentStart);
    const currentEndDate = parseISO(currentEnd);

    // Extract month and day from current period
    const startMonth = currentStartDate.getMonth();
    const startDay = currentStartDate.getDate();
    const endMonth = currentEndDate.getMonth();
    const endDay = currentEndDate.getDate();
    const currentYear = currentEndDate.getFullYear();

    // Get earliest year from database to only offer years with actual data
    const earliestYear = dataRange?.earliest?.year;

    // Generate comparison periods dynamically based on available data
    // Only generate periods if we have data range info
    if (earliestYear) {
      // Calculate the duration of the current period in days
      const durationDays = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
      
      // Add matching periods for previous years (up to 3 years back)
      [currentYear - 1, currentYear - 2, currentYear - 3].forEach(year => {
        if (year >= earliestYear) { // Only offer years with actual data
          const label = isFullYear
            ? `${year} (Full Year)`
            : `${year} (${format(currentStartDate, 'MMM d')} - ${format(currentEndDate, 'MMM d')})`;

          // For cross-year periods (e.g., Oct 2024 - Sep 2025), we need to shift back by full years
          // Start date: same month/day but in the target year
          const periodStart = new Date(year, startMonth, startDay);
          
          // End date: add the same duration as current period
          const periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + durationDays);

          // Check if this period falls within available data range
          const periodStartStr = format(periodStart, 'yyyy-MM-dd');
          const periodEndStr = format(periodEnd, 'yyyy-MM-dd');
          const earliestDataStr = dataRange?.dateRange?.start || '2023-01-01';
          const latestDataStr = dataRange?.dateRange?.end || '2025-12-31';
          
          // Period has data if it overlaps with available range
          const hasData = periodEndStr >= earliestDataStr && periodStartStr <= latestDataStr;

          availableComparisonPeriods.push({
            label,
            startDate: periodStartStr,
            endDate: periodEndStr,
            hasData, // Flag to grey out unavailable periods
          });
        }
      });

      // If current is NOT a full year, also add full year options for context
      if (!isFullYear) {
        [currentYear - 1, currentYear - 2, currentYear - 3].forEach(year => {
          if (year >= earliestYear) { // Only offer years with actual data
            // Check if full year period has data
            const fullYearStart = `${year}-01-01`;
            const fullYearEnd = `${year}-12-31`;
            const earliestDataStr = dataRange?.dateRange?.start || '2023-01-01';
            const latestDataStr = dataRange?.dateRange?.end || '2025-12-31';
            const hasData = fullYearEnd >= earliestDataStr && fullYearStart <= latestDataStr;

            availableComparisonPeriods.push({
              label: `${year} (Full Year)`,
              startDate: fullYearStart,
              endDate: fullYearEnd,
              hasData,
            });
          }
        });
      }
    }
    
    // All periods for API call - sorted chronologically (earliest to latest)
    allPeriods = [currentPeriod, ...comparisonPeriods].sort((a, b) =>
      new Date(a.startDate + 'T00:00:00') - new Date(b.startDate + 'T00:00:00')
    );
  }

  // Fetch period comparison data
  const {
    data: comparisonData,
    isLoading: comparisonLoading,
    error: comparisonError,
  } = useQuery({
    queryKey: ['period-comparison', selectedClinics, allPeriods],
    queryFn: () => {
      const clinicParam = selectedClinics.includes('all') || selectedClinics.length > 1
        ? 'all'
        : selectedClinics[0];
      return financialsAPI.periodCompare(clinicParam, allPeriods);
    },
    enabled: !isLoadingDataDate && !!currentPeriod && selectedClinics.length > 0 && allPeriods.length > 0,
  });

  if (isLoadingDataDate || !currentStart || !currentEnd || !currentPeriod) {
    return <Loading message="Initializing date filters..." />;
  }

  const handleClinicToggle = (clinicId) => {
    // Handle "All Clinics" selection
    if (clinicId === 'all') {
      setSelectedClinics(['all']);
      return;
    }

    // If "All Clinics" is currently selected, switch to individual clinic
    if (selectedClinics.includes('all')) {
      setSelectedClinics([clinicId]);
      return;
    }

    // Existing logic for individual clinic selection
    if (selectedClinics.includes(clinicId)) {
      // Remove clinic
      setSelectedClinics(selectedClinics.filter(id => id !== clinicId));
    } else {
      // Add clinic
      if (selectedClinics.length >= 6) {
        alert('You can compare up to 6 clinics at a time');
        return;
      }
      setSelectedClinics([...selectedClinics, clinicId]);
    }
  };

  const handleAddPeriod = (periodKey) => {
    const period = availableComparisonPeriods.find(p => p.label === periodKey);
    if (period && !comparisonPeriods.some(p => p.label === period.label)) {
      if (comparisonPeriods.length >= 5) {
        alert('You can compare up to 5 additional periods against the current period');
        return;
      }
      setComparisonPeriods([...comparisonPeriods, period]);
    }
  };

  const handleRemovePeriod = (periodLabel) => {
    setComparisonPeriods(comparisonPeriods.filter(p => p.label !== periodLabel));
  };

  // Get all available line items from all categories
  const allAvailableLineItems = getAllLineItems();

  // Add the total/calculated line items (Total Income, Total Expenses, etc.)
  const totalLineItems = [
    { key: 'totalIncome', label: 'Total Income', category: 'totals', categoryLabel: 'Totals' },
    { key: 'totalCOGS', label: 'Total COGS', category: 'totals', categoryLabel: 'Totals' },
    { key: 'grossProfit', label: 'Gross Profit', category: 'totals', categoryLabel: 'Totals' },
    { key: 'totalExpenses', label: 'Total Expenses', category: 'totals', categoryLabel: 'Totals' },
    { key: 'netIncome', label: 'Net Income', category: 'totals', categoryLabel: 'Totals' },
  ];

  // Combine totals with all other line items
  const allLineItemsWithTotals = [...totalLineItems, ...allAvailableLineItems];

  // Handle adding/removing line items for comparison
  const handleAddLineItem = (itemKey) => {
    if (!selectedLineItems.some(item => item.key === itemKey)) {
      const item = allLineItemsWithTotals.find(i => i.key === itemKey);
      if (item) {
        setSelectedLineItems([...selectedLineItems, item]);
      }
    }
  };

  const handleRemoveLineItem = (itemKey) => {
    setSelectedLineItems(selectedLineItems.filter(item => item.key !== itemKey));
  };

  const getLineItemValue = (period, lineItemKey) => {
    if (!period) return 0;

    // Check top-level fields first
    if (period[lineItemKey] !== undefined) {
      return period[lineItemKey];
    }

    // Check in lineItems nested structure
    if (period.lineItems) {
      for (const category of ['income', 'cogs', 'expenses', 'other']) {
        if (period.lineItems[category]?.[lineItemKey] !== undefined) {
          return period.lineItems[category][lineItemKey];
        }
      }
    }

    return 0;
  };

  if (clinicsLoading || dataRangeLoading) {
    return <Loading message="Loading..." />;
  }

  // Month names for display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Prepare dynamic line item comparison data for time-series visualization
  const monthlyRecords = comparisonData?.monthlyRecords || [];

  // Create a map of unique months across all periods
  // Use month number (1-12) as key to align same months from different years
  const monthsMap = new Map();
  comparisonData?.periods?.forEach(period => {
    period.monthlyRecords?.forEach(record => {
      const monthKey = record.month; // Use month number (1-12) to align across years
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          label: monthNames[monthKey - 1], // Display "January" instead of "1/2025"
          month: monthKey,
          date: record.date,
          periods: {}
        });
      }
      monthsMap.get(monthKey).periods[period.label] = record;
    });
  });

  // Transform data for ONE modular chart showing all selected line items
  // For each month, create data point with all period+lineItem combinations
  const combinedChartData = Array.from(monthsMap.values())
    .sort((a, b) => {
      // Sort chronologically by actual date with timezone fix
      const dateA = a.date.includes('T') ? a.date.split('T')[0] + 'T00:00:00' : a.date + 'T00:00:00';
      const dateB = b.date.includes('T') ? b.date.split('T')[0] + 'T00:00:00' : b.date + 'T00:00:00';
      return new Date(dateA) - new Date(dateB);
    })
    .map(monthData => {
      const dataPoint = {
        label: monthData.label,
        month: monthData.month,
        date: monthData.date,
      };

      // For each period and each selected line item, add a data key
      comparisonData?.periods?.forEach(period => {
        selectedLineItems.forEach(item => {
          const periodRecord = monthData.periods[period.label];
          let value = 0;

          if (periodRecord) {
            // Get the value for the selected line item
            value = getLineItemValue(periodRecord, item.key);
          }

          // Key format: "PeriodLabel - LineItemLabel"
          const dataKey = `${period.label} - ${item.label}`;
          dataPoint[dataKey] = Number(value);
        });
      });

      return dataPoint;
    });

  // Handle CSV export
  const handleExportToCSV = () => {
    if (tableView === 'monthly') {
      exportMonthlyDataToCSV();
    } else {
      exportTotalsDataToCSV();
    }
  };

  // Export monthly breakdown to CSV
  const exportMonthlyDataToCSV = () => {
    const headers = ['Month'];
    comparisonData?.periods?.forEach(period => {
      selectedLineItems.forEach(item => {
        headers.push(`${period.label} - ${item.label}`);
      });
    });

    const rows = [];
    combinedChartData.forEach(monthData => {
      const row = [monthData.label];
      comparisonData?.periods?.forEach(period => {
        selectedLineItems.forEach(item => {
          const dataKey = `${period.label} - ${item.label}`;
          const value = monthData[dataKey] || 0;
          row.push(value);
        });
      });
      rows.push(row);
    });

    const totalsRow = ['TOTAL'];
    comparisonData?.periods?.forEach(period => {
      selectedLineItems.forEach(item => {
        const total = combinedChartData.reduce((sum, monthData) => {
          const dataKey = `${period.label} - ${item.label}`;
          return sum + (Number(monthData[dataKey]) || 0);
        }, 0);
        totalsRow.push(total);
      });
    });
    rows.push(totalsRow);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `period-comparison-monthly-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export totals to CSV
  const exportTotalsDataToCSV = () => {
    const headers = ['Metric'];
    comparisonData?.periods?.forEach(period => {
      headers.push(period.label);
    });

    const rows = [];
    selectedLineItems.forEach(item => {
      const row = [item.label];
      comparisonData?.periods?.forEach(period => {
        const total = combinedChartData.reduce((sum, monthData) => {
          const dataKey = `${period.label} - ${item.label}`;
          return sum + (Number(monthData[dataKey]) || 0);
        }, 0);
        row.push(total);
      });
      rows.push(row);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `period-comparison-totals-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Export Button Row */}
      <div className="flex justify-end">
        {selectedClinics.length > 0 && (
          <ExportButton
            clinicId={selectedClinics[0]}
            startDate={currentStart}
            endDate={currentEnd}
          />
        )}
      </div>

      {/* Clinic Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedClinics.includes('all')
            ? 'All Clinics (Consolidated View)'
            : `Select Clinics to Compare (${selectedClinics.length}/6)`
          }
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* All Clinics Option */}
          <button
            onClick={() => handleClinicToggle('all')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedClinics.includes('all')
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">All Clinics</h3>
                <p className="text-sm text-gray-500">Consolidated view across all locations</p>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedClinics.includes('all') ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                {selectedClinics.includes('all') && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
          </button>

          {/* Individual Clinic Cards */}
          {clinics?.map((clinic) => {
            const isSelected = selectedClinics.includes(clinic.id);
            return (
              <button
                key={clinic.id}
                onClick={() => handleClinicToggle(clinic.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{clinic.name}</h3>
                    <p className="text-sm text-gray-500">{clinic.location}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedClinics.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600 text-lg">
            Select at least one clinic above to start comparing
          </p>
        </div>
      ) : comparisonLoading ? (
        <Loading message="Loading comparison data..." />
      ) : comparisonError ? (
        <ErrorMessage message={comparisonError.message} />
      ) : (
        <>
          {/* Period Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Period Comparison
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select additional periods to compare against your current period
            </p>

            {/* Current Period (always included) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Period (Auto-selected from Universal Filter)
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-200 rounded-lg">
                <span className="text-sm text-gray-900">{currentPeriod.label}</span>
                <span className="text-xs text-gray-500">
                  ({format(parseISO(currentStart), 'MMM d, yyyy')} - {format(parseISO(currentEnd), 'MMM d, yyyy')})
                </span>
              </div>
            </div>

            {/* Period Dropdown Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Additional Periods to Compare
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddPeriod(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Select a period to add --</option>
                <optgroup label={isFullYear ? "Previous Years (Full Year)" : "Matching Time Periods"}>
                  {availableComparisonPeriods.filter(p => !p.label.includes('Full Year') || isFullYear).map((period) => (
                    <option
                      key={period.label}
                      value={period.label}
                      disabled={comparisonPeriods.some(p => p.label === period.label) || !period.hasData}
                    >
                      {period.label}{!period.hasData ? ' (No Data Available)' : ''}
                    </option>
                  ))}
                </optgroup>
                {!isFullYear && (
                  <optgroup label="Full Year Options">
                    {availableComparisonPeriods.filter(p => p.label.includes('Full Year')).map((period) => (
                      <option
                        key={period.label}
                        value={period.label}
                        disabled={comparisonPeriods.some(p => p.label === period.label) || !period.hasData}
                      >
                        {period.label}{!period.hasData ? ' (No Data Available)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Selected Comparison Periods */}
            {comparisonPeriods.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Comparison Periods ({comparisonPeriods.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {comparisonPeriods.map((period) => (
                    <div
                      key={period.label}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-200 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{period.label}</span>
                      <span className="text-xs text-gray-500">
                        ({format(parseISO(period.startDate), 'MMM d')} - {format(parseISO(period.endDate), 'MMM d, yyyy')})
                      </span>
                      <button
                        onClick={() => handleRemovePeriod(period.label)}
                        className="text-gray-400 hover:text-danger-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Line Item Selector - All P&L metrics available */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Line Item Comparison
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select any P&L line items to compare across time periods - view monthly trends and totals
            </p>

            {/* Line Item Selector - All items from all categories */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Line Items from P&L
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddLineItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Select a line item to add --</option>
                {allLineItemsWithTotals.map((item) => (
                  <option
                    key={item.key}
                    value={item.key}
                    disabled={selectedLineItems.some((i) => i.key === item.key)}
                  >
                    {item.categoryLabel} → {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Line Items */}
            {selectedLineItems.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Line Items ({selectedLineItems.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedLineItems.map((item) => (
                    <div
                      key={item.key}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-200 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{item.label}</span>
                      <span className="text-xs text-gray-500">
                        ({item.categoryLabel})
                      </span>
                      <button
                        onClick={() => handleRemoveLineItem(item.key)}
                        className="text-gray-400 hover:text-danger-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Charts for selected line items */}
          {selectedLineItems.length > 0 && (
            <ChartCard
              title="Line Items Comparison - Period Trends"
              subtitle={`Comparing ${selectedLineItems.length} line item(s) across ${comparisonData?.periods?.length || 0} period(s)`}
              isEmpty={combinedChartData.length === 0}
            >
              {/* Chart Controls */}
              <div className="mb-4">
                <ChartControls
                  chartType={chartType}
                  onChartTypeChange={setChartType}
                  isStacked={isStacked}
                  onStackedChange={setIsStacked}
                  showStackingToggle={true}
                  availableTypes={['bar', 'line', 'area']}
                />
              </div>

              {/* Warning for stacking metrics with potential negative values */}
              {isStacked && chartType === 'bar' && selectedLineItems.some(item =>
                ['netOrdinaryIncome', 'netIncome', 'grossProfit'].includes(item.key)
              ) && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">
                      Stacking Recommendation
                    </h4>
                    <p className="text-sm text-amber-800">
                      You're comparing metrics that can have negative values (losses). Stacked view adds values together, which may not be meaningful for profit/loss metrics. Consider using <button onClick={() => setIsStacked(false)} className="font-semibold underline hover:text-amber-900">Grouped view</button> instead for clearer comparison.
                    </p>
                  </div>
                </div>
              )}

              {/* Flexible Comparison Chart */}
              <FlexibleComparisonChart
                data={combinedChartData}
                chartType={chartType}
                isStacked={isStacked}
                clinics={comparisonData?.periods || []}
                selectedLineItems={selectedLineItems}
                height={500}
              />
            </ChartCard>
          )}

          {/* Data table for selected line items */}
          {selectedLineItems.length > 0 && (
            <div className="bg-white border border-gray-300 p-2">
              {/* Table Header with View Toggle */}
              <div className="px-4 py-2 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {tableView === 'monthly' ? 'Monthly Breakdown' : 'Line Item Totals'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {tableView === 'monthly'
                        ? `Monthly data for selected line items across all periods`
                        : `Aggregated totals for selected line items across all periods`
                      }
                    </p>
                  </div>

                  {/* View Toggle and Export Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTableView('monthly')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        tableView === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setTableView('totals')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        tableView === 'totals'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Totals
                    </button>
                    <button
                      onClick={handleExportToCSV}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              {tableView === 'monthly' && (
                <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-gray-100">
                        <th className="sticky left-0 z-30 bg-gray-100 px-2 py-1 text-left font-semibold text-gray-900 border-b-2 border-gray-400 min-w-[180px] text-xs">
                          Month
                        </th>
                        {comparisonData?.periods?.map((period, periodIndex) =>
                          selectedLineItems.map((item, index) => (
                            <React.Fragment key={`${period.label}-${item.key}-frag`}>
                              <th
                                key={`${period.label}-${item.key}`}
                                className="px-2 py-1 text-right font-semibold text-gray-700 border-b-2 border-gray-400 min-w-[90px] text-xs"
                                style={{
                                  borderLeft: index === 0 ? '2px solid #e5e7eb' : 'none'
                                }}
                              >
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-gray-700">{period.label}</span>
                                  <span className="font-normal">{item.label}</span>
                                </div>
                              </th>
                              {/* Add variance column after each period group (except first) */}
                              {periodIndex > 0 && index === selectedLineItems.length - 1 && (
                                <th
                                  key={`var-${period.label}`}
                                  className="px-2 py-1 text-center font-semibold text-gray-700 border-b-2 border-gray-400 min-w-[70px] text-xs bg-gray-50"
                                >
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold">Var%</span>
                                    <span className="font-normal text-[10px]">vs {comparisonData.periods[periodIndex - 1].label}</span>
                                  </div>
                                </th>
                              )}
                            </React.Fragment>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {combinedChartData.map((monthData) => (
                        <tr key={monthData.label} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-10 bg-white px-2 py-0.5 text-gray-700 border-b border-gray-300 text-xs">
                            {monthData.label}
                          </td>
                          {comparisonData?.periods?.map((period, periodIndex) =>
                            selectedLineItems.map((item, index) => {
                              const dataKey = `${period.label} - ${item.label}`;
                              const value = monthData[dataKey] || 0;

                              // Calculate variance for this period group (last line item in period)
                              let varianceCell = null;
                              if (periodIndex > 0 && index === selectedLineItems.length - 1) {
                                // Get total for this period (sum of all line items in this row)
                                const currentTotal = selectedLineItems.reduce((sum, li) => {
                                  return sum + (monthData[`${period.label} - ${li.label}`] || 0);
                                }, 0);

                                // Get total for previous period
                                const prevPeriod = comparisonData.periods[periodIndex - 1];
                                const prevTotal = selectedLineItems.reduce((sum, li) => {
                                  return sum + (monthData[`${prevPeriod.label} - ${li.label}`] || 0);
                                }, 0);

                                const variance = calculateVariance(currentTotal, prevTotal);
                                const formatted = formatVariance(variance, false);

                                varianceCell = (
                                  <td
                                    key={`var-${period.label}-${item.key}`}
                                    className={`px-2 py-0.5 text-center text-xs border-b border-gray-300 bg-gray-50 ${formatted.colorClass}`}
                                  >
                                    {formatted.display}{formatted.icon}
                                  </td>
                                );
                              }

                              return (
                                <React.Fragment key={`${period.label}-${item.key}-data-frag`}>
                                  <td
                                    key={`${period.label}-${item.key}`}
                                    className={`px-2 py-0.5 text-right font-mono text-xs border-b border-gray-300 ${
                                      value < 0 ? 'text-danger-600 font-semibold' : 'text-gray-900'
                                    }`}
                                    style={{
                                      borderLeft: index === 0 ? '2px solid #e5e7eb' : 'none'
                                    }}
                                  >
                                    {formatCurrencyAccounting(value)}
                                  </td>
                                  {varianceCell}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tr>
                      ))}

                      {/* Total Row */}
                      <tr className="bg-blue-50 font-semibold">
                        <td className="sticky left-0 z-10 bg-blue-50 px-2 py-1 text-gray-900 border-b border-gray-300 text-xs">
                          TOTAL
                        </td>
                        {comparisonData?.periods?.map((period, periodIndex) =>
                          selectedLineItems.map((item, index) => {
                            const total = combinedChartData.reduce((sum, monthData) => {
                              const dataKey = `${period.label} - ${item.label}`;
                              return sum + (Number(monthData[dataKey]) || 0);
                            }, 0);

                            // Calculate variance for total row
                            let varianceTotalCell = null;
                            if (periodIndex > 0 && index === selectedLineItems.length - 1) {
                              // Get total for this period (sum of all line items)
                              const currentTotal = selectedLineItems.reduce((sum, li) => {
                                return sum + combinedChartData.reduce((monthSum, monthData) => {
                                  return monthSum + (Number(monthData[`${period.label} - ${li.label}`]) || 0);
                                }, 0);
                              }, 0);

                              // Get total for previous period
                              const prevPeriod = comparisonData.periods[periodIndex - 1];
                              const prevTotal = selectedLineItems.reduce((sum, li) => {
                                return sum + combinedChartData.reduce((monthSum, monthData) => {
                                  return monthSum + (Number(monthData[`${prevPeriod.label} - ${li.label}`]) || 0);
                                }, 0);
                              }, 0);

                              const variance = calculateVariance(currentTotal, prevTotal);
                              const formatted = formatVariance(variance, false);

                              varianceTotalCell = (
                                <td
                                  key={`var-total-${period.label}`}
                                  className={`px-2 py-1 text-center text-xs border-b border-gray-300 bg-blue-100 ${formatted.colorClass}`}
                                >
                                  {formatted.display}{formatted.icon}
                                </td>
                              );
                            }

                            return (
                              <React.Fragment key={`${period.label}-${item.key}-total-frag`}>
                                <td
                                  key={`${period.label}-${item.key}-total`}
                                  className={`px-2 py-1 text-right font-mono border-b border-gray-300 text-xs ${
                                    total < 0 ? 'text-danger-600 font-bold' : 'text-gray-900'
                                  }`}
                                  style={{
                                    borderLeft: index === 0 ? '2px solid #e5e7eb' : 'none'
                                  }}
                                >
                                  {formatCurrencyAccounting(total)}
                                </td>
                                {varianceTotalCell}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals Table */}
              {tableView === 'totals' && (
                <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-gray-100">
                        <th className="sticky left-0 z-30 bg-gray-100 px-2 py-1 text-left font-semibold text-gray-900 border-b-2 border-gray-400 min-w-[180px] text-xs">
                          Period
                        </th>
                        {selectedLineItems.map((item) => (
                          <th key={item.key} className="px-2 py-1 text-right font-semibold text-gray-700 border-b-2 border-gray-400 min-w-[90px] text-xs">
                            {item.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData?.periods?.map((period) => {
                        const lineItemTotals = selectedLineItems.map(item => {
                          const total = combinedChartData.reduce((sum, monthData) => {
                            const dataKey = `${period.label} - ${item.label}`;
                            return sum + (Number(monthData[dataKey]) || 0);
                          }, 0);
                          return { key: item.key, total };
                        });

                        return (
                          <tr key={period.label} className="hover:bg-gray-50">
                            <td className="sticky left-0 z-10 bg-white px-2 py-0.5 border-b border-gray-300">
                              <div className="text-xs font-medium text-gray-900">
                                {period.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(parseISO(period.startDate), 'MMM d, yyyy')} - {format(parseISO(period.endDate), 'MMM d, yyyy')}
                              </div>
                            </td>
                            {lineItemTotals.map((item) => (
                              <td
                                key={item.key}
                                className={`px-2 py-0.5 text-right font-mono text-xs border-b border-gray-300 ${
                                  item.total < 0 ? 'text-danger-600 font-semibold' : 'text-gray-900'
                                }`}
                              >
                                {formatCurrencyAccounting(item.total)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PeriodComparison;
