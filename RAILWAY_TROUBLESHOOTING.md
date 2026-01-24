# Railway Deployment Troubleshooting

Quick fixes for common Railway deployment errors.

---

## Error: "Error creating build plan with Railpack"

**What it means**: Railway couldn't detect how to build your Python project.

**Fix**: We've added 3 configuration files to help Railway:

### Files Added:

1. **`Procfile`** - Tells Railway how to start the app
   ```
   web: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
   ```

2. **`runtime.txt`** - Specifies Python version
   ```
   python-3.10.15
   ```

3. **`nixpacks.toml`** - Detailed build configuration
   ```toml
   [phases.setup]
   nixPkgs = ["python310"]

   [phases.install]
   cmds = ["pip install --upgrade pip", "pip install -r requirements.txt"]

   [start]
   cmd = "uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"
   ```

### Steps to Fix:

1. **Commit and push these new files**:
   ```bash
   git add Procfile runtime.txt nixpacks.toml railway.toml
   git commit -m "Add Railway deployment config files"
   git push
   ```

2. **Railway will auto-redeploy** when you push

3. **Watch the logs** in Railway dashboard → Deployments

---

## Error: "Module 'src.api.main' has no attribute 'app'"

**Cause**: FastAPI app not found

**Fix**: Check that `src/api/main.py` has:
```python
app = FastAPI(...)
```

**Verify locally**:
```bash
python -c "from src.api.main import app; print('✅ App found')"
```

---

## Error: "No module named 'src'"

**Cause**: Python can't find the src package

**Fix**: Ensure `src/__init__.py` exists:
```bash
# Create if missing
touch src/__init__.py
touch src/api/__init__.py

# Commit
git add src/__init__.py src/api/__init__.py
git commit -m "Add __init__.py files"
git push
```

---

## Error: "requirements.txt not found"

**Cause**: Missing dependencies file

**Fix**: Ensure `requirements.txt` exists in root directory:
```bash
ls requirements.txt  # Should exist
```

If missing, Railway can't install dependencies.

---

## Error: Build succeeds but app crashes immediately

**Check logs for**:
- Database connection errors → Ensure `DATABASE_URL` is set
- Import errors → Missing package in `requirements.txt`
- Port binding errors → Don't hardcode port, use `$PORT` variable

**View crash logs**:
1. Railway → Your service → Deployments
2. Click on failed deployment
3. Scroll to bottom of logs

---

## Error: "Health check failed"

**Cause**: App started but `/health` endpoint not responding

**Fixes**:

1. **Check if API has health endpoint**:
   ```bash
   # In src/api/main.py, should have:
   @app.get("/health")
   async def health():
       return {"status": "healthy"}
   ```

2. **Increase health check timeout** in `railway.toml`:
   ```toml
   [deploy]
   healthcheckTimeout = 300  # Increase to 5 minutes
   ```

3. **Temporarily disable health check**:
   ```toml
   [deploy]
   # healthcheckPath = "/health"  # Comment out
   ```

---

## Successful Deployment Logs Should Show:

```
✓ Installing python310
✓ pip install --upgrade pip
✓ pip install -r requirements.txt
✓ Successfully installed packages
✓ Starting application
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Quick Diagnostic Commands

### Test locally before pushing:

```bash
# 1. Check requirements install
pip install -r requirements.txt

# 2. Test app import
python -c "from src.api.main import app; print('✅ OK')"

# 3. Test server start
uvicorn src.api.main:app --host 0.0.0.0 --port 8000

# 4. Test health check
curl http://localhost:8000/health
```

If all these work locally, Railway should work too.

---

## Still Having Issues?

### Get detailed logs:

1. **Railway Dashboard**:
   - Go to Deployments tab
   - Click failed deployment
   - Click "View Logs"
   - Look for red ERROR lines

2. **Railway CLI**:
   ```bash
   railway logs
   ```

### Common log errors and fixes:

| Error in logs | Fix |
|---------------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | Add to requirements.txt |
| `DATABASE_URL not set` | Add PostgreSQL service |
| `Port 8000 is already in use` | Railway uses $PORT variable automatically |
| `Permission denied` | Check file permissions |

---

## Emergency: Start Fresh

If all else fails:

1. **Delete Railway project**
2. **Fix issues locally first**
3. **Test server runs locally**: `uvicorn src.api.main:app`
4. **Commit all config files**
5. **Create new Railway project**

---

## Configuration Files Checklist

Before deploying, ensure these files exist:

- [ ] `requirements.txt` - Python dependencies
- [ ] `Procfile` - Start command
- [ ] `runtime.txt` - Python version
- [ ] `nixpacks.toml` - Build configuration
- [ ] `railway.toml` - Railway-specific config
- [ ] `src/api/main.py` - FastAPI app
- [ ] `src/__init__.py` - Python package marker

---

## Contact Support

If stuck:
- **Railway Discord**: https://discord.gg/railway (very responsive!)
- **Railway Status**: https://status.railway.app
- **Nixpacks Docs**: https://nixpacks.com/docs

**Paste your build logs when asking for help!**
