import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/dataTransformers';

/**
 * Expense Breakdown Chart Component
 * Horizontal bar chart showing expense categories sorted by amount
 * Used in clinic view for expense analysis
 */
const ExpenseBreakdownChart = ({
  data = [],
  title = 'Expense Breakdown',
  height = 350,
  isLoading = false,
  topN = 10,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="h-[350px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="h-[350px] flex items-center justify-center text-gray-500">
          <p>No expense data available</p>
        </div>
      </div>
    );
  }

  // Sort by amount descending and take top N
  const sortedData = [...data]
    .sort((a, b) => (b.amount || b.value) - (a.amount || a.value))
    .slice(0, topN)
    .map((item) => ({
      name: item.name || item.category,
      value: Number(item.amount || item.value || 0),
    }));

  // Calculate total for percentages
  const total = sortedData.reduce((sum, item) => sum + item.value, 0);

  // Color palette for bars
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{item.name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(item.value)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Percentage:</span>
              <span className="text-sm font-medium text-gray-900">
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#9ca3af"
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(value)
            }
          />

          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#9ca3af"
            width={110}
          />

          <Tooltip content={<CustomTooltip />} />

          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary below chart */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Showing top {sortedData.length} expense categories
        </span>
        <span className="text-sm font-semibold text-gray-900">
          Total: {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
};

export default ExpenseBreakdownChart;
