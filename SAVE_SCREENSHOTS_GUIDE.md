# Quick Guide: Save Landing Page Screenshots

## 📸 Where to Save the Screenshots

Save both screenshots to this exact location:
```
frontend/public/images/
```

## 🎯 Screenshot 1: Graph Overview

**Filename:** `graph-overview.png`

**How to capture:**
1. Open http://localhost:3000/explore
2. Wait for the graph to fully load (all 558 entities visible)
3. Use "FIT" button to frame the entire graph nicely
4. Take screenshot (Cmd+Shift+4 on Mac, drag to select the graph area)
5. Save as `graph-overview.png` in `frontend/public/images/`

**What should be visible:**
- ✅ All nodes (green companies, blue ETFs, orange macro indicators)
- ✅ Connection lines visible
- ✅ Entity labels readable (zoom out if needed)
- ✅ Clean background (black)

---

## 🎯 Screenshot 2: Oracle Cascade

**Filename:** `cascade-oracle.png`

**How to capture:**
1. Open http://localhost:3000/explore (or stay on the page)
2. Use search or click to select "ORCL" (Oracle) entity
3. Wait for cascade visualization to complete
4. Orange/yellow connections should highlight affected entities
5. Take screenshot (Cmd+Shift+4 on Mac)
6. Save as `cascade-oracle.png` in `frontend/public/images/`

**What should be visible:**
- ✅ Oracle (ORCL) highlighted as the source
- ✅ Orange/yellow cascade connections
- ✅ Multiple hops visible (1st, 2nd, 3rd order effects)
- ✅ Entity labels readable
- ✅ Clean background (black)

---

## ✅ Verify Screenshots Saved Correctly

```bash
# From project root directory
ls -lh frontend/public/images/

# You should see:
# graph-overview.png    (~500KB - 2MB)
# cascade-oracle.png    (~500KB - 2MB)
```

---

## 🚀 After Saving

The landing page will automatically display your screenshots!

**View the result:**
1. Navigate to http://localhost:3000
2. Scroll to "Visualize the Entire Market as a Causal Graph" section
3. Both screenshots should appear in beautiful cards

**If images don't appear:**
- Check filenames are exact (case-sensitive)
- Refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
- Check browser console for errors

---

## 📐 Screenshot Tips

**For Best Quality:**
- Use highest resolution available
- Capture at full screen or large window size
- Ensure graph is well-lit (nodes clearly visible)
- Avoid UI elements overlapping the graph
- PNG format for better quality (not JPG)

**Recommended Size:**
- Width: 2000-3000 pixels
- Aspect ratio: 16:9 (landscape)
- File size: 500KB - 2MB (Next.js will optimize automatically)

---

## 🎨 Alternative: Use Existing Screenshots

If you have the screenshots on your desktop from earlier:

**Option 1 - Terminal:**
```bash
# Navigate to project directory
cd "/Users/arpitdhamija/Desktop/random 1/consequence-ai"

# Copy from Desktop (if that's where they are)
cp ~/Desktop/graph-screenshot-1.png frontend/public/images/graph-overview.png
cp ~/Desktop/graph-screenshot-2.png frontend/public/images/cascade-oracle.png
```

**Option 2 - Finder:**
1. Open Finder
2. Navigate to the screenshots on your Desktop
3. Copy them
4. Navigate to `consequence-ai/frontend/public/images/`
5. Paste and rename to exact filenames above

---

## ✨ Result

Once saved, your landing page will showcase:

**Graph Overview Card:**
- Beautiful visualization of 558 entities
- Live graph indicator (animated)
- Entity type badges (Company 523, ETF 17, Macro 18)

**Oracle Cascade Card:**
- Dramatic cascade effect visualization
- Multi-hop propagation shown
- Order badges (1st, 2nd, 3rd order effects)

Both cards will have:
- Hover effects (border glow)
- Clean borders with gradient overlays
- Professional captions
- Optimized loading (lazy load, responsive)

---

**Need Help?**

If images don't appear after saving:
1. Check `frontend/public/images/` directory exists
2. Verify exact filenames (case-sensitive!)
3. Hard refresh browser (Cmd+Shift+R)
4. Check Next.js console for image optimization logs
