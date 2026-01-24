# Railway Deployment Checklist

**Complete step-by-step guide to deploy Consequence AI to Railway.app**

**Estimated Time**: 30 minutes
**Cost**: $0 (free tier includes $5 monthly credit)

---

## Prerequisites

- ✅ GitHub account with this repository
- ✅ Email address for Railway signup
- ✅ Browser (Chrome, Firefox, Safari, Edge)

**No credit card required for free tier!**

---

## Step 1: Create Railway Account (5 minutes)

### 1.1 Sign Up

1. Go to **https://railway.app**
2. Click **"Login"** in top right
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub account
5. You'll be redirected to Railway dashboard

**Result**: You should see the Railway dashboard with "New Project" button.

---

## Step 2: Create New Project (2 minutes)

### 2.1 Deploy from GitHub Repository

1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. If prompted, click **"Configure GitHub App"**
4. Select your GitHub username/organization
5. Choose **"Only select repositories"**
6. Select **`consequence-ai`** repository (this repo)
7. Click **"Install & Authorize"**
8. Back on Railway, click **"Deploy Now"**

**Result**: Railway will start deploying your application. You'll see a deployment in progress.

### 2.2 Wait for Initial Deployment

- Railway will detect the `railway.toml` config
- It will install Python dependencies from `requirements.txt`
- This takes **3-5 minutes**
- You'll see logs streaming in the deployment window

**Expected**: Deployment will **fail** initially (this is normal - we need to add database first!)

---

## Step 3: Add PostgreSQL Database (3 minutes)

### 3.1 Add Database to Project

1. In your Railway project, click **"+ New"** button (top right)
2. Select **"Database"**
3. Click **"Add PostgreSQL"**

**Result**: Railway instantly creates a PostgreSQL database instance.

### 3.2 Verify Database Created

You should now see **2 services** in your project:
- `consequence-ai` (your app)
- `PostgreSQL` (database)

### 3.3 Copy Database URL

1. Click on the **PostgreSQL** service
2. Go to **"Variables"** tab
3. You'll see a variable called **`DATABASE_URL`**
4. Click the **copy icon** next to `DATABASE_URL`

**Important**: Keep this copied! You'll need it for GitHub Actions secrets.

**Format will look like**:
```
postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:5432/railway
```

---

## Step 4: Link Database to Application (2 minutes)

### 4.1 Automatic Variable Reference

Railway automatically makes `DATABASE_URL` available to your app!

1. Click on your **`consequence-ai`** service
2. Go to **"Variables"** tab
3. You should see **`DATABASE_URL`** is already there (referenced from PostgreSQL service)

**Verification**:
- Variable name: `DATABASE_URL`
- Value: `${{PostgreSQL.DATABASE_URL}}` (reference to database service)

**No action needed** - Railway handles this automatically! ✅

---

## Step 5: Add Additional Environment Variables (5 minutes)

### 5.1 Required Variables

Click **"+ New Variable"** and add these one by one:

#### Variable 1: CORS_ORIGINS
```
Variable: CORS_ORIGINS
Value: https://your-frontend-domain.com,http://localhost:3000
```
*Note: Replace `your-frontend-domain.com` with your actual frontend URL. For now, just use `http://localhost:3000` if testing locally.*

#### Variable 2: SQL_ECHO
```
Variable: SQL_ECHO
Value: false
```
*Set to `true` for debugging, but `false` for production.*

#### Variable 3: DB_POOL_SIZE
```
Variable: DB_POOL_SIZE
Value: 5
```

#### Variable 4: DB_MAX_OVERFLOW
```
Variable: DB_MAX_OVERFLOW
Value: 10
```

### 5.2 Optional Variables (can skip for now)

#### For Development/Debugging:
```
Variable: DEBUG
Value: false

Variable: LOG_LEVEL
Value: INFO
```

### 5.3 Save Variables

After adding each variable:
- Railway **auto-saves** - no save button needed
- Your app will **auto-redeploy** when you add variables

**Result**: You should see 5-6 environment variables in the Variables tab.

---

## Step 6: Generate Public URL (2 minutes)

### 6.1 Enable Public Networking

1. Stay in your **`consequence-ai`** service
2. Go to **"Settings"** tab
3. Scroll down to **"Networking"** section
4. Click **"Generate Domain"**

**Result**: Railway generates a URL like:
```
https://consequence-ai-production-a1b2.up.railway.app
```

### 6.2 Copy Your URL

- Click the **copy icon** next to the generated domain
- Save this URL - you'll need it!

**This is your public API URL!**

---

## Step 7: Wait for Successful Deployment (3 minutes)

### 7.1 Monitor Deployment

1. Go to **"Deployments"** tab
2. Click on the latest deployment (should be "Building" or "Deploying")
3. Watch the logs

