# Deployment Guide for APP23-25 Financial Dashboard

## ⚠️ Important: Architecture Considerations

This is a **full-stack application** with:
- **Frontend:** React + Vite (static site)
- **Backend:** Express.js + PostgreSQL (requires persistent server)
- **Database:** PostgreSQL (requires persistent storage)

## Recommended Deployment Strategy

### **Option 1: Split Deployment (Recommended)**

#### **Frontend → Vercel**
#### **Backend + Database → Railway or Render**

This approach is best because:
- Vercel is optimized for static sites and serverless functions
- Railway/Render are better for Express.js + PostgreSQL apps
- Easier to manage environment variables
- Better performance

---

## Option 1: Vercel (Frontend) + Railway (Backend + DB)

### Step 1: Deploy Backend to Railway

1. **Go to Railway**: https://railway.app
2. **Click "New Project"** → "Deploy from GitHub repo"
3. **Select your repository**: `0xGonz/APP_Final`
4. **Add PostgreSQL database**:
   - Click "+ New" → "Database" → "PostgreSQL"
5. **Configure backend service**:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
6. **Set environment variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=3001
   NODE_ENV=production
   ```
7. **Run Prisma migration**:
   - In Railway dashboard → Backend service → Settings
   - Add custom start command: `npx prisma migrate deploy && npm start`

8. **Note the deployed URL** (e.g., `https://app-final-backend.up.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Import your repository**: `0xGonz/APP_Final`
3. **Configure project**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Set environment variable**:
   ```
   VITE_API_URL=https://your-railway-backend-url.up.railway.app/api
   ```
5. **Deploy**

---

## Option 2: Full Vercel Deployment (More Complex)

This requires converting the Express backend to Vercel serverless functions.

### Files Needed:

1. **Update `vercel.json`** (already created):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "frontend/dist" }
    },
    {
      "src": "backend/src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/src/server.js" },
    { "src": "/(.*)", "dest": "frontend/dist/$1" }
  ]
}
```

2. **Add Vercel Postgres**:
   - In Vercel dashboard → Storage → Create Database → Postgres
   - Connect to your project
   - Copy `POSTGRES_PRISMA_URL` to environment variables

3. **Update frontend package.json**:
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build"
  }
}
```

4. **Environment Variables in Vercel**:
```
DATABASE_URL=your_vercel_postgres_url
NODE_ENV=production
```

5. **Deploy**:
```bash
vercel --prod
```

---

## Option 3: Render (Full-Stack on One Platform)

1. **Go to Render**: https://render.com
2. **Create PostgreSQL database**
3. **Create Web Service for Backend**:
   - Build command: `cd backend && npm install && npx prisma migrate deploy`
   - Start command: `cd backend && npm start`
4. **Create Static Site for Frontend**:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
5. **Set environment variables**

---

## Quick Fix for Vercel Issues

If you're seeing errors, check:

1. **Build logs** in Vercel dashboard
2. **Environment variables** are set correctly
3. **Database connection** is configured
4. **API URL** in frontend points to backend

### Common Errors:

**"Module not found"**
- Check `vercel.json` paths
- Ensure `package.json` is in correct directory

**"Database connection failed"**
- Add `DATABASE_URL` environment variable
- Use Vercel Postgres or external DB

**"404 on API routes"**
- Check `vercel.json` routes configuration
- Ensure backend is deployed

---

## Easiest Path: Use Railway for Everything

**Railway is the simplest for full-stack apps:**

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Add PostgreSQL database
4. Railway auto-detects and deploys both frontend and backend
5. Set environment variables
6. Done!

---

## What do you want to do?

Please tell me:
1. **What error did you see on Vercel?**
2. **Do you want to use Railway instead?** (Recommended - easier)
3. **Or stick with Vercel?** (Need to configure properly)

I can help you deploy with whichever option you choose!
