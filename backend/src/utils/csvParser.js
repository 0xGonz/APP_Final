import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

/**
 * CSV Parser for APP23 Financial Data
 * Parses P&L CSV files and extracts financial data by month
 */

// Mapping of CSV row labels to database field names - ALL 80+ Line Items
const FIELD_MAPPINGS = {
  // ============ INCOME (8 items + Total) ============
  '40000 · HD Research LLC Income': 'hdResearchIncome',
  '40000 � HD Research LLC Income': 'hdResearchIncome', // Unicode variant
  '41000 · Personal Injury': 'personalInjuryIncome',
  '41000 � Personal Injury': 'personalInjuryIncome',
  '43000 · ACH Credit': 'achCreditIncome',
  '43000 � ACH Credit': 'achCreditIncome',
  '42000 · Nonmedical Income': 'nonmedicalIncome',
  '42000 � Nonmedical Income': 'nonmedicalIncome',
  '44000 · OTC Deposit': 'otcDepositIncome',
  '44000 � OTC Deposit': 'otcDepositIncome',
  '44500 · Practice Income': 'practiceIncome',
  '44500 � Practice Income': 'practiceIncome',
  '45000 · Refunds': 'refundsIncome',
  '45000 � Refunds': 'refundsIncome',
  '46000 · Management Fee Income': 'managementFeeIncome',
  '46000 � Management Fee Income': 'managementFeeIncome',
  'Total Income': 'totalIncome',

  // ============ COST OF GOODS SOLD (13 items + Total) ============
  '51000 · Consulting': 'consultingCOGS',
  '51000 � Consulting': 'consultingCOGS',
  '52000 · Medical Waste': 'medicalWasteCOGS',
  '52000 � Medical Waste': 'medicalWasteCOGS',
  '53000 · Medical Billing': 'medicalBillingCOGS',
  '53000 � Medical Billing': 'medicalBillingCOGS',
  '54000 · Medical Supplies': 'medicalSuppliesCOGS',
  '54000 � Medical Supplies': 'medicalSuppliesCOGS',
  '55000 · Contract Labor': 'contractLaborCOGS',
  '55000 � Contract Labor': 'contractLaborCOGS',
  '56000 · Merchant Fees': 'merchantFeesCOGS',
  '56000 � Merchant Fees': 'merchantFeesCOGS',
  '58000 · Management Fees': 'managementFeesCOGS',
  '58000 � Management Fees': 'managementFeesCOGS',
  '64300 · Medical Books and Research': 'medicalBooksCOGS',
  '64300 � Medical Books and Research': 'medicalBooksCOGS',
  '64300· Medical Books and Research': 'medicalBooksCOGS', // No space variant
  '64300� Medical Books and Research': 'medicalBooksCOGS', // Unicode � variant
  '68200 · Laboratory Fees': 'laboratoryFeesCOGS',
  '68200 � Laboratory Fees': 'laboratoryFeesCOGS',
  '68200· Laboratory Fees': 'laboratoryFeesCOGS', // No space variant
  '68200� Laboratory Fees': 'laboratoryFeesCOGS', // Unicode � variant
  '59100 · Laboratory Directory': 'laboratoryDirectoryCOGS',
  '59100 � Laboratory Directory': 'laboratoryDirectoryCOGS',
  '68300 · Lab Supplies': 'labSuppliesCOGS',
  '68300 � Lab Supplies': 'labSuppliesCOGS',
  '68300· Lab Supplies': 'labSuppliesCOGS', // No space variant
  '68300� Lab Supplies': 'labSuppliesCOGS', // Unicode � variant
  '59300 · Patient Expense': 'patientExpenseCOGS',
  '59300 � Patient Expense': 'patientExpenseCOGS',
  '59400 · Chronic Care Management': 'chronicCareManagementCOGS',
  '59400 � Chronic Care Management': 'chronicCareManagementCOGS',
  '57500 · Chronic Care Management': 'chronicCareManagementCOGS', // Alt code
  '57500 � Chronic Care Management': 'chronicCareManagementCOGS',
  '6380 · Laboratory Directory': 'laboratoryDirectoryCOGS', // Alt code
  '6380 � Laboratory Directory': 'laboratoryDirectoryCOGS',
  'Cost of Goods Sold': 'totalCOGS',
  'Total COGS': 'totalCOGS',
  'Gross Profit': 'grossProfit',

  // ============ PAYROLL - SHARED (5 items) ============
  '66030 · Wages': 'payrollSharedWages',
  '66030 � Wages': 'payrollSharedWages',
  '66033 · Payroll Tax': 'payrollSharedTax',
  '66033 � Payroll Tax': 'payrollSharedTax',
  '66031 · Payroll Overhead': 'payrollSharedOverhead',
  '66031 � Payroll Overhead': 'payrollSharedOverhead',
  '66032 · Health Insurance': 'payrollSharedHealth',
  '66032 � Health Insurance': 'payrollSharedHealth',
  '66038 · Contract Labor': 'payrollSharedContract',
  '66038 � Contract Labor': 'payrollSharedContract',
  '66039 · Reimbursments': 'payrollSharedReimbursements', // Typo in CSV
  '66039 � Reimbursments': 'payrollSharedReimbursements',
  'Total Shared Payroll': 'sharedPayroll',

  // ============ PAYROLL - PHYSICIAN (4 items) ============
  '66010 · Wages': 'payrollPhysicianWages',
  '66010 � Wages': 'payrollPhysicianWages',
  '66011 · Payroll Tax': 'payrollPhysicianTax',
  '66011 � Payroll Tax': 'payrollPhysicianTax',
  '66012 · Provider Benefits': 'payrollPhysicianBenefits',
  '66012 � Provider Benefits': 'payrollPhysicianBenefits',
  '66075 · Physician Bonus': 'payrollPhysicianBonus',
  '66075 � Physician Bonus': 'payrollPhysicianBonus',
  'Physician Payroll - Other': 'payrollPhysicianOther',
  'Total Physician Payroll': 'physicianPayroll',

  // ============ PAYROLL - IN-OFFICE (1 item) ============
  '66020 · Salary - Other': 'payrollInOfficeSalary',
  '66020 � Salary - Other': 'payrollInOfficeSalary',
  '66051 · Wages': 'payrollInOfficeWages',
  '66051 � Wages': 'payrollInOfficeWages',
  '66052 · Bonus': 'payrollInOfficeBonus',
  '66052 � Bonus': 'payrollInOfficeBonus',
  '66053 · NP Extra Visits': 'payrollInOfficeNPExtraVisits',
  '66053 � NP Extra Visits': 'payrollInOfficeNPExtraVisits',
  '66054 · Telehealth': 'payrollInOfficeTelehealth',
  '66054 � Telehealth': 'payrollInOfficeTelehealth',
  '66055 · Administration': 'payrollInOfficeAdministration',
  '66055 � Administration': 'payrollInOfficeAdministration',
  '66061 · Payroll Taxes': 'payrollInOfficePayrollTaxes',
  '66061 � Payroll Taxes': 'payrollInOfficePayrollTaxes',
  '66062 · Unemployment': 'payrollInOfficeUnemployment',
  '66062 � Unemployment': 'payrollInOfficeUnemployment',
  '66071 · Health Insurance': 'payrollInOfficeHealthInsurance',
  '66071 � Health Insurance': 'payrollInOfficeHealthInsurance',
  '66072 · Simple Plan Match': 'payrollInOfficeSimplePlanMatch',
  '66072 � Simple Plan Match': 'payrollInOfficeSimplePlanMatch',
  'In Office Payroll - Other': 'payrollInOfficeOther',
  'Total In-Office Payroll': 'inOfficePayroll',

  // ============ PAYROLL - PROCESSING (1 item) ============
  '65800 · Payroll Processing Fees': 'payrollProcessingFees',
  '65800 � Payroll Processing Fees': 'payrollProcessingFees',
  'Payroll - Other': 'payrollOther',
  'Total Payroll': 'payrollExpense',

  // ============ FACILITIES (5 items) ============
  '67100 · Rent Expense': 'rentExpense',
  '67100 � Rent Expense': 'rentExpense',
  '68600 · Utilities': 'utilitiesExpense',
  '68600 � Utilities': 'utilitiesExpense',
  '65900 · Janitorial Expense': 'janitorialExpense',
  '65900· Janitorial Expense': 'janitorialExpense',
  '65900� Janitorial Expense': 'janitorialExpense',
  '67200 · Repairs and Maintenance': 'repairsMaintenanceExpense',
  '67200 � Repairs and Maintenance': 'repairsMaintenanceExpense',
  '67400 · Security': 'securityExpense',
  '67400 � Security': 'securityExpense',

  // ============ PROFESSIONAL SERVICES (4 items) ============
  '65100 · Accounting': 'accountingExpense',
  '65100 � Accounting': 'accountingExpense',
  '66400 · Legal Fees': 'legalFeesExpense',
  '66400 � Legal Fees': 'legalFeesExpense',
  '66700 · Professional Fees': 'professionalFeesExpense',
  '66700 � Professional Fees': 'professionalFeesExpense',
  '65475 · Credentialing': 'credentialingExpense',
  '65475 � Credentialing': 'credentialingExpense',

  // ============ OFFICE & ADMIN (5 items) ============
  '66800 · Office Expense': 'officeExpense',
  '66800 � Office Expense': 'officeExpense',
  '64900 · Office Supplies': 'officeSuppliesExpense',
  '64900 � Office Supplies': 'officeSuppliesExpense',
  '66900 · Postage': 'postageExpense',
  '66900 � Postage': 'postageExpense',
  '67300 · Printing': 'printingExpense',
  '67300 � Printing': 'printingExpense',
  '68100 · Computer Expense': 'computerExpense',
  '68100 � Computer Expense': 'computerExpense',
  '66200 · Telephone and Internet': 'telephoneInternetExpense',
  '66200 � Telephone and Internet': 'telephoneInternetExpense',

  // ============ MARKETING (2 items) ============
  '65000 · Advertising and Promotion': 'advertisingExpense',
  '65000 � Advertising and Promotion': 'advertisingExpense',
  '65350 · Charitable Contributions': 'charitableExpense',
  '65350 � Charitable Contributions': 'charitableExpense',

  // ============ MEDICAL OPERATIONS (5 items) ============
  '67700 · Small Medical Equipment': 'smallMedicalEquipExpense',
  '67700 � Small Medical Equipment': 'smallMedicalEquipExpense',
  '67600 · Oxygen and Gas': 'oxygenGasExpense',
  '67600 � Oxygen and Gas': 'oxygenGasExpense',
  '67900 · Radiation Badges': 'radiationBadgesExpense',
  '67900 � Radiation Badges': 'radiationBadgesExpense',
  '66500 · Linens and Cleaning': 'linensCleaningExpense',
  '66500 � Linens and Cleaning': 'linensCleaningExpense',
  '67500 · Equipment Rental': 'equipmentRentalExpense',
  '67500 � Equipment Rental': 'equipmentRentalExpense',

  // ============ TRAVEL & AUTO (9 items) ============
  'Automobile Expense': 'automobileExpense',
  'Total Automobile Expense': 'automobileExpense',
  'Automobile Expense - Other': 'automobileExpenseOther',
  '65210 · Gas': 'gasExpense',
  '65210 � Gas': 'gasExpense',
  '65220 · Parking': 'parkingExpense',
  '65220 � Parking': 'parkingExpense',
  '68400 · Travel Expense': 'travelExpense',
  '68400 � Travel Expense': 'travelExpense',
  '66110 · Business Entertainment': 'businessEntertainmentExpense',
  '66110 � Business Entertainment': 'businessEntertainmentExpense',
  '66150 · Employee meals on Premises': 'employeeMealsExpense',
  '66150 � Employee meals on Premises': 'employeeMealsExpense',
  '66160 · Travel Meals': 'travelMealsExpense',
  '66160 � Travel Meals': 'travelMealsExpense',
  '66140 · Office Snacks and Beverages': 'officeSnacksExpense',
  '66140 � Office Snacks and Beverages': 'officeSnacksExpense',
  '66140 · Office Party': 'officePartyExpense',
  '66140 � Office Party': 'officePartyExpense',
  '66140· Office Party': 'officePartyExpense', // No space variant
  'Meals and Entertainment - Other': 'mealsEntertainmentExpenseOther',
  'Total Meals and Entertainment': 'mealsEntertainmentExpense',

  // ============ OTHER EXPENSES (13 items) ============
  '65610 · Health Insurance': 'healthInsuranceExpense',
  '65610 � Health Insurance': 'healthInsuranceExpense',
  '65620 · Liability Insurance': 'liabilityInsuranceExpense',
  '65620 � Liability Insurance': 'liabilityInsuranceExpense',
  '65630 · Medical Malpractice': 'medicalMalpracticeExpense',
  '65630 � Medical Malpractice': 'medicalMalpracticeExpense',
  'Insurance - Other': 'insuranceExpenseOther',
  'Total Insurance': 'insuranceExpense',
  '68000 · Taxes': 'taxesExpense',
  '68000 � Taxes': 'taxesExpense',
  '68010 · Personal Property Tax': 'personalPropertyTaxExpense',
  '68010 � Personal Property Tax': 'personalPropertyTaxExpense',
  '68020 · Franchise Tax': 'franchiseTaxExpense',
  '68020 � Franchise Tax': 'franchiseTaxExpense',
  '65700 · Business Licenses and Permits': 'licensesPermitsExpense',
  '65700 � Business Licenses and Permits': 'licensesPermitsExpense',
  '6380 · License & Fee': 'licenseFeeExpense',
  '6380 � License & Fee': 'licenseFeeExpense',
  '65300 · Bank Service Charges': 'bankServiceChargesExpense',
  '65300 � Bank Service Charges': 'bankServiceChargesExpense',
  '65400 · Continuing Education': 'continuingEducationExpense',
  '65400 � Continuing Education': 'continuingEducationExpense',
  '65500 · Dues and Subscriptions': 'duesSubscriptionsExpense',
  '65500 � Dues and Subscriptions': 'duesSubscriptionsExpense',
  '68500 · Uniforms': 'uniformsExpense',
  '68500 � Uniforms': 'uniformsExpense',
  '69900 · Answering Service': 'answeringServiceExpense',
  '69900 � Answering Service': 'answeringServiceExpense',
  '67800 · Recruiting': 'recruitingExpense',
  '67800 � Recruiting': 'recruitingExpense',
  '66600 · Moving Expense': 'movingExpense',
  '66600 � Moving Expense': 'movingExpense',
  '66120 · Marketing Gifts': 'marketingGiftsExpense',
  '66120 � Marketing Gifts': 'marketingGiftsExpense',
  '68700 · Conference Fees': 'conferenceFeesExpense',
  '68700 � Conference Fees': 'conferenceFeesExpense',
  '70000 · Miscellaneous': 'miscellaneousExpense',
  '70000· Miscellaneous': 'miscellaneousExpense',
  '70000� Miscellaneous': 'miscellaneousExpense',

  'Total Expense': 'totalExpenses',
  'Net Ordinary Income': 'netOrdinaryIncome',

  // ============ OTHER INCOME/EXPENSE (6 items) ============
  '93000 · Interest Income': 'interestIncome',
  '93000 � Interest Income': 'interestIncome',
  '84000 · Depreciation Expense': 'depreciationExpense',
  '84000 � Depreciation Expense': 'depreciationExpense',
  '80000 · Management Fee Paid': 'managementFeePaid',
  '80000 � Management Fee Paid': 'managementFeePaid',
  '85000 · Interest Expense': 'interestExpense',
  '85000 � Interest Expense': 'interestExpense',
  '89005 · Corporate Admin Fee': 'corporateAdminFee',
  '89005 � Corporate Admin Fee': 'corporateAdminFee',
  '80500 · Other Expenses': 'otherExpenses',
  '80500 � Other Expenses': 'otherExpenses',

  'Net Income': 'netIncome',
};

