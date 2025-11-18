import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatMonthLabel } from '../../utils/dataTransformers';
import { CHART_COLORS, CHART_CONFIG, formatAxisValue } from '../../config/chartTheme';
import CustomTooltip from '../shared/CustomTooltip';

/**
 * Revenue vs Expenses Chart Component
 * Side-by-side bar chart showing revenue (green) and expenses (red) by month
 * Used in clinic view for monthly comparison
 */
const RevenueVsExpensesChart = ({
  data = [],
  title = 'Monthly Financial Breakdown',
  height = 350,
  isLoading = false,
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
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Transform data to ensure proper format
  const chartData = data.map((item) => ({
    ...item,
    label: item.label || formatMonthLabel(item),
    revenue: Number(item.totalIncome || item.revenue || 0),
    expenses: Number(item.totalExpenses || item.expenses || 0),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div role="img" aria-label="grouped bar chart showing monthly revenue vs expenses comparison">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            aria-hidden="true"
          >
            <CartesianGrid {...CHART_CONFIG.grid} />

            <XAxis dataKey="label" {...CHART_CONFIG.axis} />

            <YAxis tickFormatter={formatAxisValue} {...CHART_CONFIG.axis} />

            <Tooltip content={<CustomTooltip />} />

            <Legend {...CHART_CONFIG.legend} />

            <Bar
              dataKey="revenue"
              name="Revenue"
              fill={CHART_COLORS.income}
              radius={[4, 4, 0, 0]}
              animationDuration={CHART_CONFIG.animation.duration}
            />

            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={CHART_COLORS.expenses}
              radius={[4, 4, 0, 0]}
              animationDuration={CHART_CONFIG.animation.duration}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueVsExpensesChart;
