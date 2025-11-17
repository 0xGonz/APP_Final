import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyzeData() {
  // Check Sep-Dec 2025 data
  const recentMonths = await prisma.financialRecord.findMany({
    where: {
      year: 2025,
      month: { in: [9, 10, 11, 12] }
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    select: {
      year: true,
      month: true,
      totalIncome: true,
      totalCOGS: true,
      totalExpenses: true,
      netIncome: true,
      clinic: { select: { name: true } }
    }
  });

  // Group by month and sum
  const monthSummary = {};
  recentMonths.forEach(r => {
    const key = `${r.year}-${r.month}`;
    if (!monthSummary[key]) {
      monthSummary[key] = {
        year: r.year,
        month: r.month,
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        records: 0
      };
    }
    monthSummary[key].totalIncome += Number(r.totalIncome);
    monthSummary[key].totalExpenses += Number(r.totalExpenses);
    monthSummary[key].netIncome += Number(r.netIncome);
    monthSummary[key].records++;
  });

  console.log('\n📊 Monthly Summary (Sep-Dec 2025):\n');
  Object.values(monthSummary).sort((a, b) => a.month - b.month).forEach(m => {
    const hasData = m.totalIncome > 0 || m.totalExpenses > 0;
    console.log(`${m.year}-${String(m.month).padStart(2, '0')}: Income=$${m.totalIncome.toLocaleString()}, Expenses=$${m.totalExpenses.toLocaleString()}, Net=$${m.netIncome.toLocaleString()}, HasRealData=${hasData}`);
  });

  await prisma.$disconnect();
}

analyzeData().catch(console.error);
