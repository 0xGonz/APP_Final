import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, CHART_CONFIG, formatAxisValue } from '../../config/chartTheme';
import { formatCurrency } from '../../utils/dataTransformers';

/**
 * Flexible Trend Chart Component
 *
 * A modular, reusable chart component that can render data as:
 * - Area chart (with gradient fill)
 * - Bar chart
 * - Line chart
 *
 * Designed for single-metric trend visualization over time.
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Chart data with 'date' and 'value' keys
 * @param {string} props.chartType - Type of chart ('area', 'bar', 'line')
 * @param {string} props.metric - Metric name for color selection
 * @param {number} props.height - Chart height in pixels (default: 400)
 * @param {string} props.color - Primary color for the chart
 */
const FlexibleTrendChart = ({
  data,
  chartType = 'area',
  metric = 'totalIncome',
  height = 400,
  color,
}) => {
  // Determine color based on metric if not explicitly provided
  const chartColor = color || CHART_COLORS[metric] || CHART_COLORS.income;

  // Common chart props
  const commonProps = {
    data,
  };

  const commonAxisProps = {
    children: [
      <CartesianGrid key="grid" {...CHART_CONFIG.grid} />,
      <XAxis key="xaxis" dataKey="date" {...CHART_CONFIG.axis} />,
      <YAxis key="yaxis" tickFormatter={formatAxisValue} {...CHART_CONFIG.axis} />,
      <Tooltip
        key="tooltip"
        formatter={(value) => formatCurrency(value)}
        contentStyle={CHART_CONFIG.tooltip.contentStyle}
        labelStyle={CHART_CONFIG.tooltip.labelStyle}
      />,
    ],
  };

  // Generate accessible description
  const getChartDescription = () => {
    const metricLabel = metric.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    const chartTypeLabel = chartType === 'bar' ? 'bar chart' : chartType === 'line' ? 'line chart' : 'area chart';
    const dataPointCount = data?.length || 0;
    return `${chartTypeLabel} showing ${metricLabel} trend over ${dataPointCount} time periods`;
  };

  // Render Area Chart
  if (chartType === 'area') {
    return (
      <div role="img" aria-label={getChartDescription()}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart {...commonProps} aria-hidden="true">
            <defs>
              <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.3} />
              </linearGradient>
            </defs>
            {commonAxisProps.children}
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${metric})`}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Render Bar Chart
  if (chartType === 'bar') {
    return (
      <div role="img" aria-label={getChartDescription()}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...commonProps} aria-hidden="true">
            {commonAxisProps.children}
            <Bar
              dataKey="value"
              fill={chartColor}
              radius={[4, 4, 0, 0]}
              animationDuration={300}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Render Line Chart
  if (chartType === 'line') {
    return (
      <div role="img" aria-label={getChartDescription()}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...commonProps} aria-hidden="true">
            {commonAxisProps.children}
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              dot={{ fill: chartColor, r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Fallback: default to area chart
  return (
    <div role="img" aria-label={getChartDescription()}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart {...commonProps} aria-hidden="true">
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          {commonAxisProps.children}
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${metric})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FlexibleTrendChart;
