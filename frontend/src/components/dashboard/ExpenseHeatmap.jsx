import { formatCurrency } from '../../utils/dataTransformers';
import { Download } from 'lucide-react';

/**
 * Expense Heatmap Component
 * Color-coded table showing expense categories across time periods
 * Matches the "AI Consolidated Expenses by Tool Value" visualization
 */
const ExpenseHeatmap = ({
  data = [],
  title = 'Consolidated Expenses by Category',
  subtitle = 'Monthly expense distribution with heat mapping',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
        <div className="h-[500px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <p>No expense data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Extract all unique periods from the data
  const periods = data.length > 0 ? Object.keys(data[0].monthlyValues || {}) : [];

  // Calculate max value for color scaling
  const allValues = data.flatMap((category) =>
    Object.values(category.monthlyValues || {})
  );
  const maxValue = Math.max(...allValues, 1);

  // Function to get color intensity based on value
  const getColorIntensity = (value) => {
    if (!value || value === 0) return 'bg-white';

    const intensity = Math.min((value / maxValue) * 100, 100);

    if (intensity >= 80) return 'bg-red-500 text-white';
    if (intensity >= 60) return 'bg-red-400 text-white';
    if (intensity >= 40) return 'bg-red-300';
    if (intensity >= 20) return 'bg-red-200';
    return 'bg-red-100';
  };

  // Calculate row totals
  const getCategoryTotal = (monthlyValues) => {
    return Object.values(monthlyValues || {}).reduce((sum, val) => sum + val, 0);
  };

  // Calculate column totals
  const getColumnTotal = (period) => {
    return data.reduce((sum, category) => {
      return sum + (category.monthlyValues?.[period] || 0);
    }, 0);
  };

  // Calculate grand total
  const grandTotal = data.reduce((sum, category) => {
    return sum + getCategoryTotal(category.monthlyValues);
  }, 0);

  const handleExport = () => {
    // Create CSV content
    const headers = ['Category', ...periods, 'Total'];
    const rows = data.map((category) => [
      category.name,
      ...periods.map((p) => category.monthlyValues?.[p] || 0),
      getCategoryTotal(category.monthlyValues),
    ]);

    const totalsRow = [
      'Total',
      ...periods.map((p) => getColumnTotal(p)),
      grandTotal,
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      totalsRow.join(','),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-heatmap-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
        <span className="text-sm text-gray-600 font-medium">Intensity:</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 border border-gray-300"></div>
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-300 border border-gray-300"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 border border-gray-300"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[200px]">
                Category
              </th>
              {periods.map((period) => (
                <th
                  key={period}
                  className="px-4 py-3 text-right font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[100px]"
                >
                  {period}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border-b-2 border-gray-300 bg-gray-100 min-w-[120px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((category, idx) => {
              const rowTotal = getCategoryTotal(category.monthlyValues);
              return (
                <tr
                  key={category.name || idx}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-gray-900 border-b border-gray-200">
                    {category.name}
                  </td>
                  {periods.map((period) => {
                    const value = category.monthlyValues?.[period] || 0;
                    const colorClass = getColorIntensity(value);
                    return (
                      <td
                        key={period}
                        className={`px-4 py-3 text-right border-b border-gray-200 font-mono ${colorClass}`}
                      >
                        {value > 0 ? formatCurrency(value) : '-'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 border-b border-gray-200 bg-gray-50">
                    {formatCurrency(rowTotal)}
                  </td>
                </tr>
              );
            })}
            {/* Totals Row */}
            <tr className="bg-gray-100 font-semibold">
              <td className="sticky left-0 z-10 bg-gray-100 px-4 py-3 text-gray-900 border-t-2 border-gray-300">
                Total
              </td>
              {periods.map((period) => (
                <td
                  key={period}
                  className="px-4 py-3 text-right text-gray-900 border-t-2 border-gray-300"
                >
                  {formatCurrency(getColumnTotal(period))}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-gray-900 border-t-2 border-gray-300 bg-gray-200">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseHeatmap;
