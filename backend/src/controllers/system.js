import express from 'express';
import { PrismaClient } from '@prisma/client';
import { endOfMonth, format } from 'date-fns';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/system/data-range
 * Get the actual date range of available data
 */
router.get('/data-range', async (req, res) => {
  try {
    const [earliest, latest] = await Promise.all([
      prisma.financialRecord.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true, year: true, month: true },
      }),
      // Find latest record WITH meaningful data (multiple categories)
      // Requires REAL income (> $1000) AND either expenses or COGS to be non-trivial
      // This excludes months with only recurring expenses and no real business activity
      prisma.financialRecord.findFirst({
        where: {
          AND: [
            { totalIncome: { gt: 1000 } },  // Require meaningful income, not just recurring/misc
            {
              OR: [
                { totalExpenses: { gt: 100 } },
                { totalCOGS: { gt: 100 } }
              ]
            }
          ]
        },
        orderBy: { date: 'desc' },
        select: { date: true, year: true, month: true },
      }),
    ]);

    if (!earliest || !latest) {
      return res.status(404).json({ error: 'No financial data found' });
    }

    // Calculate LAST day of the month with data (not first day)
    // Create date from year/month (JS months are 0-indexed, so subtract 1)
    const lastDayOfLatestMonth = endOfMonth(new Date(latest.year, latest.month - 1, 1));

    res.json({
      earliest: {
        date: earliest.date,
        year: earliest.year,
        month: earliest.month,
      },
      latest: {
        date: lastDayOfLatestMonth, // Use last day, not first day
        year: latest.year,
        month: latest.month,
      },
      dateRange: {
        start: earliest.date.toISOString().split('T')[0],
        end: format(lastDayOfLatestMonth, 'yyyy-MM-dd'), // Sep 30, not Sep 1
      },
    });
  } catch (error) {
    console.error('Error fetching data range:', error);
    res.status(500).json({ error: 'Failed to fetch data range' });
  }
});

export default router;
