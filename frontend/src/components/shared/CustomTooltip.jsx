import { formatCurrency } from '../../utils/dataTransformers';

/**
 * Custom Tooltip Component for Recharts
 *
 * Provides consistent tooltip styling across all chart types.
 * Supports single and multiple data series.
 *
 * @param {boolean} active - Whether tooltip is active
 * @param {Array} payload - Data payload from Recharts
 * @param {string} label - X-axis label
 * @param {Function} formatter - Optional custom value formatter (defaults to formatCurrency)
 * @param {string} labelFormatter - Optional custom label formatter
 */
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatValue = formatter || formatCurrency;
  const formatLabel = labelFormatter || ((label) => label);

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        {formatLabel(label)}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">{entry.name || entry.dataKey}:</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomTooltip;
