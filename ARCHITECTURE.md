# APP23 Dashboard - Modular Architecture Documentation

## Overview

This dashboard is built with a **highly modular, dynamic architecture** that ensures:
- ✅ Clean separation of concerns
- ✅ Reusable components and utilities
- ✅ Consistent data filtering across all views
- ✅ Type-safe data transformations
- ✅ Client-side validation as safety net for backend filtering

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│  (React Components - Dashboard, Analytics, Clinics) │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│              Custom Hooks Layer                      │
│  (useFilteredData, useFilteredPnL, useFilteredTrends)│
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│           Data Transformation Layer                  │
│  (dataTransformers.js, dataValidation.js)           │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│              API Services Layer                      │
│  (financialsAPI, metricsAPI, clinicsAPI)            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│            Backend Controllers                       │
│  (financials.js, metrics.js, clinics.js)            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│          Database & Date Filtering                   │
│  (Prisma ORM, dateFilters.js utility)               │
└─────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### 1. **Date Filtering Utility** (`backend/src/utils/dateFilters.js`)

**Purpose**: Comprehensive date filtering that handles both `date` field and `year`/`month` fields

**Key Functions**:
```javascript
// Builds Prisma where clause with dual validation
buildFlexibleDateFilter({ startDate, endDate, year, month })

// Validates records are in date range (post-query)
isRecordInDateRange(record, startDate, endDate)

// Formats date range for logging
formatDateRange(startDate, endDate)
```

**Why It's Modular**:
- Single source of truth for date filtering logic
- Reusable across all API endpoints
- Handles timezone issues consistently
- Provides both date field AND year/month validation

### 2. **API Controllers** (`backend/src/controllers/`)

#### **Financials Controller** (`financials.js`)
```javascript
// Endpoints:
GET /api/financials/consolidated   // All clinics combined
GET /api/financials/trends          // Time-series data
GET /api/financials/compare         // Clinic comparisons
GET /api/financials/line-item/:cat  // Drill-down into specific line items
```

#### **Metrics Controller** (`metrics.js`)
```javascript
// Endpoints:
GET /api/metrics/kpis      // Key performance indicators
GET /api/metrics/growth    // MoM and YoY growth rates
GET /api/metrics/margins   // Profit margins by clinic
GET /api/metrics/efficiency // Operational efficiency metrics
```

**Modularity Features**:
- All endpoints use `buildFlexibleDateFilter()` for consistency
- Logging at every endpoint for debugging
- Standardized response formats
- Error handling with descriptive messages

---

## Frontend Architecture

### 1. **Custom Hooks** (`frontend/src/hooks/`)

#### **useFilteredData** - Generic data filtering hook
```javascript
const { data, count, summary, isEmpty } = useFilteredData(
  rawData,
  startDate,
  endDate,
  { requiredFields: ['totalIncome'], logIssues: true }
);
```

**What it does**:
- ✅ Client-side date validation
- ✅ Filters out records outside date range
- ✅ Validates required fields exist
- ✅ Returns metadata (count, date range summary)
- ✅ Logs filtered-out records for debugging

#### **useFilteredPnL** - P&L specific filtering
```javascript
const { data, totals, summary, isEmpty } = useFilteredPnL(
  pnlData,
  startDate,
  endDate
);
```

**What it does**:
- Everything `useFilteredData` does, plus:
- ✅ Calculates aggregate totals (totalIncome, totalExpenses, netIncome)
- ✅ Counts periods included
- ✅ Optimized for P&L data structure

#### **useFilteredTrends** - Trends specific filtering
```javascript
const { trends, summary, isEmpty } = useFilteredTrends(
  trendsResponse,
  startDate,
  endDate,
  metricField
);
```

**What it does**:
- ✅ Extracts trends array from API response
- ✅ Filters by date range
- ✅ Validates metric field exists
- ✅ Returns clean trend data ready for charting

**Why These Hooks Are Modular**:
- Encapsulate complex logic in reusable functions
- Consistent interface across all components
- Easy to test independently
- Performance optimized with `useMemo`

### 2. **Data Transformation Layer** (`frontend/src/utils/`)

