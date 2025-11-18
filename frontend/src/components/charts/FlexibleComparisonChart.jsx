import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { CHART_CONFIG, formatAxisValue, getColorByIndex, CHART_COLORS } from '../../config/chartTheme';
import { formatCurrency } from '../../utils/dataTransformers';

/**
 * Flexible Comparison Chart Component
 *
 * A modular, reusable chart component for comparing multiple clinics and metrics.
 * Supports:
 * - Bar chart (stacked or grouped)
 * - Line chart
 * - Area chart
 *
 * Data format expected:
 * [
 *   {
 *     label: "1/2024",
 *     date: "2024-01-01",
 *     "Clinic A - Total Income": 150000,
 *     "Clinic B - Total Income": 120000,
 *     ...
 *   }
 * ]
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Chart data with label/date + clinic-metric keys
 * @param {string} props.chartType - Type of chart ('bar', 'line', 'area')
 * @param {boolean} props.isStacked - Whether to stack bars (only for bar charts)
 * @param {Array<Object>} props.clinics - Array of clinic objects with id and name
 * @param {Array<Object>} props.selectedLineItems - Array of line items being compared
 * @param {number} props.height - Chart height in pixels (default: 500)
 */
const FlexibleComparisonChart = ({
  data,
  chartType = 'bar',
  isStacked = true,
  clinics = [],
  selectedLineItems = [],
  height = 500,
}) => {
  // Common chart props
  const commonProps = {
    data,
  };

  const commonAxisProps = [
    <CartesianGrid key="grid" {...CHART_CONFIG.grid} />,
    <XAxis
      key="xaxis"
      dataKey="label"
      {...CHART_CONFIG.axis}
      angle={-45}
      textAnchor="end"
      height={80}
    />,
    <YAxis
      key="yaxis"
      tickFormatter={formatAxisValue}
      domain={['auto', 'auto']}
      allowDataOverflow={false}
      {...CHART_CONFIG.axis}
    />,
    <Tooltip
      key="tooltip"
      formatter={(value, name) => [
        formatCurrency(value),
        name,
      ]}
      contentStyle={CHART_CONFIG.tooltip.contentStyle}
      labelStyle={CHART_CONFIG.tooltip.labelStyle}
    />,
    <Legend key="legend" {...CHART_CONFIG.legend} wrapperStyle={{ paddingTop: '20px' }} />,
    <ReferenceLine
      key="zero-line"
      y={0}
      stroke="#78716c"
      strokeWidth={2}
      strokeDasharray="3 3"
    />,
  ];

  // Generate chart elements for each clinic+lineItem combination
  const generateChartElements = (ElementComponent, elementProps = {}) => {
    return clinics.map((clinic, clinicIndex) =>
      selectedLineItems.map((item, itemIndex) => {
        const dataKey = `${clinic.label || clinic.name} - ${item.label}`;
        // Fixed: Use sequential index to ensure each clinic gets a different color
        const colorIndex = clinicIndex * selectedLineItems.length + itemIndex;
        const color = getColorByIndex(colorIndex);

        // For stacked bar charts, use clinic.id as stackId
        // For grouped bar charts, don't use stackId
        const stackId = chartType === 'bar' && isStacked ? clinic.id : undefined;

        // For bar charts, use Cell component for conditional coloring
        if (chartType === 'bar') {
          return (
            <ElementComponent
              key={dataKey}
              dataKey={dataKey}
              fill={color}
              stroke={color}
              stackId={stackId}
              {...elementProps}
            >
              {data.map((entry, index) => {
                const value = entry[dataKey] || 0;
                // Use danger color for negative values, original color for positive
                const cellColor = value < 0 ? CHART_COLORS.danger : color;
                return <Cell key={`cell-${index}`} fill={cellColor} />;
              })}
            </ElementComponent>
          );
        }

        return (
          <ElementComponent
            key={dataKey}
            dataKey={dataKey}
            fill={color}
            stroke={color}
            stackId={stackId}
            {...elementProps}
          />
        );
      })
    );
  };

  // Generate accessible description
  const getChartDescription = () => {
    const clinicNames = clinics.map(c => c.label || c.name).join(', ');
    const metricNames = selectedLineItems.map(i => i.label).join(', ');
    const chartTypeLabel = chartType === 'bar' ? 'bar chart' : chartType === 'line' ? 'line chart' : 'area chart';
    const stackingLabel = isStacked && chartType === 'bar' ? 'stacked' : 'grouped';
    return `${stackingLabel} ${chartTypeLabel} comparing ${metricNames} across ${clinicNames}`;
  };

  // Render Bar Chart
  if (chartType === 'bar') {
    return (
      <div role="img" aria-label={getChartDescription()}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            {...commonProps}
            stackOffset={isStacked ? "sign" : "none"}
            aria-hidden="true"
          >
            {commonAxisProps}
            {generateChartElements(Bar, {
              radius: [4, 4, 0, 0],
              animationDuration: 300,
            })}
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
            {commonAxisProps}
            {generateChartElements(Line, {
              type: 'monotone',
              strokeWidth: 2,
              dot: { r: 3 },
              activeDot: { r: 5 },
              animationDuration: 300,
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Render Area Chart
  if (chartType === 'area') {
    return (
      <div role="img" aria-label={getChartDescription()}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart {...commonProps} aria-hidden="true">
            {commonAxisProps}
            {generateChartElements(Area, {
              type: 'monotone',
              strokeWidth: 2,
              fillOpacity: 0.3,
              animationDuration: 300,
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Fallback: default to bar chart
  return (
    <div role="img" aria-label={getChartDescription()}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart {...commonProps} aria-hidden="true">
          {commonAxisProps}
          {generateChartElements(Bar, {
            radius: [4, 4, 0, 0],
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FlexibleComparisonChart;
