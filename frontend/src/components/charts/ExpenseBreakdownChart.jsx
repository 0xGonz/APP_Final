import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * Reusable Expense Breakdown Chart Component
 * Shows expense categories as a pie chart
 */
const ExpenseBreakdownChart = ({ data, title = 'Expense Breakdown', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="section-header mb-4">{title}</h3>
        <p className="text-stone-500 text-center py-8">No data available</p>
      </div>
    );
  }

  // Color palette for the pie chart
  const COLORS = [
    '#0ea5e9', // Payroll (usually largest)
    '#f59e0b', // COGS
    '#10b981', // Rent
    '#ef4444', // Marketing
    '#8b5cf6', // Insurance
    '#ec4899', // Other
  ];

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  // Prepare chart data with percentages
  const chartData = data.map(item => ({
    name: item.name,
    value: Number(item.value || 0),
    percentage: total > 0 ? ((Number(item.value || 0) / total) * 100).toFixed(1) : 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-stone-200 rounded shadow-lg">
          <p className="font-semibold text-stone-900">{payload[0].name}</p>
          <p className="text-sm text-stone-600">
            {formatCurrency(payload[0].value)} ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
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
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => `${value}: ${formatCurrency(entry.payload.value)}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseBreakdownChart;
