# Frontend Deployment Guide - Consequence AI

## Overview

This guide walks through deploying the Next.js frontend to Vercel.

## Prerequisites

- GitHub repository with frontend code
- Vercel account (free tier works)
- Backend API running on Railway: https://cognitive-production.up.railway.app

## Step-by-Step Deployment

### 1. Push Frontend to GitHub

```bash
cd /Users/arpitdhamija/Desktop/random\ 1/consequence-ai
git add frontend/
git commit -m "Add Next.js frontend for Phase 4 UI/UX"
git push origin main
```

### 2. Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New..." → "Project"
4. Select your repository (appydam/cognitive or similar)

### 3. Configure Project Settings

**Framework Preset**: Next.js

**Root Directory**: `frontend`

**Build Settings** (auto-detected):
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. Configure Environment Variables

Add the following environment variable:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://cognitive-production.up.railway.app` |

**Important**: Make sure the key is exactly `NEXT_PUBLIC_API_URL` (case-sensitive)

### 5. Deploy

Click "Deploy" button. Vercel will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Build the application (`npm run build`)
4. Deploy to production

Deployment takes ~2-3 minutes.

### 6. Get Deployment URL

After deployment succeeds, you'll get a URL like:
- Production: `https://consequence-ai.vercel.app`
- Preview: `https://consequence-ai-git-main-yourname.vercel.app`

## Post-Deployment Verification

### Test All Pages

Visit each page and verify it loads without errors:

1. **Landing Page**: `https://your-domain.vercel.app/`
   - Check hero section displays
   - Verify features cards load
   - Confirm stats show (25+ Entities, 32+ Links, 76% Accuracy)

2. **Prediction Page**: `https://your-domain.vercel.app/predict`
   - Enter ticker: AAPL
   - Set surprise: -8.0
   - Click "Predict Cascade"
   - Verify cascade timeline displays with effects

3. **Explore Page**: `https://your-domain.vercel.app/explore`
   - Check Statistics tab shows graph overview
   - Switch to Search tab
   - Search for "AAPL"
   - Click on entity to view connections

4. **Accuracy Page**: `https://your-domain.vercel.app/accuracy`
   - Verify accuracy metrics display
   - Check progress bars render
   - Confirm methodology section loads

### Test API Integration

Open browser DevTools (F12) → Network tab:

1. Go to Prediction page
2. Submit a prediction
3. Check Network tab for API call to Railway:
   - URL: `https://cognitive-production.up.railway.app/predict/earnings`
   - Status: 200 OK
   - Response: JSON with cascade data

If you see CORS errors or 404s, check:
- `NEXT_PUBLIC_API_URL` environment variable is set correctly
- Backend API is running on Railway
- Backend has CORS enabled for your Vercel domain

### Test Mobile Responsiveness

1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test on different screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

Verify:
- Navbar collapses properly
- Grid layouts stack on mobile
- Cards are readable
- No horizontal scrolling

## Custom Domain (Optional)

### Add Custom Domain

1. In Vercel dashboard, go to project Settings → Domains
2. Add your custom domain (e.g., `app.consequence-ai.com`)
3. Follow DNS configuration instructions:
   - Add A record: `76.76.21.21`
   - Or CNAME record: `cname.vercel-dns.com`
4. Wait for DNS propagation (~5-60 minutes)
5. Vercel automatically provisions SSL certificate

### Update Environment Variables

If using custom domain, update CORS in backend:
1. Go to Railway dashboard
2. Update FastAPI CORS settings to include new domain
3. Redeploy backend if needed

## Continuous Deployment

Vercel automatically deploys on every push to `main`:

1. Make changes to frontend code
2. Commit and push to GitHub:
   ```bash
   git add frontend/
   git commit -m "Update landing page copy"
   git push origin main
   ```
3. Vercel detects push and starts deployment
4. Check deployment status at vercel.com/dashboard

Preview deployments are created for pull requests.

## Troubleshooting

### Deployment Fails

**Error: "Build failed"**
- Check build logs in Vercel dashboard
- Verify build works locally: `npm run build`
- Check for TypeScript errors
- Ensure all dependencies are in `package.json`

**Error: "Module not found"**
- Verify import paths use `@/` alias
- Check that file names match imports (case-sensitive on Linux)
- Ensure `tsconfig.json` has path mapping

### Runtime Errors

**Error: "Failed to fetch"**
- Check `NEXT_PUBLIC_API_URL` is set in Vercel
- Verify backend API is running on Railway
- Check backend logs for errors
- Test API directly: `curl https://cognitive-production.up.railway.app/health`

**Error: "CORS policy"**
- Add Vercel domain to backend CORS allowed origins
- Check backend FastAPI CORS middleware configuration
- Verify request headers are allowed

**Error: "Hydration failed"**
- Check for mismatched HTML between server and client
- Verify all components using hooks have `"use client"` directive
- Check for invalid nesting (e.g., `<p>` inside `<p>`)

### Performance Issues

**Slow initial load**
- Check bundle size: Vercel dashboard → Analytics → Bundle
- Optimize images (use Next.js Image component)
- Enable compression in `next.config.js`

**Slow API calls**
- Check backend response times
- Consider adding loading states
- Implement request caching

## Monitoring

### View Analytics

Vercel provides analytics for free:
1. Go to project dashboard
2. Click "Analytics" tab
3. View metrics:
   - Page views
   - Top pages
   - Devices
   - Response times

### View Logs

Real-time logs:
1. Go to project dashboard
2. Click "Functions" or "Deployments"
3. Select deployment
4. View runtime logs

### Error Tracking

For production error tracking, consider:
- Sentry (free tier available)
- LogRocket
- Vercel's built-in error logs

## Rollback

If deployment introduces bugs:

1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm rollback

Previous deployment becomes live immediately.

## Next Steps

After successful deployment:

1. ✅ Test all features work correctly
2. ✅ Verify API integration
3. ✅ Test on mobile devices
4. ✅ Share URL with stakeholders
5. ⏭️ Continue to data quality improvements (Phase 5)

## Production Checklist

Before launching to users:

- [ ] All pages load without errors
- [ ] API calls work correctly
- [ ] Mobile responsive
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking enabled
- [ ] Error monitoring setup
- [ ] Performance metrics acceptable
- [ ] SEO meta tags added (in `layout.tsx`)
- [ ] Favicon added (`/public/favicon.ico`)

---

**Deployment URL**: `https://consequence-ai.vercel.app` (replace with your actual URL)

**Backend API**: `https://cognitive-production.up.railway.app`

**GitHub Repo**: Your repository URL

For support, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Community](https://vercel.com/community)