**Expected logs**:
```
Installing dependencies...
✅ Successfully installed requirements
Starting server...
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 7.2 Check Deployment Status

- Wait until status shows **"Success"** (green checkmark)
- If it shows **"Failed"** (red X), click to see logs

**Common issues**:
- Missing `DATABASE_URL` → Go back to Step 4
- Import errors → Check `requirements.txt` has all dependencies

---

## Step 8: Run Database Migration (5 minutes)

### 8.1 Install Railway CLI (one-time setup)

**macOS/Linux**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Or using Homebrew
brew install railway
```

**Windows**:
```bash
# Install via npm
npm install -g @railway/cli
```

### 8.2 Login to Railway

```bash
railway login
```
- This opens a browser window
- Click **"Authorize"**
- CLI is now authenticated

### 8.3 Link to Your Project

```bash
# Navigate to your project directory
cd /path/to/consequence-ai

# Link to Railway project
railway link
```
- Select your project from the list
- Select **`consequence-ai`** service (not PostgreSQL)

### 8.4 Run Migration

```bash
# Test migration (dry run)
railway run python scripts/migrate_to_db.py --dry-run

# Run actual migration
railway run python scripts/migrate_to_db.py
```

**Expected output**:
```
============================================================
Consequence AI - Database Migration
============================================================

1. Connecting to database...
   ✅ Connected

2. Creating database schema...
   ✅ Database tables created

3. Loading verified relationships...
   ✅ Loaded 34 relationships
   Version: 2.1
   Last updated: 2026-01-24

Migrating 34 verified relationships...
   ✅ Migration complete:
   Entities created: 28
   Links created: 34
   Links updated: 0
   Total relationships: 34

📊 Database validation:
   Entities in database: 28
   Links in database: 34

🔍 Sample relationships:
   TSM → AAPL: 25.0% (0.85 confidence)
   TSM → NVDA: 11.0% (0.85 confidence)
   ...

============================================================
Migration complete!
============================================================
```

---

## Step 9: Verify Deployment (3 minutes)

### 9.1 Test Health Endpoint

```bash
# Replace with your Railway URL
curl https://your-app.up.railway.app/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T12:00:00Z"
}
```

### 9.2 Test Graph Stats Endpoint

```bash
curl https://your-app.up.railway.app/graph/stats
```

**Expected response**:
```json
{
  "total_entities": 28,
  "total_links": 34,
  "high_confidence_links": 19,
  "data_version": "2.1",
  "last_updated": "2026-01-24"
}
```

### 9.3 Test in Browser

Open your Railway URL in a browser:
```
https://your-app.up.railway.app/docs
```

You should see the **FastAPI documentation** (Swagger UI).

**Try the health check**:
1. Click **GET /health**
2. Click **"Try it out"**
3. Click **"Execute"**
4. Should return `200 OK`

---

## Step 10: Set Up GitHub Actions (5 minutes)

### 10.1 Copy DATABASE_URL

You already have the `DATABASE_URL` from Step 3.3.

If you lost it:
1. Go to Railway → PostgreSQL service → Variables tab
2. Copy the `DATABASE_URL` value

### 10.2 Add GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**

**Add DATABASE_URL**:
- Name: `DATABASE_URL`
- Secret: `[paste the full PostgreSQL URL from Railway]`
- Click **"Add secret"**

**Add RAILWAY_URL** (optional, for health checks):
- Name: `RAILWAY_URL`
- Secret: `https://your-app.up.railway.app` (your Railway domain)
- Click **"Add secret"**

### 10.3 Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. You should see 5 workflows listed

### 10.4 Test a Workflow Manually

1. Click on **"Daily Data Update"** workflow
2. Click **"Run workflow"** button
3. Select `main` branch
4. Click **"Run workflow"**
5. Wait 2-3 minutes
6. Check that it completes successfully ✅

---

## Step 11: Monitor & Verify (2 minutes)

### 11.1 Check Railway Logs

1. Go to Railway → your service → **"Deployments"** tab
2. Click on active deployment
3. View real-time logs

**What to look for**:
- `INFO: Application startup complete.` ✅
- No error messages
- Requests being handled

### 11.2 Check Database

```bash
# Connect to your database
railway run psql $DATABASE_URL

# Run queries
SELECT COUNT(*) FROM entities;     -- Should return 28
SELECT COUNT(*) FROM causal_links; -- Should return 34

# Exit
\q
```

### 11.3 Monitor GitHub Actions

1. Go to **Actions** tab
2. Verify daily workflows will run automatically
3. Check that manual test workflow passed

---

## Environment Variables - Complete Reference

Here's what each environment variable does:

### Railway Application Variables

| Variable | Required | Value | Purpose |
|----------|----------|-------|---------|
| `DATABASE_URL` | ✅ Yes | `${{PostgreSQL.DATABASE_URL}}` | PostgreSQL connection (auto-set by Railway) |
| `CORS_ORIGINS` | ✅ Yes | `https://frontend.com,http://localhost:3000` | Allowed frontend domains for API calls |
| `SQL_ECHO` | ⬜ Optional | `false` | Log all SQL queries (set `true` for debugging) |
| `DB_POOL_SIZE` | ⬜ Optional | `5` | Database connection pool size |
| `DB_MAX_OVERFLOW` | ⬜ Optional | `10` | Max connections above pool size |
| `DEBUG` | ⬜ Optional | `false` | Enable debug mode (verbose logging) |
| `LOG_LEVEL` | ⬜ Optional | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

