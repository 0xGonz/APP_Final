# Local Development Guide

## Overview

This guide covers running the APP23 Financial Dashboard locally for development.

**Architecture:**
- `backend/src/server.js` - Express app (exports only, no `.listen()`)
- `backend/dev.js` - Local dev server (calls `.listen()`, starts WebSocket)
- `frontend/` - Vite React app

---

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL database (local or cloud)
- Git

---

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/0xGonz/APP_Final.git
cd APP_Final/app23-dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb app23_dashboard
```

**Option B: Cloud PostgreSQL (Recommended)**

Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or another cloud provider.

### 3. Configure Environment Variables

**Backend (`backend/.env`):**

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/app23_dashboard?schema=public"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Frontend (`frontend/.env`):**

```bash
# API URL
VITE_API_URL=http://localhost:3001/api
```

### 4. Initialize Database

```bash
cd backend

# Push Prisma schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Import CSV data
npm run import
```

✅ Database is now ready with clinic data.

---

## Running Locally

### Start Backend (Local Dev Server)

```bash
cd backend
npm run dev
```

This runs `nodemon dev.js`, which:
- Starts Express server on http://localhost:3001
- Initializes WebSocket server on ws://localhost:3001/ws
- Auto-restarts on file changes

You should see:

```
============================================================
🚀 APP23 Financial Dashboard API - LOCAL DEV
============================================================
Server running on: http://localhost:3001
WebSocket server: ws://localhost:3001/ws
Environment: development
API base: http://localhost:3001/api
============================================================
```

**Test it:**
- Visit: http://localhost:3001/api/health
- Should return: `{ "status": "ok", "database": "connected" }`

### Start Frontend

In a **separate terminal**:

```bash
cd frontend
npm run dev
```

This starts Vite dev server on http://localhost:3000

You should see:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Test it:**
- Visit: http://localhost:3000
- Dashboard should load with clinic data
- Check browser console for: `[API] Base URL: http://localhost:3001/api`

---

## Development Workflow

### Making Backend Changes

1. Edit files in `backend/src/`
2. Nodemon auto-restarts the server
3. Refresh browser to see changes

**Common files:**
- `backend/src/controllers/` - API endpoint logic
- `backend/src/utils/` - Helper functions
- `backend/prisma/schema.prisma` - Database schema

### Making Frontend Changes

1. Edit files in `frontend/src/`
2. Vite hot-reloads automatically
3. Changes appear instantly in browser

**Common files:**
- `frontend/src/pages/` - Page components
- `frontend/src/components/` - Reusable components
- `frontend/src/services/api.js` - API client

### Database Changes

When modifying `prisma/schema.prisma`:

```bash
cd backend

# Create migration (dev)
npx prisma migrate dev --name your_change_description

# Apply to database
npx prisma generate

# View data in Prisma Studio
npx prisma studio
```

---

## Important Notes

### Why `dev.js` Instead of `server.js`?

- **`server.js`**: Exports Express app only (for Vercel serverless)
- **`dev.js`**: Wraps `server.js`, calls `.listen()`, starts WebSocket

This allows the same codebase to work for:
- **Local dev**: Use `dev.js` (full HTTP server + WebSocket)
- **Vercel prod**: Use `server.js` (serverless function)

### Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend | 3001 | http://localhost:3001 |
| Frontend | 3000 | http://localhost:3000 |
| Prisma Studio | 5555 | http://localhost:5555 |

### CORS Configuration

The backend accepts requests from `http://localhost:3000` by default.

To allow additional origins:

```bash
# backend/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://other-domain.com
```

---

## Troubleshooting

### Backend won't start

**Error:** `Error: P1001: Can't reach database server`

**Fix:**
1. Check PostgreSQL is running: `brew services list`
2. Verify `DATABASE_URL` in `backend/.env`
3. Test connection: `npx prisma db pull`

---

### Frontend shows 404 on API calls

**Error:** `GET http://localhost:3000/api/clinics 404 (Not Found)`

**Fix:**
1. Check backend is running on port 3001
2. Verify `VITE_API_URL=http://localhost:3001/api` in `frontend/.env`
3. Restart frontend dev server

---

### "Prisma Client not generated"

**Error:** `@prisma/client did not initialize yet`

**Fix:**
```bash
cd backend
npx prisma generate
```

---

### Port already in use

**Error:** `EADDRINUSE: address already in use :::3001`

**Fix:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

---

### Data not showing in dashboard

**Symptoms:** Dashboard loads but shows "No data"

**Fix:**
1. Check backend health: http://localhost:3001/api/health
2. Verify database has data:
   ```bash
   npx prisma studio
   # Check FinancialRecord table
   ```
3. Re-import data:
   ```bash
   npm run import
   ```

---

## Testing

### Manual Testing

**Backend API:**
- Health check: http://localhost:3001/api/health
- Clinics list: http://localhost:3001/api/clinics
- Consolidated data: http://localhost:3001/api/financials/consolidated?startDate=2024-01-01&endDate=2024-12-31

**Frontend:**
- Dashboard: http://localhost:3000
- Clinic view: http://localhost:3000/clinic/1
- Period comparison: http://localhost:3000/period-comparison
- Data management: http://localhost:3000/data-management

### Using Browser DevTools

**Network Tab:**
- See all API requests/responses
- Check request URLs and status codes
- Verify response data

**Console Tab:**
- See API base URL log: `[API] Base URL: ...`
- Check for errors
- View React Query cache

**React DevTools:**
- Install React DevTools extension
- Inspect component state
- View React Query cache

---

## Useful Commands

```bash
# Backend
cd backend
npm run dev              # Start dev server with auto-reload
npm start                # Start production server (no WebSocket)
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Create and apply migration
npm run prisma:studio    # Open Prisma Studio GUI
npm run import           # Import CSV data

# Frontend
cd frontend
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build locally

# Database
npx prisma db push       # Push schema without creating migration
npx prisma db pull       # Pull schema from database
npx prisma migrate dev   # Create dev migration
npx prisma studio        # Open database GUI
```

---

## Environment Variables Reference

### Backend `.env`

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/app23_dashboard?schema=public

# Optional (with defaults)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend `.env`

```bash
# Required
VITE_API_URL=http://localhost:3001/api
```

---

## Next Steps

- Read `ARCHITECTURE.md` for system design overview
- Read `VERCEL_DEPLOYMENT.md` for production deployment
- Check `backend/src/controllers/` to understand API structure
- Explore `frontend/src/pages/` to see page components

---

## Getting Help

- Check backend logs in terminal
- Check browser console for frontend errors
- Use `/api/health` endpoint to verify backend status
- Review Prisma logs for database issues
