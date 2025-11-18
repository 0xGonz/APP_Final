import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, CHART_CONFIG } from '../../config/chartTheme';
import CustomTooltip from '../shared/CustomTooltip';

/**
 * Reusable Profit Margin Chart Component
 * Shows gross margin and net margin trends over time
 */
const ProfitMarginChart = ({ data, title = 'Profit Margins', height = 300 }) => {
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
    return `${monthNames[item.month - 1]} ${item.year}`;
  };

  // Calculate margins and add to chart data
  const chartData = data.map(item => {
    const totalIncome = Number(item.totalIncome || 0);
    const totalCOGS = Number(item.totalCOGS || 0);
    const netIncome = Number(item.netIncome || 0);
    const grossProfit = totalIncome - totalCOGS;

    return {
      ...item,
      label: formatMonth(item),
      grossMargin: totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0,
      netMargin: totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0,
    };
  });

  // Custom formatter for percentage tooltip
  const percentFormatter = (value) => `${value.toFixed(1)}%`;

  return (
    <div className="card p-6">
      <h3 className="section-header mb-4">{title}</h3>
      <div role="img" aria-label={`line chart showing profit margin trends over ${chartData.length} months`}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={CHART_CONFIG.container.margin} aria-hidden="true">
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis dataKey="label" {...CHART_CONFIG.axis} />
            <YAxis
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              domain={[0, 100]}
              {...CHART_CONFIG.axis}
            />
            <Tooltip content={<CustomTooltip formatter={percentFormatter} />} />
            <Legend {...CHART_CONFIG.legend} />
            <Line
              type="monotone"
              dataKey="grossMargin"
              name="Gross Margin"
              stroke={CHART_COLORS.grossMargin}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_COLORS.grossMargin }}
              activeDot={{ r: 5 }}
              animationDuration={CHART_CONFIG.animation.duration}
            />
            <Line
              type="monotone"
              dataKey="netMargin"
              name="Net Margin"
              stroke={CHART_COLORS.netMargin}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_COLORS.netMargin }}
              activeDot={{ r: 5 }}
              animationDuration={CHART_CONFIG.animation.duration}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfitMarginChart;
