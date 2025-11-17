import { useState } from 'react';
import { formatCurrency } from '../../utils/dataTransformers';
import { ChevronDown, ChevronRight, Download, Printer } from 'lucide-react';

/**
 * Profit & Loss Table Component
 * Detailed income statement showing all P&L line items by period
 * Matches traditional accounting P&L format
 */
const ProfitLossTable = ({
  data = [],
  title = 'Financial Statement',
  subtitle = 'Profit & Loss Statement',
  isLoading = false,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    cogs: true,
    expenses: true,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="h-[500px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <p>No financial data available</p>
        </div>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Extract periods from data
  const periods = data.map((item) => ({
    label: item.label || `${item.month}/${item.year}`,
    data: item,
  }));

  // Calculate YTD totals
  const calculateYTD = (field) => {
    return data.reduce((sum, period) => sum + Number(period[field] || 0), 0);
  };

  // Helper to format negative numbers with parentheses
  const formatValue = (value) => {
    const num = Number(value || 0);
    if (num < 0) {
      return (
        <span className="text-red-600">({formatCurrency(Math.abs(num))})</span>
      );
    }
    return formatCurrency(num);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Line Item', ...periods.map((p) => p.label), 'YTD'];

    const rows = [
      ['INCOME'],
      ['Gross or Total Income', ...periods.map((p) => p.data.totalIncome), calculateYTD('totalIncome')],
      [''],
      ['COST OF GOODS SOLD'],
      ['Total COGS', ...periods.map((p) => p.data.totalCOGS), calculateYTD('totalCOGS')],
      [''],
      ['GROSS PROFIT', ...periods.map((p) => p.data.grossProfit), calculateYTD('grossProfit')],
      [''],
      ['EXPENSES'],
      ['Payroll Expenses', ...periods.map((p) => p.data.payrollExpense), calculateYTD('payrollExpense')],
      ['Rent Expenses', ...periods.map((p) => p.data.rentExpense), calculateYTD('rentExpense')],
      ['Advertising Expenses', ...periods.map((p) => p.data.advertisingExpense), calculateYTD('advertisingExpense')],
      ['Insurance Expenses', ...periods.map((p) => p.data.insuranceExpense), calculateYTD('insuranceExpense')],
      ['Office Expenses', ...periods.map((p) => p.data.officeExpense), calculateYTD('officeExpense')],
      ['Total Expenses', ...periods.map((p) => p.data.totalExpenses), calculateYTD('totalExpenses')],
      [''],
      ['NET ORDINARY INCOME', ...periods.map((p) => p.data.netOrdinaryIncome || (p.data.grossProfit - p.data.totalExpenses)), calculateYTD('netOrdinaryIncome')],
      [''],
      ['NET INCOME', ...periods.map((p) => p.data.netIncome), calculateYTD('netIncome')],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pl-statement-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900 border-b-2 border-gray-300 min-w-[250px]">
                Line Item
              </th>
              {periods.map((period, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-right font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[120px]"
                >
                  {period.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border-b-2 border-gray-300 bg-gray-100 min-w-[120px]">
                YTD
              </th>
            </tr>
          </thead>
          <tbody>
            {/* INCOME SECTION */}
            <tr className="bg-gray-50">
              <td
                className="sticky left-0 z-10 bg-gray-50 px-4 py-3 font-bold text-gray-900 cursor-pointer border-b border-gray-300"
                onClick={() => toggleSection('income')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.income ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  INCOME
                </div>
              </td>
              <td colSpan={periods.length + 1} className="border-b border-gray-300"></td>
            </tr>

            {expandedSections.income && (
              <tr>
                <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-700 border-b border-gray-200">
                  Gross or Total Income
                </td>
                {periods.map((period, idx) => (
                  <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-200">
                    {formatValue(period.data.totalIncome)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold font-mono border-b border-gray-200 bg-gray-50">
                  {formatValue(calculateYTD('totalIncome'))}
                </td>
              </tr>
            )}

            {/* COGS SECTION */}
            <tr className="bg-gray-50">
              <td
                className="sticky left-0 z-10 bg-gray-50 px-4 py-3 font-bold text-gray-900 cursor-pointer border-b border-gray-300"
                onClick={() => toggleSection('cogs')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.cogs ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  COST OF GOODS SOLD
                </div>
              </td>
              <td colSpan={periods.length + 1} className="border-b border-gray-300"></td>
            </tr>

            {expandedSections.cogs && (
              <tr>
                <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-700 border-b border-gray-200">
                  Total Cost of Goods Sold
                </td>
                {periods.map((period, idx) => (
                  <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-200">
                    {formatValue(period.data.totalCOGS)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold font-mono border-b border-gray-200 bg-gray-50">
                  {formatValue(calculateYTD('totalCOGS'))}
                </td>
              </tr>
            )}

            {/* GROSS PROFIT */}
            <tr className="bg-blue-50 font-semibold">
              <td className="sticky left-0 z-10 bg-blue-50 px-4 py-3 text-gray-900 border-b border-gray-300">
                GROSS PROFIT
              </td>
              {periods.map((period, idx) => (
                <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-300">
                  {formatValue(period.data.grossProfit)}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-mono border-b border-gray-300 bg-blue-100">
                {formatValue(calculateYTD('grossProfit'))}
              </td>
            </tr>

            {/* EXPENSES SECTION */}
            <tr className="bg-gray-50">
              <td
                className="sticky left-0 z-10 bg-gray-50 px-4 py-3 font-bold text-gray-900 cursor-pointer border-b border-gray-300"
                onClick={() => toggleSection('expenses')}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.expenses ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  EXPENSES
                </div>
              </td>
              <td colSpan={periods.length + 1} className="border-b border-gray-300"></td>
            </tr>

            {expandedSections.expenses && (
              <>
                <tr>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-700 border-b border-gray-200">
                    Payroll Expenses
                  </td>
                  {periods.map((period, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-200">
                      {formatValue(period.data.payrollExpense)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono border-b border-gray-200 bg-gray-50">
                    {formatValue(calculateYTD('payrollExpense'))}
                  </td>
                </tr>

                <tr>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-700 border-b border-gray-200">
                    Rent Expenses
                  </td>
                  {periods.map((period, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-200">
                      {formatValue(period.data.rentExpense)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono border-b border-gray-200 bg-gray-50">
                    {formatValue(calculateYTD('rentExpense'))}
                  </td>
                </tr>

                <tr>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-700 border-b border-gray-200">
                    Advertising Expenses
                  </td>
                  {periods.map((period, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-200">
                      {formatValue(period.data.advertisingExpense)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono border-b border-gray-200 bg-gray-50">
                    {formatValue(calculateYTD('advertisingExpense'))}
                  </td>
                </tr>

                <tr>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-700 border-b border-gray-200">
                    Insurance Expenses
                  </td>
                  {periods.map((period, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-200">
                      {formatValue(period.data.insuranceExpense)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono border-b border-gray-200 bg-gray-50">
                    {formatValue(calculateYTD('insuranceExpense'))}
                  </td>
                </tr>

                <tr>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-700 border-b border-gray-200">
                    Office Expenses
                  </td>
                  {periods.map((period, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-200">
                      {formatValue(period.data.officeExpense)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono border-b border-gray-200 bg-gray-50">
                    {formatValue(calculateYTD('officeExpense'))}
                  </td>
                </tr>

                <tr className="font-semibold">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 pl-10 text-gray-900 border-b border-gray-300">
                    Total Expenses
                  </td>
                  {periods.map((period, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-300">
                      {formatValue(period.data.totalExpenses)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono border-b border-gray-300 bg-gray-50">
                    {formatValue(calculateYTD('totalExpenses'))}
                  </td>
                </tr>
              </>
            )}

            {/* NET ORDINARY INCOME */}
            <tr className="bg-green-50 font-semibold">
              <td className="sticky left-0 z-10 bg-green-50 px-4 py-3 text-gray-900 border-b border-gray-300">
                NET ORDINARY INCOME
              </td>
              {periods.map((period, idx) => (
                <td key={idx} className="px-4 py-3 text-right font-mono border-b border-gray-300">
                  {formatValue(period.data.netOrdinaryIncome || (period.data.grossProfit - period.data.totalExpenses))}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-mono border-b border-gray-300 bg-green-100">
                {formatValue(calculateYTD('grossProfit') - calculateYTD('totalExpenses'))}
              </td>
            </tr>

            {/* NET INCOME */}
            <tr className="bg-blue-100 font-bold text-lg">
              <td className="sticky left-0 z-10 bg-blue-100 px-4 py-4 text-gray-900 border-b-2 border-gray-400">
                NET INCOME
              </td>
              {periods.map((period, idx) => (
                <td key={idx} className="px-4 py-4 text-right font-mono border-b-2 border-gray-400">
                  {formatValue(period.data.netIncome)}
                </td>
              ))}
              <td className="px-4 py-4 text-right font-mono border-b-2 border-gray-400 bg-blue-200">
                {formatValue(calculateYTD('netIncome'))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLossTable;
