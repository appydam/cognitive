import { Card } from "@/components/ui/card";

export default function AccuracyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Model Track Record</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Direction Accuracy</div>
          <div className="text-4xl font-bold text-green-600">76.1%</div>
          <div className="text-sm text-gray-500 mt-1">
            68/89 predictions
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Sample Size</div>
          <div className="text-4xl font-bold">89</div>
          <div className="text-sm text-gray-500 mt-1">
            Validated predictions
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Backtest Events</div>
          <div className="text-4xl font-bold">10</div>
          <div className="text-sm text-gray-500 mt-1">
            Historical earnings
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Accuracy by Order</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">1st Order Effects</span>
              <span className="text-green-600 font-semibold">80.6%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: "80.6%" }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">2nd Order Effects</span>
              <span className="text-green-600 font-semibold">71.0%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: "71%" }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">3rd Order Effects</span>
              <span className="text-yellow-600 font-semibold">64.3%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: "64.3%" }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Methodology</h3>
        <Card className="p-6">
          <p className="text-gray-700 mb-4">
            Our accuracy metrics are calculated from backtests on 10 historical
            earnings events from 2024-2025. We validate predictions by comparing
            predicted price movements against actual market data from Yahoo
            Finance.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Direction Accuracy:</strong> Percentage of predictions that
            correctly predicted the direction of price movement (up or down).
          </p>
          <p className="text-gray-700">
            <strong>Known Limitations:</strong> Yahoo Finance free API has data
            availability issues, so some predictions cannot be validated. We're
            working on integrating more reliable data sources.
          </p>
        </Card>
      </div>
    </div>
  );
}
