import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { clinicsAPI, financialsAPI, systemAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import DateRangePicker from '../components/DateRangePicker';
import ExportButton from '../components/ExportButton';
import RevenueTrendChart from '../components/charts/RevenueTrendChart';
import ProfitMarginChart from '../components/charts/ProfitMarginChart';
import MonthlyPerformanceChart from '../components/charts/MonthlyPerformanceChart';
import ExpenseBreakdownChart from '../components/charts/ExpenseBreakdownChart';

const ClinicView = () => {
  const { clinicId } = useParams();
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
    setYear(new Date(newStartDate).getFullYear());
  };

  const { data: clinic, isLoading: clinicLoading, error: clinicError } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: () => clinicsAPI.getById(clinicId),
  });

  const { data: pnl, isLoading: pnlLoading, error: pnlError } = useQuery({
    queryKey: ['clinic-pnl', clinicId, startDate, endDate],
    queryFn: () => clinicsAPI.getPnL(clinicId, { startDate, endDate }),
  });

  // Fetch clinic-specific trend data for visualizations
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['clinic-trends', clinicId, startDate, endDate],
    queryFn: () => financialsAPI.getTrends({ clinicId, startDate, endDate }),
  });

  const isLoading = clinicLoading || pnlLoading;
  const error = clinicError || pnlError;

  if (isLoading) {
    return <Loading message="Loading clinic details..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const summary = pnl?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
        <ExportButton clinicId={clinicId} year={year} startDate={startDate} endDate={endDate} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-success-100 text-success-700 text-xs font-bold uppercase tracking-wide">
            Single Clinic
          </span>
        </div>
        <h1 className="page-header">{clinic?.name} Clinic</h1>
        <p className="text-stone-500 text-sm">{clinic?.location}</p>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        minDate={dataRange?.dateRange.start || "2023-01-01"}
        maxDate={dataRange?.dateRange.end || format(new Date(), 'yyyy-MM-dd')}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <p className="text-sm font-medium text-stone-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(summary.totalIncome || 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-stone-600 mb-1">Total COGS</p>
          <p className="text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(summary.totalCOGS || 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-stone-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(summary.totalExpenses || 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-stone-600 mb-1">Net Income</p>
          <p className={`text-2xl font-bold tabular-nums ${(summary.netIncome || 0) >= 0 ? 'currency-positive' : 'currency-negative'}`}>
            {formatCurrency(summary.netIncome || 0)}
          </p>
        </div>
      </div>

      {/* Trend Visualizations (Same as Dashboard) */}
      {!trendsLoading && trendsData && trendsData.length > 0 && (
        <>
          {/* Revenue and Performance Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueTrendChart
              data={trendsData}
              title={`${clinic?.name} Revenue Trend`}
              height={320}
              showArea={true}
            />
            <ProfitMarginChart
              data={trendsData}
              title={`${clinic?.name} Profit Margins`}
              height={320}
            />
          </div>

          {/* Monthly Performance */}
          <MonthlyPerformanceChart
            data={trendsData}
            title={`${clinic?.name} Monthly Performance`}
            height={400}
            stacked={false}
          />

          {/* Expense Breakdown */}
          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpenseBreakdownChart
                data={[
                  { name: 'COGS', value: summary.totalCOGS || 0 },
                  { name: 'Operating Expenses', value: summary.totalExpenses || 0 },
                ]}
                title={`${clinic?.name} Expense Breakdown`}
                height={320}
              />

              {/* P&L Summary */}
              <div className="card p-6">
                <h3 className="section-header mb-4">P&L Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-stone-200">
                    <span className="text-sm font-medium text-stone-700">Total Income</span>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">
                      {formatCurrency(summary.totalIncome || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-stone-200">
                    <span className="text-sm font-medium text-stone-700">Cost of Goods Sold</span>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">
                      {formatCurrency(summary.totalCOGS || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-stone-200">
                    <span className="text-sm font-semibold text-primary-700">Gross Profit</span>
                    <span className="text-sm font-bold text-primary-700 tabular-nums">
                      {formatCurrency(summary.grossProfit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-stone-200">
                    <span className="text-sm font-medium text-stone-700">Operating Expenses</span>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">
                      {formatCurrency(summary.totalExpenses || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-stone-50 -mx-6 px-6">
                    <span className="text-base font-bold text-stone-900">NET INCOME</span>
                    <span className={`text-base font-bold tabular-nums ${(summary.netIncome || 0) >= 0 ? 'currency-positive' : 'currency-negative'}`}>
                      {formatCurrency(summary.netIncome || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detailed P&L Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 className="section-header mb-0">Detailed Monthly Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-left">Month</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">COGS</th>
                <th className="text-right">Gross Profit</th>
                <th className="text-right">Expenses</th>
                <th className="text-right">Net Income</th>
              </tr>
            </thead>
            <tbody>
              {pnl && pnl.length > 0 ? (
                pnl.map((record) => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthLabel = `${monthNames[record.month - 1]} ${record.year}`;
                  const netIncome = Number(record.netIncome || 0);
                  const grossProfit = Number(record.totalIncome || 0) - Number(record.totalCOGS || 0);

                  return (
                    <tr key={`${record.year}-${record.month}`}>
                      <td className="font-medium">{monthLabel}</td>
                      <td className="text-right tabular-nums">{formatCurrency(record.totalIncome)}</td>
                      <td className="text-right tabular-nums">{formatCurrency(record.totalCOGS)}</td>
                      <td className="text-right tabular-nums text-primary-700 font-medium">{formatCurrency(grossProfit)}</td>
                      <td className="text-right tabular-nums">{formatCurrency(record.totalExpenses)}</td>
                      <td className={`text-right tabular-nums font-semibold ${netIncome >= 0 ? 'currency-positive' : 'currency-negative'}`}>
                        {formatCurrency(netIncome)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-stone-500 py-8">
                    No financial records available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClinicView;
