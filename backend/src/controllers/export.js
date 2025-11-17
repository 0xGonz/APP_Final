import express from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/export/excel
 * Export financial data to Excel
 */
router.post('/excel', async (req, res) => {
  try {
    const { clinicId, startDate, endDate, year } = req.body;

    // Build where clause
    const where = {};
    if (clinicId) where.clinicId = clinicId;
    if (year) {
      where.year = parseInt(year);
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate + 'T00:00:00.000Z'),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No data found for export' });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'APP23 Financial Dashboard';
    workbook.created = new Date();

    // Add P&L worksheet
    const worksheet = workbook.addWorksheet('Profit & Loss');

    // Define columns
    worksheet.columns = [
      { header: 'Clinic', key: 'clinic', width: 20 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Month', key: 'month', width: 10 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Total Income', key: 'totalIncome', width: 15, style: { numFmt: '$#,##0.00' } },
      { header: 'Total COGS', key: 'totalCOGS', width: 15, style: { numFmt: '$#,##0.00' } },
      { header: 'Gross Profit', key: 'grossProfit', width: 15, style: { numFmt: '$#,##0.00' } },
      { header: 'Total Expenses', key: 'totalExpenses', width: 15, style: { numFmt: '$#,##0.00' } },
      { header: 'Net Income', key: 'netIncome', width: 15, style: { numFmt: '$#,##0.00' } },
      { header: 'Gross Margin %', key: 'grossMargin', width: 15, style: { numFmt: '0.00%' } },
      { header: 'Net Margin %', key: 'netMargin', width: 15, style: { numFmt: '0.00%' } },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    records.forEach((record) => {
      const totalIncome = Number(record.totalIncome);
      const grossProfit = Number(record.grossProfit);
      const netIncome = Number(record.netIncome);

      worksheet.addRow({
        clinic: record.clinic.name,
        year: record.year,
        month: record.month,
        date: new Date(record.date).toLocaleDateString(),
        totalIncome,
        totalCOGS: Number(record.totalCOGS),
        grossProfit,
        totalExpenses: Number(record.totalExpenses),
        netIncome,
        grossMargin: totalIncome ? grossProfit / totalIncome : 0,
        netMargin: totalIncome ? netIncome / totalIncome : 0,
      });
    });

    // Add summary row
    const summaryRow = worksheet.addRow({
      clinic: 'TOTAL',
      totalIncome: { formula: `SUM(E2:E${records.length + 1})` },
      totalCOGS: { formula: `SUM(F2:F${records.length + 1})` },
      grossProfit: { formula: `SUM(G2:G${records.length + 1})` },
      totalExpenses: { formula: `SUM(H2:H${records.length + 1})` },
      netIncome: { formula: `SUM(I2:I${records.length + 1})` },
    });

    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };

    // Add detailed breakdown worksheet
    const detailsWorksheet = workbook.addWorksheet('Detailed Breakdown');

    // Define detail columns (simplified for space)
    const detailColumns = [
      { header: 'Clinic', key: 'clinic', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Practice Income', key: 'practiceIncome', width: 15 },
      { header: 'Medical Supplies', key: 'medicalSupplies', width: 15 },
      { header: 'Medical Billing', key: 'medicalBilling', width: 15 },
      { header: 'Payroll', key: 'payroll', width: 15 },
      { header: 'Rent', key: 'rent', width: 15 },
      { header: 'Insurance', key: 'insurance', width: 15 },
    ];

    detailsWorksheet.columns = detailColumns;
    detailsWorksheet.getRow(1).font = { bold: true };
    detailsWorksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    detailsWorksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    records.forEach((record) => {
      detailsWorksheet.addRow({
        clinic: record.clinic.name,
        date: new Date(record.date).toLocaleDateString(),
        practiceIncome: Number(record.practiceIncome),
        medicalSupplies: Number(record.medicalSuppliesCOGS),
        medicalBilling: Number(record.medicalBillingCOGS),
        payroll: Number(record.payrollExpense),
        rent: Number(record.rentExpense),
        insurance: Number(record.insuranceExpense),
      });
    });

    // Set response headers
    const filename = `APP23_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

/**
 * POST /api/export/pdf
 * Export financial data to PDF (simplified version - would use jsPDF in production)
 */
router.post('/pdf', async (req, res) => {
  try {
    const { clinicId, year } = req.body;

    const where = {};
    if (clinicId) where.clinicId = clinicId;
    if (year) where.year = parseInt(year);

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No data found for export' });
    }

    // For now, return JSON formatted for PDF generation on frontend
    // In production, you'd use jsPDF server-side or a PDF library like pdfkit
    const pdfData = {
      title: 'American Pain Partners - Financial Report',
      generatedDate: new Date().toLocaleDateString(),
      records: records.map(r => ({
        clinic: r.clinic.name,
        period: `${r.year}-${String(r.month).padStart(2, '0')}`,
        totalIncome: Number(r.totalIncome),
        totalExpenses: Number(r.totalExpenses),
        netIncome: Number(r.netIncome),
        profitMargin: r.totalIncome ? (Number(r.netIncome) / Number(r.totalIncome)) * 100 : 0,
      })),
      summary: {
        totalIncome: records.reduce((sum, r) => sum + Number(r.totalIncome), 0),
        totalExpenses: records.reduce((sum, r) => sum + Number(r.totalExpenses), 0),
        netIncome: records.reduce((sum, r) => sum + Number(r.netIncome), 0),
      },
    };

    res.json(pdfData);
  } catch (error) {
    console.error('Error preparing PDF data:', error);
    res.status(500).json({ error: 'Failed to prepare PDF data' });
  }
});

/**
 * GET /api/export/csv
 * Export to CSV format
 */
router.get('/csv', async (req, res) => {
  try {
    const { clinicId, year } = req.query;

    const where = {};
    if (clinicId) where.clinicId = clinicId;
    if (year) where.year = parseInt(year);

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No data found for export' });
    }

    // Generate CSV
    const headers = 'Clinic,Year,Month,Total Income,Total COGS,Gross Profit,Total Expenses,Net Income\n';
    const rows = records.map(r =>
      `${r.clinic.name},${r.year},${r.month},${r.totalIncome},${r.totalCOGS},${r.grossProfit},${r.totalExpenses},${r.netIncome}`
    ).join('\n');

    const csv = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="APP23_Export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({ error: 'Failed to export to CSV' });
  }
});

export default router;
