#!/usr/bin/env python3
"""
Calculate historical price correlations for stock pairs.

This script:
1. Fetches 2 years of price data for S&P 100 companies
2. Calculates lagged correlations (0-5 day lags)
3. Filters for statistical significance (p<0.01)
4. Caches results to data/correlations.json
"""

import json
import time
from pathlib import Path
from datetime import datetime
from itertools import combinations

import pandas as pd
from scipy import stats

from src.data.yahoo_finance import get_historical_prices, TOP_100_TICKERS


def calculate_lagged_correlation(
    df_a: pd.DataFrame,
    df_b: pd.DataFrame,
    max_lag: int = 5
) -> dict:
    """
    Calculate correlation with different lags.

    Args:
        df_a: Price data for stock A (the "cause")
        df_b: Price data for stock B (the "effect")
        max_lag: Maximum lag in days to test

    Returns:
        Dict with best correlation, lag, and p-value
    """
    if df_a.empty or df_b.empty:
        return {"correlation": 0.0, "lag": 0, "p_value": 1.0}

    returns_a = df_a["returns"].dropna()
    returns_b = df_b["returns"].dropna()

    # Find common dates
    common_idx = returns_a.index.intersection(returns_b.index)
    if len(common_idx) < 60:  # Need at least 60 observations
        return {"correlation": 0.0, "lag": 0, "p_value": 1.0}

    returns_a = returns_a.loc[common_idx]
    returns_b = returns_b.loc[common_idx]

    best_result = {"correlation": 0.0, "lag": 0, "p_value": 1.0, "n": len(common_idx)}

    # Test different lags
    for lag in range(max_lag + 1):
        if lag == 0:
            # No lag
            r_a = returns_a
            r_b = returns_b
        else:
            # B lags A by `lag` days
            r_a = returns_a[:-lag]
            r_b = returns_b[lag:]

        # Realign indices
        common = r_a.index.intersection(r_b.index)
        if len(common) < 60:
            continue

        r_a_aligned = r_a.loc[common]
        r_b_aligned = r_b.loc[common]

        # Calculate Pearson correlation
        corr, p_value = stats.pearsonr(r_a_aligned, r_b_aligned)

        # Keep track of best (strongest) correlation
        if abs(corr) > abs(best_result["correlation"]):
            best_result = {
                "correlation": float(corr),
                "lag": lag,
                "p_value": float(p_value),
                "n": len(common)
            }

    return best_result


def calculate_all_correlations(
    tickers: list[str],
    use_cache: bool = True,
    min_pairs: int = 100,
    period: str = "2y"
) -> list[dict]:
    """
    Calculate correlations for all stock pairs.

    Args:
        tickers: List of stock tickers
        use_cache: If True, load from cache if exists
        min_pairs: Minimum number of pairs to calculate
        period: Historical period to analyze

    Returns:
        List of correlation dicts
    """
    cache_file = Path("data/correlations.json")

    # Load from cache if exists
    if use_cache and cache_file.exists():
        print(f"Loading correlations from cache: {cache_file}")
        with open(cache_file) as f:
            cached = json.load(f)
        print(f"Loaded {len(cached)} correlations from cache")
        return cached

    print(f"Calculating correlations for {len(tickers)} stocks...")
    print(f"Period: {period}")
    print(f"This will take several minutes...")

    # Fetch all price data first (to reuse)
    print("\nFetching price data...")
    price_data = {}
    failed = []

    for i, ticker in enumerate(tickers, 1):
        print(f"  [{i}/{len(tickers)}] Fetching {ticker}...", end="")
        df = get_historical_prices(ticker, period=period)

        if not df.empty and len(df) > 60:
            price_data[ticker] = df
            print(f" ✓ ({len(df)} days)")
        else:
            failed.append(ticker)
            print(" ✗ (insufficient data)")

        # Small delay to avoid overwhelming Yahoo Finance
        time.sleep(0.1)

    print(f"\n✓ Loaded data for {len(price_data)} stocks")
    if failed:
        print(f"✗ Failed: {', '.join(failed)}")

    # Calculate correlations for all pairs
    print(f"\nCalculating correlations for pairs...")
    correlations = []

    valid_tickers = list(price_data.keys())
    all_pairs = list(combinations(valid_tickers, 2))

    # Limit to min_pairs if too many
    if len(all_pairs) > min_pairs * 2:
        print(f"Limiting to {min_pairs} pairs (out of {len(all_pairs)} possible)")
        # Prioritize major companies (earlier in list)
        pairs_to_calc = all_pairs[:min_pairs]
    else:
        pairs_to_calc = all_pairs

    for i, (ticker_a, ticker_b) in enumerate(pairs_to_calc, 1):
        if i % 20 == 0:
            print(f"  Progress: {i}/{len(pairs_to_calc)} pairs...")

        # Calculate both directions (A→B and B→A)
        for source, target in [(ticker_a, ticker_b), (ticker_b, ticker_a)]:
            result = calculate_lagged_correlation(
                price_data[source],
                price_data[target],
                max_lag=5
            )

            # Only keep statistically significant correlations
            # p < 0.01 for high confidence
            # |correlation| > 0.3 for practical significance
            if result["p_value"] < 0.01 and abs(result["correlation"]) > 0.3:
                correlations.append({
                    "source": source,
                    "target": target,
                    "correlation": round(result["correlation"], 3),
                    "lag_days": result["lag"],
                    "p_value": result["p_value"],
                    "n_observations": result["n"],
                    "period": period,
                    "calculated_at": datetime.now().isoformat(),
                })

    print(f"\n✓ Found {len(correlations)} significant correlations")

    # Sort by correlation strength
    correlations.sort(key=lambda x: -abs(x["correlation"]))

    # Save to cache
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_file, "w") as f:
        json.dump(correlations, f, indent=2)
    print(f"✓ Saved to cache: {cache_file}")

    return correlations


