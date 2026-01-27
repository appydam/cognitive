import { Card } from "@/components/ui/card";

export default function AccuracyPage() {
  return (
    <div className="min-h-screen bg-black tactical-grid">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-block bg-green-500/10 border border-green-500 text-green-400 px-4 py-1 military-font text-xs mb-4">
            ⬢ VALIDATION METRICS ⬢
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 terminal-text military-font">
            &gt; MODEL TRACK RECORD
          </h1>
          <p className="text-sm text-green-400/70 font-mono">
            VERIFIED PREDICTION ACCURACY | BACKTESTED AGAINST HISTORICAL DATA
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-black/50 border-green-500/30">
            <div className="text-sm text-green-400/70 font-mono mb-1">Direction Accuracy</div>
            <div className="text-4xl font-bold text-green-400">76.1%</div>
            <div className="text-sm text-green-400/50 font-mono mt-1">
              68/89 predictions
            </div>
          </Card>

          <Card className="p-6 bg-black/50 border-cyan-500/30">
            <div className="text-sm text-cyan-400/70 font-mono mb-1">Sample Size</div>
            <div className="text-4xl font-bold text-cyan-400">89</div>
            <div className="text-sm text-cyan-400/50 font-mono mt-1">
              Validated predictions
            </div>
          </Card>

          <Card className="p-6 bg-black/50 border-purple-500/30">
            <div className="text-sm text-purple-400/70 font-mono mb-1">Backtest Events</div>
            <div className="text-4xl font-bold text-purple-400">10</div>
            <div className="text-sm text-purple-400/50 font-mono mt-1">
              Historical earnings
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-8 bg-black/50 border-green-500/30">
          <h3 className="text-xl font-semibold mb-4 text-green-400 military-font">
            &gt; ACCURACY BY ORDER
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-green-400/90 font-mono">1st Order Effects</span>
                <span className="text-green-400 font-semibold font-mono">80.6%</span>
              </div>
              <div className="w-full bg-green-500/10 border border-green-500/30 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                  style={{ width: "80.6%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-cyan-400/90 font-mono">2nd Order Effects</span>
                <span className="text-cyan-400 font-semibold font-mono">71.0%</span>
              </div>
              <div className="w-full bg-cyan-500/10 border border-cyan-500/30 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full"
                  style={{ width: "71%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-yellow-400/90 font-mono">3rd Order Effects</span>
                <span className="text-yellow-400 font-semibold font-mono">64.3%</span>
              </div>
              <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full"
                  style={{ width: "64.3%" }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 text-green-400 military-font">
            &gt; METHODOLOGY
          </h3>
          <Card className="p-6 bg-black/50 border-green-500/30">
            <p className="text-green-400/80 font-mono text-sm mb-4 leading-relaxed">
              Our accuracy metrics are calculated from backtests on 10 historical
              earnings events from 2024-2025. We validate predictions by comparing
              predicted price movements against actual market data from Yahoo
              Finance.
            </p>
            <p className="text-green-400/80 font-mono text-sm mb-4 leading-relaxed">
              <strong className="text-cyan-400">Direction Accuracy:</strong> Percentage of predictions that
              correctly predicted the direction of price movement (up or down).
            </p>
            <p className="text-green-400/80 font-mono text-sm leading-relaxed">
              <strong className="text-yellow-400">Known Limitations:</strong> Yahoo Finance free API has data
              availability issues, so some predictions cannot be validated. We're
              working on integrating more reliable data sources.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