#### **dataTransformers.js** - Chart & display transformations
```javascript
// Transform API data for chart consumption
transformTrendsForChart(trends, metricField)

// Transform growth API response
transformGrowthData(growthResponse)

// Transform KPI data for display
transformKPIData(kpiResponse)

// Format currency and percentages
formatCurrency(value)
formatPercent(value)
```

#### **dataValidation.js** - Client-side validation
```javascript
// Validate record is in date range
isRecordInDateRange(record, startDate, endDate)

// Filter array of records
filterRecordsByDateRange(records, startDate, endDate)

// Validate financial record structure
validateFinancialRecord(record, requiredFields)

// Get summary of data range
getDataRangeSummary(records)
```

**Why This Layer Is Modular**:
- Pure functions (no side effects)
- Single responsibility principle
- Composable and testable
- Decouples API structure from UI requirements

### 3. **Presentation Components** (`frontend/src/components/`)

#### **Component Hierarchy**:
```
Dashboard (Container)
├── KPICards (Presentation)
├── FinancialTrendChart (Presentation)
└── ProfitLossTableComplete (Presentation)

Analytics (Container)
├── KPICards (Presentation)
├── ChartCard (Presentation)
└── AreaChart (from recharts)

Clinic (Container)
├── ClinicHeader (Presentation)
├── KPICards (Presentation)
└── ProfitLossTableComplete (Presentation)
```

#### **Container Components** (Smart Components)
- Fetch data using React Query
- Apply filters using custom hooks
- Manage local state
- Pass clean props to presentation components

**Example: Dashboard.jsx**
```javascript
const Dashboard = () => {
  // 1. Get global filter state
  const { startDate, endDate } = useDateFilter();

  // 2. Fetch data from API
  const { data: pnlData } = useQuery({
    queryKey: ['consolidated-pnl', startDate, endDate],
    queryFn: () => financialsAPI.getConsolidated({ startDate, endDate }),
  });

  // 3. Filter and validate using modular hook
  const { data: filteredData, totals, summary } = useFilteredPnL(
    pnlData,
    startDate,
    endDate
  );

  // 4. Pass clean data to presentation components
  return <ProfitLossTableComplete data={filteredData} />;
};
```

#### **Presentation Components** (Dumb Components)
- Accept data via props only
- No data fetching
- No business logic
- Fully reusable
- Easy to test

**Example: FinancialTrendChart.jsx**
```javascript
const FinancialTrendChart = ({
  data = [],           // Required prop
  title = 'Default',   // Optional with default
  height = 400,        // Optional with default
  isLoading = false    // Optional with default
}) => {
  // Only rendering logic here
  // No data fetching, no filtering
  return <AreaChart data={data} />;
};
```

**Why Components Are Modular**:
- Clear separation between containers and presentation
- Components can be used in different contexts
- Easy to swap implementations
- Testable in isolation

---

## Data Flow Example

### Scenario: User selects "Year to Date" filter

```
1. USER ACTION
   └─> Clicks "Year to Date" in filter dropdown

2. CONTEXT UPDATE
   └─> DateFilterContext updates state
       startDate: "2025-01-01"
       endDate: "2025-09-30"

3. QUERY INVALIDATION
   └─> React Query re-fetches with new params

4. BACKEND FILTERING (Primary)
   └─> /api/financials/consolidated?startDate=2025-01-01&endDate=2025-09-30
   └─> buildFlexibleDateFilter() creates Prisma where clause
       {
         AND: [
           { date: { gte: "2025-01-01", lte: "2025-09-30" }},
           { OR: [
               { year: 2025, month: { gte: 1 }},
               { year: 2025, month: { lte: 9 }}
             ]}
         ]
       }
   └─> Returns ONLY Jan-Sep 2025 data (9 months × 6 clinics = 54 records)

5. FRONTEND FILTERING (Safety Net)
   └─> useFilteredPnL(pnlData, "2025-01-01", "2025-09-30")
   └─> Validates each record is in date range
   └─> Logs any records filtered out
   └─> Returns clean, validated data

6. COMPONENT RENDERING
   └─> Dashboard receives filtered data
   └─> ProfitLossTableComplete shows Jan-Sep 2025 columns
   └─> FinancialTrendChart displays Jan-Sep 2025 trends
   └─> KPICards show metrics for Jan-Sep 2025
```

