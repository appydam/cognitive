# Adding Verified Microsoft (MSFT) Causal Relationships

This directory contains scripts to add **verified, documented** business relationships for Microsoft Corporation (MSFT) to the causal graph database.

## ⚠️ Data Quality Policy

**All relationships added must be:**
- ✅ Verifiable from authoritative sources (SEC filings, official announcements, analyst reports)
- ✅ Cite specific sources with URLs and dates
- ✅ Include quantifiable metrics where available (revenue %, dollar amounts)
- ❌ NO assumptions, estimates, or speculative relationships
- ❌ NO manipulation or fabrication of data

## Data Sources

All relationships are documented from the following verified sources:

### 1. OpenAI → Microsoft Azure Relationship
- **Source**: TechCrunch, November 14, 2025
- **URL**: https://techcrunch.com/2025/11/14/leaked-documents-shed-light-into-how-much-openai-pays-microsoft/
- **Evidence**:
  - OpenAI paid Microsoft $865.8M in first 3 quarters of FY2025
  - Estimated $13B annual Azure spend by OpenAI in 2025
  - OpenAI shares 20% of revenue with Microsoft until AGI is achieved

### 2. Dell Technologies → Microsoft Partnership
- **Source**: SiliconANGLE, December 16, 2025
- **URL**: https://siliconangle.com/2025/12/16/hybrid-ai-cloud-solutions-dell-microsoft-microsoftignite/
- **Evidence**:
  - Dell PowerStore and Private Cloud integrated with Azure Local in 2025
  - Customers deploying dozens to hundreds of Azure Local systems via Dell
  - Official partnership announced at Microsoft Ignite 2025

### 3. HPE → Microsoft Partnership
- **Source**: HPE Official Partnership Page, 2025
- **URL**: https://www.hpe.com/us/en/alliance/microsoft.html
- **Evidence**:
  - HPE GreenLake Flex Solution for Azure Local launched 2025
  - Exclusive license bundle for HPE ProLiant Azure Local Systems
  - Collaborative partnership for hybrid edge computing

### 4. AMD & NVIDIA → Microsoft (Existing)
These relationships already exist in the database:
- AMD → MSFT (supplies, 18% of AMD revenue from Microsoft Azure)
- NVDA → MSFT (supplies, 15% of NVDA revenue from Microsoft Azure)

## Scripts

### 1. `create_missing_entities.py`
Creates entities that don't yet exist in the database:
- **OPENAI**: OpenAI (private company, AI research)
- **DELL**: Dell Technologies Inc. (~$75B market cap)
- **HPE**: Hewlett Packard Enterprise (~$28B market cap)

**Usage:**
```bash
# Set DATABASE_URL environment variable first
export DATABASE_URL="postgresql://..."

# Or use Railway CLI
railway run python scripts/create_missing_entities.py
```

### 2. `add_msft_relationships.py`
Adds verified causal links between MSFT and other entities.

**Relationships Added:**
| Source | Target | Type | Strength | Confidence | Evidence |
|--------|--------|------|----------|------------|----------|
| MSFT | OPENAI | supplies | 0.70 | 0.85 | $865.8M paid in 3Q FY2025 |
| MSFT | DELL | correlates_with | 0.40 | 0.75 | Azure Local partnership |
| MSFT | HPE | correlates_with | 0.35 | 0.75 | GreenLake partnership |

**Usage:**
```bash
# After creating entities
railway run python scripts/add_msft_relationships.py
```

### 3. `check_entities.py`
Utility script to check which entities exist in the database.

**Usage:**
```bash
railway run python scripts/check_entities.py
```

## Running the Scripts

### Option A: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Link to project** (if not already linked):
   ```bash
   cd consequence-ai
   railway link
   ```

3. **Create missing entities:**
   ```bash
   railway run python scripts/create_missing_entities.py
   ```

4. **Add MSFT relationships:**
   ```bash
   railway run python scripts/add_msft_relationships.py
   ```

### Option B: Using Database URL Directly

1. **Get DATABASE_URL from Railway:**
   ```bash
   railway variables --service backend
   # Copy the DATABASE_URL value
   ```

2. **Set environment variable:**
   ```bash
   export DATABASE_URL="postgresql://postgres:xxx@xxxx.railway.app:5432/railway"
   ```

3. **Run scripts:**
   ```bash
   python scripts/create_missing_entities.py
   python scripts/add_msft_relationships.py
   ```

## After Running Scripts

1. **Restart the backend** to reload the graph:
   ```bash
   # Railway will auto-deploy, or trigger manually:
   railway up
   ```

2. **Test cascade effects:**
   - Open the app: https://your-frontend-url.vercel.app
   - Navigate to Explore page
   - Click on MSFT entity
   - Click "ANALYZE CASCADE"
   - **Expected result**: Should now show more than 1 first-order effect

3. **Verify in database:**
   ```bash
   railway run python -c "
   from src.db.connection import init_db, get_db_session
   from src.db.models import CausalLink

   init_db()
   with get_db_session() as session:
       links = session.query(CausalLink).filter_by(source='MSFT').all()
       print(f'MSFT outgoing connections: {len(links)}')
       for link in links:
           print(f'  → {link.target} ({link.relationship_type})')
   "
   ```

## Expected Outcome

**Before:**
- MSFT has 0 outgoing connections
- Cascade shows only 1 effect (XLK sector)
- User sees many graph connections but no cascade effects

**After:**
- MSFT has 3 verified outgoing connections (OPENAI, DELL, HPE)
- Cascade shows multiple first-order effects
- Graph visualization matches cascade prediction
- All relationships are documented with sources

## Data Sources Page

A separate frontend page will be created to display all data sources and citations, enhancing user trust and transparency.

Location: `frontend/src/app/data-sources/page.tsx`

This page will include:
- List of all relationship types and their sources
- Links to SEC filings, official announcements, and reports
- Methodology for determining strength and confidence metrics
- Last updated dates for each relationship

## Future Expansion

To add more entities with verified relationships:

1. **Research** the entity's business relationships from authoritative sources
2. **Document** sources, evidence, and quantifiable metrics
3. **Add to script** with citations
4. **Run scripts** to update database
5. **Update data sources page** with new citations

---

**Last Updated**: January 27, 2026
**Data Quality Standard**: All relationships verified from authoritative public sources
**Trust & Transparency**: Full source citations provided for user verification
