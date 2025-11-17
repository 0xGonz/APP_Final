/**
 * Data Mapping Verification Tool
 *
 * This script verifies that all CSV line items are correctly mapped
 * to the database schema fields
 */

// CSV Line Items from P&L Files
const csvLineItems = {
  // INCOME SECTION
  '40000': 'HD Research LLC Income',
  '41000': 'Personal Injury',
  '43000': 'ACH Credit',
  '42000': 'Nonmedical Income',
  '44000': 'OTC Deposit',
  '44500': 'Practice Income',
  '45000': 'Refunds',
  '46000': 'Management Fee Income',

  // COST OF GOODS SOLD
  '51000': 'Consulting',
  '52000': 'Medical Waste',
  '53000': 'Medical Billing',
  '54000': 'Medical Supplies',
  '55000': 'Contract Labor',
  '56000': 'Merchant Fees',
  '58000': 'Management Fees',
  '57000': 'Medical Books',
  '59000': 'Laboratory Fees',
  '59100': 'Laboratory Directory',
  '59200': 'Lab Supplies',
  '59300': 'Patient Expense',
  '59400': 'Chronic Care Management',

  // OPERATING EXPENSES - Payroll
  '66030': 'Wages (Shared Payroll)',
  '66033': 'Payroll Tax',
  '66031': 'Payroll Overhead',
  '66032': 'Health Insurance (Payroll)',
  '66038': 'Contract Labor (Payroll)',

  '66010': 'Wages (Physician Payroll)',
  '66011': 'Payroll Tax (Physician)',
  '66012': 'Provider Benefits',
  '66075': 'Physician Bonus',

  '66020': 'Salary - Other (In-Office)',

  '65800': 'Payroll Processing Fees',

  // OPERATING EXPENSES - Facilities
  '67100': 'Rent Expense',
  '68600': 'Utilities',
  '65200': 'Janitorial',
  '67200': 'Repairs and Maintenance',
  '67400': 'Security',

  // OPERATING EXPENSES - Professional Services
  '65100': 'Accounting',
  '66400': 'Legal Fees',
  '66700': 'Professional Fees',
  '65475': 'Credentialing',

  // OPERATING EXPENSES - Office & Admin
  '66800': 'Office Expense',
  '66900': 'Postage',
  '67300': 'Printing',
  '68100': 'Computer Expense',
  '66200': 'Telephone and Internet',

  // OPERATING EXPENSES - Marketing
  '65000': 'Advertising and Promotion',
  '65350': 'Charitable Contributions',

  // OPERATING EXPENSES - Medical Operations
  '67700': 'Small Medical Equipment',
  '67600': 'Oxygen and Gas',
  '67900': 'Radiation Badges',
  '66500': 'Linens and Cleaning',
  '67500': 'Equipment Rental',

  // OPERATING EXPENSES - Travel & Auto
  '65200': 'Automobile Expense',
  '65210': 'Gas',
  '65220': 'Parking',
  '68400': 'Travel Expense',
  '66110': 'Business Entertainment',
  '66150': 'Employee meals on Premises',
  '66160': 'Travel Meals',
  '66140': 'Office Snacks and Beverages',
  '66141': 'Office Party',

  // OPERATING EXPENSES - Other
  '65610': 'Health Insurance',
  '65620': 'Liability Insurance',
  '65630': 'Medical Malpractice',
  '68000': 'Taxes',
  '65700': 'Business Licenses and Permits',
  '65300': 'Bank Service Charges',
  '65400': 'Continuing Education',
  '65500': 'Dues and Subscriptions',
  '68500': 'Uniforms',
  '69900': 'Answering Service',
  '67800': 'Recruiting',
  '66600': 'Moving Expense',
  '66120': 'Marketing Gifts',

  // OTHER INCOME/EXPENSE
  '93000': 'Interest Income',
  '84000': 'Depreciation Expense',
  '80000': 'Management Fee Paid',
  '85000': 'Interest Expense',
  '89005': 'Corporate Admin Fee',
  '80500': 'Other Expenses',
  '81000': 'APP Pearland Clearing',
  '81100': 'APP Sweep',
  '83000': 'Ask My Accountant',
};

