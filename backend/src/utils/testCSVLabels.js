import { parseCSVFile } from './csvParser.js';
import path from 'path';

const csvPath = path.join(process.cwd(), '..', 'data', 'APP Financials 23-25(Beaumont).csv');
const result = parseCSVFile(csvPath);

console.log('Sample data for Jan 2023:');
const jan2023 = result.data.find(d => d.year === 2023 && d.month === 1);

if (jan2023) {
  console.log('\nIn-Office Payroll fields:');
  console.log('payrollInOfficeWages:', jan2023.payrollInOfficeWages);
  console.log('payrollInOfficeBonus:', jan2023.payrollInOfficeBonus);
  console.log('payrollInOfficePayrollTaxes:', jan2023.payrollInOfficePayrollTaxes);
  console.log('payrollInOfficeUnemployment:', jan2023.payrollInOfficeUnemployment);
  console.log('payrollInOfficeHealthInsurance:', jan2023.payrollInOfficeHealthInsurance);
  console.log('payrollInOfficeSimplePlanMatch:', jan2023.payrollInOfficeSimplePlanMatch);
  console.log('inOfficePayroll (total):', jan2023.inOfficePayroll);
}
