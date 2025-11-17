import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseAllCSVFiles, validateFinancialRecord } from './csvParser.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Import financial data from CSV files into PostgreSQL
 */
async function importData() {
  console.log('Starting data import...\n');

  try {
    // Parse all CSV files
    const dataDir = path.join(__dirname, '../../../data');
    console.log(`Reading CSV files from: ${dataDir}\n`);

    const parsedData = parseAllCSVFiles(dataDir);

    console.log(`\nParsed ${parsedData.length} clinic files\n`);

    // Import each clinic
    for (const clinicData of parsedData) {
      await importClinicData(clinicData);
    }

    console.log('\n✅ Data import completed successfully!');

    // Print summary
    await printImportSummary();

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Import data for a single clinic
 */
async function importClinicData(clinicData) {
  const { clinicName, data } = clinicData;

  console.log(`\n📊 Importing data for ${clinicName}...`);

  // Create or update clinic
  const clinic = await prisma.clinic.upsert({
    where: { name: clinicName },
    update: {
      location: clinicName, // Can be updated with actual location later
      active: true,
    },
    create: {
      name: clinicName,
      location: clinicName,
      active: true,
    },
  });

  console.log(`  ✓ Clinic record created/updated`);

  // Import financial records
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const record of data) {
    // Validate record
    const validation = validateFinancialRecord(record);
    if (!validation.valid) {
      console.warn(`  ⚠️  Skipping invalid record:`, validation.errors);
      skippedCount++;
      continue;
    }

    try {
      // Prepare financial record data
      const financialData = {
        clinicId: clinic.id,
        year: record.year,
        month: record.month,
        date: record.date,

        // Income
        totalIncome: record.totalIncome || 0,
        hdResearchIncome: record.hdResearchIncome || 0,
        personalInjuryIncome: record.personalInjuryIncome || 0,
        achCreditIncome: record.achCreditIncome || 0,
        nonmedicalIncome: record.nonmedicalIncome || 0,
        otcDepositIncome: record.otcDepositIncome || 0,
        practiceIncome: record.practiceIncome || 0,
        refundsIncome: record.refundsIncome || 0,
        managementFeeIncome: record.managementFeeIncome || 0,

        // COGS
        totalCOGS: record.totalCOGS || 0,
        consultingCOGS: record.consultingCOGS || 0,
        medicalWasteCOGS: record.medicalWasteCOGS || 0,
        medicalBillingCOGS: record.medicalBillingCOGS || 0,
        medicalSuppliesCOGS: record.medicalSuppliesCOGS || 0,
        contractLaborCOGS: record.contractLaborCOGS || 0,
        merchantFeesCOGS: record.merchantFeesCOGS || 0,
        managementFeesCOGS: record.managementFeesCOGS || 0,
        medicalBooksCOGS: record.medicalBooksCOGS || 0,
        laboratoryFeesCOGS: record.laboratoryFeesCOGS || 0,
        laboratoryDirectoryCOGS: record.laboratoryDirectoryCOGS || 0,
        labSuppliesCOGS: record.labSuppliesCOGS || 0,
        patientExpenseCOGS: record.patientExpenseCOGS || 0,
        chronicCareManagementCOGS: record.chronicCareManagementCOGS || 0,

        grossProfit: record.grossProfit || 0,

        // Expenses
        totalExpenses: record.totalExpenses || 0,
        recruitingExpense: record.recruitingExpense || 0,
        oxygenGasExpense: record.oxygenGasExpense || 0,
        radiationBadgesExpense: record.radiationBadgesExpense || 0,
        equipmentRentalExpense: record.equipmentRentalExpense || 0,
        accountingExpense: record.accountingExpense || 0,
        credentialingExpense: record.credentialingExpense || 0,
        janitorialExpense: record.janitorialExpense || 0,
        automobileExpense: record.automobileExpense || 0,
        automobileExpenseOther: record.automobileExpenseOther || 0,
        gasExpense: record.gasExpense || 0,
        parkingExpense: record.parkingExpense || 0,
        advertisingExpense: record.advertisingExpense || 0,
        marketingGiftsExpense: record.marketingGiftsExpense || 0,
        bankServiceChargesExpense: record.bankServiceChargesExpense || 0,
        charitableExpense: record.charitableExpense || 0,
        licensesPermitsExpense: record.licensesPermitsExpense || 0,
        licenseFeeExpense: record.licenseFeeExpense || 0,
        telephoneInternetExpense: record.telephoneInternetExpense || 0,
        conferenceFeesExpense: record.conferenceFeesExpense || 0,
        continuingEducationExpense: record.continuingEducationExpense || 0,
        duesSubscriptionsExpense: record.duesSubscriptionsExpense || 0,
        insuranceExpense: record.insuranceExpense || 0,
        healthInsuranceExpense: record.healthInsuranceExpense || 0,
        liabilityInsuranceExpense: record.liabilityInsuranceExpense || 0,
        medicalMalpracticeExpense: record.medicalMalpracticeExpense || 0,
        insuranceExpenseOther: record.insuranceExpenseOther || 0,
        legalFeesExpense: record.legalFeesExpense || 0,
        linensCleaningExpense: record.linensCleaningExpense || 0,
        mealsEntertainmentExpense: record.mealsEntertainmentExpense || 0,
        businessEntertainmentExpense: record.businessEntertainmentExpense || 0,
        employeeMealsExpense: record.employeeMealsExpense || 0,
        travelMealsExpense: record.travelMealsExpense || 0,
        officeSnacksExpense: record.officeSnacksExpense || 0,
        officePartyExpense: record.officePartyExpense || 0,
        mealsEntertainmentExpenseOther: record.mealsEntertainmentExpenseOther || 0,
        movingExpense: record.movingExpense || 0,
        officeExpense: record.officeExpense || 0,
        officeSuppliesExpense: record.officeSuppliesExpense || 0,
        postageExpense: record.postageExpense || 0,
        payrollExpense: record.payrollExpense || 0,
        sharedPayroll: record.sharedPayroll || 0,
        payrollSharedWages: record.payrollSharedWages || 0,
        payrollSharedTax: record.payrollSharedTax || 0,
        payrollSharedOverhead: record.payrollSharedOverhead || 0,
        payrollSharedHealth: record.payrollSharedHealth || 0,
        payrollSharedContract: record.payrollSharedContract || 0,
        payrollSharedReimbursements: record.payrollSharedReimbursements || 0,
        physicianPayroll: record.physicianPayroll || 0,
        payrollPhysicianWages: record.payrollPhysicianWages || 0,
        payrollPhysicianTax: record.payrollPhysicianTax || 0,
        payrollPhysicianBenefits: record.payrollPhysicianBenefits || 0,
        payrollPhysicianBonus: record.payrollPhysicianBonus || 0,
        payrollPhysicianOther: record.payrollPhysicianOther || 0,
        inOfficePayroll: record.inOfficePayroll || 0,
        payrollInOfficeSalary: record.payrollInOfficeSalary || 0,
        payrollInOfficeWages: record.payrollInOfficeWages || 0,
        payrollInOfficeBonus: record.payrollInOfficeBonus || 0,
        payrollInOfficeNPExtraVisits: record.payrollInOfficeNPExtraVisits || 0,
        payrollInOfficeTelehealth: record.payrollInOfficeTelehealth || 0,
        payrollInOfficeAdministration: record.payrollInOfficeAdministration || 0,
        payrollInOfficePayrollTaxes: record.payrollInOfficePayrollTaxes || 0,
        payrollInOfficeUnemployment: record.payrollInOfficeUnemployment || 0,
        payrollInOfficeHealthInsurance: record.payrollInOfficeHealthInsurance || 0,
        payrollInOfficeSimplePlanMatch: record.payrollInOfficeSimplePlanMatch || 0,
        payrollInOfficeOther: record.payrollInOfficeOther || 0,
        payrollProcessingFees: record.payrollProcessingFees || 0,
        payrollOther: record.payrollOther || 0,
        printingExpense: record.printingExpense || 0,
        professionalFeesExpense: record.professionalFeesExpense || 0,
        rentExpense: record.rentExpense || 0,
        repairsMaintenanceExpense: record.repairsMaintenanceExpense || 0,
        securityExpense: record.securityExpense || 0,
        smallMedicalEquipExpense: record.smallMedicalEquipExpense || 0,
        taxesExpense: record.taxesExpense || 0,
        personalPropertyTaxExpense: record.personalPropertyTaxExpense || 0,
        franchiseTaxExpense: record.franchiseTaxExpense || 0,
        computerExpense: record.computerExpense || 0,
        miscellaneousExpense: record.miscellaneousExpense || 0,
        travelExpense: record.travelExpense || 0,
        uniformsExpense: record.uniformsExpense || 0,
        utilitiesExpense: record.utilitiesExpense || 0,
        answeringServiceExpense: record.answeringServiceExpense || 0,

        netOrdinaryIncome: record.netOrdinaryIncome || 0,

        // Other
        interestIncome: record.interestIncome || 0,
        depreciationExpense: record.depreciationExpense || 0,
        managementFeePaid: record.managementFeePaid || 0,
        interestExpense: record.interestExpense || 0,
        corporateAdminFee: record.corporateAdminFee || 0,
        otherExpenses: record.otherExpenses || 0,

        netIncome: record.netIncome || 0,
      };

      // Upsert financial record
      await prisma.financialRecord.upsert({
        where: {
          clinicId_year_month: {
            clinicId: clinic.id,
            year: record.year,
            month: record.month,
          },
        },
        update: financialData,
        create: financialData,
      });

      importedCount++;
    } catch (error) {
      console.error(`  ❌ Error importing record for ${record.year}-${record.month}:`, error.message);
      errorCount++;
    }
  }

  console.log(`  ✓ Imported ${importedCount} records`);
  if (skippedCount > 0) console.log(`  ⚠️  Skipped ${skippedCount} invalid records`);
  if (errorCount > 0) console.log(`  ❌ ${errorCount} errors`);
}

/**
 * Print import summary
 */
async function printImportSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));

  const clinics = await prisma.clinic.findMany();
  console.log(`\nClinics: ${clinics.length}`);

  for (const clinic of clinics) {
    const recordCount = await prisma.financialRecord.count({
      where: { clinicId: clinic.id },
    });

    const dateRange = await prisma.financialRecord.aggregate({
      where: { clinicId: clinic.id },
      _min: { date: true },
      _max: { date: true },
    });

    console.log(`\n  📍 ${clinic.name}`);
    console.log(`     Records: ${recordCount}`);
    if (dateRange._min.date && dateRange._max.date) {
      const minDate = new Date(dateRange._min.date).toLocaleDateString();
      const maxDate = new Date(dateRange._max.date).toLocaleDateString();
      console.log(`     Date Range: ${minDate} to ${maxDate}`);
    }
  }

  const totalRecords = await prisma.financialRecord.count();
  console.log(`\nTotal Financial Records: ${totalRecords}`);
  console.log('='.repeat(60) + '\n');
}

// Run import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importData()
    .then(() => {
      console.log('Import script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import script failed:', error);
      process.exit(1);
    });
}

export default importData;
