import express from 'express';
import { PrismaClient } from '@prisma/client';
import { endOfMonth, format } from 'date-fns';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/system/data-range
 * Get the actual date range of available data
 * HARDCODED: Latest date set to September 30, 2025
 * Update manually when new data is added
 */
router.get('/data-range', async (req, res) => {
  try {
    // Fetch earliest record
    const earliest = await prisma.financialRecord.findFirst({
      orderBy: { date: 'asc' },
      select: { date: true, year: true, month: true },
    });

    if (!earliest) {
      return res.status(404).json({ error: 'No financial data found' });
    }

    // HARDCODED LATEST DATE - Update manually when new data is added
    const hardcodedLatestDate = new Date('2025-09-30T00:00:00');

    res.json({
      earliest: {
        date: earliest.date,
        year: earliest.year,
        month: earliest.month,
      },
      latest: {
        date: hardcodedLatestDate, // Hardcoded to Sep 30, 2025
        year: 2025,
        month: 9,
      },
      dateRange: {
        start: earliest.date.toISOString().split('T')[0],
        end: '2025-09-30', // Hardcoded to Sep 30, 2025
      },
    });
  } catch (error) {
    console.error('Error fetching data range:', error);
    res.status(500).json({ error: 'Failed to fetch data range' });
  }
});

export default router;
