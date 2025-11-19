import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Check, X, Plus, Trash2, Download } from 'lucide-react';
import { clinicsAPI, financialsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ExportButton from '../components/ExportButton';
import ChartCard from '../components/shared/ChartCard';
import ChartControls from '../components/charts/ChartControls';
import FlexibleComparisonChart from '../components/charts/FlexibleComparisonChart';
import { formatCurrency, formatCurrencyAccounting } from '../utils/dataTransformers';
import { useDateFilter } from '../context/DateFilterContext';
import { COMPARISON_COLORS, CHART_CONFIG, formatAxisValue, getColorByIndex } from '../config/chartTheme';
import { LINE_ITEMS, getAllLineItems, getLineItemValue } from '../config/lineItems';

const Comparison = () => {
  const { startDate, endDate, selectedClinics, toggleClinicSelection } = useDateFilter();

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

  // Fetch comparison data
  const {
    data: comparisonData,
    isLoading: comparisonLoading,
    error: comparisonError,
  } = useQuery({
    queryKey: ['comparison', selectedClinics, startDate, endDate],
    queryFn: () =>
      financialsAPI.compare(selectedClinics, {
        startDate,
        endDate,
      }),
    enabled: selectedClinics.length > 0,
  });

  const handleClinicToggle = (clinicId) => {
    if (selectedClinics.length >= 6 && !selectedClinics.includes(clinicId)) {
      alert('You can compare up to 6 clinics at a time');
      return;
    }
    toggleClinicSelection(clinicId, 6);
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

  // Create a stable color mapping based on clinic ID (not array position)
  // This ensures each clinic always gets the same color regardless of selection order
  const getClinicColor = (clinicId) => {
    if (!clinics) return getColorByIndex(0);

    // Find the clinic's index in the full clinic list (not just selected clinics)
    const clinicIndex = clinics.findIndex(c => c.id === clinicId);
    return getColorByIndex(clinicIndex >= 0 ? clinicIndex : 0);
  };

  if (clinicsLoading) {
    return <Loading message="Loading clinics..." />;
  }

  // Prepare chart data
  const revenueData = comparisonData?.clinics?.map((clinic) => ({
    name: clinic.name,
    'Total Income': parseFloat(clinic.totalIncome || 0),
    'Net Income': parseFloat(clinic.netIncome || 0),
  })) || [];

  const expenseData = comparisonData?.clinics?.map((clinic) => ({
    name: clinic.name,
    COGS: parseFloat(clinic.totalCOGS || 0),
    Expenses: parseFloat(clinic.totalExpenses || 0),
  })) || [];

  const marginData = comparisonData?.clinics?.map((clinic) => ({
    name: clinic.name,
    'Gross Margin': parseFloat(clinic.grossMargin || 0),
    'Net Margin': parseFloat(clinic.netMargin || 0),
  })) || [];

  // Prepare radar chart data for performance comparison
  const radarData = [
    {
      metric: 'Revenue',
      ...Object.fromEntries(
        comparisonData?.clinics?.map((clinic) => [
          clinic.name,
          parseFloat(clinic.totalIncome || 0) / 1000000, // Scale down for better visualization
        ]) || []
      ),
    },
    {
      metric: 'Profitability',
      ...Object.fromEntries(
        comparisonData?.clinics?.map((clinic) => [
          clinic.name,
          parseFloat(clinic.netMargin || 0),
        ]) || []
      ),
    },
    {
      metric: 'Efficiency',
      ...Object.fromEntries(
        comparisonData?.clinics?.map((clinic) => [
          clinic.name,
          100 - parseFloat(clinic.expenseRatio || 0),
        ]) || []
      ),
    },
  ];

  // Prepare dynamic line item comparison data for time-series visualization
  // Group monthly records by date, then add selected metrics for each clinic
  const monthlyRecords = comparisonData?.monthlyRecords || [];

  // Create a map of unique months
  const monthsMap = new Map();
  monthlyRecords.forEach(record => {
    const monthKey = record.label; // e.g., "1/2024"
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        label: monthKey,
        date: record.date,
        clinics: {}
      });
    }
    monthsMap.get(monthKey).clinics[record.clinicId] = record;
  });

  // Transform data for ONE modular chart showing all selected line items
  // For each month, create data point with all clinic+lineItem combinations
  const combinedChartData = Array.from(monthsMap.values()).map(monthData => {
    const dataPoint = {
      label: monthData.label,
      date: monthData.date,
    };

    // For each clinic and each selected line item, add a data key
    comparisonData?.clinics?.forEach(clinic => {
      selectedLineItems.forEach(item => {
        const clinicRecord = monthData.clinics[clinic.id];
        let value = 0;

        if (clinicRecord) {
          // Get the value for the selected line item
          value = clinicRecord[item.key] || 0;
        }

        // Key format: "ClinicName - LineItemLabel"
        const dataKey = `${clinic.name} - ${item.label}`;
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
    // Build CSV header
    const headers = ['Month'];
    comparisonData?.clinics?.forEach(clinic => {
      selectedLineItems.forEach(item => {
        headers.push(`${clinic.name} - ${item.label}`);
      });
    });

    // Build CSV rows
    const rows = [];
    combinedChartData.forEach(monthData => {
      const row = [monthData.label];
      comparisonData?.clinics?.forEach(clinic => {
        selectedLineItems.forEach(item => {
          const dataKey = `${clinic.name} - ${item.label}`;
          const value = monthData[dataKey] || 0;
          row.push(value);
        });
      });
      rows.push(row);
    });

    // Add totals row
    const totalsRow = ['TOTAL'];
    comparisonData?.clinics?.forEach(clinic => {
      selectedLineItems.forEach(item => {
        const total = combinedChartData.reduce((sum, monthData) => {
          const dataKey = `${clinic.name} - ${item.label}`;
          return sum + (Number(monthData[dataKey]) || 0);
        }, 0);
        totalsRow.push(total);
      });
    });
    rows.push(totalsRow);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparison-monthly-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export totals to CSV
  const exportTotalsDataToCSV = () => {
    // Build CSV header
    const headers = ['Metric'];
    comparisonData?.clinics?.forEach(clinic => {
      headers.push(clinic.name);
    });

    // Build CSV rows
    const rows = [];
    selectedLineItems.forEach(item => {
      const row = [item.label];
      comparisonData?.clinics?.forEach(clinic => {
        const total = combinedChartData.reduce((sum, monthData) => {
          const dataKey = `${clinic.name} - ${item.label}`;
          return sum + (Number(monthData[dataKey]) || 0);
        }, 0);
        row.push(total);
      });
      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparison-totals-${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>

      {/* Clinic Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Clinics to Compare ({selectedClinics.length}/6)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          {/* Line Item Selector - All P&L metrics available */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Line Item Comparison
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select any P&L line items to compare across clinics - view monthly trends and totals
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
              title="Line Items Comparison - Monthly Trends"
              subtitle={`Comparing ${selectedLineItems.length} line item(s) across ${comparisonData?.clinics?.length || 0} clinic(s)`}
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
                clinics={comparisonData?.clinics || []}
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
                        ? `Monthly data for selected line items (${format(new Date(startDate + 'T00:00:00'), 'MMM d, yyyy')} - ${format(new Date(endDate + 'T00:00:00'), 'MMM d, yyyy')})`
                        : `Aggregated totals for selected line items (${format(new Date(startDate + 'T00:00:00'), 'MMM d, yyyy')} - ${format(new Date(endDate + 'T00:00:00'), 'MMM d, yyyy')})`
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
                        {comparisonData?.clinics?.map((clinic) =>
                          selectedLineItems.map((item, index) => (
                            <th
                              key={`${clinic.id}-${item.key}`}
                              className="px-2 py-1 text-right font-semibold text-gray-700 border-b-2 border-gray-400 min-w-[90px] text-xs"
                              style={{
                                borderLeft: index === 0 ? '2px solid #e5e7eb' : 'none'
                              }}
                            >
                              <div className="flex flex-col items-end">
                                <span className="font-semibold text-gray-700">{clinic.name}</span>
                                <span className="font-normal">{item.label}</span>
                              </div>
                            </th>
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
                          {comparisonData?.clinics?.map((clinic) =>
                            selectedLineItems.map((item, index) => {
                              const dataKey = `${clinic.name} - ${item.label}`;
                              const value = monthData[dataKey] || 0;
                              return (
                                <td
                                  key={`${clinic.id}-${item.key}`}
                                  className={`px-2 py-0.5 text-right font-mono text-xs border-b border-gray-300 ${
                                    value < 0 ? 'text-danger-600 font-semibold' : 'text-gray-900'
                                  }`}
                                  style={{
                                    borderLeft: index === 0 ? '2px solid #e5e7eb' : 'none'
                                  }}
                                >
                                  {formatCurrencyAccounting(value)}
                                </td>
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
                        {comparisonData?.clinics?.map((clinic) =>
                          selectedLineItems.map((item, index) => {
                            const total = combinedChartData.reduce((sum, monthData) => {
                              const dataKey = `${clinic.name} - ${item.label}`;
                              return sum + (Number(monthData[dataKey]) || 0);
                            }, 0);
                            return (
                              <td
                                key={`${clinic.id}-${item.key}-total`}
                                className={`px-2 py-1 text-right font-mono border-b border-gray-300 text-xs ${
                                  total < 0 ? 'text-danger-600 font-bold' : 'text-gray-900'
                                }`}
                                style={{
                                  borderLeft: index === 0 ? '2px solid #e5e7eb' : 'none'
                                }}
                              >
                                {formatCurrencyAccounting(total)}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals Table (existing implementation) */}
              {tableView === 'totals' && (
                <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-gray-100">
                        <th className="sticky left-0 z-30 bg-gray-100 px-2 py-1 text-left font-semibold text-gray-900 border-b-2 border-gray-400 min-w-[180px] text-xs">
                          Clinic
                        </th>
                        {selectedLineItems.map((item) => (
                          <th key={item.key} className="px-2 py-1 text-right font-semibold text-gray-700 border-b-2 border-gray-400 min-w-[90px] text-xs">
                            {item.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData?.clinics?.map((clinic) => {
                        const lineItemTotals = selectedLineItems.map(item => {
                          const clinicMonthlyRecords = monthlyRecords.filter(r => r.clinicId === clinic.id);
                          const total = clinicMonthlyRecords.reduce((sum, record) => {
                            return sum + (Number(record[item.key]) || 0);
                          }, 0);
                          return { key: item.key, total };
                        });

                        return (
                          <tr key={clinic.id} className="hover:bg-gray-50">
                            <td className="sticky left-0 z-10 bg-white px-2 py-0.5 border-b border-gray-300">
                              <div className="text-xs font-medium text-gray-900">
                                {clinic.name}
                              </div>
                              <div className="text-xs text-gray-500">{clinic.location}</div>
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

export default Comparison;