// Database Schema Field Mapping
const databaseSchema = {
  // Income fields
  income: {
    hdResearchIncome: '40000',
    personalInjuryIncome: '41000',
    achCreditIncome: '43000',
    nonmedicalIncome: '42000',
    otcDepositIncome: '44000',
    practiceIncome: '44500',
    refundsIncome: '45000',
    managementFeeIncome: '46000',
  },

  // COGS fields
  cogs: {
    cogsConsulting: '51000',
    cogsMedicalWaste: '52000',
    cogsMedicalBilling: '53000',
    cogsMedicalSupplies: '54000',
    cogsContractLabor: '55000',
    cogsMerchantFees: '56000',
    cogsManagementFees: '58000',
    cogsMedicalBooks: '57000',
    cogsLaboratoryFees: '59000',
    cogsLaboratoryDirectory: '59100',
    cogsLabSupplies: '59200',
    cogsPatientExpense: '59300',
    cogsChronicCare: '59400',
  },

  // Payroll - Shared
  payrollShared: {
    payrollSharedWages: '66030',
    payrollSharedTax: '66033',
    payrollSharedOverhead: '66031',
    payrollSharedHealth: '66032',
    payrollSharedContract: '66038',
  },

  // Payroll - Physician
  payrollPhysician: {
    payrollPhysicianWages: '66010',
    payrollPhysicianTax: '66011',
    payrollPhysicianBenefits: '66012',
    payrollPhysicianBonus: '66075',
  },

  // Payroll - In-Office
  payrollInOffice: {
    payrollInOfficeSalary: '66020',
  },

  // Payroll Processing
  payroll: {
    payrollProcessingFees: '65800',
  },

  // Facilities
  facilities: {
    rent: '67100',
    utilities: '68600',
    janitorial: '65200',
    repairsMaintenance: '67200',
    security: '67400',
  },

  // Professional Services
  professional: {
    accounting: '65100',
    legalFees: '66400',
    professionalFees: '66700',
    credentialing: '65475',
  },

  // Office & Admin
  office: {
    officeExpense: '66800',
    postage: '66900',
    printing: '67300',
    computerExpense: '68100',
    telephoneInternet: '66200',
  },

  // Marketing
  marketing: {
    advertising: '65000',
    charitable: '65350',
  },

  // Medical Operations
  medical: {
    medicalEquipment: '67700',
    oxygenGas: '67600',
    radiationBadges: '67900',
    linensCleaning: '66500',
    equipmentRental: '67500',
  },

  // Travel & Auto
  travel: {
    automobileExpense: '65200',
    gas: '65210',
    parking: '65220',
    travelExpense: '68400',
    businessEntertainment: '66110',
    employeeMeals: '66150',
    travelMeals: '66160',
    officeSnacks: '66140',
    officeParty: '66141',
  },

  // Other Expenses
  other: {
    healthInsurance: '65610',
    liabilityInsurance: '65620',
    medicalMalpractice: '65630',
    taxes: '68000',
    licensesPermits: '65700',
    bankCharges: '65300',
    continuingEducation: '65400',
    duesSubscriptions: '65500',
    uniforms: '68500',
    answeringService: '69900',
    recruiting: '67800',
    movingExpense: '66600',
    marketingGifts: '66120',
  },

  // Other Income/Expense
  otherIncomeExpense: {
    interestIncome: '93000',
    depreciationExpense: '84000',
    managementFeePaid: '80000',
    interestExpense: '85000',
    corporateAdminFee: '89005',
    otherExpenses: '80500',
  },
};

// Verification Functions
function verifyMapping() {
  console.log('🔍 Data Mapping Verification Report\n');
  console.log('='.repeat(80));

  const errors = [];
  const warnings = [];
  const mapped = new Set();

  // Check all database fields map to valid CSV codes
  Object.entries(databaseSchema).forEach(([category, fields]) => {
    console.log(`\n📂 ${category.toUpperCase()}`);
    Object.entries(fields).forEach(([fieldName, csvCode]) => {
      if (!csvLineItems[csvCode]) {
        errors.push(`❌ ${fieldName}: maps to ${csvCode} but no CSV line item found`);
      } else {
        console.log(`  ✅ ${fieldName.padEnd(30)} → ${csvCode.padEnd(6)} ${csvLineItems[csvCode]}`);
        mapped.add(csvCode);
      }
    });
  });

  // Check for unmapped CSV codes
  console.log('\n📋 Unmapped CSV Line Items');
  console.log('='.repeat(80));
  const unmapped = Object.keys(csvLineItems).filter(code => !mapped.has(code));
  if (unmapped.length > 0) {
    unmapped.forEach(code => {
      warnings.push(`⚠️  Code ${code} (${csvLineItems[code]}) exists in CSV but not mapped to database`);
      console.log(`  ⚠️  ${code} - ${csvLineItems[code]}`);
    });
  } else {
    console.log('  ✅ All CSV line items are mapped!');
  }

  // Summary
  console.log('\n📊 Summary');
  console.log('='.repeat(80));
  console.log(`Total CSV Line Items:     ${Object.keys(csvLineItems).length}`);
  console.log(`Mapped to Database:       ${mapped.size}`);
  console.log(`Unmapped:                 ${unmapped.length}`);
  console.log(`Errors:                   ${errors.length}`);
  console.log(`Warnings:                 ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS');
    console.log('='.repeat(80));
    errors.forEach(err => console.log(err));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS');
    console.log('='.repeat(80));
    warnings.forEach(warn => console.log(warn));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ ALL MAPPINGS VERIFIED - No errors or warnings!');
  }

  return {
    totalCsvItems: Object.keys(csvLineItems).length,
    mappedItems: mapped.size,
    unmappedItems: unmapped.length,
    errors: errors.length,
    warnings: warnings.length,
    isValid: errors.length === 0,
  };
}

// Export field mapping for use in other modules
export const FIELD_MAPPING = {
  csvLineItems,
  databaseSchema,
};

// Run verification if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMapping();
}

export default verifyMapping;