---

## Key Design Principles

### 1. **Single Source of Truth**
- Date filter state: `DateFilterContext`
- Date filtering logic: `dateFilters.js` (backend), `dataValidation.js` (frontend)
- Data transformations: `dataTransformers.js`

### 2. **Defense in Depth**
- **Primary**: Backend filtering with Prisma
- **Secondary**: Year/month range validation
- **Tertiary**: Frontend client-side filtering
- **Result**: Impossible for wrong data to reach the UI

### 3. **Fail Fast with Logging**
- Every endpoint logs its filter parameters
- Client-side hooks log filtered-out records
- Data summaries logged to console
- Easy to debug filtering issues

### 4. **Composition Over Inheritance**
- Small, focused functions
- Hooks compose multiple utilities
- Components compose multiple hooks
- Build complex features from simple primitives

### 5. **Immutability**
- All transformations return new objects
- No mutation of input data
- Predictable data flow
- Easier to debug and test

---

## Testing Strategy

### Backend Tests
```javascript
// Test date filtering utility
describe('buildFlexibleDateFilter', () => {
  it('filters by date range correctly')
  it('filters by year/month correctly')
  it('handles cross-year ranges')
  it('handles invalid dates gracefully')
});
```

### Frontend Tests
```javascript
// Test custom hooks
describe('useFilteredData', () => {
  it('filters records within date range')
  it('excludes records outside date range')
  it('validates required fields')
  it('returns correct summary metadata')
});

// Test presentation components
describe('FinancialTrendChart', () => {
  it('renders with valid data')
  it('shows empty state with no data')
  it('shows loading state when loading')
  it('formats currency correctly')
});
```

---

## Performance Optimizations

1. **React Query Caching**: API responses cached by query key
2. **useMemo**: Data transformations memoized to prevent re-computation
3. **Component Optimization**: Presentation components are pure and memoizable
4. **Lazy Loading**: Components loaded on-demand
5. **Debounced Filters**: Date picker updates debounced to reduce API calls

---

## Adding New Features

### To add a new metric:
1. Add field to Prisma schema if needed
2. Update backend endpoint to include new field
3. Add transformation in `dataTransformers.js`
4. Update component props to accept new field
5. Add to UI where needed

### To add a new chart:
1. Create presentation component in `components/`
2. Accept `data` prop with clean structure
3. Use existing transformers from `dataTransformers.js`
4. Add to container component (Dashboard, Analytics, etc.)

### To add a new filter:
1. Update `DateFilterContext` with new filter type
2. Update `buildFlexibleDateFilter` if backend logic needed
3. Update `useFilteredData` if frontend validation needed
4. Components automatically use new filter (no changes needed!)

---

## Maintenance Checklist

- [ ] All API endpoints use `buildFlexibleDateFilter()`
- [ ] All container components use custom hooks for filtering
- [ ] All presentation components accept data via props only
- [ ] No hardcoded values in components
- [ ] All transformations are pure functions
- [ ] Logging is present at key integration points
- [ ] PropTypes or TypeScript types defined for all components
- [ ] Tests exist for utilities, hooks, and components

---

## Summary

This architecture ensures:
✅ **Modularity**: Each layer has clear responsibilities
✅ **Reusability**: Components, hooks, and utilities are reusable
✅ **Maintainability**: Easy to understand and modify
✅ **Testability**: Each piece can be tested independently
✅ **Reliability**: Multiple layers of validation ensure data integrity
✅ **Performance**: Optimized with memoization and caching
✅ **Debuggability**: Comprehensive logging at every layer

The system is **dynamic** because:
- Filters update → All components re-render with new data
- API changes → Only transformers need updating
- New metrics → Add to schema and transformers, components work automatically
- New visualizations → Create component, use existing data hooks

The system is **modular** because:
- Backend utilities are independent and reusable
- Frontend hooks encapsulate complex logic
- Presentation components are pure and composable
- Each layer can be modified without affecting others
