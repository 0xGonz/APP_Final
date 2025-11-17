import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parseCSVFile } from './csvParser.js';

const prisma = new PrismaClient();

/**
 * Comprehensive Line-Item Validation
 * Validates every single line item from CSV against database values
 */

const CLINICS = [
  { name: 'Baytown', file: 'APP Financials 23-25(Baytown).csv' },
  { name: 'Beaumont', file: 'APP Financials 23-25(Beaumont).csv' },
  { name: 'Katy', file: 'APP Financials 23-25(Katy).csv' },
  { name: 'Pearland', file: 'APP Financials 23-25(Pearland).csv' },
  { name: 'Webster', file: 'APP Financials 23-25(Webster).csv' },
  { name: 'West Houston', file: 'APP Financials 23-25(West_Houston).csv' },
];

// Tolerance for floating point comparisons (cents)
const TOLERANCE = 0.01;

function compareValues(csvValue, dbValue, fieldName) {
  const csv = parseFloat(csvValue) || 0;
  const db = parseFloat(dbValue) || 0;
  const diff = Math.abs(csv - db);

  if (diff > TOLERANCE) {
    return {
      match: false,
      csvValue: csv,
      dbValue: db,
      difference: diff,
    };
  }

  return { match: true };
}

async function validateClinic(clinicName, csvFile) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Validating: ${clinicName}`);
  console.log('='.repeat(80));

  // Find clinic in database
  const clinic = await prisma.clinic.findFirst({
    where: { name: clinicName },
  });

  if (!clinic) {
    console.log(`❌ Clinic "${clinicName}" not found in database`);
    return { error: 'Clinic not found' };
  }

  // Parse CSV file
  const csvPath = path.join(process.cwd(), '..', 'data', csvFile);
  if (!fs.existsSync(csvPath)) {
    console.log(`❌ CSV file not found: ${csvPath}`);
    return { error: 'CSV file not found' };
  }

  const parsedCSV = parseCSVFile(csvPath);
  const csvData = parsedCSV.data;

  // Get database records for this clinic
  const dbRecords = await prisma.financialRecord.findMany({
    where: { clinicId: clinic.id },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  });

  // Create lookup map for database records
  const dbMap = {};
  dbRecords.forEach(record => {
    const key = `${record.year}-${String(record.month).padStart(2, '0')}`;
    dbMap[key] = record;
  });

  // Validation results
  const results = {
    clinicName,
    totalMonths: csvData.length,
    matchedMonths: 0,
    missingMonths: [],
    discrepancies: [],
    fieldStats: {},
  };

  // Validate each month
  for (const csvMonth of csvData) {
    const key = `${csvMonth.year}-${String(csvMonth.month).padStart(2, '0')}`;
    const dbRecord = dbMap[key];

    if (!dbRecord) {
      results.missingMonths.push(key);
      continue;
    }

    let monthHasErrors = false;
    const monthDiscrepancies = [];

    // Get all fields from CSV record (exclude metadata)
    const csvFields = Object.keys(csvMonth).filter(
      field => !['clinicId', 'year', 'month', 'date'].includes(field)
    );

    // Compare each field
    for (const field of csvFields) {
      const comparison = compareValues(csvMonth[field], dbRecord[field], field);

      if (!comparison.match) {
        monthHasErrors = true;
        monthDiscrepancies.push({
          field,
          ...comparison,
        });

        // Track field-level stats
        if (!results.fieldStats[field]) {
          results.fieldStats[field] = {
            totalChecks: 0,
            errors: 0,
            totalDifference: 0,
          };
        }
        results.fieldStats[field].totalChecks++;
        results.fieldStats[field].errors++;
        results.fieldStats[field].totalDifference += comparison.difference;
      } else {
        if (!results.fieldStats[field]) {
          results.fieldStats[field] = {
            totalChecks: 0,
            errors: 0,
            totalDifference: 0,
          };
        }
        results.fieldStats[field].totalChecks++;
      }
    }

    if (!monthHasErrors) {
      results.matchedMonths++;
    } else {
      results.discrepancies.push({
        month: key,
        errors: monthDiscrepancies,
      });
    }
  }

  // Print results
  console.log(`\n📊 Validation Results:`);
  console.log(`  Total Months in CSV: ${results.totalMonths}`);
  console.log(`  Matched Months: ${results.matchedMonths}`);
  console.log(`  Months with Discrepancies: ${results.discrepancies.length}`);
  console.log(`  Missing Months: ${results.missingMonths.length}`);

  if (results.missingMonths.length > 0) {
    console.log(`\n⚠️  Missing Months:`);
    results.missingMonths.forEach(month => {
      console.log(`    - ${month}`);
    });
  }

  if (results.discrepancies.length > 0) {
    console.log(`\n❌ Discrepancies Found:`);
    results.discrepancies.forEach(({ month, errors }) => {
      console.log(`\n  ${month} (${errors.length} field(s) don't match):`);
      errors.slice(0, 5).forEach(({ field, csvValue, dbValue, difference }) => {
        console.log(`    ${field}:`);
        console.log(`      CSV: $${csvValue.toFixed(2)}`);
        console.log(`      DB:  $${dbValue.toFixed(2)}`);
        console.log(`      Diff: $${difference.toFixed(2)}`);
      });
      if (errors.length > 5) {
        console.log(`    ... and ${errors.length - 5} more fields`);
      }
    });
  }

  // Field-level summary
  const errorFields = Object.entries(results.fieldStats)
    .filter(([_, stats]) => stats.errors > 0)
    .sort((a, b) => b[1].errors - a[1].errors);

  if (errorFields.length > 0) {
    console.log(`\n📋 Fields with Most Errors:`);
    errorFields.slice(0, 10).forEach(([field, stats]) => {
      console.log(`  ${field}:`);
      console.log(`    Errors: ${stats.errors}/${stats.totalChecks}`);
      console.log(`    Total Difference: $${stats.totalDifference.toFixed(2)}`);
    });
  }

  if (results.matchedMonths === results.totalMonths && results.missingMonths.length === 0) {
    console.log(`\n✅ All line items match perfectly for ${clinicName}!`);
  }

  return results;
}