### GitHub Actions Secrets

| Secret | Required | Value | Purpose |
|--------|----------|-------|---------|
| `DATABASE_URL` | ✅ Yes | Full PostgreSQL URL from Railway | For cron jobs to access database |
| `RAILWAY_URL` | ⬜ Optional | `https://your-app.up.railway.app` | For health check verification |

### Railway Auto-Provided Variables

Railway automatically sets these (don't add manually):
- `PORT` - Application port (Railway assigns dynamically)
- `RAILWAY_ENVIRONMENT` - Environment name (production, staging, etc.)
- `RAILWAY_SERVICE_NAME` - Service name
- `RAILWAY_PROJECT_ID` - Project ID

---

## Troubleshooting Guide

### Issue: Deployment Failed - "ModuleNotFoundError"

**Cause**: Missing dependency in `requirements.txt`

**Fix**:
```bash
# Add missing package to requirements.txt
echo "missing-package==1.0.0" >> requirements.txt

# Commit and push
git add requirements.txt
git commit -m "Add missing dependency"
git push

# Railway auto-redeploys
```

---

### Issue: Health Check Returns 503

**Cause**: Application not started or crashed

**Fix**:
1. Check Railway logs (Deployments → Latest → View logs)
2. Look for error messages
3. Common issues:
   - Database connection failed (check `DATABASE_URL`)
   - Import error (check `requirements.txt`)
   - Port binding issue (Railway sets `$PORT` automatically)

---

### Issue: Database Connection Timeout

**Cause**: Incorrect `DATABASE_URL` or database service down

**Fix**:
```bash
# Test connection locally
railway run psql $DATABASE_URL

# If it fails, verify:
# 1. PostgreSQL service is running in Railway
# 2. DATABASE_URL variable is set correctly
```

---

### Issue: Migration Failed - "Table already exists"

**Cause**: Migration was run multiple times

**Fix**:
```bash
# Reset database (⚠️ deletes all data)
railway run python -c "from src.db.connection import init_db, reset_database; init_db(); reset_database()"

# Re-run migration
railway run python scripts/migrate_to_db.py
```

---

### Issue: GitHub Actions Failing

**Cause**: `DATABASE_URL` secret not set or incorrect

**Fix**:
1. Go to GitHub → Settings → Secrets → Actions
2. Verify `DATABASE_URL` is set
3. Copy fresh value from Railway → PostgreSQL → Variables
4. Update secret with new value
5. Re-run failed workflow

---

## Deployment Checklist

Use this to verify everything is working:

### Railway Setup
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] PostgreSQL database added
- [ ] `DATABASE_URL` auto-linked to app
- [ ] Additional environment variables set (CORS_ORIGINS, etc.)
- [ ] Public domain generated
- [ ] Deployment shows "Success" status

### Database Migration
- [ ] Railway CLI installed
- [ ] Linked to Railway project
- [ ] Migration ran successfully
- [ ] 28 entities in database (verified)
- [ ] 34 causal links in database (verified)

### API Verification
- [ ] Health check returns 200 OK
- [ ] Graph stats endpoint works
- [ ] FastAPI docs accessible at `/docs`
- [ ] No errors in Railway logs

### GitHub Actions
- [ ] `DATABASE_URL` secret added
- [ ] `RAILWAY_URL` secret added (optional)
- [ ] Workflows enabled
- [ ] Manual test workflow passed
- [ ] Scheduled workflows will run automatically

---

## Cost Breakdown

### Railway Free Tier Includes:
- ✅ $5 monthly credit (automatically applied)
- ✅ 512 MB RAM per service
- ✅ PostgreSQL database (up to 1 GB storage)
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ Automatic SSL certificates

### Estimated Usage:
- **API Service**: ~$3/month (with $5 credit = **$0 actual cost**)
- **PostgreSQL**: Included in free tier
- **Total**: **$0/month** for MVP stage

### When to Upgrade:
- When exceeding 512 MB RAM (unlikely for MVP)
- When needing >1 GB database storage
- When scaling to thousands of users

**Railway Hobby Plan**: $5/month (8GB RAM, 8GB storage) - upgrade when needed.

---

## Next Steps After Deployment

1. ✅ Verify API is accessible at Railway URL
2. ✅ Test prediction endpoint with sample data
3. ✅ Monitor GitHub Actions for first week
4. ⬜ Set up custom domain (optional)
5. ⬜ Add monitoring (Sentry, LogRocket)
6. ⬜ Build frontend (Phase 4)

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway (very responsive!)
- **Railway Status**: https://status.railway.app
- **CLI Docs**: https://docs.railway.app/develop/cli

---

**You're all set! Your production infrastructure is running on Railway.** 🚀