def print_summary(correlations: list[dict]) -> None:
    """Print summary statistics."""
    print("\n" + "=" * 60)
    print("CORRELATION ANALYSIS SUMMARY")
    print("=" * 60)

    print(f"\nTotal significant correlations: {len(correlations)}")
    print(f"  (p < 0.01 and |correlation| > 0.3)")

    # Distribution by lag
    lags = {}
    for corr in correlations:
        lag = corr["lag_days"]
        lags[lag] = lags.get(lag, 0) + 1

    print("\nBy lag (days):")
    for lag in sorted(lags.keys()):
        print(f"  {lag} day(s): {lags[lag]} correlations")

    # Positive vs negative
    positive = sum(1 for c in correlations if c["correlation"] > 0)
    negative = len(correlations) - positive
    print(f"\nDirection:")
    print(f"  Positive (move together): {positive}")
    print(f"  Negative (move opposite): {negative}")

    # Strongest correlations
    print(f"\nStrongest positive correlations:")
    positive_corrs = [c for c in correlations if c["correlation"] > 0]
    for corr in sorted(positive_corrs, key=lambda x: -x["correlation"])[:10]:
        print(
            f"  {corr['source']} → {corr['target']}: "
            f"{corr['correlation']:.3f} (lag: {corr['lag_days']}d, p={corr['p_value']:.4f})"
        )

    print(f"\nStrongest negative correlations:")
    negative_corrs = [c for c in correlations if c["correlation"] < 0]
    for corr in sorted(negative_corrs, key=lambda x: x["correlation"])[:10]:
        print(
            f"  {corr['source']} → {corr['target']}: "
            f"{corr['correlation']:.3f} (lag: {corr['lag_days']}d, p={corr['p_value']:.4f})"
        )


def main():
    """Main entry point."""
    print("Calculating stock price correlations...")
    print("=" * 60)

    # Use full TOP_100_TICKERS for comprehensive analysis
    # Previously limited to [:50], now using all 100 for 4,950 pairs
    tickers = TOP_100_TICKERS

    # Calculate correlations
    correlations = calculate_all_correlations(
        tickers,
        use_cache=True,
        min_pairs=2000,  # Calculate at least 2000 pairs (up from 200)
        period="2y"
    )

    # Print summary
    print_summary(correlations)

    print("\n" + "=" * 60)
    print("✓ Done! Correlations cached to data/correlations.json")
    print("=" * 60)


if __name__ == "__main__":
    main()
