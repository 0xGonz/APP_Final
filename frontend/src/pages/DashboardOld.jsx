import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, PieChart, BarChart } from 'lucide-react';
import { format } from 'date-fns';
import { clinicsAPI, metricsAPI, financialsAPI, systemAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import DateRangePicker from '../components/DateRangePicker';
import ExportButton from '../components/ExportButton';
import RevenueTrendChart from '../components/charts/RevenueTrendChart';
import ProfitMarginChart from '../components/charts/ProfitMarginChart';
import MonthlyPerformanceChart from '../components/charts/MonthlyPerformanceChart';
import ExpenseBreakdownChart from '../components/charts/ExpenseBreakdownChart';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(
    format(new Date(currentYear, 0, 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [year, setYear] = useState(currentYear);
  const [dataRangeFetched, setDataRangeFetched] = useState(false);

  // Fetch actual data range from database
  const { data: dataRange } = useQuery({
    queryKey: ['data-range'],
    queryFn: () => systemAPI.getDataRange(),
  });

  // Update date range when actual data range is fetched
  useEffect(() => {
    if (dataRange && !dataRangeFetched) {
      // Use the actual latest date from the database
      const latestDate = dataRange.dateRange.end;
      const startOfYear = `${dataRange.latest.year}-01-01`;

      setStartDate(startOfYear);
      setEndDate(latestDate);
      setYear(dataRange.latest.year);
      setDataRangeFetched(true);
    }
  }, [dataRange, dataRangeFetched]);

  const handleDateChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    // Extract year from start date for backwards compatibility
    setYear(new Date(newStartDate).getFullYear());
  };

  // Fetch clinics data with date filters
  const {
    data: clinics,
    isLoading: clinicsLoading,
    error: clinicsError,
  } = useQuery({
    queryKey: ['clinics', year, startDate, endDate],
    queryFn: () => clinicsAPI.getAll({ year, startDate, endDate }),
  });

  // Fetch KPIs with date range
  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
  } = useQuery({
    queryKey: ['kpis', year, startDate, endDate],
    queryFn: () => metricsAPI.getKPIs({ year, startDate, endDate }),
  });

  // Fetch trend data for visualizations
  const {
    data: trendsData,
    isLoading: trendsLoading,
  } = useQuery({
    queryKey: ['trends', startDate, endDate],
    queryFn: () => financialsAPI.getTrends({ startDate, endDate }),
  });

  if (clinicsLoading || kpisLoading) {
    return <Loading message="Loading dashboard data..." />;
  }

  if (clinicsError || kpisError) {
    return (
      <ErrorMessage
        message={clinicsError?.message || kpisError?.message || 'Failed to load dashboard'}
      />
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wide">
              All Clinics
            </span>
            <span className="text-stone-400 text-sm">•</span>
            <span className="text-stone-500 text-sm font-medium">6 Locations</span>
          </div>
          <p className="text-stone-500 text-sm">
            Consolidated financial performance across all clinic locations
          </p>
        </div>
        <ExportButton year={year} startDate={startDate} endDate={endDate} />
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        minDate={dataRange?.dateRange.start || "2023-01-01"}
        maxDate={dataRange?.dateRange.end || format(new Date(), 'yyyy-MM-dd')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={kpis?.totalRevenue || 0}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Net Profit"
          value={kpis?.netProfit || 0}
          icon={TrendingUp}
          format="currency"
        />
        <MetricCard
          title="Gross Margin"
          value={kpis?.grossMargin || 0}
          icon={PieChart}
          format="percent"
        />
        <MetricCard
          title="Net Margin"
          value={kpis?.netMargin || 0}
          icon={BarChart}
          format="percent"
        />
      </div>

      {/* Clinic Performance Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 className="section-header mb-0">Clinic Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-left">Clinic</th>
                <th className="text-right">Total Revenue</th>
                <th className="text-right">Total Expenses</th>
                <th className="text-right">Net Income</th>
                <th className="text-right">Records</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clinics?.map((clinic) => {
                const netIncome = parseFloat(clinic.netIncome);
                const isProfit = netIncome >= 0;

                return (
                  <tr key={clinic.id}>
                    <td>
                      <div>
                        <div className="font-semibold text-stone-900">{clinic.name}</div>
                        <div className="text-xs text-stone-500">{clinic.location}</div>
                      </div>
                    </td>
                    <td className="text-right tabular-nums font-medium">
                      {formatCurrency(clinic.totalIncome)}
                    </td>
                    <td className="text-right tabular-nums font-medium">
                      {formatCurrency(clinic.totalExpenses)}
                    </td>
                    <td className="text-right">
                      <span className={`tabular-nums font-semibold ${isProfit ? 'currency-positive' : 'currency-negative'}`}>
                        {formatCurrency(netIncome)}
                      </span>
                    </td>
                    <td className="text-right text-stone-600">
                      {clinic.totalRecords} months
                    </td>
                    <td className="text-right">
                      <Link to={`/clinic/${clinic.id}`} className="text-primary-500 hover:text-primary-700 font-medium text-sm">
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Visualizations */}
      {!trendsLoading && trendsData && trendsData.length > 0 && (
        <>
          {/* Revenue and Performance Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueTrendChart
              data={trendsData}
              title="Revenue Trend Over Time"
              height={320}
              showArea={true}
            />
            <ProfitMarginChart
              data={trendsData}
              title="Profit Margins Over Time"
              height={320}
            />
          </div>

          {/* Monthly Performance */}
          <MonthlyPerformanceChart
            data={trendsData}
            title="Monthly Performance"
            height={400}
            stacked={false}
          />

          {/* Expense Breakdown */}
          {kpis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ExpenseBreakdownChart
                data={[
                  { name: 'Payroll', value: kpis.totalPayroll || 0 },
                  { name: 'COGS', value: kpis.totalCOGS || 0 },
                  { name: 'Operating Expenses', value: (kpis.totalOperatingExpenses || 0) - (kpis.totalPayroll || 0) },
                ]}
                title="Expense Breakdown"
                height={320}
              />

              {/* Summary Stats */}
              <div className="space-y-4">
                <div className="card p-6 bg-primary-50 border-primary-200">
                  <p className="text-sm font-semibold text-primary-900">Total Clinics</p>
                  <p className="mt-2 text-3xl font-bold text-primary-600 tabular-nums">
                    {clinics?.length || 0}
                  </p>
                </div>
                <div className="card p-6 bg-success-50 border-success-200">
                  <p className="text-sm font-semibold text-success-900">Payroll Cost</p>
                  <p className="mt-2 text-3xl font-bold text-success-600 tabular-nums">
                    {kpis?.payrollPercentage?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-success-700 mt-1">of total revenue</p>
                </div>
                <div className="card p-6 bg-stone-100 border-stone-300">
                  <p className="text-sm font-semibold text-stone-900">Records Analyzed</p>
                  <p className="mt-2 text-3xl font-bold text-stone-700 tabular-nums">
                    {kpis?.recordCount || 0}
                  </p>
                  <p className="text-sm text-stone-600 mt-1">months of data</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
