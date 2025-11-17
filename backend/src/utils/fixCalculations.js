import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Fix calculation errors in financial records
 * Recalculates netOrdinaryIncome and netIncome based on correct formulas
 */

async function fixCalculations() {
  console.log('='.repeat(80));
  console.log('FIXING FINANCIAL CALCULATION ERRORS');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Get all records
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
        netOrdinaryIncome: true,
        netIncome: true,
        interestIncome: true,
        depreciationExpense: true,
        managementFeePaid: true,
        interestExpense: true,
        corporateAdminFee: true,
        otherExpenses: true,
        clinic: {
          select: { name: true },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    console.log(`Scanning ${allRecords.length} records...\n`);

    let netOrdinaryIncomeFixed = 0;
    let netIncomeFixed = 0;
    const recordsToUpdate = [];

    for (const record of allRecords) {
      let needsUpdate = false;
      const updates = {};

      // Calculate correct netOrdinaryIncome
      const correctNetOrdinaryIncome = Number(record.grossProfit) - Number(record.totalExpenses);
      const netOrdinaryIncomeDiff = Math.abs(correctNetOrdinaryIncome - Number(record.netOrdinaryIncome));

      if (netOrdinaryIncomeDiff > 0.01) {
        updates.netOrdinaryIncome = correctNetOrdinaryIncome;
        needsUpdate = true;
        netOrdinaryIncomeFixed++;
      }

      // Calculate correct netIncome
      const correctNetIncome =
        correctNetOrdinaryIncome +
        Number(record.interestIncome) -
        Number(record.depreciationExpense) -
        Number(record.managementFeePaid) -
        Number(record.interestExpense) -
        Number(record.corporateAdminFee) -
        Number(record.otherExpenses);

      const netIncomeDiff = Math.abs(correctNetIncome - Number(record.netIncome));

      if (netIncomeDiff > 0.01) {
        updates.netIncome = correctNetIncome;
        needsUpdate = true;
        netIncomeFixed++;
      }

      if (needsUpdate) {
        recordsToUpdate.push({
          id: record.id,
          clinic: record.clinic.name,
          year: record.year,
          month: record.month,
          updates,
        });
      }
    }

    console.log(`Found ${recordsToUpdate.length} records to fix:`);
    console.log(`  - netOrdinaryIncome errors: ${netOrdinaryIncomeFixed}`);
    console.log(`  - netIncome errors: ${netIncomeFixed}`);
    console.log('');

    if (recordsToUpdate.length === 0) {
      console.log('✅ All calculations are already correct!');
      return { fixed: 0 };
    }

    // Ask for confirmation
    console.log('Sample of records to be updated:');
    recordsToUpdate.slice(0, 5).forEach((rec) => {
      console.log(`  ${rec.clinic} ${rec.year}-${String(rec.month).padStart(2, '0')}`);
      if (rec.updates.netOrdinaryIncome !== undefined) {
        console.log(`    netOrdinaryIncome will be updated`);
      }
      if (rec.updates.netIncome !== undefined) {
        console.log(`    netIncome will be updated`);
      }
    });
    console.log('');

    // Update all records
    console.log('Updating records...');

    let updated = 0;
    for (const rec of recordsToUpdate) {
      await prisma.financialRecord.update({
        where: { id: rec.id },
        data: rec.updates,
      });
      updated++;

      if (updated % 50 === 0) {
        console.log(`  Updated ${updated}/${recordsToUpdate.length} records...`);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} records!`);
    console.log('');

    // Verify the fix
    console.log('Verifying fixes...');
    const verifyRecords = await prisma.financialRecord.findMany({
      select: {
        id: true,
        grossProfit: true,
        totalExpenses: true,
        netOrdinaryIncome: true,
        netIncome: true,
        interestIncome: true,
        depreciationExpense: true,
        managementFeePaid: true,
        interestExpense: true,
        corporateAdminFee: true,
        otherExpenses: true,
      },
    });

    let stillHasErrors = 0;
    for (const record of verifyRecords) {
      const expectedNetOrdinaryIncome = Number(record.grossProfit) - Number(record.totalExpenses);
      const netOrdinaryIncomeDiff = Math.abs(expectedNetOrdinaryIncome - Number(record.netOrdinaryIncome));

      const expectedNetIncome =
        Number(record.netOrdinaryIncome) +
        Number(record.interestIncome) -
        Number(record.depreciationExpense) -
        Number(record.managementFeePaid) -
        Number(record.interestExpense) -
        Number(record.corporateAdminFee) -
        Number(record.otherExpenses);

      const netIncomeDiff = Math.abs(expectedNetIncome - Number(record.netIncome));

      if (netOrdinaryIncomeDiff > 0.01 || netIncomeDiff > 0.01) {
        stillHasErrors++;
      }
    }

    if (stillHasErrors === 0) {
      console.log('✅ All calculations are now correct!');
    } else {
      console.log(`⚠️  ${stillHasErrors} records still have errors`);
    }
    console.log('');

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Records updated: ${updated}`);
    console.log(`netOrdinaryIncome fixes: ${netOrdinaryIncomeFixed}`);
    console.log(`netIncome fixes: ${netIncomeFixed}`);
    console.log(`Remaining errors: ${stillHasErrors}`);
    console.log('='.repeat(80));

    return {
      fixed: updated,
      remainingErrors: stillHasErrors,
    };

  } catch (error) {
    console.error('Error fixing calculations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixCalculations()
    .then((result) => {
      console.log('\nFix complete!');
      if (result.remainingErrors > 0) {
        console.log(`⚠️  ${result.remainingErrors} errors remain`);
        process.exit(1);
      } else {
        console.log('✅ All calculations fixed successfully');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

export default fixCalculations;