async function main() {
  console.log('================================================================================');
  console.log('COMPREHENSIVE LINE-ITEM VALIDATION');
  console.log('Validating every line item from CSV against database');
  console.log('================================================================================');

  const allResults = [];

  for (const clinic of CLINICS) {
    const results = await validateClinic(clinic.name, clinic.file);
    allResults.push(results);
  }

  // Overall Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));

  let totalMonths = 0;
  let totalMatched = 0;
  let totalDiscrepancies = 0;
  let totalMissing = 0;

  allResults.forEach(result => {
    if (!result.error) {
      totalMonths += result.totalMonths;
      totalMatched += result.matchedMonths;
      totalDiscrepancies += result.discrepancies.length;
      totalMissing += result.missingMonths.length;
    }
  });

  console.log(`\nTotal Months Validated: ${totalMonths}`);
  console.log(`✅ Months with Perfect Match: ${totalMatched}`);
  console.log(`❌ Months with Discrepancies: ${totalDiscrepancies}`);
  console.log(`⚠️  Missing Months: ${totalMissing}`);

  const successRate = ((totalMatched / totalMonths) * 100).toFixed(2);
  console.log(`\n📊 Success Rate: ${successRate}%`);

  if (totalMatched === totalMonths) {
    console.log(`\n🎉 VALIDATION PASSED - All line items match perfectly!`);
  } else {
    console.log(`\n⚠️  VALIDATION FAILED - Some discrepancies found`);
    console.log(`Run with --fix flag to attempt automatic corrections`);
  }

  console.log('\n' + '='.repeat(80));

  await prisma.$disconnect();
}

main().catch(console.error);
