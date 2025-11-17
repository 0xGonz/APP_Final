// Line item definitions for financial comparisons
export const LINE_ITEMS = {
  income: {
    label: 'Income',
    items: {
      hdResearchIncome: 'HD Research Income',
      personalInjuryIncome: 'Personal Injury Income',
      achCreditIncome: 'ACH Credit Income',
      nonmedicalIncome: 'Non-Medical Income',
      otcDepositIncome: 'OTC Deposit Income',
      practiceIncome: 'Practice Income',
      refundsIncome: 'Refunds Income',
      managementFeeIncome: 'Management Fee Income',
    },
  },
  cogs: {
    label: 'Cost of Goods Sold (COGS)',
    items: {
      consultingCOGS: 'Consulting',
      medicalWasteCOGS: 'Medical Waste',
      medicalBillingCOGS: 'Medical Billing',
      medicalSuppliesCOGS: 'Medical Supplies',
      contractLaborCOGS: 'Contract Labor',
      merchantFeesCOGS: 'Merchant Fees',
      managementFeesCOGS: 'Management Fees',
      medicalBooksCOGS: 'Medical Books',
      laboratoryFeesCOGS: 'Laboratory Fees',
      laboratoryDirectoryCOGS: 'Laboratory Directory',
      labSuppliesCOGS: 'Lab Supplies',
      patientExpenseCOGS: 'Patient Expense',
      chronicCareManagementCOGS: 'Chronic Care Management',
    },
  },
  expenses: {
    label: 'Operating Expenses',
    items: {
      payrollExpense: 'Total Payroll',
      rentExpense: 'Rent',
      advertisingExpense: 'Advertising',
      utilitiesExpense: 'Utilities',
      insuranceExpense: 'Total Insurance',
      recruitingExpense: 'Recruiting',
      oxygenGasExpense: 'Oxygen Gas',
      radiationBadgesExpense: 'Radiation Badges',
      equipmentRentalExpense: 'Equipment Rental',
      accountingExpense: 'Accounting',
      credentialingExpense: 'Credentialing',
      janitorialExpense: 'Janitorial',
      automobileExpense: 'Automobile',
      automobileExpenseOther: 'Automobile: Other',
      gasExpense: 'Gas',
      parkingExpense: 'Parking',
      marketingGiftsExpense: 'Marketing Gifts',
      bankServiceChargesExpense: 'Bank Service Charges',
      charitableExpense: 'Charitable',
      licensesPermitsExpense: 'Licenses & Permits',
      licenseFeeExpense: 'License Fee',
      telephoneInternetExpense: 'Telephone & Internet',
      conferenceFeesExpense: 'Conference Fees',
      continuingEducationExpense: 'Continuing Education',
      duesSubscriptionsExpense: 'Dues & Subscriptions',
      healthInsuranceExpense: 'Health Insurance',
      liabilityInsuranceExpense: 'Liability Insurance',
      medicalMalpracticeExpense: 'Medical Malpractice',
      insuranceExpenseOther: 'Insurance: Other',
      legalFeesExpense: 'Legal Fees',
      linensCleaningExpense: 'Linens & Cleaning',
      mealsEntertainmentExpense: 'Total Meals & Entertainment',
      businessEntertainmentExpense: 'Business Entertainment',
      employeeMealsExpense: 'Employee Meals',
      travelMealsExpense: 'Travel Meals',
      officeSnacksExpense: 'Office Snacks',
      officePartyExpense: 'Office Party',
      mealsEntertainmentExpenseOther: 'Meals & Entertainment: Other',
      movingExpense: 'Moving',
      officeExpense: 'Office',
      officeSuppliesExpense: 'Office Supplies',
      postageExpense: 'Postage',
      sharedPayroll: 'Shared Payroll (Total)',
      payrollSharedWages: 'Payroll: Shared Wages',
      payrollSharedTax: 'Payroll: Shared Tax',
      payrollSharedOverhead: 'Payroll: Shared Overhead',
      payrollSharedHealth: 'Payroll: Shared Health',
      payrollSharedContract: 'Payroll: Shared Contract',
      payrollSharedReimbursements: 'Payroll: Shared Reimbursements',
      physicianPayroll: 'Physician Payroll (Total)',
      payrollPhysicianWages: 'Payroll: Physician Wages',
      payrollPhysicianTax: 'Payroll: Physician Tax',
      payrollPhysicianBenefits: 'Payroll: Physician Benefits',
      payrollPhysicianBonus: 'Payroll: Physician Bonus',
      payrollPhysicianOther: 'Payroll: Physician Other',
      inOfficePayroll: 'In-Office Payroll (Total)',
      payrollInOfficeSalary: 'Payroll: In-Office Salary',
      payrollInOfficeWages: 'Payroll: In-Office Wages',
      payrollInOfficeBonus: 'Payroll: In-Office Bonus',
      payrollInOfficeNPExtraVisits: 'Payroll: In-Office NP Extra Visits',
      payrollInOfficeTelehealth: 'Payroll: In-Office Telehealth',
      payrollInOfficeAdministration: 'Payroll: In-Office Administration',
      payrollInOfficePayrollTaxes: 'Payroll: In-Office Payroll Taxes',
      payrollInOfficeUnemployment: 'Payroll: In-Office Unemployment',
      payrollInOfficeHealthInsurance: 'Payroll: In-Office Health Insurance',
      payrollInOfficeSimplePlanMatch: 'Payroll: In-Office Simple Plan Match',
      payrollInOfficeOther: 'Payroll: In-Office Other',
      payrollProcessingFees: 'Payroll Processing Fees',
      payrollOther: 'Payroll: Other',
      printingExpense: 'Printing',
      professionalFeesExpense: 'Professional Fees',
      repairsMaintenanceExpense: 'Repairs & Maintenance',
      securityExpense: 'Security',
      smallMedicalEquipExpense: 'Small Medical Equipment',
      taxesExpense: 'Taxes',
      personalPropertyTaxExpense: 'Personal Property Tax',
      franchiseTaxExpense: 'Franchise Tax',
      computerExpense: 'Computer',
      miscellaneousExpense: 'Miscellaneous',
      travelExpense: 'Travel',
      uniformsExpense: 'Uniforms',
      answeringServiceExpense: 'Answering Service',
    },
  },
  other: {
    label: 'Other Items',
    items: {
      interestIncome: 'Interest Income',
      netOrdinaryIncome: 'Net Ordinary Income',
      depreciationExpense: 'Depreciation',
      managementFeePaid: 'Management Fee Paid',
      interestExpense: 'Interest Expense',
      corporateAdminFee: 'Corporate Admin Fee',
      otherExpenses: 'Other Expenses',
    },
  },
};

// Get all line items as a flat array
export const getAllLineItems = () => {
  const allItems = [];
  Object.entries(LINE_ITEMS).forEach(([category, { label: categoryLabel, items }]) => {
    Object.entries(items).forEach(([key, label]) => {
      allItems.push({
        key,
        label,
        category,
        categoryLabel,
        fullPath: `lineItems.${category}.${key}`,
      });
    });
  });
  return allItems;
};

// Get line item value from clinic data
export const getLineItemValue = (clinic, category, key) => {
  return clinic?.lineItems?.[category]?.[key] || 0;
};

// Format field name for display
export const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/COGS/g, '')
    .replace(/Expense/g, '')
    .replace(/Income/g, '')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
};
