import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendValue, icon: Icon, format = 'currency' }) => {
  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    } else if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString();
  };

  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="metric-card group animate-slide-in">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">{title}</p>
          <p className="text-4xl font-black text-stone-900 tabular-nums leading-none mb-1">
            {formatValue(value)}
          </p>
          {trendValue && (
            <div className="mt-3 flex items-center space-x-1.5">
              <TrendIcon
                className={`w-4 h-4 ${
                  isPositive ? 'text-profit' : 'text-loss'
                }`}
              />
              <span
                className={`text-sm font-bold tabular-nums ${
                  isPositive ? 'text-profit' : 'text-loss'
                }`}
              >
                {trendValue}
              </span>
              <span className="text-xs text-stone-400">vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="ml-4">
            <div className="p-3.5 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl group-hover:from-primary-100 group-hover:to-primary-200/50 transition-all duration-150 shadow-sm">
              <Icon className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
