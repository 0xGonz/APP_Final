# 🚀 Quick Start Guide

Get your APP23 Financial Dashboard up and running in 5 minutes!

## Step 1: Start the Database (30 seconds)

Open a terminal and run:

```bash
cd /Users/gonz/APP23-25/app23-dashboard
docker-compose up -d
```

✅ This starts PostgreSQL in the background.

---

## Step 2: Install Dependencies (1-2 minutes)

```bash
cd backend
npm install
```

⏳ This downloads all required Node.js packages.

---

## Step 3: Setup Database (30 seconds)

```bash
npm run prisma:generate
npm run prisma:migrate
```

✅ This creates the database schema.

---

## Step 4: Import Your Financial Data (1 minute)

```bash
npm run import
```

📊 This imports all 6 CSV files into PostgreSQL.

You should see output like:
```
📊 Importing data for Pearland...
  ✓ Clinic record created/updated
  ✓ Imported 33 records

📊 Importing data for Baytown...
  ✓ Clinic record created/updated
  ✓ Imported 33 records
...

✅ Data import completed successfully!
```

---

## Step 5: Start the API Server (5 seconds)

```bash
npm run dev
```

🎉 **You're ready!**

The API is now running at: `http://localhost:3001`

---

## Test It!

Open a new terminal and try these commands:

### Get all clinics:
```bash
curl http://localhost:3001/api/clinics | json_pp
```

### Get 2024 financial summary:
```bash
curl "http://localhost:3001/api/financials/summary?year=2024" | json_pp
```

### Get KPIs:
```bash
curl "http://localhost:3001/api/metrics/kpis?year=2024" | json_pp
```

---

## What You Have Now

✅ **Backend API** - Fully functional REST API
✅ **PostgreSQL Database** - All your financial data imported
✅ **Metrics & Analytics** - KPIs, growth rates, margins
✅ **Export Capabilities** - Excel, PDF, CSV downloads
✅ **Drill-down Analysis** - Line item details and trends
✅ **Clinic Comparisons** - Side-by-side performance analysis

---

## Next: Build the Frontend

The backend is complete! Now you can:

1. **Test all API endpoints** using the examples in README.md
2. **Build the React frontend** to visualize the data
3. **Create interactive dashboards** with charts and graphs

---

## Need Help?

- Check the full [README.md](./README.md) for detailed documentation
- API endpoints are listed in the README
- Use pgAdmin at `http://localhost:5050` to view the database
  - Email: `admin@app23.com`
  - Password: `admin`

---

## Stop the Server

Press `Ctrl+C` in the terminal where the API is running.

To stop PostgreSQL:
```bash
docker-compose down
```

To restart everything:
```bash
docker-compose up -d
cd backend
npm run dev
```

---

**That's it! Happy analyzing! 📊**
