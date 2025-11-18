import express from 'express';
import { PrismaClient } from '@prisma/client';
import { buildFlexibleDateFilter, formatDateRange } from '../utils/dateFilters.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/metrics/kpis
 * Get key performance indicators
 */
router.get('/kpis', async (req, res) => {
  try {
    const { clinicId, year, month, startDate, endDate } = req.query;

    const where = {};
    if (clinicId) where.clinicId = clinicId;

    // Apply comprehensive date filtering
    const dateFilter = buildFlexibleDateFilter({ startDate, endDate, year, month });
    Object.assign(where, dateFilter);

    // Log the filter for debugging
    console.log(`[KPIs] Filtering: ${formatDateRange(startDate, endDate)}, Year: ${year || 'N/A'}, Month: ${month || 'N/A'}, Clinic: ${clinicId || 'all'}`);

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No data found for the specified criteria' });
    }

    // Calculate KPIs
    const totalIncome = records.reduce((sum, r) => sum + Number(r.totalIncome), 0);
    const totalCOGS = records.reduce((sum, r) => sum + Number(r.totalCOGS), 0);
    const totalExpenses = records.reduce((sum, r) => sum + Number(r.totalExpenses), 0);
    const netIncome = records.reduce((sum, r) => sum + Number(r.netIncome), 0);
    const grossProfit = records.reduce((sum, r) => sum + Number(r.grossProfit), 0);
    const payroll = records.reduce((sum, r) => sum + Number(r.payrollExpense), 0);

    // Sum up existing NOI (Net Operating Income) from P&L records
    const noi = records.reduce((sum, r) => sum + Number(r.netOrdinaryIncome), 0);

    const kpis = {
      // Revenue Metrics
      totalRevenue: totalIncome,
      averageMonthlyRevenue: totalIncome / records.length,

      // Profit Metrics
      grossProfit,
      netProfit: netIncome,
      noi,
      grossMargin: totalIncome ? (grossProfit / totalIncome) * 100 : 0,
      netMargin: totalIncome ? (netIncome / totalIncome) * 100 : 0,
      noiMargin: totalIncome ? (noi / totalIncome) * 100 : 0,

      // Cost Metrics
      totalCOGS,
      totalOperatingExpenses: totalExpenses,
      cogsPercentage: totalIncome ? (totalCOGS / totalIncome) * 100 : 0,
      opexPercentage: totalIncome ? (totalExpenses / totalIncome) * 100 : 0,

      // Payroll Metrics
      totalPayroll: payroll,
      payrollPercentage: totalIncome ? (payroll / totalIncome) * 100 : 0,
      revenuePerEmployee: payroll ? totalIncome / (payroll / 50000) : 0, // Rough estimate

      // EBITDA (proxy - doesn't include depreciation/amortization from records)
      ebitda: grossProfit - totalExpenses + records.reduce((sum, r) => sum + Number(r.depreciationExpense), 0),

      // Other
      breakEvenRevenue: totalExpenses + totalCOGS,
      recordCount: records.length,
      clinicsAnalyzed: new Set(records.map(r => r.clinicId)).size,
    };

    res.json(kpis);
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    res.status(500).json({ error: 'Failed to calculate KPIs' });
  }
});

/**
 * GET /api/metrics/growth
 * Calculate growth rates (MoM, YoY, etc.)
 */
