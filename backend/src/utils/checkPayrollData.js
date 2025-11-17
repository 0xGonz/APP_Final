import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const clinicRes = await prisma.clinic.findFirst({ where: { name: 'Pearland' } });
  if (!clinicRes) {
    console.log('Clinic not found');
    await prisma.$disconnect();
    return;
  }

  const record = await prisma.financialRecord.findFirst({
    where: {
      clinicId: clinicRes.id,
      year: 2024,
      month: 1
    }
  });

  if (record) {
    console.log('='.repeat(60));
    console.log('Pearland - Jan 2024 - In-Office Payroll Breakdown');
    console.log('='.repeat(60));
    console.log('inOfficePayroll TOTAL:', record.inOfficePayroll);
    console.log('\nDetailed breakdown:');
    console.log('  Salary:', record.payrollInOfficeSalary);
    console.log('  Wages:', record.payrollInOfficeWages);
    console.log('  Bonus:', record.payrollInOfficeBonus);
    console.log('  NP Extra Visits:', record.payrollInOfficeNPExtraVisits);
    console.log('  Telehealth:', record.payrollInOfficeTelehealth);
    console.log('  Administration:', record.payrollInOfficeAdministration);
    console.log('  Payroll Taxes:', record.payrollInOfficePayrollTaxes);
    console.log('  Unemployment:', record.payrollInOfficeUnemployment);
    console.log('  Health Insurance:', record.payrollInOfficeHealthInsurance);
    console.log('  Simple Plan Match:', record.payrollInOfficeSimplePlanMatch);
    console.log('  Other:', record.payrollInOfficeOther);

    const detailedSum = parseFloat(record.payrollInOfficeSalary || 0) +
                       parseFloat(record.payrollInOfficeWages || 0) +
                       parseFloat(record.payrollInOfficeBonus || 0) +
                       parseFloat(record.payrollInOfficeNPExtraVisits || 0) +
                       parseFloat(record.payrollInOfficeTelehealth || 0) +
                       parseFloat(record.payrollInOfficeAdministration || 0) +
                       parseFloat(record.payrollInOfficePayrollTaxes || 0) +
                       parseFloat(record.payrollInOfficeUnemployment || 0) +
                       parseFloat(record.payrollInOfficeHealthInsurance || 0) +
                       parseFloat(record.payrollInOfficeSimplePlanMatch || 0) +
                       parseFloat(record.payrollInOfficeOther || 0);
    console.log('\nSum of detailed items:', detailedSum);
    console.log('CSV Total (inOfficePayroll):', parseFloat(record.inOfficePayroll));
    console.log('Difference:', parseFloat(record.inOfficePayroll) - detailedSum);
    console.log('\n' + '='.repeat(60));
  }

  await prisma.$disconnect();
}

checkData();
