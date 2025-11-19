import express from 'express';
import { PrismaClient } from '@prisma/client';
import { buildFlexibleDateFilter, buildDateRangeFilter, formatDateRange } from '../utils/dateFilters.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/financials/consolidated
 * Get consolidated financial data across all clinics
 */
router.get('/consolidated', async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;

    // Build comprehensive where clause using the date filter utility
    const where = buildFlexibleDateFilter({ startDate, endDate, year });

    // Log the filter for debugging
    console.log(`[Consolidated] Filtering: ${formatDateRange(startDate, endDate)}, Year: ${year || 'N/A'}`);

    // Get all records
    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Group by month and sum across all clinics - INCLUDING ALL LINE ITEMS
    const consolidated = {};

    records.forEach((record) => {
      const key = `${record.year}-${String(record.month).padStart(2, '0')}`;

      if (!consolidated[key]) {
        consolidated[key] = {
          year: record.year,
          month: record.month,
          date: record.date,
          // Top-level totals
          totalIncome: 0,
          totalCOGS: 0,
          grossProfit: 0,
          totalExpenses: 0,
          netOrdinaryIncome: 0,
          netIncome: 0,
          // All Income line items
          hdResearchIncome: 0,
          personalInjuryIncome: 0,
          achCreditIncome: 0,
          nonmedicalIncome: 0,
          otcDepositIncome: 0,
          practiceIncome: 0,
          refundsIncome: 0,
          managementFeeIncome: 0,
          // All COGS line items
          medicalSuppliesCOGS: 0,
          medicalBillingCOGS: 0,
          laboratoryFeesCOGS: 0,
          contractLaborCOGS: 0,
          merchantFeesCOGS: 0,
          medicalWasteCOGS: 0,
          consultingCOGS: 0,
          managementFeesCOGS: 0,
          medicalBooksCOGS: 0,
          laboratoryDirectoryCOGS: 0,
          labSuppliesCOGS: 0,
          patientExpenseCOGS: 0,
          chronicCareManagementCOGS: 0,
          // All Operating Expense line items
          payrollExpense: 0,
          sharedPayroll: 0,
          payrollSharedWages: 0,
          payrollSharedTax: 0,
          payrollSharedOverhead: 0,
          payrollSharedHealth: 0,
          payrollSharedContract: 0,
          payrollSharedReimbursements: 0,
          physicianPayroll: 0,
          payrollPhysicianWages: 0,
          payrollPhysicianTax: 0,
          payrollPhysicianBenefits: 0,
          payrollPhysicianBonus: 0,
          payrollPhysicianOther: 0,
          inOfficePayroll: 0,
          payrollInOfficeSalary: 0,
          payrollInOfficeWages: 0,
          payrollInOfficeBonus: 0,
          payrollInOfficeNPExtraVisits: 0,
          payrollInOfficeTelehealth: 0,
          payrollInOfficeAdministration: 0,
          payrollInOfficePayrollTaxes: 0,
          payrollInOfficeUnemployment: 0,
          payrollInOfficeHealthInsurance: 0,
          payrollInOfficeSimplePlanMatch: 0,
          payrollInOfficeOther: 0,
          payrollProcessingFees: 0,
          payrollOther: 0,
          rentExpense: 0,
          advertisingExpense: 0,
          insuranceExpense: 0,
          insuranceExpenseOther: 0,
          officeExpense: 0,
          officeSuppliesExpense: 0,
          computerExpense: 0,
          utilitiesExpense: 0,
          telephoneInternetExpense: 0,
          professionalFeesExpense: 0,
          legalFeesExpense: 0,
          accountingExpense: 0,
          bankServiceChargesExpense: 0,
          repairsMaintenanceExpense: 0,
          equipmentRentalExpense: 0,
          licensesPermitsExpense: 0,
          licenseFeeExpense: 0,
          duesSubscriptionsExpense: 0,
          mealsEntertainmentExpense: 0,
          mealsEntertainmentExpenseOther: 0,
          businessEntertainmentExpense: 0,
          employeeMealsExpense: 0,
          travelMealsExpense: 0,
          officeSnacksExpense: 0,
          officePartyExpense: 0,
          travelExpense: 0,
          continuingEducationExpense: 0,
          conferenceFeesExpense: 0,
          healthInsuranceExpense: 0,
          liabilityInsuranceExpense: 0,
          medicalMalpracticeExpense: 0,
          recruitingExpense: 0,
          credentialingExpense: 0,
          janitorialExpense: 0,
          automobileExpense: 0,
          automobileExpenseOther: 0,
          gasExpense: 0,
          parkingExpense: 0,
          charitableExpense: 0,
          marketingGiftsExpense: 0,
          linensCleaningExpense: 0,
          movingExpense: 0,
          postageExpense: 0,
          printingExpense: 0,
          securityExpense: 0,
          smallMedicalEquipExpense: 0,
          taxesExpense: 0,
          personalPropertyTaxExpense: 0,
          franchiseTaxExpense: 0,
          uniformsExpense: 0,
          miscellaneousExpense: 0,
          answeringServiceExpense: 0,
          oxygenGasExpense: 0,
          radiationBadgesExpense: 0,
          depreciationExpense: 0,
          interestExpense: 0,
          otherExpenses: 0,
          // Other Income/Expense items
          interestIncome: 0,
          // Below-the-line items
          managementFeePaid: 0,
          corporateAdminFee: 0,
          // Metadata
          clinics: [],
        };
      }

      // Sum top-level totals
      consolidated[key].totalIncome += Number(record.totalIncome || 0);
      consolidated[key].totalCOGS += Number(record.totalCOGS || 0);
      consolidated[key].grossProfit += Number(record.grossProfit || 0);
      consolidated[key].totalExpenses += Number(record.totalExpenses || 0);
      consolidated[key].netOrdinaryIncome += Number(record.netOrdinaryIncome || 0);
      consolidated[key].netIncome += Number(record.netIncome || 0);

      // Sum all Income line items
      consolidated[key].hdResearchIncome += Number(record.hdResearchIncome || 0);
      consolidated[key].personalInjuryIncome += Number(record.personalInjuryIncome || 0);
      consolidated[key].achCreditIncome += Number(record.achCreditIncome || 0);
      consolidated[key].nonmedicalIncome += Number(record.nonmedicalIncome || 0);
      consolidated[key].otcDepositIncome += Number(record.otcDepositIncome || 0);
      consolidated[key].practiceIncome += Number(record.practiceIncome || 0);
      consolidated[key].refundsIncome += Number(record.refundsIncome || 0);
      consolidated[key].managementFeeIncome += Number(record.managementFeeIncome || 0);

      // Sum all COGS line items
      consolidated[key].medicalSuppliesCOGS += Number(record.medicalSuppliesCOGS || 0);
      consolidated[key].medicalBillingCOGS += Number(record.medicalBillingCOGS || 0);
      consolidated[key].laboratoryFeesCOGS += Number(record.laboratoryFeesCOGS || 0);
      consolidated[key].contractLaborCOGS += Number(record.contractLaborCOGS || 0);
      consolidated[key].merchantFeesCOGS += Number(record.merchantFeesCOGS || 0);
      consolidated[key].medicalWasteCOGS += Number(record.medicalWasteCOGS || 0);
      consolidated[key].consultingCOGS += Number(record.consultingCOGS || 0);
      consolidated[key].managementFeesCOGS += Number(record.managementFeesCOGS || 0);
      consolidated[key].medicalBooksCOGS += Number(record.medicalBooksCOGS || 0);
      consolidated[key].laboratoryDirectoryCOGS += Number(record.laboratoryDirectoryCOGS || 0);
      consolidated[key].labSuppliesCOGS += Number(record.labSuppliesCOGS || 0);
      consolidated[key].patientExpenseCOGS += Number(record.patientExpenseCOGS || 0);
      consolidated[key].chronicCareManagementCOGS += Number(record.chronicCareManagementCOGS || 0);

      // Sum all Operating Expense line items
      consolidated[key].payrollExpense += Number(record.payrollExpense || 0);
      consolidated[key].sharedPayroll += Number(record.sharedPayroll || 0);
      consolidated[key].payrollSharedWages += Number(record.payrollSharedWages || 0);
      consolidated[key].payrollSharedTax += Number(record.payrollSharedTax || 0);
      consolidated[key].payrollSharedOverhead += Number(record.payrollSharedOverhead || 0);
      consolidated[key].payrollSharedHealth += Number(record.payrollSharedHealth || 0);
      consolidated[key].payrollSharedContract += Number(record.payrollSharedContract || 0);
      consolidated[key].payrollSharedReimbursements += Number(record.payrollSharedReimbursements || 0);
      consolidated[key].physicianPayroll += Number(record.physicianPayroll || 0);
      consolidated[key].payrollPhysicianWages += Number(record.payrollPhysicianWages || 0);
      consolidated[key].payrollPhysicianTax += Number(record.payrollPhysicianTax || 0);
      consolidated[key].payrollPhysicianBenefits += Number(record.payrollPhysicianBenefits || 0);
      consolidated[key].payrollPhysicianBonus += Number(record.payrollPhysicianBonus || 0);
      consolidated[key].payrollPhysicianOther += Number(record.payrollPhysicianOther || 0);
      consolidated[key].inOfficePayroll += Number(record.inOfficePayroll || 0);
      consolidated[key].payrollInOfficeSalary += Number(record.payrollInOfficeSalary || 0);
      consolidated[key].payrollInOfficeWages += Number(record.payrollInOfficeWages || 0);
      consolidated[key].payrollInOfficeBonus += Number(record.payrollInOfficeBonus || 0);
      consolidated[key].payrollInOfficeNPExtraVisits += Number(record.payrollInOfficeNPExtraVisits || 0);
      consolidated[key].payrollInOfficeTelehealth += Number(record.payrollInOfficeTelehealth || 0);
      consolidated[key].payrollInOfficeAdministration += Number(record.payrollInOfficeAdministration || 0);
      consolidated[key].payrollInOfficePayrollTaxes += Number(record.payrollInOfficePayrollTaxes || 0);
      consolidated[key].payrollInOfficeUnemployment += Number(record.payrollInOfficeUnemployment || 0);
      consolidated[key].payrollInOfficeHealthInsurance += Number(record.payrollInOfficeHealthInsurance || 0);
      consolidated[key].payrollInOfficeSimplePlanMatch += Number(record.payrollInOfficeSimplePlanMatch || 0);
      consolidated[key].payrollInOfficeOther += Number(record.payrollInOfficeOther || 0);
      consolidated[key].payrollProcessingFees += Number(record.payrollProcessingFees || 0);
      consolidated[key].payrollOther += Number(record.payrollOther || 0);
      consolidated[key].rentExpense += Number(record.rentExpense || 0);
      consolidated[key].advertisingExpense += Number(record.advertisingExpense || 0);
      consolidated[key].insuranceExpense += Number(record.insuranceExpense || 0);
      consolidated[key].insuranceExpenseOther += Number(record.insuranceExpenseOther || 0);
      consolidated[key].officeExpense += Number(record.officeExpense || 0);
      consolidated[key].officeSuppliesExpense += Number(record.officeSuppliesExpense || 0);
      consolidated[key].computerExpense += Number(record.computerExpense || 0);
      consolidated[key].utilitiesExpense += Number(record.utilitiesExpense || 0);
      consolidated[key].telephoneInternetExpense += Number(record.telephoneInternetExpense || 0);
      consolidated[key].professionalFeesExpense += Number(record.professionalFeesExpense || 0);
      consolidated[key].legalFeesExpense += Number(record.legalFeesExpense || 0);
      consolidated[key].accountingExpense += Number(record.accountingExpense || 0);
      consolidated[key].bankServiceChargesExpense += Number(record.bankServiceChargesExpense || 0);
      consolidated[key].repairsMaintenanceExpense += Number(record.repairsMaintenanceExpense || 0);
      consolidated[key].equipmentRentalExpense += Number(record.equipmentRentalExpense || 0);
      consolidated[key].licensesPermitsExpense += Number(record.licensesPermitsExpense || 0);
      consolidated[key].licenseFeeExpense += Number(record.licenseFeeExpense || 0);
      consolidated[key].duesSubscriptionsExpense += Number(record.duesSubscriptionsExpense || 0);
      consolidated[key].mealsEntertainmentExpense += Number(record.mealsEntertainmentExpense || 0);
      consolidated[key].mealsEntertainmentExpenseOther += Number(record.mealsEntertainmentExpenseOther || 0);
      consolidated[key].businessEntertainmentExpense += Number(record.businessEntertainmentExpense || 0);
      consolidated[key].employeeMealsExpense += Number(record.employeeMealsExpense || 0);
      consolidated[key].travelMealsExpense += Number(record.travelMealsExpense || 0);
      consolidated[key].officeSnacksExpense += Number(record.officeSnacksExpense || 0);
      consolidated[key].officePartyExpense += Number(record.officePartyExpense || 0);
      consolidated[key].travelExpense += Number(record.travelExpense || 0);
      consolidated[key].continuingEducationExpense += Number(record.continuingEducationExpense || 0);
      consolidated[key].conferenceFeesExpense += Number(record.conferenceFeesExpense || 0);
      consolidated[key].healthInsuranceExpense += Number(record.healthInsuranceExpense || 0);
      consolidated[key].liabilityInsuranceExpense += Number(record.liabilityInsuranceExpense || 0);
      consolidated[key].medicalMalpracticeExpense += Number(record.medicalMalpracticeExpense || 0);
      consolidated[key].recruitingExpense += Number(record.recruitingExpense || 0);
      consolidated[key].credentialingExpense += Number(record.credentialingExpense || 0);
      consolidated[key].janitorialExpense += Number(record.janitorialExpense || 0);
      consolidated[key].automobileExpense += Number(record.automobileExpense || 0);
      consolidated[key].automobileExpenseOther += Number(record.automobileExpenseOther || 0);
      consolidated[key].gasExpense += Number(record.gasExpense || 0);
      consolidated[key].parkingExpense += Number(record.parkingExpense || 0);
      consolidated[key].charitableExpense += Number(record.charitableExpense || 0);
      consolidated[key].marketingGiftsExpense += Number(record.marketingGiftsExpense || 0);
      consolidated[key].linensCleaningExpense += Number(record.linensCleaningExpense || 0);
      consolidated[key].movingExpense += Number(record.movingExpense || 0);
      consolidated[key].postageExpense += Number(record.postageExpense || 0);
      consolidated[key].printingExpense += Number(record.printingExpense || 0);
      consolidated[key].securityExpense += Number(record.securityExpense || 0);
      consolidated[key].smallMedicalEquipExpense += Number(record.smallMedicalEquipExpense || 0);
      consolidated[key].taxesExpense += Number(record.taxesExpense || 0);
      consolidated[key].personalPropertyTaxExpense += Number(record.personalPropertyTaxExpense || 0);
      consolidated[key].franchiseTaxExpense += Number(record.franchiseTaxExpense || 0);
      consolidated[key].uniformsExpense += Number(record.uniformsExpense || 0);
      consolidated[key].miscellaneousExpense += Number(record.miscellaneousExpense || 0);
      consolidated[key].answeringServiceExpense += Number(record.answeringServiceExpense || 0);
      consolidated[key].oxygenGasExpense += Number(record.oxygenGasExpense || 0);
      consolidated[key].radiationBadgesExpense += Number(record.radiationBadgesExpense || 0);
      consolidated[key].depreciationExpense += Number(record.depreciationExpense || 0);
      consolidated[key].interestExpense += Number(record.interestExpense || 0);
      consolidated[key].otherExpenses += Number(record.otherExpenses || 0);

      // Sum other income/expense items
      consolidated[key].interestIncome += Number(record.interestIncome || 0);

      // Sum below-the-line items
      consolidated[key].managementFeePaid += Number(record.managementFeePaid || 0);
      consolidated[key].corporateAdminFee += Number(record.corporateAdminFee || 0);

      // Track contributing clinics
      consolidated[key].clinics.push({
        name: record.clinic.name,
        income: Number(record.totalIncome),
        netIncome: Number(record.netIncome),
      });
    });

    // Convert to array and sort
    const consolidatedArray = Object.values(consolidated).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    res.json(consolidatedArray);
  } catch (error) {
    console.error('Error fetching consolidated data:', error);
    res.status(500).json({ error: 'Failed to fetch consolidated data' });
  }
});

