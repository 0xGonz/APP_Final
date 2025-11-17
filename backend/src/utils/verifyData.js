import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Comprehensive Financial Data Verification Script
 * Verifies data integrity and calculation accuracy
 */

async function verifyDataIntegrity() {
  console.log('=' .repeat(80));
  console.log('FINANCIAL DATA INTEGRITY AUDIT');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Step 1: Overall Statistics
    console.log('📊 STEP 1: Overall Data Statistics');
    console.log('-'.repeat(80));

    const totalRecords = await prisma.financialRecord.count();
    const clinicCount = await prisma.clinic.count();

    console.log(`Total Financial Records: ${totalRecords}`);
    console.log(`Total Clinics: ${clinicCount}`);
    console.log(`Expected Records: ${clinicCount * 36} (${clinicCount} clinics × 36 months)`);

    if (totalRecords !== clinicCount * 36) {
      console.log(`⚠️  WARNING: Record count mismatch! Expected ${clinicCount * 36}, found ${totalRecords}`);
    } else {
      console.log(`✅ Record count is correct`);
    }
    console.log('');

    // Step 2: Per-Clinic Analysis
    console.log('📍 STEP 2: Per-Clinic Analysis');
    console.log('-'.repeat(80));

    const clinics = await prisma.clinic.findMany({
      orderBy: { name: 'asc' },
    });

    for (const clinic of clinics) {
      const recordCount = await prisma.financialRecord.count({
        where: { clinicId: clinic.id },
      });

      const dateRange = await prisma.financialRecord.aggregate({
        where: { clinicId: clinic.id },
        _min: { date: true, year: true, month: true },
        _max: { date: true, year: true, month: true },
      });

      console.log(`\n${clinic.name}:`);
      console.log(`  Records: ${recordCount}/36`);
      console.log(`  Date Range: ${dateRange._min.year}-${String(dateRange._min.month).padStart(2, '0')} to ${dateRange._max.year}-${String(dateRange._max.month).padStart(2, '0')}`);

      if (recordCount !== 36) {
        console.log(`  ⚠️  Expected 36 months, found ${recordCount}`);

        // Find missing months
        const records = await prisma.financialRecord.findMany({
          where: { clinicId: clinic.id },
          select: { year: true, month: true },
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        });

        const existingMonths = new Set(
          records.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`)
        );

        const missingMonths = [];
        for (let year = 2023; year <= 2025; year++) {
          for (let month = 1; month <= 12; month++) {
            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (!existingMonths.has(key)) {
              missingMonths.push(key);
            }
          }
        }

        if (missingMonths.length > 0) {
          console.log(`  Missing months: ${missingMonths.join(', ')}`);
        }
      } else {
        console.log(`  ✅ All 36 months present`);
      }
    }
    console.log('');

    // Step 3: Calculation Verification
    console.log('🧮 STEP 3: Calculation Verification');
    console.log('-'.repeat(80));

    // Get a sample of records to verify calculations
    const sampleRecords = await prisma.financialRecord.findMany({
      take: 10,
      include: { clinic: { select: { name: true } } },
    });

    let calculationErrors = 0;

    for (const record of sampleRecords) {
      const errors = [];

      // Verify grossProfit = totalIncome - totalCOGS
      const expectedGrossProfit = Number(record.totalIncome) - Number(record.totalCOGS);
      const actualGrossProfit = Number(record.grossProfit);
      const grossProfitDiff = Math.abs(expectedGrossProfit - actualGrossProfit);

      if (grossProfitDiff > 0.01) {
        errors.push(`Gross Profit mismatch: Expected ${expectedGrossProfit.toFixed(2)}, found ${actualGrossProfit.toFixed(2)} (diff: ${grossProfitDiff.toFixed(2)})`);
      }

      // Verify netIncome calculation
      // netIncome = grossProfit - totalExpenses - netOrdinaryIncome adjustments + other income/expenses
      const expectedNetIncome =
        Number(record.grossProfit) -
        Number(record.totalExpenses) +
        Number(record.interestIncome) -
        Number(record.depreciationExpense) -
        Number(record.managementFeePaid) -
        Number(record.interestExpense) -
        Number(record.corporateAdminFee) -
        Number(record.otherExpenses);

      const actualNetIncome = Number(record.netIncome);
      const netIncomeDiff = Math.abs(expectedNetIncome - actualNetIncome);

      if (netIncomeDiff > 0.01) {
        errors.push(`Net Income mismatch: Expected ${expectedNetIncome.toFixed(2)}, found ${actualNetIncome.toFixed(2)} (diff: ${netIncomeDiff.toFixed(2)})`);
      }

      if (errors.length > 0) {
        console.log(`\n${record.clinic.name} - ${record.year}-${String(record.month).padStart(2, '0')}:`);
        errors.forEach(err => console.log(`  ❌ ${err}`));
        calculationErrors++;
      }
    }

    if (calculationErrors === 0) {
      console.log('\n✅ All sampled calculations are correct');
    } else {
      console.log(`\n⚠️  Found calculation errors in ${calculationErrors} out of ${sampleRecords.length} sampled records`);
    }
    console.log('');

    // Step 4: Full Database Calculation Scan
    console.log('🔍 STEP 4: Full Database Calculation Scan');
    console.log('-'.repeat(80));

    const allRecords = await prisma.financialRecord.findMany({
      select: {
        id: true,
        clinicId: true,
        year: true,
        month: true,
        totalIncome: true,
        totalCOGS: true,
        grossProfit: true,
        totalExpenses: true,
        netIncome: true,
        interestIncome: true,
        depreciationExpense: true,
        managementFeePaid: true,
        interestExpense: true,
        corporateAdminFee: true,
        otherExpenses: true,
      },
    });

    let grossProfitErrors = 0;
    let netIncomeErrors = 0;
    const recordsToFix = [];

    for (const record of allRecords) {
      const expectedGrossProfit = Number(record.totalIncome) - Number(record.totalCOGS);
      const grossProfitDiff = Math.abs(expectedGrossProfit - Number(record.grossProfit));

      const expectedNetIncome =
        Number(record.grossProfit) -
        Number(record.totalExpenses) +
        Number(record.interestIncome) -
        Number(record.depreciationExpense) -
        Number(record.managementFeePaid) -
        Number(record.interestExpense) -
        Number(record.corporateAdminFee) -
        Number(record.otherExpenses);

      const netIncomeDiff = Math.abs(expectedNetIncome - Number(record.netIncome));

      if (grossProfitDiff > 0.01 || netIncomeDiff > 0.01) {
        if (grossProfitDiff > 0.01) grossProfitErrors++;
        if (netIncomeDiff > 0.01) netIncomeErrors++;

        recordsToFix.push({
          id: record.id,
          year: record.year,
          month: record.month,
          grossProfitError: grossProfitDiff > 0.01,
          netIncomeError: netIncomeDiff > 0.01,
          expectedGrossProfit: grossProfitDiff > 0.01 ? expectedGrossProfit : null,
          expectedNetIncome: netIncomeDiff > 0.01 ? expectedNetIncome : null,
        });
      }
    }

    console.log(`Total records scanned: ${allRecords.length}`);
    console.log(`Records with Gross Profit errors: ${grossProfitErrors}`);
    console.log(`Records with Net Income errors: ${netIncomeErrors}`);

    if (recordsToFix.length > 0) {
      console.log(`\n⚠️  ${recordsToFix.length} records need correction`);
      console.log('Run fixCalculations() to correct these records');
    } else {
      console.log('\n✅ All calculations are correct!');
    }
    console.log('');

    // Step 5: Date Filtering Test
    console.log('📅 STEP 5: Date Filtering Consistency Test');
    console.log('-'.repeat(80));

    // Test 2025 data
    const records2025 = await prisma.financialRecord.findMany({
      where: { year: 2025 },
    });

    const totalIncome2025 = records2025.reduce((sum, r) => sum + Number(r.totalIncome), 0);
    const totalExpenses2025 = records2025.reduce((sum, r) => sum + Number(r.totalExpenses), 0);
    const netIncome2025 = records2025.reduce((sum, r) => sum + Number(r.netIncome), 0);

    console.log(`\n2025 Data (${records2025.length} records):`);
    console.log(`  Total Income: $${totalIncome2025.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Total Expenses: $${totalExpenses2025.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Net Income: $${netIncome2025.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    // Test all data
    const allDataRecords = await prisma.financialRecord.findMany();
    const totalIncomeAll = allDataRecords.reduce((sum, r) => sum + Number(r.totalIncome), 0);
    const totalExpensesAll = allDataRecords.reduce((sum, r) => sum + Number(r.totalExpenses), 0);
    const netIncomeAll = allDataRecords.reduce((sum, r) => sum + Number(r.netIncome), 0);

    console.log(`\nAll Data (${allDataRecords.length} records):`);
    console.log(`  Total Income: $${totalIncomeAll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Total Expenses: $${totalExpensesAll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Net Income: $${netIncomeAll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log('');

    // Summary
    console.log('=' .repeat(80));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Data Integrity: ${totalRecords === clinicCount * 36 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Calculations: ${recordsToFix.length === 0 ? 'PASS' : 'FAIL - ' + recordsToFix.length + ' errors found'}`);
    console.log('='.repeat(80));
    console.log('');

    return {
      totalRecords,
      clinicCount,
      calculationErrors: recordsToFix.length,
      recordsToFix,
    };

  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDataIntegrity()
    .then((result) => {
      console.log('Verification complete');
      if (result.calculationErrors > 0) {
        console.log(`\n⚠️  ${result.calculationErrors} calculation errors found`);
        console.log('Run fixCalculations.js to correct these errors');
        process.exit(1);
      } else {
        console.log('\n✅ All data verified successfully');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export default verifyDataIntegrity;
