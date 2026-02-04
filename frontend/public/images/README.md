# Landing Page Images

This directory contains the graph visualization screenshots used on the landing page.

## Required Images

Please save your screenshots with these exact filenames:

1. **graph-overview.png** - General view of the complete knowledge graph
   - Screenshot from `/explore` page showing all 558 entities
   - Should show the full graph with green nodes (companies), blue nodes (ETFs), and yellow/orange nodes (macro indicators)
   - Dimensions: Approximately 2540x1440 or similar aspect ratio

2. **cascade-oracle.png** - Oracle cascade effect visualization
   - Screenshot from `/explore` page showing Oracle (ORCL) cascade prediction
   - Should highlight affected entities with orange/yellow connections
   - Shows the propagation through 1st, 2nd, and 3rd order effects
   - Dimensions: Approximately 2540x1440 or similar aspect ratio

## How to Save

1. Take screenshots from your running application at `localhost:3000/explore`
2. Save them to this directory (`frontend/public/images/`)
3. Use the exact filenames above
4. The landing page will automatically display them

## Current Status

- [ ] graph-overview.png
- [ ] cascade-oracle.png

Once both images are saved, the landing page will display them in the "Visual Showcase" section.