/**
 * GET /api/financials/compare
 * Compare multiple clinics side-by-side
 */
router.get('/compare', async (req, res) => {
  try {
    const { clinicIds, startDate, endDate, year } = req.query;

    if (!clinicIds) {
      return res.status(400).json({ error: 'clinicIds parameter is required' });
    }

    const clinicIdArray = clinicIds.split(',');

    // Build where clause with consistent date filtering
    const where = {
      clinicId: { in: clinicIdArray },
    };

    // Add date/year filtering using the same logic as other endpoints
    if (year) {
      where.year = parseInt(year);
    } else if (startDate && endDate) {
      // Use the date filter utility for consistent local timezone handling
      const dateFilter = buildDateRangeFilter(startDate, endDate);
      Object.assign(where, dateFilter);
    }

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Group by clinic
    const comparison = {};

    // Define all line item fields to aggregate
    const incomeFields = [
      'hdResearchIncome', 'personalInjuryIncome', 'achCreditIncome', 'nonmedicalIncome',
      'otcDepositIncome', 'practiceIncome', 'refundsIncome', 'managementFeeIncome'
    ];

    const cogsFields = [
      'consultingCOGS', 'medicalWasteCOGS', 'medicalBillingCOGS', 'medicalSuppliesCOGS',
      'contractLaborCOGS', 'merchantFeesCOGS', 'managementFeesCOGS', 'medicalBooksCOGS',
      'laboratoryFeesCOGS', 'laboratoryDirectoryCOGS', 'labSuppliesCOGS', 'patientExpenseCOGS',
      'chronicCareManagementCOGS'
    ];

    const expenseFields = [
      'recruitingExpense', 'oxygenGasExpense', 'radiationBadgesExpense', 'equipmentRentalExpense',
      'accountingExpense', 'credentialingExpense', 'janitorialExpense', 'automobileExpense',
      'automobileExpenseOther', 'gasExpense', 'parkingExpense', 'advertisingExpense', 'marketingGiftsExpense',
      'bankServiceChargesExpense', 'charitableExpense', 'licensesPermitsExpense', 'licenseFeeExpense',
      'telephoneInternetExpense', 'conferenceFeesExpense', 'continuingEducationExpense', 'duesSubscriptionsExpense',
      'insuranceExpense', 'healthInsuranceExpense', 'liabilityInsuranceExpense',
      'medicalMalpracticeExpense', 'insuranceExpenseOther', 'legalFeesExpense', 'linensCleaningExpense',
      'mealsEntertainmentExpense', 'businessEntertainmentExpense', 'employeeMealsExpense',
      'travelMealsExpense', 'officeSnacksExpense', 'officePartyExpense', 'mealsEntertainmentExpenseOther',
      'movingExpense', 'officeExpense', 'officeSuppliesExpense', 'postageExpense',
      'payrollExpense', 'sharedPayroll', 'payrollSharedWages', 'payrollSharedTax', 'payrollSharedOverhead',
      'payrollSharedHealth', 'payrollSharedContract', 'payrollSharedReimbursements',
      'physicianPayroll', 'payrollPhysicianWages', 'payrollPhysicianTax',
      'payrollPhysicianBenefits', 'payrollPhysicianBonus', 'payrollPhysicianOther',
      'inOfficePayroll', 'payrollInOfficeSalary', 'payrollInOfficeWages', 'payrollInOfficeBonus',
      'payrollInOfficeNPExtraVisits', 'payrollInOfficeTelehealth', 'payrollInOfficeAdministration',
      'payrollInOfficePayrollTaxes', 'payrollInOfficeUnemployment', 'payrollInOfficeHealthInsurance',
      'payrollInOfficeSimplePlanMatch', 'payrollInOfficeOther',
      'payrollProcessingFees', 'payrollOther', 'printingExpense',
      'professionalFeesExpense', 'rentExpense', 'repairsMaintenanceExpense', 'securityExpense',
      'smallMedicalEquipExpense', 'taxesExpense', 'personalPropertyTaxExpense', 'franchiseTaxExpense',
      'computerExpense', 'miscellaneousExpense', 'travelExpense',
      'uniformsExpense', 'utilitiesExpense', 'answeringServiceExpense'
    ];

    const otherFields = [
      'interestIncome', 'netOrdinaryIncome', 'depreciationExpense', 'managementFeePaid', 'interestExpense',
      'corporateAdminFee', 'otherExpenses'
    ];

    records.forEach((record) => {
      const clinicId = record.clinicId;

      if (!comparison[clinicId]) {
        const lineItems = {
          income: {},
          cogs: {},
          expenses: {},
          other: {}
        };

        // Initialize all line items to 0
        incomeFields.forEach(field => lineItems.income[field] = 0);
        cogsFields.forEach(field => lineItems.cogs[field] = 0);
        expenseFields.forEach(field => lineItems.expenses[field] = 0);
        otherFields.forEach(field => lineItems.other[field] = 0);

        comparison[clinicId] = {
          id: clinicId,
          name: record.clinic.name,
          location: record.clinic.location,
          totalIncome: 0,
          totalCOGS: 0,
          grossProfit: 0,
          totalExpenses: 0,
          netIncome: 0,
          lineItems
        };
      }

      // Aggregate totals
      comparison[clinicId].totalIncome += Number(record.totalIncome);
      comparison[clinicId].totalCOGS += Number(record.totalCOGS);
      comparison[clinicId].grossProfit += Number(record.grossProfit);
      comparison[clinicId].totalExpenses += Number(record.totalExpenses);
      comparison[clinicId].netIncome += Number(record.netIncome);

      // Aggregate all line items
      incomeFields.forEach(field => {
        comparison[clinicId].lineItems.income[field] += Number(record[field] || 0);
      });
      cogsFields.forEach(field => {
        comparison[clinicId].lineItems.cogs[field] += Number(record[field] || 0);
      });
      expenseFields.forEach(field => {
        comparison[clinicId].lineItems.expenses[field] += Number(record[field] || 0);
      });
      otherFields.forEach(field => {
        comparison[clinicId].lineItems.other[field] += Number(record[field] || 0);
      });
    });

    // Calculate margins and ratios for each clinic
    const clinics = Object.values(comparison).map(clinic => {
      const grossMargin = clinic.totalIncome > 0
        ? ((clinic.grossProfit / clinic.totalIncome) * 100)
        : 0;
      const netMargin = clinic.totalIncome > 0
        ? ((clinic.netIncome / clinic.totalIncome) * 100)
        : 0;
      const expenseRatio = clinic.totalIncome > 0
        ? ((clinic.totalExpenses / clinic.totalIncome) * 100)
        : 0;

      return {
        ...clinic,
        grossMargin,
        netMargin,
        expenseRatio,
      };
    });

    // Format monthly records for time-series visualization
    const monthlyRecords = records.map(record => ({
      id: record.id,
      clinicId: record.clinicId,
      clinicName: record.clinic.name,
      date: record.date,
      year: record.year,
      month: record.month,
      label: `${record.month}/${record.year}`,
      // Top-level metrics
      totalIncome: Number(record.totalIncome),
      totalCOGS: Number(record.totalCOGS),
      grossProfit: Number(record.grossProfit),
      totalExpenses: Number(record.totalExpenses),
      netIncome: Number(record.netIncome),
      // Income line items
      ...incomeFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {}),
      // COGS line items
      ...cogsFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {}),
      // Expense line items
      ...expenseFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {}),
      // Other line items
      ...otherFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {})
    }));

    res.json({ clinics, monthlyRecords });
  } catch (error) {
    console.error('Error comparing clinics:', error);
    res.status(500).json({ error: 'Failed to compare clinics' });
  }
});

