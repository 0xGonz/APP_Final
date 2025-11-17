import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatMonthLabel } from '../../utils/dataTransformers';
import { CHART_COLORS, CHART_CONFIG, formatAxisValue } from '../../config/chartTheme';

/**
 * Financial Trend Chart Component
 * Area chart showing Total Income, Total Expenses, and NOI over time
 * Matches the KPI cards metrics
 */
const FinancialTrendChart = ({
  data = [],
  title = 'Monthly Financial Performance',
  subtitle = 'Monthly Trend Analysis',
  height = 400,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="h-[400px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Transform data to ensure proper format
  const chartData = data.map((item) => ({
    ...item,
    label: item.label || formatMonthLabel(item),
    totalIncome: Number(item.totalIncome || 0),
    totalExpenses: Number(item.totalExpenses || 0),
    noi: Number(item.netOrdinaryIncome || 0),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const totalIncome = payload.find((p) => p.dataKey === 'totalIncome')?.value || 0;
      const totalExpenses = payload.find((p) => p.dataKey === 'totalExpenses')?.value || 0;
      const noi = payload.find((p) => p.dataKey === 'noi')?.value || 0;

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Total Income</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Total Expenses</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-gray-700">NOI</span>
                </div>
                <span className={`text-sm font-bold ${noi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(noi)}
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Gradient for Total Income */}
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0.3} />
            </linearGradient>
            {/* Gradient for Total Expenses */}
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0.3} />
            </linearGradient>
            {/* Gradient for NOI */}
            <linearGradient id="colorNOI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid {...CHART_CONFIG.grid} />

          <XAxis dataKey="label" {...CHART_CONFIG.axis} />

          <YAxis tickFormatter={formatAxisValue} {...CHART_CONFIG.axis} />

          <Tooltip
            content={<CustomTooltip />}
            contentStyle={CHART_CONFIG.tooltip.contentStyle}
            labelStyle={CHART_CONFIG.tooltip.labelStyle}
          />

          <Legend {...CHART_CONFIG.legend} />

          {/* Separate areas - NOT stacked */}
          <Area
            type="monotone"
            dataKey="totalIncome"
            name="Total Income"
            stroke={CHART_COLORS.income}
            fill="url(#colorIncome)"
            strokeWidth={2}
          />

          <Area
            type="monotone"
            dataKey="totalExpenses"
            name="Total Expenses"
            stroke={CHART_COLORS.expenses}
            fill="url(#colorExpenses)"
            strokeWidth={2}
          />

          <Area
            type="monotone"
            dataKey="noi"
            name="NOI"
            stroke={CHART_COLORS.profit}
            fill="url(#colorNOI)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinancialTrendChart;
