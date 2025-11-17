# APP23 Financial Dashboard

A modern, professional accounting dashboard for American Pain Partners LLC to analyze financial performance across multiple clinic locations.

## 🎯 Features

### Core Functionality
- ✅ **Consolidated Dashboard** - View all clinic data in one place
- ✅ **Individual Clinic Views** - Detailed P&L analysis per location
- ✅ **Line Item Drill-Down** - Click any P&L line item for detailed analysis
- ✅ **Clinic Comparisons** - Side-by-side performance analysis
- ✅ **Trend Analysis** - MoM and YoY growth metrics
- ✅ **KPI Metrics** - Automated calculation of key performance indicators
- ✅ **Export Capabilities** - Download reports in Excel, PDF, or CSV format
- ✅ **Date Range Filtering** - Custom date selection for analysis
- ✅ **Real-time Updates** - Auto-refresh when CSV files change (coming soon)

### Technical Stack
- **Backend:** Node.js + Express.js + PostgreSQL + Prisma ORM
- **Frontend:** React.js + Recharts + Tailwind CSS (coming soon)
- **Database:** PostgreSQL 15
- **Deployment:** Docker Compose for local deployment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

#### 1. Clone or navigate to the project
```bash
cd /Users/gonz/APP23-25/app23-dashboard
```

#### 2. Start PostgreSQL Database
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- pgAdmin (database UI) on `http://localhost:5050`
  - Email: `admin@app23.com`
  - Password: `admin`

#### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 4. Set up Database Schema
```bash
npm run prisma:generate
npm run prisma:migrate
```

#### 5. Import Financial Data
```bash
npm run import
```

This will:
- Parse all 6 CSV files from the `data/` directory
- Import financial records into PostgreSQL
- Display import summary

#### 6. Start the API Server
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

---

## 📊 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Health Check
```
GET /api/health
```

#### Clinics
```
GET /api/clinics                  # List all clinics with summary stats
GET /api/clinics/:id              # Get single clinic details
GET /api/clinics/:id/pnl          # Get P&L for a clinic
  ?startDate=2023-01-01
  &endDate=2025-09-30
  &year=2024
  &month=6
```

#### Financial Data
```
GET /api/financials/consolidated  # Consolidated data across all clinics
  ?year=2024
  ?startDate=2023-01-01&endDate=2023-12-31

GET /api/financials/compare       # Compare multiple clinics
  ?clinicIds=uuid1,uuid2,uuid3
  &year=2024

GET /api/financials/trends        # Time-series trend data
  ?clinicId=uuid
  &category=totalIncome
  &startDate=2023-01-01&endDate=2025-09-30

GET /api/financials/line-item/:category  # Drill-down into specific line item
  ?clinicId=uuid
  &startDate=2023-01-01&endDate=2025-09-30

GET /api/financials/summary       # Summary statistics
  ?clinicId=uuid
  &year=2024
```

#### Metrics & KPIs
```
GET /api/metrics/kpis             # Key performance indicators
  ?clinicId=uuid
  &year=2024
  &month=6

GET /api/metrics/growth           # Growth rates (MoM, YoY)
  ?clinicId=uuid
  &metric=totalIncome

GET /api/metrics/margins          # Profit margins by clinic
  ?year=2024
  &month=6

GET /api/metrics/efficiency       # Operational efficiency metrics
  ?clinicId=uuid
```

#### Export
```
POST /api/export/excel            # Export to Excel
  Body: { clinicId?, year?, startDate?, endDate? }

POST /api/export/pdf              # Export to PDF
  Body: { clinicId?, year? }

GET /api/export/csv               # Export to CSV
  ?clinicId=uuid
  &year=2024
```

---

## 🗂️ Project Structure

```
app23-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/       # API route handlers
│   │   │   ├── clinics.js     # Clinic endpoints
│   │   │   ├── financials.js  # Financial data endpoints
│   │   │   ├── metrics.js     # KPI and metrics endpoints
│   │   │   └── export.js      # Export functionality
│   │   ├── models/            # Database models (Prisma)
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utilities
│   │   │   ├── csvParser.js   # CSV parsing logic
│   │   │   └── importData.js  # Data import pipeline
│   │   └── server.js          # Express server
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── package.json
│   └── .env                   # Environment variables
├── frontend/                  # React dashboard (coming soon)
├── data/                      # CSV files
│   ├── APP Financials 23-25(Pearland).csv
│   ├── APP Financials 23-25(Baytown).csv
│   ├── APP Financials 23-25(Beaumont).csv
│   ├── APP Financials 23-25(Webster).csv
│   ├── APP Financials 23-25(West_Houston).csv
│   └── APP Financials 23-25(Katy).csv
├── docker-compose.yml         # Docker setup
└── README.md
```