/**
 * Parse a numeric value from CSV (handles commas, parentheses for negatives, dashes for zero)
 */
function parseNumericValue(value) {
  if (!value || value === '-' || value.trim() === '') {
    return 0;
  }

  // Remove spaces and commas
  let cleaned = value.replace(/,/g, '').replace(/\s/g, '');

  // Handle parentheses (negative values)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  // Handle quotes
  cleaned = cleaned.replace(/"/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Extract clinic name from filename
 */
function extractClinicName(filename) {
  const match = filename.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].replace(/_/g, ' ');
  }
  return filename.replace('.csv', '');
}

/**
 * Extract clinic location from full clinic name in CSV
 * E.g., "American Pain Partners LLC - Webster" => "Webster"
 */
function extractClinicLocation(fullName) {
  if (!fullName || typeof fullName !== 'string') return null;

  // Pattern: "American Pain Partners LLC - Location"
  const match = fullName.match(/American Pain Partners LLC\s*-\s*(.+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  // If it doesn't match the pattern, check if it's just a location name
  const cleanName = fullName.trim();
  if (cleanName && !cleanName.includes('LLC') && !cleanName.includes('Profit') && !cleanName.includes('Loss')) {
    return cleanName;
  }

  return null;
}

/**
 * Parse month from column header (e.g., "Jan 23" => {year: 2023, month: 1})
 */
function parseMonthHeader(header) {
  if (!header || header.trim() === '') return null;

  const parts = header.trim().split(' ');
  if (parts.length !== 2) return null;

  const monthMap = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };

  const month = monthMap[parts[0]];
  if (!month) return null;

  let yearShort = parseInt(parts[1]);
  if (isNaN(yearShort)) return null;

  // Convert 2-digit year to 4-digit (23 => 2023, 24 => 2024, 25 => 2025)
  const year = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;

  return { year, month };
}

/**
 * Parse a single CSV file
 */
export function parseCSVFile(filePath) {
  const filename = path.basename(filePath);
  const clinicNameFromFile = extractClinicName(filename);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    skip_empty_lines: true,
    relax_column_count: true,
  });

  if (records.length < 5) {
    throw new Error(`Invalid CSV format: ${filename}`);
  }

  // Try to extract clinic name from Row 0 (e.g., "American Pain Partners LLC - Webster")
  const row0Text = records[0] && records[0][0];
  const clinicLocationFromCSV = extractClinicLocation(row0Text);

  // Prefer CSV content over filename, fallback to filename
  const clinicName = clinicLocationFromCSV || clinicNameFromFile;

  console.log(`📄 Parsing ${filename}`);
  console.log(`   CSV Row 0: "${row0Text}"`);
  console.log(`   Extracted clinic: "${clinicName}"`);

  // Row 4 (index 3) contains month headers
  const headerRow = records[3];

  // Parse month columns
  const monthColumns = [];
  for (let i = 1; i < headerRow.length; i += 2) {
    const monthInfo = parseMonthHeader(headerRow[i]);
    if (monthInfo) {
      monthColumns.push({
        ...monthInfo,
        columnIndex: i,
      });
    }
  }

  console.log(`Found ${monthColumns.length} month columns`);

  // Parse financial data for each month
  const financialData = [];

  for (const monthCol of monthColumns) {
    const monthData = {
      clinicName,
      year: monthCol.year,
      month: monthCol.month,
      date: new Date(monthCol.year, monthCol.month - 1, 1),
    };

    // Parse each row and extract values
    for (let rowIndex = 4; rowIndex < records.length; rowIndex++) {
      const row = records[rowIndex];
      const label = row[0]?.trim();

      if (!label) continue;

      const fieldName = FIELD_MAPPINGS[label];
      if (fieldName) {
        const value = parseNumericValue(row[monthCol.columnIndex]);
        monthData[fieldName] = value;
      } else {
        // Log unmapped rows (exclude header rows and empty rows)
        if (!label.includes('===') && !label.includes('INCOME') && !label.includes('EXPENSE')) {
          console.warn(`⚠️  Unmapped CSV row: "${label}"`);
        }
      }
    }

    // Check if this month has any non-zero financial data
    const hasFinancialData = Object.entries(monthData)
      .filter(([key, value]) => typeof value === 'number' && value !== 0)
      .length > 0;

    if (hasFinancialData) {
      financialData.push(monthData);
    } else {
      console.log(`Skipping empty month: ${monthCol.month}/${monthCol.year} for ${clinicName}`);
    }
  }

  return {
    clinicName,
    data: financialData,
  };
}

/**
 * Parse all CSV files in a directory
 */
export function parseAllCSVFiles(dataDir) {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

  console.log(`Found ${files.length} CSV files to parse`);

  const allData = [];

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const result = parseCSVFile(filePath);
      allData.push(result);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error.message);
    }
  }

  return allData;
}

/**
 * Validate parsed data
 */
export function validateFinancialRecord(record) {
  const errors = [];

  if (!record.clinicName) errors.push('Missing clinic name');
  if (!record.year || record.year < 2020 || record.year > 2030) {
    errors.push('Invalid year');
  }
  if (!record.month || record.month < 1 || record.month > 12) {
    errors.push('Invalid month');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  parseCSVFile,
  parseAllCSVFiles,
  validateFinancialRecord,
};
