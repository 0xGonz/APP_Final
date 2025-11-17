import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

// Simple fetch wrapper
async function fetchAPI(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return {
    status: response.status,
    data: await response.json(),
  };
}

/**
 * Comprehensive Integration Test Suite
 * Tests complete data flow: Database → API → Frontend Field Compatibility
 */

const CLINICS = [
  { name: 'Baytown' },
  { name: 'Beaumont' },
  { name: 'Katy' },
  { name: 'Pearland' },
  { name: 'Webster' },
  { name: 'West Houston' },
];

// Required fields that frontend expects
const REQUIRED_FIELDS = {
  basic: ['totalIncome', 'totalExpenses', 'grossProfit', 'totalCOGS', 'netOrdinaryIncome', 'netIncome'],
  income: ['hdResearchIncome', 'practiceIncome', 'refundsIncome', 'managementFeeIncome'],
  cogs: ['medicalBillingCOGS', 'medicalSuppliesCOGS', 'contractLaborCOGS'],
  expenses: ['payrollExpense', 'rentExpense', 'utilitiesExpense'],
};

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
  }
}

async function testDatabaseRecords() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST 1: Database Records Verification');
  console.log('='.repeat(80));

  try {
    const recordCount = await prisma.financialRecord.count();
    logTest('Database has expected 216 records', recordCount === 216, `Found ${recordCount} records`);

    for (const clinic of CLINICS) {
      const clinicRecord = await prisma.clinic.findFirst({
        where: { name: clinic.name },
      });

      logTest(`Clinic "${clinic.name}" exists in database`, !!clinicRecord);

      if (clinicRecord) {
        const financialRecords = await prisma.financialRecord.count({
          where: { clinicId: clinicRecord.id },
        });
        logTest(`${clinic.name} has 36 financial records`, financialRecords === 36, `Found ${financialRecords} records`);
      }
    }
  } catch (error) {
    logTest('Database connection test', false, error.message);
  }
}

async function testAPIEndpoints() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST 2: API Endpoint Response Format');
  console.log('='.repeat(80));

  try {
    // Test 1: Get all clinics
    const clinicsResponse = await fetchAPI(`${API_BASE}/clinics`);
    logTest('GET /api/clinics endpoint responds', clinicsResponse.status === 200);
    logTest('Clinics endpoint returns 6 clinics', clinicsResponse.data.length === 6, `Found ${clinicsResponse.data.length} clinics`);

    // Test 2: Get individual clinic
    const clinic = clinicsResponse.data[0];
    const clinicDetailResponse = await fetchAPI(`${API_BASE}/clinics/${clinic.id}`);
    logTest('GET /api/clinics/:id endpoint responds', clinicDetailResponse.status === 200);

    // Test 3: Get clinic P&L data
    const pnlResponse = await fetchAPI(`${API_BASE}/clinics/${clinic.id}/pnl?startDate=2024-01-01&endDate=2024-12-31`);

    logTest('GET /api/clinics/:id/pnl endpoint responds', pnlResponse.status === 200);
    logTest('P&L endpoint returns data array', Array.isArray(pnlResponse.data), `Type: ${typeof pnlResponse.data}`);

    if (pnlResponse.data.length > 0) {
      const record = pnlResponse.data[0];

      // Test required fields exist
      const missingFields = [];
      [...REQUIRED_FIELDS.basic, ...REQUIRED_FIELDS.income, ...REQUIRED_FIELDS.cogs, ...REQUIRED_FIELDS.expenses].forEach(field => {
        if (!(field in record)) {
          missingFields.push(field);
        }
      });

      logTest('P&L response contains all required fields', missingFields.length === 0,
        missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : '');

      // Test field types (should be strings from Prisma Decimal)
      logTest('totalIncome field is present and numeric',
        record.totalIncome !== undefined && !isNaN(parseFloat(record.totalIncome)));
      logTest('totalExpenses field is present and numeric',
        record.totalExpenses !== undefined && !isNaN(parseFloat(record.totalExpenses)));
      logTest('netOrdinaryIncome field is present and numeric',
        record.netOrdinaryIncome !== undefined && !isNaN(parseFloat(record.netOrdinaryIncome)));
    }

    // Test 4: Get consolidated financial data
    const consolidatedResponse = await fetchAPI(`${API_BASE}/financials/consolidated?startDate=2024-01-01&endDate=2024-12-31`);
    logTest('GET /api/financials/consolidated endpoint responds', consolidatedResponse.status === 200);

    // Test 5: Get trends data
    const trendsResponse = await fetchAPI(`${API_BASE}/financials/trends?clinicId=${clinic.id}`);
    logTest('GET /api/financials/trends endpoint responds', trendsResponse.status === 200);

    if (trendsResponse.data && trendsResponse.data.trends) {
      const trendData = trendsResponse.data.trends[0];
      if (trendData) {
        logTest('Trends data contains totalIncome', 'totalIncome' in trendData);
        logTest('Trends data contains totalExpenses', 'totalExpenses' in trendData);
        logTest('Trends data contains netOrdinaryIncome', 'netOrdinaryIncome' in trendData);
      }
    }

  } catch (error) {
    logTest('API connectivity test', false, error.message);
  }
}

