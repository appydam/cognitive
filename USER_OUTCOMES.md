# Consequence AI - User Outcomes & Benefits

## What Users Get: The Final Product

### 1. Real-Time Cascade Predictions

**User Journey:**
```
4:02 PM - Apple reports earnings (EPS $1.38 vs $1.50 expected)
         ↓
4:03 PM - User gets instant alert: "AAPL missed by 8%"
         ↓
4:03 PM - System auto-generates cascade prediction:
```

**Output they see:**

```
🚨 AAPL Earnings Miss Detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRIGGER:
Apple Inc. (AAPL) missed earnings by 8.0%
Expected: $1.50 EPS | Actual: $1.38 EPS
Reason: "Weak iPhone demand in China"

PREDICTED CASCADE (Next 14 Days):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📉 HOUR 0-4 (Immediate Impact)
├─ TSMC (Taiwan Semi)     : -2.4% [-2.7% to -2.1%]  ⚠️ 75% confident
├─ SWKS (Skyworks)        : -5.2% [-5.9% to -4.6%]  ⚠️ 75% confident
├─ XLK (Tech ETF)         : -2.4% [-2.5% to -2.3%]  ✓ 90% confident
└─ SPY (S&P 500)          : -1.1% [-1.2% to -1.1%]  ✓ 90% confident

Why: Apple suppliers depend heavily on Apple revenue. TSMC
     gets 48% of revenue from Apple (10-K FY2024). Historical
     correlation: 0.67 (p<0.01) with 1-day lag.

📉 DAY 1 (Next Business Day)
├─ AVGO (Broadcom)        : -1.9% [-2.2% to -1.7%]  ⚠️ 75% confident
├─ QCOM (Qualcomm)        : -1.9% [-2.2% to -1.7%]  ⚠️ 75% confident
└─ SMH (Semiconductor ETF): -0.6% [-0.7% to -0.5%]  ⚡ 68% confident

Why: Secondary chip suppliers and sector ETFs typically follow
     with 1-2 day delay based on 24-month historical analysis.

📉 DAY 2-3 (Ripple Effects)
├─ ADI (Analog Devices)   : -1.0% [-1.1% to -0.8%]  ⚡ 75% confident
├─ TXN (Texas Instruments): -1.2% [-1.3% to -1.0%]  ⚡ 75% confident
└─ LRCX (Lam Research)    : -0.6% [-0.7% to -0.4%]  ⚡ 56% confident

📉 DAY 4-7 (Tertiary Effects)
└─ ASML (ASML Holding)    : -0.7% [-0.9% to -0.6%]  ⚡ 56% confident

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONFIDENCE LEGEND:
✓ High (>80%): Strong evidence, tested 50+ times
⚠️ Medium (60-80%): Good evidence, tested 20+ times
⚡ Low (<60%): Limited evidence, watch closely

ATTRIBUTION:
This shows ISOLATED effect from Apple earnings miss.
Actual prices will also reflect:
├─ Company-specific news
├─ Macro economic factors
├─ Sector sentiment
└─ Market-wide movements

Use this as ONE input to your trading decisions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 WHAT-IF SCENARIOS:

What if Apple BEATS by 5% instead?
├─ TSMC: +2.7% [+2.4% to +3.0%]
├─ SMH:  +4.5% [+4.3% to +4.7%]
└─ XLK:  +1.8% [+1.7% to +1.9%]

What if surprise was -12% (worse)?
├─ TSMC: -3.6% [-4.0% to -3.2%]
├─ SWKS: -7.8% [-8.8% to -6.9%]
└─ XLK:  -3.6% [-3.8% to -3.4%]
```

---

## 2. Accuracy Transparency

**What users see on Track Record page:**

