import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { COMPARISON_COLORS, CHART_CONFIG } from '../../config/chartTheme';
import { formatCurrency } from '../../utils/dataTransformers';
import CustomTooltip from '../shared/CustomTooltip';

/**
 * Reusable Expense Breakdown Chart Component
 * Shows expense categories as a pie chart
 */
const ExpenseBreakdownChart = ({ data, title = 'Expense Breakdown', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="section-header mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  // Prepare chart data with percentages
  const chartData = data.map(item => ({
    name: item.name,
    value: Number(item.value || 0),
    percentage: total > 0 ? ((Number(item.value || 0) / total) * 100).toFixed(1) : 0,
  }));

  // Custom formatter for pie chart tooltip
  const pieTooltipFormatter = (value, name, props) => {
    return `${formatCurrency(value)} (${props.payload.percentage}%)`;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (parseFloat(percentage) < 5) return null; // Don't show labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="card p-6">
      <h3 className="section-header mb-4">{title}</h3>
      <div role="img" aria-label={`pie chart showing expense breakdown across ${chartData.length} categories`}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart aria-hidden="true">
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              animationDuration={CHART_CONFIG.animation.duration}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COMPARISON_COLORS[index % COMPARISON_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatter={pieTooltipFormatter} />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => `${value}: ${formatCurrency(entry.payload.value)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseBreakdownChart;
