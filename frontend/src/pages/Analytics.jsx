import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { clinicsAPI, financialsAPI, metricsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ExportButton from '../components/ExportButton';
import ChartCard from '../components/shared/ChartCard';
import {
  transformTrendsForChart,
  transformGrowthData,
  transformKPIData,
  formatCurrency,
  formatPercent,
  calculateAverage,
} from '../utils/dataTransformers';
import { useDateFilter } from '../context/DateFilterContext';
import { CHART_COLORS, CHART_CONFIG, formatAxisValue } from '../config/chartTheme';

const Analytics = () => {
  const { startDate, endDate, selectedClinic, setSelectedClinic } = useDateFilter();
  const [selectedMetric, setSelectedMetric] = useState('totalIncome');
  const currentYear = new Date().getFullYear();

  // Fetch clinics for selector
  const { data: clinics } = useQuery({
    queryKey: ['clinics'],
    queryFn: clinicsAPI.getAll,
  });

  // Fetch trend data
  const { data: trendData, isLoading: trendsLoading, error: trendsError } = useQuery({
    queryKey: ['trends', selectedClinic, selectedMetric, startDate, endDate],
    queryFn: () =>
      financialsAPI.getTrends({
        clinicId: selectedClinic === 'all' ? undefined : selectedClinic,
        category: selectedMetric,
        startDate,
        endDate,
      }),
  });

  // Fetch growth metrics
  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: ['growth', selectedClinic, selectedMetric],
    queryFn: () =>
      metricsAPI.getGrowth({
        clinicId: selectedClinic === 'all' ? undefined : selectedClinic,
        metric: selectedMetric,
      }),
  });

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', selectedClinic, currentYear],
    queryFn: () =>
      metricsAPI.getKPIs({
        clinicId: selectedClinic === 'all' ? undefined : selectedClinic,
        year: currentYear,
      }),
  });

  if (trendsLoading || growthLoading || kpisLoading) {
    return <Loading message="Loading analytics data..." />;
  }

  if (trendsError) {
    return <ErrorMessage message={trendsError.message} />;
  }

  // Transform data using modular utilities
  const chartData = trendData?.trends
    ? transformTrendsForChart(trendData.trends, selectedMetric)
    : [];

  const growthMetrics = transformGrowthData(growthData);
  const kpiMetrics = transformKPIData(kpis);

  const metricOptions = [
    { value: 'totalIncome', label: 'Total Income' },
    { value: 'netIncome', label: 'Net Income' },
    { value: 'grossProfit', label: 'Gross Profit' },
    { value: 'totalExpenses', label: 'Total Expenses' },
    { value: 'totalCOGS', label: 'Total COGS' },
    { value: 'payrollExpense', label: 'Payroll Expense' },
  ];

  const momGrowth = growthMetrics.monthOverMonth;
  const yoyGrowth = growthMetrics.yearOverYear;

  return (
    <div className="space-y-4">
      {/* Export Button Row */}
      <div className="flex justify-end">
        <ExportButton
          clinicId={selectedClinic === 'all' ? null : selectedClinic}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinic
          </label>
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Clinics (Consolidated)</option>
            {clinics?.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Growth Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">MoM Growth</p>
            {momGrowth >= 0 ? (
              <TrendingUp className="w-5 h-5 text-success-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-danger-600" />
            )}
          </div>
          <p
            className={`text-2xl font-bold ${
              momGrowth >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}
          >
            {formatPercent(momGrowth)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Month over Month</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">YoY Growth</p>
            {yoyGrowth >= 0 ? (
              <TrendingUp className="w-5 h-5 text-success-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-danger-600" />
            )}
          </div>
          <p
            className={`text-2xl font-bold ${
              yoyGrowth >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}
          >
            {formatPercent(yoyGrowth)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Year over Year</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Gross Margin</p>
            <Percent className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPercent(kpiMetrics.grossMargin)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Net Margin</p>
            <Percent className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPercent(kpiMetrics.netMargin)}
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      <ChartCard
        title={`${metricOptions.find((m) => m.value === selectedMetric)?.label} Trend`}
        isEmpty={chartData.length === 0}
      >
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis dataKey="date" {...CHART_CONFIG.axis} />
            <YAxis tickFormatter={formatAxisValue} {...CHART_CONFIG.axis} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={CHART_CONFIG.tooltip.contentStyle}
              labelStyle={CHART_CONFIG.tooltip.labelStyle}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.income}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(kpiMetrics.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Net Profit</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(kpiMetrics.netProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payroll %</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatPercent(kpiMetrics.payrollPercentage)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Records Analyzed</span>
              <span className="text-sm font-semibold text-gray-900">
                {kpiMetrics.recordCount} months
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Growth Insights
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Monthly Value</p>
              <p className="text-xl font-bold text-gray-900">
                {chartData.length > 0
                  ? formatCurrency(calculateAverage(chartData))
                  : '$0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Trend Direction</p>
              <div className="flex items-center gap-2">
                {momGrowth >= 0 ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-success-600" />
                    <p className="text-xl font-bold text-success-600">Growing</p>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-6 h-6 text-danger-600" />
                    <p className="text-xl font-bold text-danger-600">Declining</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
