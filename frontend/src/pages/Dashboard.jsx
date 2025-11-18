import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { financialsAPI, metricsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import KPICards from '../components/dashboard/KPICards';
import FinancialTrendChart from '../components/dashboard/FinancialTrendChart';
import ProfitLossTableComplete from '../components/clinic/ProfitLossTableComplete';
import { useDateFilter } from '../context/DateFilterContext';
import { useFilteredPnL, useFilteredTrends } from '../hooks/useFilteredData';

/**
 * Dashboard - Consolidated Financial Overview
 * Matches the "Overview" screenshot design with:
 * - KPI Cards (Total Income, Total Expenses, NOI/NOI Margin)
 * - Financial Trend Chart (Stacked Area)
 * - Complete P&L Statement (Consolidated across all clinics)
 * - Connected to global date filter context
 */
const Dashboard = () => {
  const { startDate, endDate } = useDateFilter();

  // Fetch consolidated trends data
  const {
    data: trendsData,
    isLoading: trendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['financials-trends', startDate, endDate],
    queryFn: () =>
      financialsAPI.getTrends({
        startDate,
        endDate,
        clinicId: 'all', // Consolidated view
      }),
  });

  // Fetch KPIs for the period
  const {
    data: kpisData,
    isLoading: kpisLoading,
  } = useQuery({
    queryKey: ['kpis', startDate, endDate],
    queryFn: () =>
      metricsAPI.getKPIs({
        startDate,
        endDate,
      }),
  });

  // Fetch consolidated P&L data
  const {
    data: pnlData,
    isLoading: pnlLoading,
  } = useQuery({
    queryKey: ['consolidated-pnl', startDate, endDate],
    queryFn: () =>
      financialsAPI.getConsolidated({
        startDate,
        endDate,
      }),
  });

  const isLoading = trendsLoading || kpisLoading || pnlLoading;

  if (trendsError) {
    return <ErrorMessage message={trendsError.message} />;
  }

  // Use modular hooks for data filtering and validation
  const {
    data: filteredPnLData,
    totals: pnlTotals,
    summary: pnlSummary,
    isEmpty: pnlIsEmpty,
  } = useFilteredPnL(pnlData, startDate, endDate);

  const {
    trends: filteredTrends,
    summary: trendsSummary,
    isEmpty: trendsIsEmpty,
  } = useFilteredTrends(trendsData, startDate, endDate);

  // Transform KPI data (already filtered by backend)
  const kpiCardData = {
    totalIncome: kpisData?.totalRevenue || 0,
    totalExpenses: kpisData?.totalOperatingExpenses || 0,
    noi: kpisData?.noi || 0,
    noiMargin: kpisData?.noiMargin || 0,
  };

  // Transform P&L data - add labels for display
  const formattedPnLData = filteredPnLData.map((item) => ({
    ...item,
    label: format(new Date(item.date || `${item.year}-${String(item.month).padStart(2, '0')}-01`), 'MMM yyyy'),
  }));

  // Log data summary for debugging
  console.log('[Dashboard] Data Summary:', {
    pnl: pnlSummary,
    trends: trendsSummary,
    kpis: { recordCount: kpisData?.recordCount },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Consolidated view across all clinics
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards
        data={kpiCardData}
        isLoading={kpisLoading}
        metadata={{
          dateRange: { startDate, endDate },
          recordCount: kpisData?.recordCount,
          clinicName: 'All Clinics',
        }}
      />

      {/* Financial Trend Chart */}
      <FinancialTrendChart
        data={filteredTrends}
        title="Monthly Financial Performance"
        subtitle="Total Income, Total Expenses, and NOI over time"
        height={450}
        isLoading={trendsLoading}
      />

      {/* Complete P&L Statement - Consolidated across all clinics */}
      <ProfitLossTableComplete
        data={formattedPnLData}
        title="Consolidated Profit & Loss Statement"
        subtitle="Detailed Income Statement - All Clinics Combined"
        isLoading={pnlLoading}
      />
    </div>
  );
};

export default Dashboard;
