import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, CHART_CONFIG, formatAxisValue } from '../../config/chartTheme';
import CustomTooltip from '../shared/CustomTooltip';

/**
 * Reusable Revenue Trend Chart Component
 * Works with both aggregated (dashboard) and individual clinic data
 */
const RevenueTrendChart = ({ data, title = 'Revenue Trend', height = 300, showArea = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="section-header mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  // Format month labels (e.g., "Jan 2023")
  const formatMonth = (item) => {
    if (!item.year || !item.month) return '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[item.month - 1]} ${item.year}`;
  };

  // Add formatted labels to data
  const chartData = data.map(item => ({
    ...item,
    label: formatMonth(item),
    totalIncome: Number(item.totalIncome || 0),
  }));

  const Chart = showArea ? AreaChart : LineChart;
  const ChartComponent = showArea ? Area : Line;
  const chartType = showArea ? 'area chart' : 'line chart';

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0">{title}</h3>
        <span className="text-xs text-gray-500 font-medium">{data.length} months</span>
      </div>
      <div role="img" aria-label={`${chartType} showing revenue trend over ${data.length} months`}>
        <ResponsiveContainer width="100%" height={height}>
          <Chart data={chartData} margin={CHART_CONFIG.container.margin} aria-hidden="true">
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis dataKey="label" {...CHART_CONFIG.axis} />
            <YAxis tickFormatter={formatAxisValue} {...CHART_CONFIG.axis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend {...CHART_CONFIG.legend} />
            <ChartComponent
              type="monotone"
              dataKey="totalIncome"
              name="Revenue"
              stroke={CHART_COLORS.income}
              fill={CHART_COLORS.income}
              fillOpacity={showArea ? 0.6 : 1}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_COLORS.income }}
              activeDot={{ r: 5 }}
              animationDuration={CHART_CONFIG.animation.duration}
            />
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueTrendChart;
