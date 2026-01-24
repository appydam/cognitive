# GitHub Actions Setup Guide

Complete guide to setting up automated cron jobs for Consequence AI.

---

## Overview

We've created **5 automated workflows** that run on schedule:

| Workflow | Schedule | Purpose | Duration |
|----------|----------|---------|----------|
| **Daily Update** | 6am ET daily | Update prices, validate predictions | ~5 min |
| **Prediction Validation** | 6:30am ET daily | Validate pending predictions | ~10 min |
| **Weekly Backtest** | Monday 12pm UTC | Verify accuracy ≥70% | ~15 min |
| **Quarterly 10-K Review** | 1st of month | Create review issue for SEC filings | ~1 min |
| **Database Backup** | Sunday 3am UTC | Backup database to artifacts | ~5 min |

**Total automation**: ~35 minutes of automated work per week

---

## Step 1: Set Up GitHub Secrets

GitHub secrets securely store sensitive credentials for workflows.

### Navigate to Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets

#### 1. `DATABASE_URL` **(Required)**

Your PostgreSQL connection string.

**Format**:
```
postgresql://username:password@host:port/database
```

**Where to get it**:

- **Railway**:
  - Go to your project → PostgreSQL → Connect
  - Copy the `Database URL`
  - Example: `postgresql://postgres:pass@containers-us-west-123.railway.app:5432/railway`

- **Supabase**:
  - Go to Project Settings → Database → Connection string
  - Select **Direct connection**
  - Copy the connection string
  - Example: `postgresql://postgres:pass@db.abc123.supabase.co:5432/postgres`

**Steps**:
- Name: `DATABASE_URL`
- Secret: `[paste your connection string]`
- Click **Add secret**

#### 2. `RAILWAY_URL` (Optional)

Your deployed API URL for health checks.

**Example**: `https://consequence-ai.up.railway.app`

**Steps**:
- Name: `RAILWAY_URL`
- Secret: `https://your-app.up.railway.app`
- Click **Add secret**

---

## Step 2: Enable GitHub Actions

### First-time Setup

1. Go to your repository → **Actions** tab
2. If prompted, click **I understand my workflows, go ahead and enable them**
3. Workflows will now run on their schedules

### Verify Workflows are Active

You should see 5 workflows:
- ✅ Daily Data Update
- ✅ Validate Predictions
- ✅ Weekly Backtest
- ✅ Quarterly 10-K Refresh
- ✅ Database Backup

---

## Step 3: Test Workflows Manually

Before waiting for scheduled runs, test each workflow manually.

### Manual Trigger Steps

1. Go to **Actions** tab
2. Select a workflow (e.g., "Daily Data Update")
3. Click **Run workflow** button
4. Select branch (usually `main`)
5. Click **Run workflow**

### Expected Results

#### Daily Update
```
✅ Connected to database
✅ Updated: 10, Failed: 0
✅ Validated 0 predictions
✅ Refreshed accuracy_stats view
✅ No old data to clean up
```

#### Weekly Backtest
```
✅ Backtest accuracy: 76.1%
✅ Accuracy meets threshold (≥70%)
```

#### Database Backup
```
✅ Backup created successfully
✅ backup_20260124_120000.sql.gz uploaded
```

---

## Step 4: Monitor Workflows

### View Workflow Runs

1. Go to **Actions** tab
2. Click on a workflow name
3. See list of recent runs with status (✅ success, ❌ failed)

### Check Logs

1. Click on a specific run
2. Click on job name (e.g., "update-data")
3. Expand steps to see detailed logs

### Download Artifacts

Some workflows create artifacts (backups, reports):

1. Go to workflow run
2. Scroll to **Artifacts** section
3. Download files (e.g., `database-backup-123.sql.gz`)

---

## Workflow Schedules Explained