/**
 * POST /api/financials/period-compare
 * Compare same clinic across different time periods
 */
router.post('/period-compare', async (req, res) => {
  try {
    const { clinicId, periods } = req.body;

    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({ error: 'periods array is required' });
    }

    // Define all line item fields to aggregate
    const incomeFields = [
      'hdResearchIncome', 'personalInjuryIncome', 'achCreditIncome', 'nonmedicalIncome',
      'otcDepositIncome', 'practiceIncome', 'refundsIncome', 'managementFeeIncome'
    ];

    const cogsFields = [
      'consultingCOGS', 'medicalWasteCOGS', 'medicalBillingCOGS', 'medicalSuppliesCOGS',
      'contractLaborCOGS', 'merchantFeesCOGS', 'managementFeesCOGS', 'medicalBooksCOGS',
      'laboratoryFeesCOGS', 'laboratoryDirectoryCOGS', 'labSuppliesCOGS', 'patientExpenseCOGS',
      'chronicCareManagementCOGS'
    ];

    const expenseFields = [
      'recruitingExpense', 'oxygenGasExpense', 'radiationBadgesExpense', 'equipmentRentalExpense',
      'accountingExpense', 'credentialingExpense', 'janitorialExpense', 'automobileExpense',
      'automobileExpenseOther', 'gasExpense', 'parkingExpense', 'advertisingExpense', 'marketingGiftsExpense',
      'bankServiceChargesExpense', 'charitableExpense', 'licensesPermitsExpense', 'licenseFeeExpense',
      'telephoneInternetExpense', 'conferenceFeesExpense', 'continuingEducationExpense', 'duesSubscriptionsExpense',
      'insuranceExpense', 'healthInsuranceExpense', 'liabilityInsuranceExpense',
      'medicalMalpracticeExpense', 'insuranceExpenseOther', 'legalFeesExpense', 'linensCleaningExpense',
      'mealsEntertainmentExpense', 'businessEntertainmentExpense', 'employeeMealsExpense',
      'travelMealsExpense', 'officeSnacksExpense', 'officePartyExpense', 'mealsEntertainmentExpenseOther',
      'movingExpense', 'officeExpense', 'officeSuppliesExpense', 'postageExpense',
      'payrollExpense', 'sharedPayroll', 'payrollSharedWages', 'payrollSharedTax', 'payrollSharedOverhead',
      'payrollSharedHealth', 'payrollSharedContract', 'payrollSharedReimbursements',
      'physicianPayroll', 'payrollPhysicianWages', 'payrollPhysicianTax',
      'payrollPhysicianBenefits', 'payrollPhysicianBonus', 'payrollPhysicianOther',
      'inOfficePayroll', 'payrollInOfficeSalary', 'payrollInOfficeWages', 'payrollInOfficeBonus',
      'payrollInOfficeNPExtraVisits', 'payrollInOfficeTelehealth', 'payrollInOfficeAdministration',
      'payrollInOfficePayrollTaxes', 'payrollInOfficeUnemployment', 'payrollInOfficeHealthInsurance',
      'payrollInOfficeSimplePlanMatch', 'payrollInOfficeOther',
      'payrollProcessingFees', 'payrollOther', 'printingExpense',
      'professionalFeesExpense', 'rentExpense', 'repairsMaintenanceExpense', 'securityExpense',
      'smallMedicalEquipExpense', 'taxesExpense', 'personalPropertyTaxExpense', 'franchiseTaxExpense',
      'computerExpense', 'miscellaneousExpense', 'travelExpense',
      'uniformsExpense', 'utilitiesExpense', 'answeringServiceExpense'
    ];

    const otherFields = [
      'interestIncome', 'netOrdinaryIncome', 'depreciationExpense', 'managementFeePaid', 'interestExpense',
      'corporateAdminFee', 'otherExpenses'
    ];

    // Process each period
    const periodResults = await Promise.all(periods.map(async (period) => {
      const { label, startDate, endDate } = period;

      if (!startDate || !endDate) {
        throw new Error(`Period "${label}" missing startDate or endDate`);
      }

      // Build where clause using the same date filter as other endpoints
      // This ensures consistent filtering with local timezone (not UTC) and year/month validation
      const where = buildDateRangeFilter(startDate, endDate);

      // Add clinic filter (or get all clinics for consolidated)
      if (clinicId && clinicId !== 'all') {
        where.clinicId = clinicId;
      }

      // Fetch records for this period
      const records = await prisma.financialRecord.findMany({
        where,
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      });

      // Initialize aggregation object
      const lineItems = {
        income: {},
        cogs: {},
        expenses: {},
        other: {}
      };

      incomeFields.forEach(field => lineItems.income[field] = 0);
      cogsFields.forEach(field => lineItems.cogs[field] = 0);
      expenseFields.forEach(field => lineItems.expenses[field] = 0);
      otherFields.forEach(field => lineItems.other[field] = 0);

      const periodData = {
        label,
        startDate,
        endDate,
        totalIncome: 0,
        totalCOGS: 0,
        grossProfit: 0,
        totalExpenses: 0,
        netIncome: 0,
        lineItems,
        clinics: [],
        recordCount: records.length
      };

      // Aggregate records
      records.forEach((record) => {
        periodData.totalIncome += Number(record.totalIncome);
        periodData.totalCOGS += Number(record.totalCOGS);
        periodData.grossProfit += Number(record.grossProfit);
        periodData.totalExpenses += Number(record.totalExpenses);
        periodData.netIncome += Number(record.netIncome);

        // Aggregate all line items
        incomeFields.forEach(field => {
          periodData.lineItems.income[field] += Number(record[field] || 0);
        });
        cogsFields.forEach(field => {
          periodData.lineItems.cogs[field] += Number(record[field] || 0);
        });
        expenseFields.forEach(field => {
          periodData.lineItems.expenses[field] += Number(record[field] || 0);
        });
        otherFields.forEach(field => {
          periodData.lineItems.other[field] += Number(record[field] || 0);
        });

        // Track clinics (for consolidated view)
        if (!periodData.clinics.find(c => c.id === record.clinicId)) {
          periodData.clinics.push({
            id: record.clinicId,
            name: record.clinic.name,
            location: record.clinic.location
          });
        }
      });

      // Calculate margins
      periodData.grossMargin = periodData.totalIncome > 0
        ? ((periodData.grossProfit / periodData.totalIncome) * 100)
        : 0;
      periodData.netMargin = periodData.totalIncome > 0
        ? ((periodData.netIncome / periodData.totalIncome) * 100)
        : 0;
      periodData.expenseRatio = periodData.totalIncome > 0
        ? ((periodData.totalExpenses / periodData.totalIncome) * 100)
        : 0;

      // Format monthly records for time-series
      if (clinicId === 'all') {
        // AGGREGATE BY MONTH when showing consolidated view (all clinics)
        const monthlyAggregated = {};

        records.forEach(record => {
          const monthKey = `${record.year}-${String(record.month).padStart(2, '0')}`;

          if (!monthlyAggregated[monthKey]) {
            // Initialize all fields to 0 for this month
            monthlyAggregated[monthKey] = {
              date: record.date,
              year: record.year,
              month: record.month,
              label: `${record.month}/${record.year}`,
              periodLabel: label,
              clinicName: 'All Clinics (Consolidated)',
              totalIncome: 0,
              totalCOGS: 0,
              grossProfit: 0,
              totalExpenses: 0,
              netIncome: 0,
              ...incomeFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {}),
              ...cogsFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {}),
              ...expenseFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {}),
              ...otherFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {})
            };
          }

          // Sum all values across clinics for this month
          monthlyAggregated[monthKey].totalIncome += Number(record.totalIncome || 0);
          monthlyAggregated[monthKey].totalCOGS += Number(record.totalCOGS || 0);
          monthlyAggregated[monthKey].grossProfit += Number(record.grossProfit || 0);
          monthlyAggregated[monthKey].totalExpenses += Number(record.totalExpenses || 0);
          monthlyAggregated[monthKey].netIncome += Number(record.netIncome || 0);

          // Sum all line items
          incomeFields.forEach(field => {
            monthlyAggregated[monthKey][field] += Number(record[field] || 0);
          });
          cogsFields.forEach(field => {
            monthlyAggregated[monthKey][field] += Number(record[field] || 0);
          });
          expenseFields.forEach(field => {
            monthlyAggregated[monthKey][field] += Number(record[field] || 0);
          });
          otherFields.forEach(field => {
            monthlyAggregated[monthKey][field] += Number(record[field] || 0);
          });
        });

        // Convert to array and sort by date
        periodData.monthlyRecords = Object.values(monthlyAggregated).sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
      } else {
        // SINGLE CLINIC - Keep existing behavior
        periodData.monthlyRecords = records.map(record => ({
          date: record.date,
          year: record.year,
          month: record.month,
          label: `${record.month}/${record.year}`,
          periodLabel: label,
          clinicName: record.clinic.name,
          totalIncome: Number(record.totalIncome),
          totalCOGS: Number(record.totalCOGS),
          grossProfit: Number(record.grossProfit),
          totalExpenses: Number(record.totalExpenses),
          netIncome: Number(record.netIncome),
          ...incomeFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {}),
          ...cogsFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {}),
          ...expenseFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {}),
          ...otherFields.reduce((acc, field) => ({ ...acc, [field]: Number(record[field] || 0) }), {})
        }));
      }

      return periodData;
    }));

    res.json({ periods: periodResults });
  } catch (error) {
    console.error('Error comparing periods:', error);
    res.status(500).json({ error: 'Failed to compare periods', details: error.message });
  }
});