```
📊 MODEL PERFORMANCE (Last 90 Days)

Overall Accuracy:
├─ Direction Correct: 73% (146/200 predictions)
├─ Magnitude Error:   ±42% average
└─ Timing Accuracy:   67% within 1 day

By Order of Effect:
┌─────────────┬───────────────┬──────────────┬─────────┐
│ Order       │ Direction Acc │ Magnitude    │ Sample  │
├─────────────┼───────────────┼──────────────┼─────────┤
│ 1st (Direct)│ 82%          │ ±35%         │ 80 pred │
│ 2nd (Ripple)│ 68%          │ ±48%         │ 70 pred │
│ 3rd+ (Weak) │ 61%          │ ±55%         │ 50 pred │
└─────────────┴───────────────┴──────────────┴─────────┘

Top Performing Links:
├─ AAPL → TSMC:  88% accurate (42 tests)
├─ NVDA → SMH:   85% accurate (38 tests)
└─ MSFT → XLK:   81% accurate (35 tests)

Needs Improvement:
├─ AAPL → QCOM:  42% accurate (needs review)
└─ TSM → ASML:   58% accurate (high variance)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 RECENT PREDICTIONS (Last 10 Events)

Jan 18, 2025 - NVDA beats by 12%
Predicted: TSMC +2.7%, SMH +4.5%
Actual:    TSMC +2.9%, SMH +4.2%
Result:    ✓ Direction ✓ Magnitude ✓

Jan 15, 2025 - AAPL misses by 6%
Predicted: TSMC -1.8%, SWKS -3.9%
Actual:    TSMC -2.1%, SWKS -4.5%
Result:    ✓ Direction ~ Magnitude

Jan 10, 2025 - TSM warns on capacity
Predicted: ASML -3.2%, LRCX -2.5%
Actual:    ASML +1.2%, LRCX -0.8%
Result:    ✗ Direction (other factors dominated)

[Show more...]
```

---

## 3. How Users Benefit

### For Day Traders:
**Before Consequence AI:**
- "Apple missed earnings. I should sell AAPL."
- Maybe thinks about suppliers, but unsure which ones
- Misses 2nd and 3rd order effects completely

**With Consequence AI:**
- Gets alert 60 seconds after earnings
- Sees full cascade: TSMC -2.4%, SWKS -5.2%, SMH -0.6%
- Can front-run the cascade (place orders before market prices it in)
- **Value: First-mover advantage**

### For Portfolio Managers:
**Before:**
- Manually track holdings: "I own TSMC. How does Apple news affect it?"
- Rely on gut feel and sector ETF movements

**With:**
- Auto-alerts: "You own TSMC. Apple miss predicts -2.4% TSMC drop"
- Quantified risk: "Your portfolio has $50K exposure to Apple cascades"
- **Value: Risk management + hedging opportunities**

### For Analysts/Researchers:
**Before:**
- Spend hours researching supply chain impacts
- Write reports saying "This could affect suppliers"

**With:**
- Instant quantified cascade analysis
- Evidence trail: "Based on 10-K disclosures + 24-month correlation"
- **Value: Research productivity 10x faster**

---

## 4. Accuracy Strategy

### How We Make It Accurate:

#### Layer 1: Strong Evidence (High Confidence)
```
Use only when we have:
1. SEC 10-K disclosure (Company A is 25% of Company B's revenue)
2. 2+ years of price correlation data (r > 0.6, p < 0.01)
3. 20+ historical tests showing 80%+ accuracy

Example:
AAPL → TSMC:
├─ Evidence: "TSMC 10-K: Customer A (Apple) = 25% revenue"
├─ Correlation: r=0.67 (p<0.001) over 24 months
├─ Historical: 88% accurate over 42 earnings events
└─ Confidence: 85%
```

#### Layer 2: Moderate Evidence (Medium Confidence)
```
Use when:
1. Strong sector correlation (both in XLK)
2. Known business relationship (not in 10-K but public knowledge)
3. 10+ historical tests

Example:
NVDA → AMD (competitors):
├─ Evidence: "Same sector, correlation r=0.45"
├─ Historical: 68% accurate (inverse relationship)
└─ Confidence: 60%
```

#### Layer 3: Weak Evidence (Low Confidence, Show with Warning)
```
Use when:
1. Statistical correlation only (no business link)
2. <10 historical tests
3. High variance in outcomes

Example:
AAPL → random tech stock:
├─ Evidence: "Correlation r=0.35 (sector effect)"
├─ Historical: 4 tests (insufficient data)
└─ Confidence: 40% ⚠️ SPECULATIVE
```

### Continuous Improvement:

