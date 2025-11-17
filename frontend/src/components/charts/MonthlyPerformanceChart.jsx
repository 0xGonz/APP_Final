import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Reusable Monthly Performance Chart Component
 * Shows revenue, expenses, and profit as stacked/grouped bars
 */
const MonthlyPerformanceChart = ({ data, title = 'Monthly Performance', height = 350, stacked = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="section-header mb-4">{title}</h3>
        <p className="text-stone-500 text-center py-8">No data available</p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-stone-200 rounded shadow-lg">
          <p className="font-semibold text-stone-900 mb-2">{payload[0].payload.label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6">
      <h3 className="section-header mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            stroke="#78716c"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#78716c"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="totalIncome"
            name="Revenue"
            fill="#0ea5e9"
            stackId={stacked ? "stack" : undefined}
          />
          <Bar
            dataKey="totalExpenses"
            name="Expenses"
            fill="#ef4444"
            stackId={stacked ? "stack" : undefined}
          />
          <Bar
            dataKey="netIncome"
            name="Net Profit"
            fill="#10b981"
            stackId={stacked ? undefined : undefined}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyPerformanceChart;
