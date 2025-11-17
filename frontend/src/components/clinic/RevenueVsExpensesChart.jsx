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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const revenue = payload.find((p) => p.dataKey === 'revenue')?.value || 0;
      const expenses = payload.find((p) => p.dataKey === 'expenses')?.value || 0;
      const netIncome = revenue - expenses;

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(expenses)}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-700">Net Income</span>
                <span className={`text-sm font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </span>
              </div>
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
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#9ca3af"
          />

          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#9ca3af"
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(value)
            }
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
          />

          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />

          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueVsExpensesChart;
