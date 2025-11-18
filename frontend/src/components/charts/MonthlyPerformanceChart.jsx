import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, CHART_CONFIG, formatAxisValue } from '../../config/chartTheme';
import CustomTooltip from '../shared/CustomTooltip';

/**
 * Reusable Monthly Performance Chart Component
 * Shows revenue, expenses, and profit as stacked/grouped bars
 */
const MonthlyPerformanceChart = ({ data, title = 'Monthly Performance', height = 350, stacked = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="section-header mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  // Format month labels
  const formatMonth = (item) => {
    if (!item.year || !item.month) return '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[item.month - 1]} ${String(item.year).slice(2)}`;
  };

  // Prepare chart data
  const chartData = data.map(item => ({
    ...item,
    label: formatMonth(item),
    totalIncome: Number(item.totalIncome || 0),
    totalExpenses: Number(item.totalExpenses || 0),
    netIncome: Number(item.netIncome || 0),
  }));

  return (
    <div className="card p-6">
      <h3 className="section-header mb-4">{title}</h3>
      <div role="img" aria-label={`${stacked ? 'stacked' : 'grouped'} bar chart showing monthly performance across ${chartData.length} months`}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={CHART_CONFIG.container.margin} aria-hidden="true">
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis dataKey="label" {...CHART_CONFIG.axis} />
            <YAxis tickFormatter={formatAxisValue} {...CHART_CONFIG.axis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend {...CHART_CONFIG.legend} />
            <Bar
              dataKey="totalIncome"
              name="Revenue"
              fill={CHART_COLORS.income}
              stackId={stacked ? "stack" : undefined}
              animationDuration={CHART_CONFIG.animation.duration}
            />
            <Bar
              dataKey="totalExpenses"
              name="Expenses"
              fill={CHART_COLORS.expenses}
              stackId={stacked ? "stack" : undefined}
              animationDuration={CHART_CONFIG.animation.duration}
            />
            <Bar
              dataKey="netIncome"
              name="Net Profit"
              fill={CHART_COLORS.profit}
              stackId={stacked ? "stack" : undefined}
              animationDuration={CHART_CONFIG.animation.duration}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyPerformanceChart;
