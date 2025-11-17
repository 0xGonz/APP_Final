import React, { useState } from 'react';
import { formatCurrency } from '../../utils/dataTransformers';
import { ChevronDown, ChevronRight, Download, Printer } from 'lucide-react';

/**
 * Complete Profit & Loss Table Component
 * Shows ALL 80+ line items with full calculations and breakdowns
 * Professional accounting format matching QuickBooks/accounting software
 */
const ProfitLossTableComplete = ({
  data = [],
  title = 'Profit & Loss Statement',
  subtitle = 'Detailed Income Statement - All Line Items',
  isLoading = false,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    cogs: true,
    payroll: true,
    facilities: true,
    professional: true,
    office: true,
    marketing: true,
    medical: true,
    travel: true,
    other: true,
    otherIncomeExpense: true,
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-300 p-2">
        <div className="h-4 bg-gray-200 w-1/3 mb-1 animate-pulse"></div>
        <div className="h-[500px] bg-gray-100 animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-300 p-2">
        <h3 className="text-xs font-semibold text-gray-900 mb-1">{title}</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <p className="text-xs">No financial data available</p>
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

  // Define all P&L line items grouped by category
  const incomeItems = [
    { field: 'hdResearchIncome', label: 'HD Research Income' },
    { field: 'personalInjuryIncome', label: 'Personal Injury Income' },
    { field: 'achCreditIncome', label: 'ACH Credit Income' },
    { field: 'nonmedicalIncome', label: 'Nonmedical Income' },
    { field: 'otcDepositIncome', label: 'OTC Deposit Income' },
    { field: 'practiceIncome', label: 'Practice Income' },
    { field: 'refundsIncome', label: 'Refunds Income' },
    { field: 'managementFeeIncome', label: 'Management Fee Income' },
  ];

  const cogsItems = [
    { field: 'consultingCOGS', label: 'Consulting' },
    { field: 'medicalWasteCOGS', label: 'Medical Waste' },
    { field: 'medicalBillingCOGS', label: 'Medical Billing' },
    { field: 'medicalSuppliesCOGS', label: 'Medical Supplies' },
    { field: 'contractLaborCOGS', label: 'Contract Labor' },
    { field: 'merchantFeesCOGS', label: 'Merchant Fees' },
    { field: 'managementFeesCOGS', label: 'Management Fees' },
    { field: 'medicalBooksCOGS', label: 'Medical Books' },
    { field: 'laboratoryFeesCOGS', label: 'Laboratory Fees' },
    { field: 'laboratoryDirectoryCOGS', label: 'Laboratory Directory' },
    { field: 'labSuppliesCOGS', label: 'Lab Supplies' },
    { field: 'patientExpenseCOGS', label: 'Patient Expense' },
    { field: 'chronicCareManagementCOGS', label: 'Chronic Care Management' },
  ];

  const sharedPayrollBreakdown = [
    { field: 'payrollSharedWages', label: 'Wages', indent: 3 },
    { field: 'payrollSharedTax', label: 'Payroll Tax', indent: 3 },
    { field: 'payrollSharedOverhead', label: 'Payroll Overhead', indent: 3 },
    { field: 'payrollSharedHealth', label: 'Health Insurance', indent: 3 },
    { field: 'payrollSharedContract', label: 'Contract Labor', indent: 3 },
    { field: 'payrollSharedReimbursements', label: 'Reimbursements', indent: 3 },
  ];

  const physicianPayrollBreakdown = [
    { field: 'payrollPhysicianWages', label: 'Wages', indent: 3 },
    { field: 'payrollPhysicianTax', label: 'Payroll Tax', indent: 3 },
    { field: 'payrollPhysicianBenefits', label: 'Provider Benefits', indent: 3 },
    { field: 'payrollPhysicianBonus', label: 'Physician Bonus', indent: 3 },
    { field: 'payrollPhysicianOther', label: 'Other', indent: 3 },
  ];

  const inOfficePayrollBreakdown = [
    { field: 'payrollInOfficeSalary', label: 'Salary - Other', indent: 3 },
    { field: 'payrollInOfficeWages', label: 'Wages', indent: 3 },
    { field: 'payrollInOfficeBonus', label: 'Bonus', indent: 3 },
    { field: 'payrollInOfficeNPExtraVisits', label: 'NP Extra Visits', indent: 3 },
    { field: 'payrollInOfficeTelehealth', label: 'Telehealth', indent: 3 },
    { field: 'payrollInOfficeAdministration', label: 'Administration', indent: 3 },
    { field: 'payrollInOfficePayrollTaxes', label: 'Payroll Taxes', indent: 3 },
    { field: 'payrollInOfficeUnemployment', label: 'Unemployment', indent: 3 },
    { field: 'payrollInOfficeHealthInsurance', label: 'Health Insurance', indent: 3 },
    { field: 'payrollInOfficeSimplePlanMatch', label: 'Simple Plan Match', indent: 3 },
    { field: 'payrollInOfficeOther', label: 'Other', indent: 3 },
  ];

  const payrollItems = [
    { field: 'sharedPayroll', label: 'Shared Payroll', hasBreakdown: true },
    { field: 'physicianPayroll', label: 'Physician Payroll', hasBreakdown: true },
    { field: 'inOfficePayroll', label: 'In-Office Payroll', hasBreakdown: true },
    { field: 'payrollProcessingFees', label: 'Payroll Processing Fees' },
    { field: 'payrollOther', label: 'Payroll - Other' },
  ];

  const facilitiesItems = [
    { field: 'rentExpense', label: 'Rent' },
    { field: 'utilitiesExpense', label: 'Utilities' },
    { field: 'janitorialExpense', label: 'Janitorial' },
    { field: 'repairsMaintenanceExpense', label: 'Repairs & Maintenance' },
    { field: 'securityExpense', label: 'Security' },
  ];

  const professionalServicesItems = [
    { field: 'accountingExpense', label: 'Accounting' },
    { field: 'legalFeesExpense', label: 'Legal Fees' },
    { field: 'professionalFeesExpense', label: 'Professional Fees' },
    { field: 'credentialingExpense', label: 'Credentialing' },
  ];

  const officeItems = [
    { field: 'officeExpense', label: 'Office Expense' },
    { field: 'officeSuppliesExpense', label: 'Office Supplies' },
    { field: 'postageExpense', label: 'Postage' },
    { field: 'printingExpense', label: 'Printing' },
    { field: 'computerExpense', label: 'Computer' },
    { field: 'telephoneInternetExpense', label: 'Telephone & Internet' },
  ];

  const marketingItems = [
    { field: 'advertisingExpense', label: 'Advertising' },
    { field: 'marketingGiftsExpense', label: 'Marketing Gifts' },
    { field: 'charitableExpense', label: 'Charitable Contributions' },
  ];

  const medicalOperationsItems = [
    { field: 'smallMedicalEquipExpense', label: 'Small Medical Equipment' },
    { field: 'oxygenGasExpense', label: 'Oxygen Gas' },
    { field: 'radiationBadgesExpense', label: 'Radiation Badges' },
    { field: 'linensCleaningExpense', label: 'Linens & Cleaning' },
    { field: 'equipmentRentalExpense', label: 'Equipment Rental' },
  ];

  const automobileBreakdown = [
    { field: 'gasExpense', label: 'Gas', indent: 3 },
    { field: 'parkingExpense', label: 'Parking', indent: 3 },
    { field: 'automobileExpenseOther', label: 'Other', indent: 3 },
  ];

  const mealsBreakdown = [
    { field: 'businessEntertainmentExpense', label: 'Business Entertainment', indent: 3 },
    { field: 'employeeMealsExpense', label: 'Employee Meals on Premises', indent: 3 },
    { field: 'travelMealsExpense', label: 'Travel Meals', indent: 3 },
    { field: 'officeSnacksExpense', label: 'Office Snacks and Beverages', indent: 3 },
    { field: 'officePartyExpense', label: 'Office Party', indent: 3 },
    { field: 'mealsEntertainmentExpenseOther', label: 'Other', indent: 3 },
  ];

  const travelAutoItems = [
    { field: 'automobileExpense', label: 'Automobile', hasBreakdown: true },
    { field: 'travelExpense', label: 'Travel' },
    { field: 'mealsEntertainmentExpense', label: 'Meals & Entertainment', hasBreakdown: true },
  ];

  const insuranceBreakdown = [
    { field: 'healthInsuranceExpense', label: 'Health Insurance', indent: 3 },
    { field: 'liabilityInsuranceExpense', label: 'Liability Insurance', indent: 3 },
    { field: 'medicalMalpracticeExpense', label: 'Medical Malpractice', indent: 3 },
    { field: 'insuranceExpenseOther', label: 'Other', indent: 3 },
  ];

  const otherExpenseItems = [
    { field: 'insuranceExpense', label: 'Insurance', hasBreakdown: true },
    { field: 'taxesExpense', label: 'Taxes' },
    { field: 'personalPropertyTaxExpense', label: 'Personal Property Tax' },
    { field: 'franchiseTaxExpense', label: 'Franchise Tax' },
    { field: 'licensesPermitsExpense', label: 'Licenses & Permits' },
    { field: 'licenseFeeExpense', label: 'License & Fee' },
    { field: 'bankServiceChargesExpense', label: 'Bank Service Charges' },
    { field: 'continuingEducationExpense', label: 'Continuing Education' },
    { field: 'conferenceFeesExpense', label: 'Conference Fees' },
    { field: 'duesSubscriptionsExpense', label: 'Dues & Subscriptions' },
    { field: 'uniformsExpense', label: 'Uniforms' },
    { field: 'answeringServiceExpense', label: 'Answering Service' },
    { field: 'recruitingExpense', label: 'Recruiting' },
    { field: 'movingExpense', label: 'Moving' },
    { field: 'miscellaneousExpense', label: 'Miscellaneous' },
  ];

  const otherIncomeExpenseItems = [
    { field: 'interestIncome', label: 'Interest Income' },
    { field: 'depreciationExpense', label: 'Depreciation Expense' },
    { field: 'managementFeePaid', label: 'Management Fee Paid' },
    { field: 'interestExpense', label: 'Interest Expense' },
    { field: 'corporateAdminFee', label: 'Corporate Admin Fee' },
    { field: 'otherExpenses', label: 'Other Expenses' },
  ];

  const handleExport = () => {
    // CSV export logic would go here
    alert('CSV export feature - to be implemented');
  };

  const handlePrint = () => {
    window.print();
  };

  // Component for rendering a line item row
  const LineItem = ({ field, label, indentLevel = 1, indent }) => {
    const actualIndent = indent || indentLevel;
    return (
      <tr className="hover:bg-gray-50">
        <td
          className="sticky left-0 z-10 bg-white px-2 py-0.5 text-gray-700 border-b border-gray-300 text-xs"
          style={{ paddingLeft: `${actualIndent * 0.75}rem` }}
        >
          {label}
        </td>
        {periods.map((period, idx) => (
          <td key={idx} className="px-2 py-0.5 text-right font-mono text-xs border-b border-gray-300">
            {formatValue(period.data[field])}
          </td>
        ))}
        <td className="px-2 py-0.5 text-right font-mono text-xs border-b border-gray-300 bg-gray-50">
          {formatValue(calculateYTD(field))}
        </td>
      </tr>
    );
  };

  // Component for section header
  const SectionHeader = ({ title, sectionKey }) => (
    <tr className="bg-gray-50">
      <td
        className="sticky left-0 z-10 bg-gray-50 px-2 py-1 font-bold text-gray-900 cursor-pointer border-b border-gray-300 text-xs"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-1">
          {expandedSections[sectionKey] ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          {title}
        </div>
      </td>
      <td colSpan={periods.length + 1} className="border-b border-gray-300"></td>
    </tr>
  );

  // Component for subtotal row
  const SubtotalRow = ({ label, value, periods, highlightColor = 'blue' }) => {
    const bgColor = highlightColor === 'blue' ? 'bg-blue-50' : highlightColor === 'green' ? 'bg-green-50' : 'bg-yellow-50';
    const bgColorStrong = highlightColor === 'blue' ? 'bg-blue-100' : highlightColor === 'green' ? 'bg-green-100' : 'bg-yellow-100';

    return (
      <tr className={`${bgColor} font-semibold`}>
        <td className={`sticky left-0 z-10 ${bgColor} px-2 py-1 text-gray-900 border-b border-gray-300 text-xs`}>
          {label}
        </td>
        {periods.map((period, idx) => (
          <td key={idx} className={`px-2 py-1 text-right font-mono border-b border-gray-300 text-xs`}>
            {formatValue(period.data[value])}
          </td>
        ))}
        <td className={`px-2 py-1 text-right font-mono border-b border-gray-300 ${bgColorStrong} text-xs`}>
          {formatValue(calculateYTD(value))}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white border border-gray-300 p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700"
          >
            <Printer className="w-3 h-3" />
            Print
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-100">
              <th className="sticky left-0 z-30 bg-gray-100 px-2 py-1 text-left font-semibold text-gray-900 border-b-2 border-gray-400 min-w-[180px] text-xs">
                Account
              </th>
              {periods.map((period, idx) => (
                <th
                  key={idx}
                  className="px-2 py-1 text-right font-semibold text-gray-700 border-b-2 border-gray-400 min-w-[90px] text-xs"
                >
                  {period.label}
                </th>
              ))}
              <th className="px-2 py-1 text-right font-semibold text-gray-900 border-b-2 border-gray-400 bg-gray-200 min-w-[90px] text-xs">
                YTD Total
              </th>
            </tr>
          </thead>
          <tbody>
            {/* INCOME SECTION */}
            <SectionHeader title="INCOME" sectionKey="income" />
            {expandedSections.income && incomeItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} />
            ))}
            <SubtotalRow label="TOTAL INCOME" value="totalIncome" periods={periods} highlightColor="blue" />

            {/* COST OF GOODS SOLD */}
            <SectionHeader title="COST OF GOODS SOLD" sectionKey="cogs" />
            {expandedSections.cogs && cogsItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} />
            ))}
            <SubtotalRow label="TOTAL COGS" value="totalCOGS" periods={periods} highlightColor="yellow" />

            {/* GROSS PROFIT */}
            <SubtotalRow label="GROSS PROFIT" value="grossProfit" periods={periods} highlightColor="green" />

            {/* OPERATING EXPENSES */}
            <tr className="bg-gray-100">
              <td className="sticky left-0 z-10 bg-gray-100 px-2 py-1 font-bold text-gray-900 border-b-2 border-gray-400 text-xs" colSpan={periods.length + 2}>
                OPERATING EXPENSES
              </td>
            </tr>

            {/* Payroll */}
            <SectionHeader title="Payroll Expenses" sectionKey="payroll" />
            {expandedSections.payroll && payrollItems.map((item) => (
              <React.Fragment key={item.field}>
                {item.hasBreakdown && item.field === 'sharedPayroll' && sharedPayrollBreakdown.map((breakdown) => (
                  <LineItem key={breakdown.field} field={breakdown.field} label={breakdown.label} indent={breakdown.indent} />
                ))}
                <LineItem field={item.field} label={item.label} indentLevel={2} />
                {item.hasBreakdown && item.field === 'physicianPayroll' && physicianPayrollBreakdown.map((breakdown) => (
                  <LineItem key={breakdown.field} field={breakdown.field} label={breakdown.label} indent={breakdown.indent} />
                ))}
                {item.hasBreakdown && item.field === 'inOfficePayroll' && inOfficePayrollBreakdown.map((breakdown) => (
                  <LineItem key={breakdown.field} field={breakdown.field} label={breakdown.label} indent={breakdown.indent} />
                ))}
              </React.Fragment>
            ))}
            {expandedSections.payroll && (
              <tr className="bg-gray-50 font-semibold">
                <td className="sticky left-0 z-10 bg-gray-50 px-2 py-1 text-gray-900 border-b border-gray-300 text-xs" style={{ paddingLeft: '1.5rem' }}>
                  Total Payroll
                </td>
                {periods.map((period, idx) => (
                  <td key={idx} className="px-2 py-1 text-right font-mono text-xs border-b border-gray-300">
                    {formatValue(period.data.payrollExpense)}
                  </td>
                ))}
                <td className="px-2 py-1 text-right font-mono text-xs border-b border-gray-300 bg-gray-100">
                  {formatValue(calculateYTD('payrollExpense'))}
                </td>
              </tr>
            )}

            {/* Facilities */}
            <SectionHeader title="Facilities Expenses" sectionKey="facilities" />
            {expandedSections.facilities && facilitiesItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} indentLevel={2} />
            ))}

            {/* Professional Services */}
            <SectionHeader title="Professional Services" sectionKey="professional" />
            {expandedSections.professional && professionalServicesItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} indentLevel={2} />
            ))}

            {/* Office & Admin */}
            <SectionHeader title="Office & Administrative" sectionKey="office" />
            {expandedSections.office && officeItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} indentLevel={2} />
            ))}

            {/* Marketing */}
            <SectionHeader title="Marketing & Advertising" sectionKey="marketing" />
            {expandedSections.marketing && marketingItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} indentLevel={2} />
            ))}

            {/* Medical Operations */}
            <SectionHeader title="Medical Operations" sectionKey="medical" />
            {expandedSections.medical && medicalOperationsItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} indentLevel={2} />
            ))}

            {/* Travel & Auto */}
            <SectionHeader title="Travel & Automobile" sectionKey="travel" />
            {expandedSections.travel && travelAutoItems.map((item) => (
              <React.Fragment key={item.field}>
                {item.hasBreakdown && item.field === 'automobileExpense' && automobileBreakdown.map((breakdown) => (
                  <LineItem key={breakdown.field} field={breakdown.field} label={breakdown.label} indent={breakdown.indent} />
                ))}
                <LineItem field={item.field} label={item.label} indentLevel={2} />
                {item.hasBreakdown && item.field === 'mealsEntertainmentExpense' && mealsBreakdown.map((breakdown) => (
                  <LineItem key={breakdown.field} field={breakdown.field} label={breakdown.label} indent={breakdown.indent} />
                ))}
              </React.Fragment>
            ))}

            {/* Other Expenses */}
            <SectionHeader title="Other Operating Expenses" sectionKey="other" />
            {expandedSections.other && otherExpenseItems.map((item) => (
              <React.Fragment key={item.field}>
                {item.hasBreakdown && item.field === 'insuranceExpense' && insuranceBreakdown.map((breakdown) => (
                  <LineItem key={breakdown.field} field={breakdown.field} label={breakdown.label} indent={breakdown.indent} />
                ))}
                <LineItem field={item.field} label={item.label} indentLevel={2} />
              </React.Fragment>
            ))}

            <SubtotalRow label="TOTAL OPERATING EXPENSES" value="totalExpenses" periods={periods} highlightColor="yellow" />

            {/* NET ORDINARY INCOME */}
            <SubtotalRow label="NET ORDINARY INCOME" value="netOrdinaryIncome" periods={periods} highlightColor="green" />

            {/* OTHER INCOME/EXPENSE */}
            <SectionHeader title="OTHER INCOME / (EXPENSE)" sectionKey="otherIncomeExpense" />
            {expandedSections.otherIncomeExpense && otherIncomeExpenseItems.map((item) => (
              <LineItem key={item.field} field={item.field} label={item.label} />
            ))}

            {/* NET INCOME */}
            <tr className="bg-blue-100 font-bold">
              <td className="sticky left-0 z-10 bg-blue-100 px-2 py-1 text-gray-900 border-b-2 border-gray-400 text-xs">
                NET INCOME
              </td>
              {periods.map((period, idx) => (
                <td key={idx} className="px-2 py-1 text-right font-mono border-b-2 border-gray-400 text-xs">
                  {formatValue(period.data.netIncome)}
                </td>
              ))}
              <td className="px-2 py-1 text-right font-mono border-b-2 border-gray-400 bg-blue-200 text-xs">
                {formatValue(calculateYTD('netIncome'))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLossTableComplete;