---

## 💾 Database Schema

### Tables

**clinics**
- Stores clinic metadata (id, name, location, active status)

**financial_records**
- Monthly P&L data per clinic
- Includes all income, COGS, and expense categories
- Indexed by clinic, date, year/month

**metrics_cache**
- Pre-calculated KPIs for performance
- Optional optimization table

---

## 🔄 Data Import

### Updating Data

When CSV files are updated:

1. Place new CSV files in the `data/` directory
2. Run the import command:
```bash
cd backend
npm run import
```

The import process:
- Parses all CSV files
- Validates data
- Upserts records (updates existing, creates new)
- Displays import summary

### CSV File Format

Expected format:
- Row 1: Clinic name header
- Row 2: "Profit & Loss"
- Row 3: Date range
- Row 4: Month column headers (e.g., "Jan 23", "Feb 23", etc.)
- Row 5+: Financial data rows with category labels in column 0

---

## 🧪 Testing the API

### Using cURL

#### Get all clinics:
```bash
curl http://localhost:3001/api/clinics
```

#### Get consolidated data for 2024:
```bash
curl "http://localhost:3001/api/financials/consolidated?year=2024"
```

#### Get KPIs for a specific clinic:
```bash
curl "http://localhost:3001/api/metrics/kpis?clinicId=<clinic-id>&year=2024"
```

#### Export to Excel:
```bash
curl -X POST http://localhost:3001/api/export/excel \
  -H "Content-Type: application/json" \
  -d '{"year": 2024}' \
  --output report.xlsx
```

### Using Postman or Insomnia

Import the base URL: `http://localhost:3001/api`

---

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Start dev server with auto-reload
npm start            # Start production server
npm run import       # Import CSV data
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run prisma:studio     # Open Prisma Studio (database UI)
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app23_dashboard?schema=public"
PORT=3001
NODE_ENV=development
DATA_DIR=../data
CORS_ORIGIN=http://localhost:3000
```

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart database
docker-compose restart postgres

# Remove all data (WARNING: deletes database)
docker-compose down -v
```

---

## 📈 Key Metrics Calculated

### Revenue Metrics
- Total Revenue
- Average Monthly Revenue
- Revenue Growth (MoM, YoY)

### Profitability Metrics
- Gross Profit & Gross Margin %
- Net Income & Net Margin %
- EBITDA (proxy)

### Cost Metrics
- COGS as % of Revenue
- Operating Expenses as % of Revenue
- Payroll as % of Revenue

### Efficiency Metrics
- Revenue per Employee (estimate)
- Revenue per Payroll Dollar
- Marketing Efficiency
- Break-even Revenue

---

## 📊 Sample Queries

### Get total revenue for all clinics in 2024:
```bash
curl "http://localhost:3001/api/financials/summary?year=2024"
```

### Compare Pearland and Beaumont:
```bash
curl "http://localhost:3001/api/financials/compare?clinicIds=<pearland-id>,<beaumont-id>&year=2024"
```

### Get payroll expense trends:
```bash
curl "http://localhost:3001/api/financials/trends?category=payrollExpense"
```

### Get YoY growth for total income:
```bash
curl "http://localhost:3001/api/metrics/growth?metric=totalIncome"
```

---

## 🚧 Roadmap

### Phase 1: Backend API ✅
- [x] Database schema
- [x] CSV parser
- [x] Data import pipeline
- [x] REST API endpoints
- [x] Metrics calculation
- [x] Export functionality

### Phase 2: Frontend Dashboard (Next)
- [ ] React application setup
- [ ] Consolidated dashboard view
- [ ] Individual clinic pages
- [ ] Interactive charts (Recharts)
- [ ] Line item drill-down modals
- [ ] Clinic comparison view
- [ ] Date range filtering
- [ ] Export UI

### Phase 3: Advanced Features
- [ ] Real-time file monitoring
- [ ] WebSocket updates
- [ ] User authentication
- [ ] Custom report builder
- [ ] Budget vs Actual analysis
- [ ] Forecasting

---

## ❓ Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Import Fails
```bash
# Check CSV files are in correct location
ls ../data/*.csv

# Run import with verbose logging
npm run import
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3002

# Or stop conflicting service
lsof -ti:3001 | xargs kill
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check application logs

---

## 📝 License

Private - American Pain Partners LLC

---

**Built with ❤️ using Node.js, Express, PostgreSQL, and Prisma**
