# Consequence AI - Stock Market Cascades

A **causal reasoning engine** that predicts how earnings and market events ripple through sectors.

Not another stock screener or alert tool. This system shows the **cascade effects** - the 2nd, 3rd, and 4th order consequences that LLMs can't reliably predict.

## What Makes This Different

| Capability | LLM | Consequence AI |
|------------|-----|----------------|
| Prediction | "Prices might drop" | "-12% to -15% (confidence: 0.92)" |
| Timing | "Eventually" | "Day 1: suppliers, Day 2-3: sector ETFs" |
| Multi-hop | Struggles beyond 2 hops | 4+ order effects with degrading confidence |
| Counterfactuals | Hallucination-prone | Structural: change input → see new cascade |
| Learning | None | Graph weights update from outcomes |
| Explainability | Black box | Traceable causal chains with evidence |

## Quick Start

### 1. Install dependencies

```bash
cd consequence-ai
pip install -e .
# or
pip install -e ".[dev]"  # with dev dependencies
```

### 2. Run the demo

```bash
# CLI demo
python run.py --demo

# API server
python run.py

# Then open web/index.html in your browser
# Or serve it: python -m http.server 3000 -d web
```

### 3. Try the API

```bash
# Predict cascade from Apple earnings miss
curl -X POST http://localhost:8000/predict/earnings \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL", "surprise_percent": -8.0}'
```

## Example Output

**Input**: "Apple misses earnings by 8%"

```
CAUSAL CASCADE (14-day projection)

Hour 0-4:
├── AAPL: -12% to -15% (confidence: 0.92)
└── After-hours selling triggers stop losses

Day 1:
├── TSMC (primary chip supplier): -5% to -7% (confidence: 0.85)
├── Foxconn (manufacturer): -4% to -6% (confidence: 0.82)
└── Apple supplier ETF: -4% (confidence: 0.80)

Day 2-3:
├── Semiconductor ETF (SMH): -2% to -4% (confidence: 0.75)
├── Qualcomm, Broadcom: -2% to -3% (confidence: 0.72)
└── Retail sentiment shift: "tech weakness" narrative emerges
```

## Architecture

```
consequence-ai/
├── src/
│   ├── data/           # Data ingestion (Yahoo Finance, SEC EDGAR)
│   ├── graph/          # Causal graph schema and builders
│   ├── engine/         # Cascade propagation engine
│   ├── learning/       # Feedback loop for learning from outcomes
│   ├── explain/        # Explainability and causal tracing
│   ├── validation/     # Backtesting framework
│   └── api/            # FastAPI endpoints
├── web/                # Simple HTML demo UI
├── scripts/            # Demo and utility scripts
└── data/               # Saved graphs and backtest results
```

## Key Components

### Causal Graph

Entities (companies, ETFs, sectors) connected by causal links with:
- **Strength**: How much effect propagates (0-1)
- **Delay**: Time until effect materializes (days)
- **Confidence**: How certain we are (0-1)
- **Evidence**: Why this relationship exists

### Propagation Engine

BFS traversal through the graph, calculating:
- Magnitude of effects (with ranges)
- Timing of effects (when they hit)
- Confidence decay (degrades with each hop)
- Causal chains (for explainability)

### Learning Loop

Updates graph weights based on outcomes:
- Bayesian updates to link strengths
- Timing calibration from actual delays
- Confidence adjustment from accuracy

## Data Sources

All free and publicly available:
- **Yahoo Finance** (yfinance): Stock prices, earnings calendar
- **SEC EDGAR**: 10-K filings for supplier/customer relationships
- **FRED**: Economic indicators

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict/earnings` | POST | Generate cascade prediction |
| `/explain/cascade` | POST | Get detailed explanations |
| `/graph/stats` | GET | Graph statistics |
| `/graph/entity/{ticker}` | GET | Entity information |
| `/graph/entity/{ticker}/connections` | GET | Entity connections |
| `/entities/search` | GET | Search entities |

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black src/
ruff check src/
```

## Disclaimer

This is a technical demonstration of causal reasoning systems. It is **not financial advice**. Predictions are for educational purposes only. Always do your own research before making investment decisions.

## License

MIT
