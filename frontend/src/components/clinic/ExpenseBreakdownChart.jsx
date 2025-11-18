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
import { COMPARISON_COLORS, CHART_CONFIG, formatAxisValue } from '../../config/chartTheme';
import CustomTooltip from '../shared/CustomTooltip';

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div role="img" aria-label={`horizontal bar chart showing top ${sortedData.length} expense categories`}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            aria-hidden="true"
          >
            <CartesianGrid {...CHART_CONFIG.grid} />

            <XAxis
              type="number"
              tickFormatter={formatAxisValue}
              {...CHART_CONFIG.axis}
            />

            <YAxis
              type="category"
              dataKey="name"
              {...CHART_CONFIG.axis}
              width={110}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={CHART_CONFIG.animation.duration}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COMPARISON_COLORS[index % COMPARISON_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

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