```
Day 1:  Predict AAPL → TSMC: -2.4%
Day 2:  Actual TSMC: -2.8%
        ↓
        Error: 0.4% (predicted too low)
        ↓
        Bayesian Update:
        Old strength: 0.48
        New strength: 0.48 × (1 + 0.1 × (2.8/2.4 - 1))
                    = 0.48 × 1.017
                    = 0.488
        ↓
        Link gets slightly stronger
        Confidence increases: 0.85 → 0.86

After 50 tests:
├─ Links converge to true strength
├─ Bad links get low confidence (we warn users)
└─ Good links get high confidence (users trust them)
```

### User-Facing Accuracy Features:

1. **Confidence Scores**: Never hide uncertainty
2. **Historical Track Record**: Show all predictions, not just wins
3. **Attribution**: "This is ONE factor, not the only factor"
4. **Ranges**: Show [-2.7% to -2.1%] not just -2.4%
5. **Evidence Links**: Click to see SEC filing or correlation data

---

## 5. Competitive Advantage

### vs Stock Screeners:
| Them | Us |
|------|-----|
| "AAPL dropped 5%" | "AAPL drop predicts TSMC -2.4% in 24h" |
| Shows what happened | Predicts what happens next |
| No causality | Explicit causal chains |

### vs LLMs (GPT-4):
| GPT-4 | Consequence AI |
|-------|----------------|
| "Suppliers might be affected" | "TSMC: -2.4% [-2.7% to -2.1%], Day 1, 75% confident" |
| No learning | Learns from every prediction |
| Hallucinates correlations | Evidence-based (10-K + prices) |
| Black box | Traceable causal chains |

### vs Bloomberg Terminal:
| Bloomberg | Us |
|-----------|-----|
| $24K/year | $79/month |
| Shows correlations | Predicts cascades with timing |
| For institutions | For retail + institutions |
| No learning loop | Self-improving model |

---

## 6. User Journey (End-to-End)

### New User (Free Tier):
```
Day 1: Sign up (no credit card)
       ├─ See track record (73% accuracy)
       ├─ Run 3 what-if simulations
       └─ Subscribe to 5 tickers for alerts

Day 3: First real alert (NVDA beats)
       ├─ Email: "NVDA +12% → TSMC +2.7% predicted"
       ├─ Check web UI: See full cascade
       └─ Verify next day: TSMC actually +2.9% ✓

Week 2: Convinced by accuracy
        ├─ Upgrade to Pro ($29/mo)
        ├─ Get unlimited predictions
        └─ Enable SMS alerts
```

### Pro User (Paid):
```
Every Day:
├─ Monitor live earnings feed
├─ Get instant alerts when positions affected
├─ Run what-if scenarios before earnings
└─ Check track record (builds trust)

Earnings Season (Quarterly):
├─ 50+ alerts per week
├─ Front-run 10-20 cascade opportunities
├─ Avoid 5-10 surprise hits to portfolio
└─ ROI: Saves/makes $500+ vs $79/mo cost
```

---

## Success Metrics

### Week 1 (Beta):
- [ ] 100 signups
- [ ] 70%+ direction accuracy on first 20 predictions
- [ ] 5 users upgrade to paid

### Month 1:
- [ ] 500 users
- [ ] 75%+ direction accuracy (sustained)
- [ ] 50 paying customers ($1,500 MRR)
- [ ] NPS > 40

### Month 3:
- [ ] 2,000 users
- [ ] Featured on r/algotrading or FinTwit
- [ ] 200 paying customers ($6,000 MRR)
- [ ] 80%+ retention

---

## The Promise to Users

**"See the ripple effects before they hit."**

We predict:
- ✓ WHAT will be affected (which stocks/sectors)
- ✓ HOW MUCH (magnitude with ranges)
- ✓ WHEN (timing with day-level precision)
- ✓ HOW CONFIDENT we are (transparent uncertainty)

We show:
- ✓ Our track record (all predictions, wins + losses)
- ✓ The evidence (SEC filings + correlations)
- ✓ The causal chain (A → B → C explained)

We improve:
- ✓ Every prediction updates the model
- ✓ Accuracy increases over time
- ✓ Bad links get flagged/removed

**Not financial advice. A decision support tool for informed traders.**