router.get('/growth', async (req, res) => {
  try {
    const { clinicId, metric = 'totalIncome', startDate, endDate } = req.query;

    const where = {};
    if (clinicId && clinicId !== 'all') {
      where.clinicId = clinicId;
    }

    // Apply comprehensive date filtering
    const dateFilter = buildFlexibleDateFilter({ startDate, endDate });
    Object.assign(where, dateFilter);

    // Log the filter for debugging
    console.log(`[Growth] Filtering: ${formatDateRange(startDate, endDate)}, Metric: ${metric}, Clinic: ${clinicId || 'all'}`);

    const records = await prisma.financialRecord.findMany({
      where,
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      select: {
        year: true,
        month: true,
        date: true,
        totalIncome: true,
        totalCOGS: true,
        grossProfit: true,
        totalExpenses: true,
        netIncome: true,
        payrollExpense: true,
        rentExpense: true,
        advertisingExpense: true,
        insuranceExpense: true,
        officeExpense: true,
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    let processedRecords;

    // If viewing all clinics, aggregate by month first
    if (!clinicId || clinicId === 'all') {
      const aggregated = {};

      records.forEach((record) => {
        const key = `${record.year}-${String(record.month).padStart(2, '0')}`;

        if (!aggregated[key]) {
          aggregated[key] = {
            year: record.year,
            month: record.month,
            date: record.date,
            clinicName: 'All Clinics (Consolidated)',
            totalIncome: 0,
            totalCOGS: 0,
            grossProfit: 0,
            totalExpenses: 0,
            netIncome: 0,
            payrollExpense: 0,
            rentExpense: 0,
            advertisingExpense: 0,
            insuranceExpense: 0,
            officeExpense: 0,
          };
        }

        // Sum all metrics
        aggregated[key].totalIncome += Number(record.totalIncome || 0);
        aggregated[key].totalCOGS += Number(record.totalCOGS || 0);
        aggregated[key].grossProfit += Number(record.grossProfit || 0);
        aggregated[key].totalExpenses += Number(record.totalExpenses || 0);
        aggregated[key].netIncome += Number(record.netIncome || 0);
        aggregated[key].payrollExpense += Number(record.payrollExpense || 0);
        aggregated[key].rentExpense += Number(record.rentExpense || 0);
        aggregated[key].advertisingExpense += Number(record.advertisingExpense || 0);
        aggregated[key].insuranceExpense += Number(record.insuranceExpense || 0);
        aggregated[key].officeExpense += Number(record.officeExpense || 0);
      });

      // Convert to array and sort
      processedRecords = Object.values(aggregated).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    } else {
      // Single clinic - use records as is
      processedRecords = records.map(r => ({
        year: r.year,
        month: r.month,
        date: r.date,
        clinicName: r.clinic.name,
        totalIncome: Number(r.totalIncome || 0),
        totalCOGS: Number(r.totalCOGS || 0),
        grossProfit: Number(r.grossProfit || 0),
        totalExpenses: Number(r.totalExpenses || 0),
        netIncome: Number(r.netIncome || 0),
        payrollExpense: Number(r.payrollExpense || 0),
        rentExpense: Number(r.rentExpense || 0),
        advertisingExpense: Number(r.advertisingExpense || 0),
        insuranceExpense: Number(r.insuranceExpense || 0),
        officeExpense: Number(r.officeExpense || 0),
      }));
    }

    // Now calculate growth rates on aggregated/processed data
    const growthData = processedRecords.map((record, index) => {
      const current = Number(record[metric] || 0);

      // Month-over-Month growth
      let momGrowth = null;
      if (index > 0) {
        const previous = Number(processedRecords[index - 1][metric] || 0);
        if (previous !== 0) {
          momGrowth = ((current - previous) / previous) * 100;
        } else if (current !== 0) {
          momGrowth = 100; // If previous was 0 but current has value, that's 100% growth
        }
      }

      // Year-over-Year growth
      let yoyGrowth = null;
      // Find the same month in the previous year
      const yoyRecord = processedRecords.find((r) =>
        r.year === record.year - 1 && r.month === record.month
      );
      if (yoyRecord) {
        const previousYear = Number(yoyRecord[metric] || 0);
        if (previousYear !== 0) {
          yoyGrowth = ((current - previousYear) / previousYear) * 100;
        } else if (current !== 0) {
          yoyGrowth = 100; // If previous year was 0 but current has value
        } else {
          yoyGrowth = 0; // Both are 0, no growth
        }
      }

      return {
        year: record.year,
        month: record.month,
        date: record.date,
        clinicName: record.clinicName,
        value: current,
        momGrowth,
        yoyGrowth,
      };
    });

    // Calculate average growth rates (excluding null values)
    const momGrowthValues = growthData.filter(d => d.momGrowth !== null).map(d => d.momGrowth);
    const yoyGrowthValues = growthData.filter(d => d.yoyGrowth !== null).map(d => d.yoyGrowth);

    const avgMomGrowth = momGrowthValues.length > 0
      ? momGrowthValues.reduce((sum, val) => sum + val, 0) / momGrowthValues.length
      : 0;

    const avgYoyGrowth = yoyGrowthValues.length > 0
      ? yoyGrowthValues.reduce((sum, val) => sum + val, 0) / yoyGrowthValues.length
      : 0;

    // Get most recent growth values from the last data point that has meaningful data (value > 0)
    // This prevents zero-value placeholder records from skewing the results
    const recentGrowthWithData = [...growthData].reverse().find(d => d.value > 0) || growthData[growthData.length - 1] || {};

    // Use recent values if available, otherwise use averages
    const finalMomGrowth = recentGrowthWithData.momGrowth !== null && recentGrowthWithData.momGrowth !== undefined
      ? recentGrowthWithData.momGrowth
      : avgMomGrowth;

    const finalYoyGrowth = recentGrowthWithData.yoyGrowth !== null && recentGrowthWithData.yoyGrowth !== undefined
      ? recentGrowthWithData.yoyGrowth
      : avgYoyGrowth;

    res.json({
      metric,
      // Add top-level fields for frontend compatibility
      monthOverMonth: finalMomGrowth,
      yearOverYear: finalYoyGrowth,
      // Keep detailed data for advanced usage
      data: growthData,
      summary: {
        averageMoMGrowth: avgMomGrowth,
        averageYoYGrowth: avgYoyGrowth,
        totalPeriods: processedRecords.length,
        recentMoMGrowth: recentGrowthWithData.momGrowth,
        recentYoYGrowth: recentGrowthWithData.yoyGrowth,
        dataQuality: {
          hasYoyComparisons: yoyGrowthValues.length > 0,
          hasMomComparisons: momGrowthValues.length > 0,
          periodsWithYoyData: yoyGrowthValues.length,
          periodsWithMomData: momGrowthValues.length,
        },
      },
      isAggregated: !clinicId || clinicId === 'all',
    });
  } catch (error) {
    console.error('Error calculating growth:', error);
    res.status(500).json({ error: 'Failed to calculate growth metrics' });
  }
});

/**
 * GET /api/metrics/margins
 * Calculate profit margins by clinic
 */
router.get('/margins', async (req, res) => {
  try {
    const { year, month } = req.query;

    const where = {};
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by clinic and calculate margins
    const clinicMargins = {};

    records.forEach((record) => {
      const clinicId = record.clinicId;

      if (!clinicMargins[clinicId]) {
        clinicMargins[clinicId] = {
          clinicId,
          clinicName: record.clinic.name,
          totalIncome: 0,
          totalCOGS: 0,
          totalExpenses: 0,
          grossProfit: 0,
          netIncome: 0,
        };
      }

      clinicMargins[clinicId].totalIncome += Number(record.totalIncome);
      clinicMargins[clinicId].totalCOGS += Number(record.totalCOGS);
      clinicMargins[clinicId].totalExpenses += Number(record.totalExpenses);
      clinicMargins[clinicId].grossProfit += Number(record.grossProfit);
      clinicMargins[clinicId].netIncome += Number(record.netIncome);
    });

    // Calculate margin percentages
    const margins = Object.values(clinicMargins).map((clinic) => ({
      ...clinic,
      grossMargin: clinic.totalIncome ? (clinic.grossProfit / clinic.totalIncome) * 100 : 0,
      netMargin: clinic.totalIncome ? (clinic.netIncome / clinic.totalIncome) * 100 : 0,
      cogsMargin: clinic.totalIncome ? (clinic.totalCOGS / clinic.totalIncome) * 100 : 0,
      opexMargin: clinic.totalIncome ? (clinic.totalExpenses / clinic.totalIncome) * 100 : 0,
    }));

    res.json(margins);
  } catch (error) {
    console.error('Error calculating margins:', error);
    res.status(500).json({ error: 'Failed to calculate margins' });
  }
});

/**
 * GET /api/metrics/efficiency
 * Calculate operational efficiency metrics
 */
router.get('/efficiency', async (req, res) => {
  try {
    const { clinicId } = req.query;

    const where = {};
    if (clinicId) where.clinicId = clinicId;

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    const totals = records.reduce((acc, record) => ({
      revenue: acc.revenue + Number(record.totalIncome),
      payroll: acc.payroll + Number(record.payrollExpense),
      rent: acc.rent + Number(record.rentExpense),
      supplies: acc.supplies + Number(record.medicalSuppliesCOGS),
      marketing: acc.marketing + Number(record.advertisingExpense),
    }), { revenue: 0, payroll: 0, rent: 0, supplies: 0, marketing: 0 });

    const efficiency = {
      // Efficiency Ratios (lower is better for costs)
      payrollEfficiency: totals.revenue ? (totals.payroll / totals.revenue) * 100 : 0,
      rentEfficiency: totals.revenue ? (totals.rent / totals.revenue) * 100 : 0,
      suppliesEfficiency: totals.revenue ? (totals.supplies / totals.revenue) * 100 : 0,
      marketingEfficiency: totals.revenue ? (totals.marketing / totals.revenue) * 100 : 0,

      // Revenue per dollar spent
      revenuePerPayrollDollar: totals.payroll ? totals.revenue / totals.payroll : 0,
      revenuePerRentDollar: totals.rent ? totals.revenue / totals.rent : 0,

      // Absolute values
      totalRevenue: totals.revenue,
      totalPayroll: totals.payroll,
      totalRent: totals.rent,
      totalSupplies: totals.supplies,
      totalMarketing: totals.marketing,
    };

    res.json(efficiency);
  } catch (error) {
    console.error('Error calculating efficiency metrics:', error);
    res.status(500).json({ error: 'Failed to calculate efficiency metrics' });
  }
});

export default router;
