/**
 * ChartCard - Consistent wrapper for all chart visualizations
 *
 * Provides standardized container styling, loading states, and empty states
 */
const ChartCard = ({
  children,
  title,
  subtitle,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available for the selected period',
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        {title && (
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            {subtitle && <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>}
          </div>
        )}
        <div className="h-[400px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        {title && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        )}
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default ChartCard;