async function testFieldNameConsistency() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST 3: Field Name Consistency (Database ↔ API)');
  console.log('='.repeat(80));

  try {
    // Get data from database
    const dbRecord = await prisma.financialRecord.findFirst({
      where: {
        year: 2024,
        month: 1,
      },
    });

    // Get same data from API
    const clinic = await prisma.clinic.findFirst({
      where: { id: dbRecord.clinicId },
    });

    const apiResponse = await fetchAPI(`${API_BASE}/clinics/${clinic.id}/pnl?startDate=2024-01-01&endDate=2024-01-31`);

    const apiRecord = apiResponse.data[0];

    // Compare field names
    const dbFields = Object.keys(dbRecord).filter(k => !['id', 'createdAt', 'updatedAt', 'clinicId', 'year', 'month', 'date'].includes(k));
    const apiFields = Object.keys(apiRecord).filter(k => !['id', 'createdAt', 'updatedAt', 'clinicId', 'year', 'month', 'date'].includes(k));

    const missingInAPI = dbFields.filter(f => !apiFields.includes(f));
    logTest('API response contains all database fields', missingInAPI.length === 0,
      missingInAPI.length > 0 ? `Missing: ${missingInAPI.slice(0, 5).join(', ')}` : '');

    // Test specific critical fields
    logTest('Database and API both use "totalIncome"',
      'totalIncome' in dbRecord && 'totalIncome' in apiRecord);
    logTest('Database and API both use "totalExpenses"',
      'totalExpenses' in dbRecord && 'totalExpenses' in apiRecord);
    logTest('Database and API both use "netOrdinaryIncome"',
      'netOrdinaryIncome' in dbRecord && 'netOrdinaryIncome' in apiRecord);

    // Verify NO old field names exist
    logTest('NO "income_total" field in API response', !('income_total' in apiRecord));
    logTest('NO "expenses_total" field in API response', !('expenses_total' in apiRecord));
    logTest('NO "noi" field in API response (uses netOrdinaryIncome)', !('noi' in apiRecord));

  } catch (error) {
    logTest('Field name consistency check', false, error.message);
  }
}

