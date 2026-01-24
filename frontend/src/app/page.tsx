import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Network, Target } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">
          Understand Cascading Consequences
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          When one company reports earnings, what happens next? Our causal
          reasoning engine predicts cascade effects across supply chains,
          sectors, and markets.
        </p>
        <Link href="/predict">
          <Button size="lg" className="text-lg px-8 py-6">
            Try Predictions
          </Button>
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="p-6">
          <TrendingUp className="h-12 w-12 mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Cascade Predictions</h3>
          <p className="text-gray-600">
            Predict 1st, 2nd, and 3rd order effects with confidence scores and
            timing estimates.
          </p>
        </Card>

        <Card className="p-6">
          <Network className="h-12 w-12 mb-4 text-green-600" />
          <h3 className="text-xl font-semibold mb-2">Causal Graph</h3>
          <p className="text-gray-600">
            Explore relationships between 25+ entities with verified supplier
            dependencies.
          </p>
        </Card>

        <Card className="p-6">
          <Target className="h-12 w-12 mb-4 text-purple-600" />
          <h3 className="text-xl font-semibold mb-2">Evidence-Based</h3>
          <p className="text-gray-600">
            Every prediction backed by SEC filings, historical correlations, and
            Bayesian learning.
          </p>
        </Card>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-8 grid md:grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-4xl font-bold text-blue-600">25+</div>
          <div className="text-gray-600">Entities</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-green-600">32+</div>
          <div className="text-gray-600">Verified Links</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-purple-600">76%</div>
          <div className="text-gray-600">Backtest Accuracy</div>
        </div>
      </div>
    </div>
  );
}
