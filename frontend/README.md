# APP23 Financial Dashboard - Frontend

React-based dashboard for visualizing financial data across clinic locations.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

✅ **Dashboard Overview**
- KPI cards (Revenue, Profit, Margins)
- Clinic performance table
- Summary statistics

✅ **API Integration**
- React Query for data fetching & caching
- Axios for HTTP requests
- Auto-refresh capabilities

✅ **Professional UI**
- Tailwind CSS styling
- Responsive design
- Clean, modern interface

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **TanStack Query** - Data fetching
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── AppLayout.jsx
│   ├── MetricCard.jsx
│   ├── Loading.jsx
│   └── ErrorMessage.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── ClinicView.jsx
│   ├── Comparison.jsx
│   └── Analytics.jsx
├── services/
│   └── api.js
├── App.jsx
├── main.jsx
└── index.css
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment

The Vite proxy is configured to forward `/api` requests to `http://localhost:3001`.

Make sure the backend API is running on port 3001.

## Next Steps

Enhance the dashboard with:
- Interactive charts (Recharts)
- Line item drill-down modals
- Clinic comparison views
- Export functionality
- Date range filtering
- More detailed P&L views
