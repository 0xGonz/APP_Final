import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { clinicsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ProfitLossTableComplete from '../components/clinic/ProfitLossTableComplete';
import KPICards from '../components/dashboard/KPICards';
import FinancialTrendChart from '../components/dashboard/FinancialTrendChart';
import { useDateFilter } from '../context/DateFilterContext';

/**
 * Clinic View - Individual Clinic Financial Analysis
 * Matches the Dashboard layout but for a single clinic:
 * - KPI Cards (Total Income, Total Expenses, NOI, NOI Margin)
 * - Financial Performance Chart (Area chart showing trends)
 * - Complete P&L Table (detailed reference data)
 */
const ClinicView = () => {
  const { clinicId } = useParams();
  const { startDate, endDate, isLoadingDataDate } = useDateFilter();

  // Fetch clinic details
  const {
    data: clinic,
    isLoading: clinicLoading,
    error: clinicError,
  } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: () => clinicsAPI.getById(clinicId),
  });

  // Fetch clinic P&L data
  const {
    data: pnlData,
    isLoading: pnlLoading,
  } = useQuery({
    queryKey: ['clinic-pnl', clinicId, startDate, endDate],
    queryFn: () =>
      clinicsAPI.getPnL(clinicId, {
        startDate,
        endDate,
      }),
  });

  if (clinicError) {
    return <ErrorMessage message={clinicError.message} />;
  }

  // Wait for dynamic date initialization
  if (isLoadingDataDate) {
    return <Loading message="Initializing date filters..." />;
  }

  if (clinicLoading) {
    return <Loading message="Loading clinic data..." />;
  }

  // Transform P&L data to add labels and match FinancialTrendChart field names
  const formattedPnLData = pnlData
    ? pnlData.map((item) => {
        // Handle date with timezone fix
        const dateStr = item.date
          ? (typeof item.date === 'string' && item.date.includes('T')
              ? item.date.split('T')[0] + 'T00:00:00'
              : item.date + 'T00:00:00')
          : `${item.year}-${String(item.month).padStart(2, '0')}-01T00:00:00`;

        return {
          ...item,
          label: format(new Date(dateStr), 'MMM yyyy'),
          // Map field names for FinancialTrendChart component
          totalIncome: Number(item.totalIncome || 0),
          totalExpenses: Number(item.totalExpenses || 0),
          netOrdinaryIncome: Number(item.netOrdinaryIncome || 0),
        };
      })
    : [];

  // Calculate KPI data directly from P&L data
  const totalIncome = formattedPnLData.reduce((sum, item) => sum + Number(item.totalIncome || 0), 0);
  const totalExpenses = formattedPnLData.reduce((sum, item) => sum + Number(item.totalExpenses || 0), 0);
  const noi = formattedPnLData.reduce((sum, item) => sum + Number(item.netOrdinaryIncome || 0), 0);
  const noiMargin = totalIncome > 0 ? (noi / totalIncome) * 100 : 0;

  const kpiCardData = {
    totalIncome,
    totalExpenses,
    noi,
    noiMargin,
  };

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{clinic?.name || 'Clinic'}</h1>
          <p className="text-gray-600 mt-1">
            {clinic?.location || 'Financial performance and detailed analysis'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards
        data={kpiCardData}
        isLoading={pnlLoading}
        metadata={{
          dateRange: { startDate, endDate },
          recordCount: formattedPnLData.length,
          clinicName: clinic?.name || 'Clinic',
        }}
      />

      {/* Acquisition Note for West Houston */}
      {(clinic?.name === 'West Houston' || clinic?.location === 'West Houston') && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 font-medium">
                This practice was acquired in May 2025
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Performance Chart - Same as Dashboard */}
      <FinancialTrendChart
        data={formattedPnLData}
        title="Monthly Financial Performance"
        subtitle="Total Income, Total Expenses, and NOI over time"
        height={400}
        isLoading={pnlLoading}
      />

      {/* Complete Profit & Loss Table - All Line Items */}
      <ProfitLossTableComplete
        data={formattedPnLData}
        title="Profit & Loss Statement"
        subtitle="Detailed Income Statement - All Line Items & Calculations"
        isLoading={pnlLoading}
      />
    </div>
  );
};

export default ClinicView;