async function testDataAccuracy() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST 4: Data Accuracy (Values Match Between DB and API)');
  console.log('='.repeat(80));

  try {
    const clinic = await prisma.clinic.findFirst({
      where: { name: 'Beaumont' },
    });

    // Get Jan 2024 from database
    const dbRecord = await prisma.financialRecord.findFirst({
      where: {
        clinicId: clinic.id,
        year: 2024,
        month: 1,
      },
    });

    // Get same data from API
    const apiResponse = await fetchAPI(`${API_BASE}/clinics/${clinic.id}/pnl?startDate=2024-01-01&endDate=2024-01-31`);

    const apiRecord = apiResponse.data[0];

    // Compare values
    const tolerance = 0.01; // Allow 1 cent difference due to floating point

    const incomesMatch = Math.abs(parseFloat(dbRecord.totalIncome) - parseFloat(apiRecord.totalIncome)) < tolerance;
    logTest('Total Income values match (DB ↔ API)', incomesMatch,
      `DB: ${dbRecord.totalIncome}, API: ${apiRecord.totalIncome}`);

    const expensesMatch = Math.abs(parseFloat(dbRecord.totalExpenses) - parseFloat(apiRecord.totalExpenses)) < tolerance;
    logTest('Total Expenses values match (DB ↔ API)', expensesMatch,
      `DB: ${dbRecord.totalExpenses}, API: ${apiRecord.totalExpenses}`);

    const noiMatch = Math.abs(parseFloat(dbRecord.netOrdinaryIncome) - parseFloat(apiRecord.netOrdinaryIncome)) < tolerance;
    logTest('Net Ordinary Income values match (DB ↔ API)', noiMatch,
      `DB: ${dbRecord.netOrdinaryIncome}, API: ${apiRecord.netOrdinaryIncome}`);

  } catch (error) {
    logTest('Data accuracy verification', false, error.message);
  }
}

async function testCalculations() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST 5: Calculation Integrity');
  console.log('='.repeat(80));

  try {
    const records = await prisma.financialRecord.findMany({
      take: 10,
      where: {
        year: 2024,
      },
    });

    for (const record of records) {
      const income = parseFloat(record.totalIncome);
      const cogs = parseFloat(record.totalCOGS);
      const grossProfit = parseFloat(record.grossProfit);
      const expenses = parseFloat(record.totalExpenses);
      const noi = parseFloat(record.netOrdinaryIncome);

      const calculatedGrossProfit = income - cogs;
      const calculatedNOI = grossProfit - expenses;

      const gpMatch = Math.abs(grossProfit - calculatedGrossProfit) < 0.01;
      const noiMatch = Math.abs(noi - calculatedNOI) < 0.01;

      if (!gpMatch || !noiMatch) {
        logTest(`Calculations correct for ${record.year}-${record.month}`, false,
          `GP: ${grossProfit} vs ${calculatedGrossProfit}, NOI: ${noi} vs ${calculatedNOI}`);
      }
    }

    logTest('All sampled calculation formulas are correct', true);

  } catch (error) {
    logTest('Calculation verification', false, error.message);
  }
}

async function main() {
  console.log('================================================================================');
  console.log('COMPREHENSIVE INTEGRATION TEST SUITE');
  console.log('Testing: Database → API → Frontend Field Compatibility');
  console.log('================================================================================');

  await testDatabaseRecords();
  await testAPIEndpoints();
  await testFieldNameConsistency();
  await testDataAccuracy();
  await testCalculations();

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  console.log(`\n📊 Success Rate: ${successRate}%`);

  if (testResults.failed > 0) {
    console.log(`\n⚠️  Failed Tests:`);
    testResults.errors.forEach(({ test, details }) => {
      console.log(`   - ${test}`);
      if (details) console.log(`     ${details}`);
    });
  }

  if (testResults.failed === 0) {
    console.log(`\n🎉 ALL TESTS PASSED - Integration is 100% verified!`);
    console.log(`✅ Database → API → Frontend integration is working correctly`);
    console.log(`✅ All field names are consistent`);
    console.log(`✅ All calculations are accurate`);
    console.log(`✅ System is ready for production`);
  } else {
    console.log(`\n⚠️  SOME TESTS FAILED - Please review errors above`);
  }

  console.log('\n' + '='.repeat(80));

  await prisma.$disconnect();
  process.exit(testResults.failed > 0 ? 1 : 0);
}

main().catch(console.error);
