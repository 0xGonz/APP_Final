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

    // Fetch latest record with ACTUAL data (non-zero income or expenses)
    // This filters out placeholder months (Oct/Nov/Dec) that only contain zeros
    const latest = await prisma.financialRecord.findFirst({
      where: {
        OR: [
          { totalIncome: { not: 0 } },
          { totalExpenses: { not: 0 } }
        ]
      },
      orderBy: { date: 'desc' },
      select: { date: true, year: true, month: true },
    });

    if (!earliest || !latest) {
      // Fallback if no data exists
      const now = new Date();
      return res.json({
        earliest: {
          date: new Date(now.getFullYear(), 0, 1),
          year: now.getFullYear(),
          month: 1,
        },
        latest: {
          date: now,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
        dateRange: {
          start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
        },
      });
    }

    // Return dates as timezone-agnostic strings to prevent UTC conversion issues
    res.json({
      earliest: {
        dateString: earliest.date.toISOString().split('T')[0],
        year: earliest.year,
        month: earliest.month,
      },
      latest: {
        dateString: latest.date.toISOString().split('T')[0],
        year: latest.year,
        month: latest.month,
      },
      dateRange: {
        start: earliest.date.toISOString().split('T')[0],
        end: latest.date.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error fetching data range:', error);
    res.status(500).json({ error: 'Failed to fetch data range' });
  }
});

export default router;