### Cron Syntax

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, Sunday = 0)
│ │ │ │ │
* * * * *
```

### Our Schedules

| Cron | Description | Timezone |
|------|-------------|----------|
| `0 11 * * *` | 6am ET daily | UTC |
| `30 11 * * *` | 6:30am ET daily | UTC |
| `0 12 * * 1` | Monday 12pm UTC | UTC |
| `0 2 1 * *` | 1st of month, 2am UTC | UTC |
| `0 3 * * 0` | Sunday 3am UTC | UTC |

**Note**: GitHub Actions runs in UTC timezone. ET = UTC - 5 hours.

---

## Troubleshooting

### Workflow Failed: "DATABASE_URL not set"

**Cause**: Secret not configured

**Fix**:
1. Go to Settings → Secrets and variables → Actions
2. Add `DATABASE_URL` secret
3. Re-run workflow

### Workflow Failed: "Database connection failed"

**Cause**: Invalid connection string or database is down

**Fix**:
1. Test connection string locally:
   ```bash
   psql "postgresql://..."
   ```
2. Verify Railway/Supabase database is running
3. Check if IP is whitelisted (Supabase only)

### Workflow Failed: "Module not found"

**Cause**: Missing dependency in requirements.txt

**Fix**:
1. Add missing package to `requirements.txt`
2. Commit and push
3. Workflow will install on next run

### Backtest Below 70%

**Cause**: Prediction accuracy dropped

**Actions**:
1. GitHub will automatically create an issue
2. Review backtest results in artifacts
3. Check for data quality issues
4. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for troubleshooting

### Rate Limit Exceeded (yfinance)

**Cause**: Too many price requests to Yahoo Finance

**Fix**:
1. Reduce entities updated per run (currently limited to 10)
2. Add delay between requests
3. Consider upgrading to paid data provider

---

## Advanced Configuration

### Change Schedule

Edit `.github/workflows/[workflow].yml`:

```yaml
on:
  schedule:
    - cron: '0 11 * * *'  # Change this line
```

Useful tool: [Crontab Guru](https://crontab.guru/)

### Add Notifications

Add Slack/Discord webhook to workflows:

```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"Daily update failed!"}'
```

### Enable S3 Backups

In `database_backup.yml`, set `if: true` and add secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## Workflow Files Reference

All workflows are in `.github/workflows/`:

1. **daily_update.yml** - Daily price updates and prediction validation
2. **validate_predictions.yml** - Validate pending predictions
3. **weekly_backtest.yml** - Weekly accuracy verification
4. **quarterly_10k_refresh.yml** - Quarterly SEC filing review reminder
5. **database_backup.yml** - Weekly database backups

---

## Cost & Resource Usage

### GitHub Actions Free Tier

- **2,000 minutes/month** for private repos
- **Unlimited** for public repos

### Our Usage (per month)

| Workflow | Frequency | Duration | Monthly Total |
|----------|-----------|----------|---------------|
| Daily Update | 30x | 5 min | 150 min |
| Validation | 30x | 10 min | 300 min |
| Weekly Backtest | 4x | 15 min | 60 min |
| 10-K Review | 1x | 1 min | 1 min |
| Database Backup | 4x | 5 min | 20 min |
| **TOTAL** | | | **531 min/month** |

**Verdict**: ✅ Well within free tier (2,000 min)

---

## Security Best Practices

### ✅ Do:
- Store credentials in GitHub Secrets (never commit)
- Use environment variables for configuration
- Limit workflow permissions to minimum needed
- Review workflow logs for sensitive data before sharing

### ❌ Don't:
- Commit `DATABASE_URL` to repository
- Log sensitive data (passwords, API keys)
- Give workflows `write` permissions unless needed
- Share workflow artifacts publicly if they contain data

---

## Maintenance

### Monthly Tasks

- [ ] Review workflow run history for failures
- [ ] Check accuracy_stats to verify predictions are improving
- [ ] Download and archive database backups
- [ ] Review GitHub Actions usage (Settings → Billing)

### Quarterly Tasks

- [ ] Review SEC 10-K filings (workflow creates issue automatically)
- [ ] Update verified_relationships.json if needed
- [ ] Re-run backtest with updated data
- [ ] Check for dependency updates

---

## Next Steps

After workflows are running:

1. ✅ Monitor daily updates for 1 week
2. ✅ Verify predictions are being validated
3. ✅ Check backtest maintains ≥70% accuracy
4. ⬜ Set up custom notifications (Slack, email)
5. ⬜ Add monitoring dashboard (optional)
6. ⬜ Configure S3 backups (if needed)

---

## Support

If workflows fail repeatedly:

1. Check workflow logs in GitHub Actions tab
2. Test scripts locally: `python scripts/daily_update.py --dry-run`
3. Verify database connection: `psql $DATABASE_URL`
4. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for infrastructure issues

**All automated! Workflows will keep your data fresh and predictions accurate.**
