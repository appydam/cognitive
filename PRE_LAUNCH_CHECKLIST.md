# Pre-Launch Checklist
**Consequence AI - Final Steps Before Launch**

---

## 🔴 CRITICAL FIXES (Required)

### Fix #1: Backend Environment Loading
- [ ] Open `src/db/database.py`
- [ ] Add these 2 lines after the imports:
  ```python
  from dotenv import load_dotenv
  load_dotenv()
  ```
- [ ] Restart backend: `python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000`
- [ ] Test: `curl http://localhost:8000/backtest/runs` (should get 200, not 500)
- [ ] Test: `curl http://localhost:8000/notifications/preferences` (should get JSON)

### Fix #2: Frontend TypeScript Build
- [ ] Open `frontend/src/app/roadmap/page.tsx`
- [ ] Line 11: Change `status: 'live'` to `status: 'live' as const`
- [ ] Line 12: Change `status: 'live'` to `status: 'live' as const`
- [ ] Line 13: Change `status: 'live'` to `status: 'live' as const`
- [ ] Line 19: Change `status: 'building'` to `status: 'building' as const`
- [ ] Line 20: Change `status: 'building'` to `status: 'building' as const`
- [ ] Lines 26-29: Change all `status: 'planned'` to `status: 'planned' as const`
- [ ] Run: `cd frontend && npm run build` (should succeed)

---

## ✅ VERIFICATION TESTS

### Backend Health Check
```bash
# Start backend
cd /path/to/consequence-ai
source venv/bin/activate
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000

# Test core endpoints (in new terminal)
curl http://localhost:8000/health
# Expected: {"status":"healthy","graph_loaded":true}

curl http://localhost:8000/graph/stats
# Expected: {"num_entities":105,"num_links":160,...}

curl -X POST http://localhost:8000/predict/earnings \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","surprise_percent":-8.0}'
# Expected: Cascade prediction with 17 effects

curl http://localhost:8000/backtest/runs
# Expected: [] (empty array, NOT error 500)

curl http://localhost:8000/notifications/preferences
# Expected: JSON with default preferences
```

### Frontend Build Check
```bash
cd frontend

# Type check
npm run type-check
# Expected: Success, no errors

# Production build
npm run build
# Expected: "Compiled successfully"

# Development server
npm run dev
# Visit http://localhost:3000
# Navigate to each page: Home, Predict, Explore, Vision, Roadmap, Alerts, Backtest
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend (Railway)
- [ ] Ensure `.env` file is NOT in git (should be in `.gitignore`)
- [ ] Verify Railway environment variables:
  - [ ] `DATABASE_URL` (auto-set by Railway)
  - [ ] `SMTP_SERVER` (if using email)
  - [ ] `SMTP_USERNAME` (if using email)
  - [ ] `SMTP_PASSWORD` (if using email)
  - [ ] `TWILIO_ACCOUNT_SID` (if using SMS/WhatsApp)
  - [ ] `TWILIO_AUTH_TOKEN` (if using SMS/WhatsApp)
  - [ ] `TWILIO_PHONE_NUMBER` (if using SMS/WhatsApp)
- [ ] Deploy: `git push railway main`
- [ ] Test live API: `curl https://your-app.railway.app/health`

### Frontend (Vercel/Netlify)
- [ ] Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
- [ ] Build locally: `npm run build` (verify it works)
- [ ] Deploy via platform
- [ ] Test live frontend at your deployed URL
- [ ] Verify all pages load
- [ ] Test prediction feature with live backend

---

## 🎯 FEATURE VERIFICATION

After deployment, verify these key features work:

### Must Work for Launch
- [ ] Home page loads
- [ ] Predict page works (enter ticker, get cascade)
- [ ] Explore graph loads and is interactive
- [ ] Entity search returns results
- [ ] Cascade predictions are accurate
- [ ] Vision page explains the product
- [ ] Roadmap page shows features

### Should Work (if database fixes applied)
- [ ] Backtest page shows historical runs
- [ ] Alert preferences can be saved
- [ ] Notification test sends emails (if SMTP configured)

### Optional (can configure later)
- [ ] SMS notifications (needs Twilio)
- [ ] WhatsApp notifications (needs Twilio)
- [ ] WebSocket live alerts (needs scheduler setup)

---

## 📊 PERFORMANCE CHECK

After deployment, verify performance:

- [ ] API responds in < 2 seconds
- [ ] Graph loads in < 5 seconds
- [ ] Entity search is fast (< 500ms)
- [ ] Frontend pages load quickly
- [ ] No console errors in browser
- [ ] No server errors in Railway logs

---

## 🔒 SECURITY CHECK

- [ ] `.env` file is in `.gitignore`
- [ ] Database credentials not in code
- [ ] API keys not exposed to frontend
- [ ] CORS configured correctly
- [ ] HTTPS enabled (Railway/Vercel do this automatically)

---

## 📈 MONITORING SETUP

Consider setting up:

- [ ] Railway dashboard monitoring
- [ ] Error tracking (Sentry, etc.)
- [ ] Analytics (Google Analytics, Plausible, etc.)
- [ ] Uptime monitoring (UptimeRobot, etc.)
- [ ] Database backup schedule

---

## 🎓 DOCUMENTATION CHECK

- [ ] README has correct setup instructions
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available

---

## ✨ FINAL TOUCHES

- [ ] Update social media cards
- [ ] Prepare launch announcement
- [ ] Create demo video/screenshots
- [ ] Write launch blog post
- [ ] Prepare support channels

---

## 🚨 ROLLBACK PLAN

If something goes wrong:

1. **Backend Issues:**
   - Revert to previous Railway deployment
   - Check environment variables
   - Verify database connection

2. **Frontend Issues:**
   - Revert to previous Vercel/Netlify deployment
   - Check API URL environment variable
   - Verify build logs

3. **Database Issues:**
   - Check Railway database status
   - Verify connection string
   - Check database logs

---

## ✅ LAUNCH READY CRITERIA

You're ready to launch when:

- [x] All critical fixes applied
- [ ] Backend tests pass
- [ ] Frontend builds successfully
- [ ] Deployment successful
- [ ] Core features verified working
- [ ] No critical errors in logs
- [ ] Performance acceptable

---

## 🎉 POST-LAUNCH

After launch:

- [ ] Monitor error logs for 24 hours
- [ ] Check user feedback
- [ ] Monitor performance metrics
- [ ] Fix any hot issues immediately
- [ ] Plan next iteration based on feedback

---

**Current Status:** Ready for fixes
**Next Step:** Apply Fix #1 and Fix #2
**Estimated Time to Launch Ready:** 1-2 hours

🚀 **You got this!** The hard part (building a working causal prediction engine) is done. These are just the final touches.
