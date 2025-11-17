import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/dataTransformers';
import { format } from 'date-fns';

/**
 * KPI Cards Component
 * Displays three key performance indicators: Gross Profit, Net Profit, and Margin %
 * Reusable across Dashboard and Clinic views
 */
const KPICards = ({ data, isLoading = false, metadata = null }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpenses = 0,
    noi = 0,
    noiMargin = 0,
    previousTotalIncome,
    previousTotalExpenses,
    previousNOI,
  } = data || {};

  // Calculate trends if previous period data is available
  const incomeTrend = previousTotalIncome
    ? ((totalIncome - previousTotalIncome) / previousTotalIncome) * 100
    : null;

  const expensesTrend = previousTotalExpenses
    ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
    : null;

  const noiTrend = previousNOI
    ? ((noi - previousNOI) / previousNOI) * 100
    : null;

  const TrendIndicator = ({ value }) => {
    if (value === null || value === undefined) return null;

    const isPositive = value >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-success-600' : 'text-danger-600';

    return (
      <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  // Format metadata for display
  const getMetadataText = () => {
    if (!metadata) return null;

    const { dateRange, recordCount, clinicName } = metadata;
    const parts = [];

    if (recordCount !== undefined && recordCount !== null) {
      parts.push(`${recordCount} record${recordCount !== 1 ? 's' : ''}`);
    }

    if (dateRange?.startDate && dateRange?.endDate) {
      const start = format(new Date(dateRange.startDate), 'MMM d, yyyy');
      const end = format(new Date(dateRange.endDate), 'MMM d, yyyy');
      parts.push(`${start} - ${end}`);
    }

    if (clinicName) {
      parts.push(clinicName);
    }

    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const metadataText = getMetadataText();

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Income
            </p>
            {incomeTrend !== null && (
              <TrendIndicator value={incomeTrend} />
            )}
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(totalIncome)}
        </p>
        {previousTotalIncome && (
          <p className="text-xs text-gray-500 mt-2">
            vs {formatCurrency(previousTotalIncome)} prev period
          </p>
        )}
      </div>

      {/* Total Expenses Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Expenses
            </p>
            {expensesTrend !== null && (
              <TrendIndicator value={expensesTrend} />
            )}
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(totalExpenses)}
        </p>
        {previousTotalExpenses && (
          <p className="text-xs text-gray-500 mt-2">
            vs {formatCurrency(previousTotalExpenses)} prev period
          </p>
        )}
      </div>

      {/* NOI / NOI Margin Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              NOI / NOI Margin
            </p>
            {noiTrend !== null && (
              <TrendIndicator value={noiTrend} />
            )}
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <Percent className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(noi)}
        </p>
        <p className="text-lg font-semibold text-gray-700 mt-1">
          {formatPercent(noiMargin)}
        </p>
        {previousNOI && (
          <p className="text-xs text-gray-500 mt-2">
            vs {formatCurrency(previousNOI)} prev period
          </p>
        )}
      </div>
      </div>

      {/* Subtle Metadata Footnote */}
      {metadataText && !isLoading && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            Based on {metadataText}
          </p>
        </div>
      )}
    </div>
  );
};

export default KPICards;
