# Vercel Deployment Guide

## Overview

This application requires **two separate Vercel projects**:
1. **Backend** (Express API) - `backend/` folder
2. **Frontend** (React/Vite) - `frontend/` folder

---

## Step 1: Set Up Cloud Database

⚠️ **You MUST use a hosted PostgreSQL database. `localhost` will NOT work on Vercel.**

### Recommended: Neon (Free tier, fastest setup)

1. Go to [Neon.tech](https://neon.tech)
2. Sign up / Sign in
3. Click **Create Project**
4. Copy the **connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this - you'll need it for both local setup and deployment

### Alternative Options:
- **Vercel Postgres** (paid, but integrates nicely)
- **Supabase** (free tier)
- **Railway** (free tier)

---

## Step 2: Initialize Database Locally

Run this on your local machine to set up schema and import data:

```bash
cd backend

# Create .env file with cloud database URL
echo "DATABASE_URL=postgresql://your-neon-connection-string" > .env

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Import CSV data into cloud database
npm run import
```

✅ Your cloud database is now ready with all clinic data.

---

## Step 3: Deploy Backend to Vercel

### Create New Backend Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New... → Project**
3. Click **Import Git Repository**
4. Select your repo: `0xGonz/APP_Final`
5. **Configure the project:**

   - **Project Name:** `app23-backend` (or your choice)
   - **Root Directory:** `backend` ← **IMPORTANT**
   - **Framework Preset:** Other
   - **Build Command:** Leave default
   - **Output Directory:** Leave empty
   - **Install Command:** Leave default

6. **Add Environment Variables:**

   Click **Environment Variables** and add these:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://your-neon-connection-string` |
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `CORS_ORIGIN` | `https://app-v3-ten.vercel.app` |

   ⚠️ Replace `https://app-v3-ten.vercel.app` with your **actual frontend URL**.

7. Click **Deploy**

8. Wait for deployment (usually 1-2 minutes)

9. **Test the backend:**
   - Vercel will give you a URL like: `https://app23-backend.vercel.app`
   - Visit: `https://app23-backend.vercel.app/api/health`
   - You should see:
     ```json
     {
       "status": "ok",
       "database": "connected",
       "environment": "production"
     }
     ```

10. **Save your backend URL:** `https://app23-backend.vercel.app`

---

## Step 4: Update Frontend on Vercel

Your frontend is already deployed. Now connect it to the backend:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **frontend project** (`app-v3-ten`)
3. Go to **Settings → Environment Variables**
4. **Add or update:**

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://app23-backend.vercel.app/api` |

   ⚠️ Replace with your **actual backend URL** from Step 3.

5. Go to **Deployments** tab
6. Click the **...** (three dots) on the latest deployment
7. Click **Redeploy**
8. Wait for redeployment

9. **Test the frontend:**
   - Go to: `https://app-v3-ten.vercel.app`
   - Open browser console (F12)
   - You should see:
     ```
     [API] Base URL: https://app23-backend.vercel.app/api
     [API] Environment: production
     ```
   - Dashboard should load with data (no 404 errors!)

---

## Step 5: Verify Everything Works

### Test Checklist:

- [ ] Backend health check returns `"status": "ok"`
  - Visit: `https://your-backend.vercel.app/api/health`

- [ ] Frontend loads without errors
  - Visit: `https://app-v3-ten.vercel.app`
  - Check browser console (F12) for errors

- [ ] Dashboard displays clinic data
  - KPIs should show numbers
  - Charts should render

- [ ] API endpoints work
  - Open Network tab in browser DevTools
  - Refresh page
  - All `/api/*` requests should return 200 (not 404)

- [ ] No CORS errors
  - Check console for CORS messages
  - If you see CORS errors, verify `CORS_ORIGIN` matches frontend URL exactly

---

## Troubleshooting

### Issue: Backend returns 404 on all routes

**Symptoms:**
```
GET https://your-backend.vercel.app/api/health 404
```

**Fix:**
1. Check **Root Directory** is set to `backend` in Vercel project settings
2. Verify `backend/vercel.json` exists
3. Redeploy the backend

---

### Issue: Backend returns 500 (Internal Server Error)

**Symptoms:**
```json
{
  "status": "error",
  "database": "disconnected"
}
```

**Fix:**
1. Verify `DATABASE_URL` environment variable is correct
2. Test database connection locally:
   ```bash
   cd backend
   npx prisma db pull
   ```
3. Check Vercel logs for detailed error:
   - Go to backend project → Deployments → Latest → View Function Logs

---

### Issue: Frontend shows 404 on all API calls

**Symptoms:**
```
GET /api/clinics 404 (Not Found)
GET /api/financials/consolidated 404 (Not Found)
```

**Fix:**
1. Check browser console for `[API] Base URL:`
2. It should show your backend URL (e.g., `https://app23-backend.vercel.app/api`)
3. If it shows `/api` or `http://localhost:3001/api`, then `VITE_API_URL` is not set correctly
4. Update `VITE_API_URL` in Vercel frontend project settings
5. Redeploy frontend

---

### Issue: CORS errors

**Symptoms:**
```
Access to XMLHttpRequest at 'https://backend.vercel.app/api/clinics'
from origin 'https://app-v3-ten.vercel.app' has been blocked by CORS policy
```

**Fix:**
1. Go to backend Vercel project → Settings → Environment Variables
2. Update `CORS_ORIGIN` to **exactly** match your frontend URL:
   ```
   CORS_ORIGIN=https://app-v3-ten.vercel.app
   ```
3. **No trailing slash!**
4. Redeploy backend

---

### Issue: Data not showing / Empty dashboard

**Symptoms:**
- Dashboard loads but shows "No data"
- Charts are empty

**Fix:**
1. Verify backend health shows `"database": "connected"`
2. Check that you ran `npm run import` to seed the database
3. Test backend endpoints directly:
   ```
   https://your-backend.vercel.app/api/clinics
   ```
   Should return array of clinics, not empty `[]`
4. If empty, re-run `npm run import` locally

---

## Environment Variables Reference

### Backend Project (`backend` folder)

```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://app-v3-ten.vercel.app
```

### Frontend Project (`frontend` folder)

```bash
VITE_API_URL=https://app23-backend.vercel.app/api
```

---

## Production URLs Summary

After deployment:

| Component | URL | Description |
|-----------|-----|-------------|
| **Frontend** | `https://app-v3-ten.vercel.app` | Main dashboard UI |
| **Backend** | `https://app23-backend.vercel.app` | API server |
| **Health Check** | `https://app23-backend.vercel.app/api/health` | Backend status |
| **Database** | Neon/Supabase/etc | PostgreSQL database |

---

## Quick Deploy Commands

### If you need to redeploy manually:

**Backend:**
```bash
cd backend
git pull
vercel --prod
```

**Frontend:**
```bash
cd frontend
git pull
vercel --prod
```

---

## Need Help?

1. **Check Vercel logs:**
   - Project → Deployments → Latest → View Function Logs

2. **Check health endpoint:**
   - `https://your-backend.vercel.app/api/health`

3. **Check browser console:**
   - Open DevTools (F12) → Console tab
   - Look for `[API] Base URL:` message

4. **Common mistakes:**
   - Forgot to set `Root Directory: backend` for backend project
   - Used `localhost` in `DATABASE_URL`
   - Forgot to redeploy after changing environment variables
   - CORS_ORIGIN doesn't match frontend URL exactly
