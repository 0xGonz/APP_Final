import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, Layers } from 'lucide-react';

/**
 * Reusable Chart Controls Component
 *
 * Provides a consistent UI for controlling chart display options:
 * - Chart type selection (Bar, Line, Area)
 * - Stacking toggle (when applicable)
 *
 * @param {Object} props
 * @param {string} props.chartType - Current chart type ('bar', 'line', 'area')
 * @param {function} props.onChartTypeChange - Callback when chart type changes
 * @param {boolean} props.isStacked - Whether data is stacked (for bar charts)
 * @param {function} props.onStackedChange - Callback when stacking changes
 * @param {boolean} props.showStackingToggle - Whether to show stacking toggle
 * @param {Array<string>} props.availableTypes - Available chart types (default: all)
 */
const ChartControls = ({
  chartType,
  onChartTypeChange,
  isStacked,
  onStackedChange,
  showStackingToggle = false,
  availableTypes = ['bar', 'line', 'area'],
}) => {
  const chartTypeOptions = [
    { value: 'bar', label: 'Bar', icon: BarChart3 },
    { value: 'line', label: 'Line', icon: LineChartIcon },
    { value: 'area', label: 'Area', icon: AreaChartIcon },
  ];

  // Filter to only show available types
  const visibleOptions = chartTypeOptions.filter((option) =>
    availableTypes.includes(option.value)
  );

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Chart Type Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Chart Type:</span>
        <div className="inline-flex rounded-lg border border-gray-300 bg-white">
          {visibleOptions.map((option) => {
            const Icon = option.icon;
            const isActive = chartType === option.value;

            return (
              <button
                key={option.value}
                onClick={() => onChartTypeChange(option.value)}
                className={`
                  px-4 py-2 text-sm font-medium transition-all duration-150
                  inline-flex items-center gap-2
                  first:rounded-l-lg last:rounded-r-lg
                  ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                aria-pressed={isActive}
                aria-label={`${option.label} chart`}
              >
                <Icon className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stacking Toggle (only show for bar charts) */}
      {showStackingToggle && chartType === 'bar' && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Display:</span>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              onClick={() => onStackedChange(true)}
              className={`
                px-4 py-2 text-sm font-medium transition-all duration-150
                inline-flex items-center gap-2 rounded-l-lg
                ${
                  isStacked
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
              aria-pressed={isStacked}
              aria-label="Stacked bars"
            >
              <Layers className="w-4 h-4" />
              <span>Stacked</span>
            </button>
            <button
              onClick={() => onStackedChange(false)}
              className={`
                px-4 py-2 text-sm font-medium transition-all duration-150
                inline-flex items-center gap-2 rounded-r-lg
                ${
                  !isStacked
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
              aria-pressed={!isStacked}
              aria-label="Grouped bars"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Grouped</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartControls;
