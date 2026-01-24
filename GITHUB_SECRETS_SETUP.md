# GitHub Actions Secrets Setup

This guide explains how to set up the required secrets for GitHub Actions workflows.

## Required Secrets

The GitHub Actions workflows need access to your Railway PostgreSQL database and deployment URL. You'll need to add two repository secrets.

## Step-by-Step Setup

### 1. Navigate to Repository Secrets

Go to: https://github.com/appydam/cognitive/settings/secrets/actions

Or manually:
1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)

### 2. Add DATABASE_URL Secret

1. Click **"New repository secret"**
2. Fill in:
   - **Name:** `DATABASE_URL`
   - **Secret:** `postgresql://postgres:hCUnlTUUttIZFhGWYRnDLVdqEsVnqNZT@switchback.proxy.rlwy.net:11738/railway`
3. Click **"Add secret"**

⚠️ **Important:** This is the **public** PostgreSQL URL (switchback.proxy.rlwy.net), not the internal one (postgres.railway.internal), because GitHub Actions runs outside Railway's network.

### 3. Add RAILWAY_URL Secret

1. Click **"New repository secret"** again
2. Fill in:
   - **Name:** `RAILWAY_URL`
   - **Secret:** `https://cognitive-production.up.railway.app`
3. Click **"Add secret"**

This URL is used by workflows to verify deployment health.

## Verify Secrets Are Set

After adding both secrets, you should see them listed on the secrets page:
- ✅ `DATABASE_URL`
- ✅ `RAILWAY_URL`

## What These Secrets Enable

Once configured, the following GitHub Actions workflows will work automatically:

### 1. Daily Update Workflow (`.github/workflows/daily_update.yml`)
- **Schedule:** Every day at 6am ET (11am UTC)
- **Actions:**
  - Updates latest stock prices in the database
  - Validates pending predictions
  - Refreshes accuracy statistics
  - Cleans up old data (>90 days)

### 2. Prediction Validation (`.github/workflows/validate_predictions.yml`)
- **Schedule:** Every day at 6:30am ET
- **Actions:**
  - Checks predictions that are due for validation
  - Fetches actual stock price movements
  - Updates accuracy metrics

### 3. Weekly Backtest (`.github/workflows/weekly_backtest.yml`)
- **Schedule:** Every Monday at 8am ET
- **Actions:**
  - Runs backtest on 10 historical earnings events
  - Verifies accuracy ≥70% threshold
  - Creates GitHub issue if accuracy drops below threshold
  - Uploads backtest results as artifacts

### 4. Quarterly 10-K Refresh (`.github/workflows/quarterly_10k_refresh.yml`)
- **Schedule:** First day of each quarter
- **Actions:**
  - Reviews new SEC 10-K filings
  - Updates supplier relationship data
  - Creates pull request with new verified relationships

### 5. Database Backup (`.github/workflows/database_backup.yml`)
- **Schedule:** Every Sunday at 2am ET
- **Actions:**
  - Creates PostgreSQL database dump
  - Compresses backup file
  - Stores as GitHub Actions artifact (30-day retention)

## Testing the Workflows

You can manually trigger any workflow to test it:

1. Go to **Actions** tab in your repository
2. Select the workflow (e.g., "Daily Data Update")
3. Click **"Run workflow"** dropdown
4. Click **"Run workflow"** button

The workflow will execute immediately and you can view the logs.

## Security Notes

- ✅ **Secrets are encrypted** - GitHub encrypts all secrets at rest
- ✅ **Not visible in logs** - Secret values are masked in workflow logs
- ✅ **Scoped access** - Only workflows in this repository can access these secrets
- ⚠️ **Rotate if compromised** - If you suspect a secret is exposed, regenerate the DATABASE_URL in Railway and update the secret

## Troubleshooting

### Workflow fails with "DATABASE_URL not set"
- Verify the secret name is exactly `DATABASE_URL` (case-sensitive)
- Check that the secret was added to the repository (not organization or environment)

### Workflow fails with "connection refused"
- Verify the DATABASE_URL includes the correct host: `switchback.proxy.rlwy.net`
- Check that Railway PostgreSQL allows external connections (it should by default)

### Workflow fails with "permission denied"
- Verify the password in DATABASE_URL is correct
- Check that the PostgreSQL user has the necessary permissions

## Next Steps

After setting up secrets:
1. ✅ Secrets are configured
2. 🔄 Wait for scheduled workflows to run, or trigger manually
3. 📊 Monitor workflow runs in the Actions tab
4. 🎯 Check that data is being updated in Railway PostgreSQL

---

For more details on the workflows, see [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md).