/**
 * GET /api/financials/trends
 * Get time-series trend data for visualization
 */
router.get('/trends', async (req, res) => {
  try {
    const { clinicId, category, startDate, endDate } = req.query;

    // Build comprehensive where clause
    const where = {};
    if (clinicId && clinicId !== 'all') {
      where.clinicId = clinicId;
    }

    // Apply comprehensive date filtering
    const dateFilter = buildFlexibleDateFilter({ startDate, endDate });
    Object.assign(where, dateFilter);

    // Log the filter for debugging
    console.log(`[Trends] Filtering: ${formatDateRange(startDate, endDate)}, Clinic: ${clinicId || 'all'}`);

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

    let trends;

    // If no specific clinic selected, aggregate data by month
    if (!clinicId || clinicId === 'all') {
      const aggregated = {};

      records.forEach((record) => {
        const key = `${record.year}-${String(record.month).padStart(2, '0')}`;

        if (!aggregated[key]) {
          // Initialize with ALL expense/COGS fields
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
            netOrdinaryIncome: 0,
            // COGS fields
            medicalSuppliesCOGS: 0,
            medicalBillingCOGS: 0,
            laboratoryFeesCOGS: 0,
            contractLaborCOGS: 0,
            merchantFeesCOGS: 0,
            medicalWasteCOGS: 0,
            consultingCOGS: 0,
            managementFeesCOGS: 0,
            medicalBooksCOGS: 0,
            laboratoryDirectoryCOGS: 0,
            labSuppliesCOGS: 0,
            patientExpenseCOGS: 0,
            chronicCareManagementCOGS: 0,
            // Expense fields
            payrollExpense: 0,
            rentExpense: 0,
            advertisingExpense: 0,
            insuranceExpense: 0,
            officeExpense: 0,
            computerExpense: 0,
            utilitiesExpense: 0,
            telephoneInternetExpense: 0,
            professionalFeesExpense: 0,
            legalFeesExpense: 0,
            accountingExpense: 0,
            bankServiceChargesExpense: 0,
            repairsMaintenanceExpense: 0,
            equipmentRentalExpense: 0,
            licensesPermitsExpense: 0,
            duesSubscriptionsExpense: 0,
            mealsEntertainmentExpense: 0,
            travelExpense: 0,
            continuingEducationExpense: 0,
            recruitingExpense: 0,
            credentialingExpense: 0,
            janitorialExpense: 0,
            automobileExpense: 0,
            charitableExpense: 0,
            linensCleaningExpense: 0,
            movingExpense: 0,
            postageExpense: 0,
            printingExpense: 0,
            securityExpense: 0,
            smallMedicalEquipExpense: 0,
            taxesExpense: 0,
            uniformsExpense: 0,
            answeringServiceExpense: 0,
            oxygenGasExpense: 0,
            radiationBadgesExpense: 0,
            depreciationExpense: 0,
            interestExpense: 0,
            otherExpenses: 0,
            clinicCount: 0,
          };
        }

        // Sum all financial fields
        aggregated[key].totalIncome += Number(record.totalIncome);
        aggregated[key].totalCOGS += Number(record.totalCOGS);
        aggregated[key].grossProfit += Number(record.grossProfit);
        aggregated[key].totalExpenses += Number(record.totalExpenses);
        aggregated[key].netIncome += Number(record.netIncome);
        aggregated[key].netOrdinaryIncome += Number(record.netOrdinaryIncome || 0);
        // Sum all COGS fields
        aggregated[key].medicalSuppliesCOGS += Number(record.medicalSuppliesCOGS || 0);
        aggregated[key].medicalBillingCOGS += Number(record.medicalBillingCOGS || 0);
        aggregated[key].laboratoryFeesCOGS += Number(record.laboratoryFeesCOGS || 0);
        aggregated[key].contractLaborCOGS += Number(record.contractLaborCOGS || 0);
        aggregated[key].merchantFeesCOGS += Number(record.merchantFeesCOGS || 0);
        aggregated[key].medicalWasteCOGS += Number(record.medicalWasteCOGS || 0);
        aggregated[key].consultingCOGS += Number(record.consultingCOGS || 0);
        aggregated[key].managementFeesCOGS += Number(record.managementFeesCOGS || 0);
        aggregated[key].medicalBooksCOGS += Number(record.medicalBooksCOGS || 0);
        aggregated[key].laboratoryDirectoryCOGS += Number(record.laboratoryDirectoryCOGS || 0);
        aggregated[key].labSuppliesCOGS += Number(record.labSuppliesCOGS || 0);
        aggregated[key].patientExpenseCOGS += Number(record.patientExpenseCOGS || 0);
        aggregated[key].chronicCareManagementCOGS += Number(record.chronicCareManagementCOGS || 0);
        // Sum all Expense fields
        aggregated[key].payrollExpense += Number(record.payrollExpense || 0);
        aggregated[key].rentExpense += Number(record.rentExpense || 0);
        aggregated[key].advertisingExpense += Number(record.advertisingExpense || 0);
        aggregated[key].insuranceExpense += Number(record.insuranceExpense || 0);
        aggregated[key].officeExpense += Number(record.officeExpense || 0);
        aggregated[key].computerExpense += Number(record.computerExpense || 0);
        aggregated[key].utilitiesExpense += Number(record.utilitiesExpense || 0);
        aggregated[key].telephoneInternetExpense += Number(record.telephoneInternetExpense || 0);
        aggregated[key].professionalFeesExpense += Number(record.professionalFeesExpense || 0);
        aggregated[key].legalFeesExpense += Number(record.legalFeesExpense || 0);
        aggregated[key].accountingExpense += Number(record.accountingExpense || 0);
        aggregated[key].bankServiceChargesExpense += Number(record.bankServiceChargesExpense || 0);
        aggregated[key].repairsMaintenanceExpense += Number(record.repairsMaintenanceExpense || 0);
        aggregated[key].equipmentRentalExpense += Number(record.equipmentRentalExpense || 0);
        aggregated[key].licensesPermitsExpense += Number(record.licensesPermitsExpense || 0);
        aggregated[key].duesSubscriptionsExpense += Number(record.duesSubscriptionsExpense || 0);
        aggregated[key].mealsEntertainmentExpense += Number(record.mealsEntertainmentExpense || 0);
        aggregated[key].travelExpense += Number(record.travelExpense || 0);
        aggregated[key].continuingEducationExpense += Number(record.continuingEducationExpense || 0);
        aggregated[key].recruitingExpense += Number(record.recruitingExpense || 0);
        aggregated[key].credentialingExpense += Number(record.credentialingExpense || 0);
        aggregated[key].janitorialExpense += Number(record.janitorialExpense || 0);
        aggregated[key].automobileExpense += Number(record.automobileExpense || 0);
        aggregated[key].charitableExpense += Number(record.charitableExpense || 0);
        aggregated[key].linensCleaningExpense += Number(record.linensCleaningExpense || 0);
        aggregated[key].movingExpense += Number(record.movingExpense || 0);
        aggregated[key].postageExpense += Number(record.postageExpense || 0);
        aggregated[key].printingExpense += Number(record.printingExpense || 0);
        aggregated[key].securityExpense += Number(record.securityExpense || 0);
        aggregated[key].smallMedicalEquipExpense += Number(record.smallMedicalEquipExpense || 0);
        aggregated[key].taxesExpense += Number(record.taxesExpense || 0);
        aggregated[key].uniformsExpense += Number(record.uniformsExpense || 0);
        aggregated[key].answeringServiceExpense += Number(record.answeringServiceExpense || 0);
        aggregated[key].oxygenGasExpense += Number(record.oxygenGasExpense || 0);
        aggregated[key].radiationBadgesExpense += Number(record.radiationBadgesExpense || 0);
        aggregated[key].depreciationExpense += Number(record.depreciationExpense || 0);
        aggregated[key].interestExpense += Number(record.interestExpense || 0);
        aggregated[key].otherExpenses += Number(record.otherExpenses || 0);
        aggregated[key].clinicCount++;
      });

      // Convert aggregated data to array and add calculated fields
      trends = Object.values(aggregated).map((item) => {
        const baseData = {
          ...item,
          profitMargin: item.totalIncome ? (item.netIncome / item.totalIncome) * 100 : 0,
        };

        // If specific category requested, include it
        if (category && item[category] !== undefined) {
          baseData.categoryValue = Number(item[category]);
          baseData.value = Number(item[category]);
        } else {
          // Default to totalIncome if no category specified
          baseData.value = Number(item.totalIncome);
        }

        return baseData;
      });
    } else {
      // Single clinic view - return individual records with ALL fields
      trends = records.map((record) => {
        const baseData = {
          year: record.year,
          month: record.month,
          date: record.date,
          clinicName: record.clinic.name,
          totalIncome: Number(record.totalIncome),
          totalCOGS: Number(record.totalCOGS),
          grossProfit: Number(record.grossProfit),
          totalExpenses: Number(record.totalExpenses),
          netIncome: Number(record.netIncome),
          netOrdinaryIncome: Number(record.netOrdinaryIncome || 0),
          // All COGS fields
          medicalSuppliesCOGS: Number(record.medicalSuppliesCOGS || 0),
          medicalBillingCOGS: Number(record.medicalBillingCOGS || 0),
          laboratoryFeesCOGS: Number(record.laboratoryFeesCOGS || 0),
          contractLaborCOGS: Number(record.contractLaborCOGS || 0),
          merchantFeesCOGS: Number(record.merchantFeesCOGS || 0),
          medicalWasteCOGS: Number(record.medicalWasteCOGS || 0),
          consultingCOGS: Number(record.consultingCOGS || 0),
          managementFeesCOGS: Number(record.managementFeesCOGS || 0),
          medicalBooksCOGS: Number(record.medicalBooksCOGS || 0),
          laboratoryDirectoryCOGS: Number(record.laboratoryDirectoryCOGS || 0),
          labSuppliesCOGS: Number(record.labSuppliesCOGS || 0),
          patientExpenseCOGS: Number(record.patientExpenseCOGS || 0),
          chronicCareManagementCOGS: Number(record.chronicCareManagementCOGS || 0),
          // All Expense fields
          payrollExpense: Number(record.payrollExpense || 0),
          rentExpense: Number(record.rentExpense || 0),
          advertisingExpense: Number(record.advertisingExpense || 0),
          insuranceExpense: Number(record.insuranceExpense || 0),
          officeExpense: Number(record.officeExpense || 0),
          computerExpense: Number(record.computerExpense || 0),
          utilitiesExpense: Number(record.utilitiesExpense || 0),
          telephoneInternetExpense: Number(record.telephoneInternetExpense || 0),
          professionalFeesExpense: Number(record.professionalFeesExpense || 0),
          legalFeesExpense: Number(record.legalFeesExpense || 0),
          accountingExpense: Number(record.accountingExpense || 0),
          bankServiceChargesExpense: Number(record.bankServiceChargesExpense || 0),
          repairsMaintenanceExpense: Number(record.repairsMaintenanceExpense || 0),
          equipmentRentalExpense: Number(record.equipmentRentalExpense || 0),
          licensesPermitsExpense: Number(record.licensesPermitsExpense || 0),
          duesSubscriptionsExpense: Number(record.duesSubscriptionsExpense || 0),
          mealsEntertainmentExpense: Number(record.mealsEntertainmentExpense || 0),
          travelExpense: Number(record.travelExpense || 0),
          continuingEducationExpense: Number(record.continuingEducationExpense || 0),
          recruitingExpense: Number(record.recruitingExpense || 0),
          credentialingExpense: Number(record.credentialingExpense || 0),
          janitorialExpense: Number(record.janitorialExpense || 0),
          automobileExpense: Number(record.automobileExpense || 0),
          charitableExpense: Number(record.charitableExpense || 0),
          linensCleaningExpense: Number(record.linensCleaningExpense || 0),
          movingExpense: Number(record.movingExpense || 0),
          postageExpense: Number(record.postageExpense || 0),
          printingExpense: Number(record.printingExpense || 0),
          securityExpense: Number(record.securityExpense || 0),
          smallMedicalEquipExpense: Number(record.smallMedicalEquipExpense || 0),
          taxesExpense: Number(record.taxesExpense || 0),
          uniformsExpense: Number(record.uniformsExpense || 0),
          answeringServiceExpense: Number(record.answeringServiceExpense || 0),
          oxygenGasExpense: Number(record.oxygenGasExpense || 0),
          radiationBadgesExpense: Number(record.radiationBadgesExpense || 0),
          depreciationExpense: Number(record.depreciationExpense || 0),
          interestExpense: Number(record.interestExpense || 0),
          otherExpenses: Number(record.otherExpenses || 0),
          profitMargin: record.totalIncome ? (Number(record.netIncome) / Number(record.totalIncome)) * 100 : 0,
        };

        // If specific category requested, include it
        if (category && record[category] !== undefined) {
          baseData.categoryValue = Number(record[category]);
          baseData.value = Number(record[category]);
        } else {
          // Default to totalIncome if no category specified
          baseData.value = Number(record.totalIncome);
        }

        return baseData;
      });
    }

    // Sort trends by year and month
    trends.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Wrap in trends object for frontend compatibility
    res.json({
      trends,
      totalRecords: trends.length,
      clinicId: clinicId || 'all',
      category: category || 'all',
      isAggregated: !clinicId || clinicId === 'all',
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

/**
 * GET /api/financials/line-item/:category
 * Drill-down into a specific P&L line item
 */
router.get('/line-item/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { clinicId, startDate, endDate } = req.query;

    // Validate category exists in schema
    const validCategories = [
      'totalIncome', 'totalCOGS', 'grossProfit', 'totalExpenses', 'netIncome',
      // Income categories
      'hdResearchIncome', 'personalInjuryIncome', 'achCreditIncome',
      'nonmedicalIncome', 'otcDepositIncome', 'practiceIncome',
      // COGS categories
      'medicalSuppliesCOGS', 'medicalBillingCOGS', 'laboratoryFeesCOGS',
      'contractLaborCOGS', 'merchantFeesCOGS',
      // Expense categories
      'payrollExpense', 'rentExpense', 'advertisingExpense',
      'insuranceExpense', 'officeExpense',
      // Add more as needed
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Build where clause
    const where = {};
    if (clinicId) {
      where.clinicId = clinicId;
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate + 'T00:00:00.000Z'),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const records = await prisma.financialRecord.findMany({
      where,
      select: {
        id: true,
        year: true,
        month: true,
        date: true,
        [category]: true,
        totalIncome: true, // For percentage calculations
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Calculate statistics
    const values = records.map(r => Number(r[category]));
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = values.length > 0 ? total / values.length : 0;
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);

    // Format data for charts
    const lineItemData = records.map((record) => ({
      year: record.year,
      month: record.month,
      date: record.date,
      clinicId: record.clinic.id,
      clinicName: record.clinic.name,
      value: Number(record[category]),
      percentOfRevenue: record.totalIncome ? (Number(record[category]) / Number(record.totalIncome)) * 100 : 0,
    }));

    res.json({
      category,
      statistics: {
        total,
        average,
        max,
        min,
        count: records.length,
      },
      data: lineItemData,
    });
  } catch (error) {
    console.error('Error fetching line item data:', error);
    res.status(500).json({ error: 'Failed to fetch line item data' });
  }
});

/**
 * GET /api/financials/summary
 * Get summary statistics across all data
 */
router.get('/summary', async (req, res) => {
  try {
    const { clinicId, year } = req.query;

    const where = {};
    if (clinicId) where.clinicId = clinicId;
    if (year) where.year = parseInt(year);

    const summary = await prisma.financialRecord.aggregate({
      where,
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
      _count: true,
    });

    const totalIncome = Number(summary._sum.totalIncome || 0);
    const totalCOGS = Number(summary._sum.totalCOGS || 0);
    const totalExpenses = Number(summary._sum.totalExpenses || 0);
    const netIncome = Number(summary._sum.netIncome || 0);

    res.json({
      totalIncome,
      totalCOGS,
      totalExpenses,
      netIncome,
      grossProfit: Number(summary._sum.grossProfit || 0),
      avgMonthlyIncome: Number(summary._avg.totalIncome || 0),
      avgMonthlyNetIncome: Number(summary._avg.netIncome || 0),
      grossMargin: totalIncome ? (totalIncome - totalCOGS) / totalIncome * 100 : 0,
      profitMargin: totalIncome ? netIncome / totalIncome * 100 : 0,
      recordCount: summary._count,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary data' });
  }
});

/**
 * GET /api/financials/debug-records
 * Debug endpoint to see all records in database with their dates
 */
router.get('/debug-records', async (req, res) => {
  try {
    const records = await prisma.financialRecord.findMany({
      select: {
        id: true,
        year: true,
        month: true,
        date: true,
        totalIncome: true,
        totalExpenses: true,
        clinic: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Group by clinic for easier reading
    const byClinic = {};
    records.forEach((record) => {
      const clinicName = record.clinic?.name || 'Unknown';
      if (!byClinic[clinicName]) {
        byClinic[clinicName] = [];
      }
      byClinic[clinicName].push({
        year: record.year,
        month: record.month,
        date: record.date,
        totalIncome: record.totalIncome,
        totalExpenses: record.totalExpenses,
      });
    });

    res.json({
      totalRecords: records.length,
      byClinic,
      allRecords: records.map((r) => ({
        clinic: r.clinic?.name,
        location: r.clinic?.location,
        year: r.year,
        month: r.month,
        date: r.date,
        totalIncome: r.totalIncome,
      })),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
