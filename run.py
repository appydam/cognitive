#!/usr/bin/env python3
"""
Run the Consequence AI demo server.

Usage:
    python run.py              # Run API server only
    python run.py --demo       # Run demo (CLI output)
    python run.py --backtest   # Run backtests
"""

import sys
import argparse
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))


def run_api():
    """Run the FastAPI server."""
    import uvicorn
    print("Starting Consequence AI API server...")
    print("API will be available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")
    print("\nOpen web/index.html in your browser for the demo UI")
    print("(You can use 'python -m http.server 3000 -d web' to serve it)")
    print("\nPress Ctrl+C to stop\n")

    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


def run_demo():
    """Run the CLI demo."""
    from scripts.demo import main
    main()


def run_backtest():
    """Run backtests on historical data."""
    from graph.builders import build_initial_graph
    from validation import run_standard_backtest, save_backtest_results

    print("Building causal graph...")
    graph = build_initial_graph()

    print("\nRunning backtests on historical events...")
    print("This will fetch actual price data from Yahoo Finance.\n")

    suite = run_standard_backtest(graph)

    print("\n" + "=" * 60)
    print(suite.summary())

    # Save results
    output_path = Path("data/backtest_results.json")
    save_backtest_results(suite, output_path)
    print(f"\nResults saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Run Consequence AI")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run CLI demo instead of API server",
    )
    parser.add_argument(
        "--backtest",
        action="store_true",
        help="Run backtests on historical data",
    )

    args = parser.parse_args()

    if args.demo:
        run_demo()
    elif args.backtest:
        run_backtest()
    else:
        run_api()


if __name__ == "__main__":
    main()
