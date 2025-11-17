import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parseCSVFile } from './csvParser.js';

const prisma = new PrismaClient();

const TOLERANCE = 0.01;

async function investigate() {
  console.log('='.repeat(80));
  console.log('CSV CALCULATION DISCREPANCY INVESTIGATION');
  console.log('='.repeat(80));

  const clinics = [
    { name: 'Baytown', file: 'APP Financials 23-25(Baytown).csv' },
    { name: 'Beaumont', file: 'APP Financials 23-25(Beaumont).csv' },
    { name: 'Katy', file: 'APP Financials 23-25(Katy).csv' },
    { name: 'Pearland', file: 'APP Financials 23-25(Pearland).csv' },
    { name: 'Webster', file: 'APP Financials 23-25(Webster).csv' },
    { name: 'West Houston', file: 'APP Financials 23-25(West_Houston).csv' },
  ];

  const fieldDiscrepancies = {};

  for (const clinicInfo of clinics) {
    console.log(`\nInvestigating ${clinicInfo.name}...`);

    // Get clinic from database
    const clinic = await prisma.clinic.findFirst({
      where: { name: clinicInfo.name },
    });

    if (!clinic) continue;

    // Parse CSV
    const csvPath = path.join(process.cwd(), '..', 'data', clinicInfo.file);
    if (!fs.existsSync(csvPath)) continue;

    const parsedCSV = parseCSVFile(csvPath);
    const csvData = parsedCSV.data;

    // Get database records
    const dbRecords = await prisma.financialRecord.findMany({
      where: { clinicId: clinic.id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Create lookup map
    const dbMap = {};
    dbRecords.forEach(record => {
      const key = `${record.year}-${String(record.month).padStart(2, '0')}`;
      dbMap[key] = record;
    });

    // Check first few months for discrepancies
    let monthsChecked = 0;
    for (const csvMonth of csvData.slice(0, 12)) {  // Check first 12 months
      const key = `${csvMonth.year}-${String(csvMonth.month).padStart(2, '0')}`;
      const dbRecord = dbMap[key];

      if (!dbRecord) continue;
      monthsChecked++;

      // Check all fields
      const csvFields = Object.keys(csvMonth).filter(
        field => !['clinicName', 'year', 'month', 'date'].includes(field)
      );

      for (const field of csvFields) {
        const csvValue = parseFloat(csvMonth[field]) || 0;
        const dbValue = parseFloat(dbRecord[field]) || 0;
        const diff = Math.abs(csvValue - dbValue);

        if (diff > TOLERANCE) {
          if (!fieldDiscrepancies[field]) {
            fieldDiscrepancies[field] = {
              count: 0,
              totalDiff: 0,
              examples: [],
            };
          }

          fieldDiscrepancies[field].count++;
          fieldDiscrepancies[field].totalDiff += diff;

          if (fieldDiscrepancies[field].examples.length < 3) {
            fieldDiscrepancies[field].examples.push({
              clinic: clinicInfo.name,
              month: key,
              csvValue,
              dbValue,
              diff,
            });
          }
        }
      }
    }

    console.log(`  Checked ${monthsChecked} months`);
  }

  // Report findings
  console.log('\n' + '='.repeat(80));
  console.log('DISCREPANCY ANALYSIS');
  console.log('='.repeat(80));

  const sortedFields = Object.entries(fieldDiscrepancies)
    .sort((a, b) => b[1].count - a[1].count);

  if (sortedFields.length === 0) {
    console.log('\n✅ NO DISCREPANCIES FOUND!');
  } else {
    console.log(`\nFound discrepancies in ${sortedFields.length} fields:\n`);

    sortedFields.slice(0, 10).forEach(([field, data]) => {
      console.log(`📊 ${field}:`);
      console.log(`   Discrepancies: ${data.count} occurrences`);
      console.log(`   Total Difference: $${data.totalDiff.toFixed(2)}`);
      console.log(`   Average Difference: $${(data.totalDiff / data.count).toFixed(2)}`);
      console.log(`   Examples:`);
      data.examples.forEach(ex => {
        console.log(`     - ${ex.clinic} ${ex.month}: CSV=$${ex.csvValue.toFixed(2)}, DB=$${ex.dbValue.toFixed(2)}, Diff=$${ex.diff.toFixed(2)}`);
      });
      console.log('');
    });

    if (sortedFields.length > 10) {
      console.log(`... and ${sortedFields.length - 10} more fields with discrepancies\n`);
    }
  }

  console.log('='.repeat(80));

  await prisma.$disconnect();
}

investigate().catch(console.error);
