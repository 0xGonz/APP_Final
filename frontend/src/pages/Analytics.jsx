import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { clinicsAPI, financialsAPI, metricsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ExportButton from '../components/ExportButton';
import ChartCard from '../components/shared/ChartCard';
import ChartControls from '../components/charts/ChartControls';
import FlexibleTrendChart from '../components/charts/FlexibleTrendChart';
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
import { useFilteredTrends } from '../hooks/useFilteredData';

const Analytics = () => {
  const { startDate, endDate, selectedClinic, setSelectedClinic } = useDateFilter();
  const [selectedMetric, setSelectedMetric] = useState('totalIncome');
  const [chartType, setChartType] = useState('area');

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
        clinicId: selectedClinic,
        category: selectedMetric,
        startDate,
        endDate,
      }),
  });

  // Fetch growth metrics
  const { data: growthData, isLoading: growthLoading, error: growthError } = useQuery({
    queryKey: ['growth', selectedClinic, selectedMetric, startDate, endDate],
    queryFn: () =>
      metricsAPI.getGrowth({
        clinicId: selectedClinic,
        metric: selectedMetric,
        startDate,
        endDate,
      }),
  });

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['kpis', selectedClinic, startDate, endDate],
    queryFn: () =>
      metricsAPI.getKPIs({
        clinicId: selectedClinic,
        startDate,
        endDate,
      }),
  });

  // ⚠️ IMPORTANT: All hooks must be called BEFORE any conditional returns (Rules of Hooks)
  // Use modular hooks for data filtering and validation
  const {
    trends: filteredTrends,
    summary: trendsSummary,
    isEmpty: trendsIsEmpty,
  } = useFilteredTrends(trendData, startDate, endDate, selectedMetric);

  // Transform filtered data for chart display (must happen before early returns)
  const chartData = transformTrendsForChart(filteredTrends, selectedMetric);

  // Transform other data using modular utilities with null-safety
  const growthMetrics = transformGrowthData(growthData || { monthOverMonth: 0, yearOverYear: 0 });
  const kpiMetrics = transformKPIData(kpis || {});

  // NOW check loading/error state AFTER all hooks are called
  if (trendsLoading || growthLoading || kpisLoading) {
    return <Loading message="Loading analytics data..." />;
  }

  // Comprehensive error handling for all API calls
  if (trendsError || growthError || kpisError) {
    const errorMessage = trendsError?.message || growthError?.message || kpisError?.message || 'Failed to load analytics data';
    console.error('[Analytics] Error loading data:', { trendsError, growthError, kpisError });
    return <ErrorMessage message={errorMessage} />;
  }

  // Log data summary for debugging
  console.log('[Analytics] Data Summary:', {
    trends: trendsSummary,
    metric: selectedMetric,
    growthMetrics,
  });

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
        {/* Chart Controls */}
        <div className="mb-4">
          <ChartControls
            chartType={chartType}
            onChartTypeChange={setChartType}
            availableTypes={['area', 'bar', 'line']}
          />
        </div>

        {/* Flexible Trend Chart */}
        <FlexibleTrendChart
          data={chartData}
          chartType={chartType}
          metric={selectedMetric}
          height={400}
        />
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
