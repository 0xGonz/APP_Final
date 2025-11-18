# APP23 Financial Dashboard - Deployment Guide

This guide covers deploying the APP23 Financial Dashboard to Replit or other production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deploying to Replit](#deploying-to-replit)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)
- [Health Checks](#health-checks)

---

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- Replit account (for Replit deployment)

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Server
PORT=3001
NODE_ENV=production

# CORS - Multiple origins supported (comma-separated)
CORS_ORIGIN="https://your-frontend-url.repl.co,https://your-custom-domain.com"

# Optional: Session secret for authentication (if implemented)
# SESSION_SECRET="your-secret-key-here"
```

**Important Notes:**
- `DATABASE_URL`: Must be a valid PostgreSQL connection string
- `CORS_ORIGIN`: Add all frontend domains that will access your API (comma-separated)
- For local development, use `http://localhost:3000`
- For Replit deployment, use your Replit frontend URL

### Frontend Environment Variables

The frontend uses different `.env` files for different environments:

**Development (`.env`):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Production (`.env.production`):**
```env
# Option 1: Same-domain deployment (backend serves frontend)
VITE_API_URL=/api

# Option 2: Separate backend deployment
VITE_API_URL=https://your-backend-url.repl.co/api
```

---

## Deploying to Replit

### Step 1: Import Repository

1. Go to [Replit](https://replit.com)
2. Click "Create Repl" → "Import from GitHub"
3. Enter your repository URL
4. Replit will automatically detect the configuration from `.replit` and `replit.nix`

### Step 2: Configure Environment Variables

**Backend Secrets:**
1. Open your Repl
2. Click on "Secrets" (lock icon) in the left sidebar
3. Add the following secrets:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `PORT`: `3001`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your Replit frontend URL (e.g., `https://your-repl-name.your-username.repl.co`)

**Frontend Environment:**
1. The frontend will automatically use `.env.production` when building for production
2. No additional configuration needed if using same-domain deployment (`VITE_API_URL=/api`)

### Step 3: Database Setup

**Option A: Use Replit Database (PostgreSQL)**
1. Enable PostgreSQL in your Repl
2. Copy the connection string from Replit's database tab
3. Add it to your secrets as `DATABASE_URL`

**Option B: Use External Database (Recommended for Production)**
1. Create a PostgreSQL database on a service like:
   - [Neon](https://neon.tech) (Free tier available)
   - [Supabase](https://supabase.com) (Free tier available)
   - [Railway](https://railway.app)
   - [ElephantSQL](https://www.elephantsql.com)
2. Copy the connection string
3. Add it to your Replit secrets as `DATABASE_URL`

**Run Migrations:**
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Step 4: Run the Application

1. Click the "Run" button in Replit
2. The `.replit` configuration will:
   - Install dependencies for both frontend and backend
   - Start the backend on port 3001
   - Start the frontend on port 3000
3. Replit will provide you with a public URL

### Step 5: Verify Deployment

**Health Check Endpoint:**
Visit: `https://your-backend-url.repl.co/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "environment": "production",
  "database": "connected",
  "corsOrigins": ["https://..."],
  "version": "1.0.0"
}
```

**Test Frontend:**
1. Visit your frontend URL
2. Verify the Analytics page loads data correctly
3. Test date filtering (Year to Date, Custom Range, etc.)
4. Check that data displays without timezone discrepancies

---

## Database Setup

### Initial Schema Setup

If deploying for the first time, you need to set up the database schema:

```bash
# Navigate to backend directory
cd backend

# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# (Optional) Seed with sample data
npm run seed
```

### Migration Management

For ongoing schema changes:

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Deploy migrations to production
npx prisma migrate deploy
```

### Viewing Data

Use Prisma Studio to view and manage data:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555`

---

## Troubleshooting

### Common Issues and Solutions

#### 1. CORS Errors

**Problem:** Frontend can't access backend API
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
- Add your frontend URL to `CORS_ORIGIN` in backend `.env`
- Multiple origins: `CORS_ORIGIN="https://url1.com,https://url2.com"`
- Check backend logs for CORS warnings
- Verify health check shows correct `corsOrigins`

#### 2. Database Connection Failed

**Problem:** Backend can't connect to database
```
Error: P1001: Can't reach database server
```

**Solutions:**
- Verify `DATABASE_URL` is correctly set in Replit secrets
- Check database service is running
- Verify IP whitelist settings (some services require whitelisting Replit's IPs)
- Test connection string format: `postgresql://user:pass@host:port/dbname?schema=public`

#### 3. API Returns 404

**Problem:** API endpoints return 404 Not Found

**Solutions:**
- Verify `VITE_API_URL` is correctly set in frontend `.env.production`
- Check that backend is running on the expected port
- Visit `/api/health` endpoint directly to verify backend is accessible
- Check browser console for actual URL being called

#### 4. Date Discrepancies (December Data in Jan-Sep Filter)

**Problem:** Wrong months showing in filtered data

**Solutions:**
- This should be fixed in the latest version
- Verify you're using the updated `dateFilters.js` utility
- Check backend logs for date filter output
- Ensure database records have correct `year`, `month`, and `date` fields

#### 5. Environment Variables Not Loading

**Problem:** App uses wrong API URL or default values

**Solutions:**
- Frontend: Ensure `.env.production` exists and has `VITE_API_URL`
- Backend: Verify secrets are set in Replit (not just in `.env` file)
- Restart the Repl after changing environment variables
- Check build logs for environment variable values (only in dev mode)

---

## Health Checks

### Backend Health Check

Endpoint: `GET /api/health`

**Response (Healthy):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "corsOrigins": ["https://frontend.repl.co"],
  "version": "1.0.0"
}
```

**Response (Unhealthy):**
```json
{
  "status": "error",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "environment": "production",
  "database": "disconnected",
  "error": "Connection timeout"
}
```

### Monitoring Checklist

Before going live, verify:

- [ ] Backend health endpoint returns `"status": "ok"`
- [ ] Database connection shows `"database": "connected"`
- [ ] CORS origins include your frontend URL
- [ ] Frontend successfully loads clinic data
- [ ] Analytics page displays charts and trends
- [ ] Date filtering works correctly across all pages
- [ ] KPIs calculate correctly
- [ ] Export functionality works
- [ ] No console errors in browser

---

## Performance Optimization

### Backend Optimization

1. **Database Indexing:**
   - Ensure indexes on frequently queried fields (`clinicId`, `year`, `month`, `date`)
   - Check query performance with `EXPLAIN ANALYZE` in PostgreSQL

2. **Connection Pooling:**
   - Prisma automatically handles connection pooling
   - Verify connection limit in `DATABASE_URL` parameter: `connection_limit=10`

3. **Caching:**
   - Consider implementing Redis for frequently accessed data
   - Cache aggregated metrics and KPIs

### Frontend Optimization

1. **Build Optimization:**
   - Run `npm run build` to create optimized production build
   - Enable gzip compression on server

2. **Code Splitting:**
   - Vite automatically code-splits by route
   - Verify chunk sizes in build output

3. **API Request Optimization:**
   - React Query automatically caches API responses
   - Adjust `staleTime` and `cacheTime` if needed

---

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use Replit Secrets for sensitive data
   - Rotate database passwords regularly

2. **CORS Configuration:**
   - Only whitelist specific frontend domains
   - Never use `*` (wildcard) in production

3. **Database Security:**
   - Use read-only users for analytics queries
   - Enable SSL for database connections
   - Regularly backup data

4. **API Security:**
   - Implement rate limiting (consider `express-rate-limit`)
   - Add authentication/authorization if handling sensitive data
   - Validate all input parameters

---

## Scaling Considerations

### When to Scale

Consider scaling when:
- Response times exceed 500ms consistently
- Database queries take >100ms
- Server CPU/memory usage >80%
- Concurrent users exceed 100

### Scaling Options

1. **Vertical Scaling:**
   - Upgrade Replit plan for more resources
   - Upgrade database tier

2. **Horizontal Scaling:**
   - Use load balancer (e.g., Cloudflare)
   - Deploy multiple backend instances
   - Use managed database with read replicas

3. **Caching Layer:**
   - Add Redis for session storage and caching
   - Implement CDN for static assets

---

## Support and Resources

### Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vite Deployment](https://vitejs.dev/guide/build.html)

### Project Documentation
- `ARCHITECTURE.md` - System architecture overview
- `MODULARITY_SUMMARY.md` - Modular design patterns
- `README.md` - Project overview and local setup

### Getting Help
- Check GitHub Issues for known problems
- Review backend logs for error messages
- Use health check endpoint to diagnose issues
- Contact support at [your support email]

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check health endpoint status
- Monitor database growth

**Monthly:**
- Review and optimize slow queries
- Update dependencies (`npm audit`)
- Backup database

**Quarterly:**
- Security audit
- Performance review
- User feedback analysis

---

## Version History

- **v1.0.0** (2025-11-17): Initial deployment guide
  - Replit configuration
  - Environment setup
  - Troubleshooting guide
  - Health checks and monitoring
