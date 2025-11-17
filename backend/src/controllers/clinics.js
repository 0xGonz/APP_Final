import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/clinics
 * Get all clinics with summary statistics
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, year, month } = req.query;

    const clinics = await prisma.clinic.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        location: true,
        active: true,
      },
      orderBy: { name: 'asc' },
    });

    // Build where clause for financial records
    const buildWhere = (clinicId) => {
      const where = { clinicId };

      if (year) {
        where.year = parseInt(year);
        if (month) {
          where.month = parseInt(month);
        }
      } else if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate + 'T00:00:00.000Z'),
          lte: new Date(endDate + 'T23:59:59.999Z'),
        };
      }

      return where;
    };

    // Enrich with summary data
    const enrichedClinics = await Promise.all(
      clinics.map(async (clinic) => {
        const where = buildWhere(clinic.id);

        const [summary, count] = await Promise.all([
          prisma.financialRecord.aggregate({
            where,
            _sum: {
              totalIncome: true,
              totalExpenses: true,
              netIncome: true,
            },
            _min: { date: true },
            _max: { date: true },
          }),
          prisma.financialRecord.count({ where }),
        ]);

        return {
          ...clinic,
          totalRecords: count,
          totalIncome: summary._sum.totalIncome || 0,
          totalExpenses: summary._sum.totalExpenses || 0,
          netIncome: summary._sum.netIncome || 0,
          dateRange: {
            start: summary._min.date,
            end: summary._max.date,
          },
        };
      })
    );

    res.json(enrichedClinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

/**
 * GET /api/clinics/:id
 * Get single clinic details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        _count: {
          select: { financialRecords: true },
        },
      },
    });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    // Get financial summary
    const summary = await prisma.financialRecord.aggregate({
      where: { clinicId: id },
      _sum: {
        totalIncome: true,
        totalCOGS: true,
        totalExpenses: true,
        netIncome: true,
        grossProfit: true,
      },
      _avg: {
        totalIncome: true,
        netIncome: true,
      },
      _min: { date: true },
      _max: { date: true },
    });

    res.json({
      ...clinic,
      summary: {
        totalRecords: clinic._count.financialRecords,
        totalIncome: summary._sum.totalIncome || 0,
        totalCOGS: summary._sum.totalCOGS || 0,
        totalExpenses: summary._sum.totalExpenses || 0,
        netIncome: summary._sum.netIncome || 0,
        grossProfit: summary._sum.grossProfit || 0,
        avgMonthlyIncome: summary._avg.totalIncome || 0,
        avgMonthlyNetIncome: summary._avg.netIncome || 0,
        dateRange: {
          start: summary._min.date,
          end: summary._max.date,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
});

/**
 * GET /api/clinics/:id/pnl
 * Get P&L statement for a clinic with date filtering
 */
router.get('/:id/pnl', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, year, month } = req.query;

    // Build where clause
    const where = { clinicId: id };

    if (year) {
      where.year = parseInt(year);
      if (month) {
        where.month = parseInt(month);
      }
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate + 'T00:00:00.000Z'),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const records = await prisma.financialRecord.findMany({
      where,
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No financial records found for the specified criteria' });
    }

    res.json(records);
  } catch (error) {
    console.error('Error fetching P&L:', error);
    res.status(500).json({ error: 'Failed to fetch P&L data' });
  }
});

export default router;
