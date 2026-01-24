import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Network,
  Target,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  BarChart3,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Powered by Causal AI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Predict Cascading
              <br />
              <span className="bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent">
                Market Consequences
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              When one company reports earnings, what happens next? Our causal
              reasoning engine predicts multi-hop cascade effects across supply
              chains, sectors, and markets with explainable AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/predict">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Try Predictions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/graph">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Network className="mr-2 h-5 w-5" />
                  Explore Graph
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Three-Layer Causal Engine
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built on domain-agnostic causal reasoning infrastructure that learns
            from real data.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Cascade Predictions</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Predict 1st, 2nd, and 3rd order effects with confidence scores,
              timing estimates, and expected impact ranges.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                Multi-hop propagation algorithm
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                Time-delayed effect modeling
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                Confidence degradation by order
              </li>
            </ul>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in" style={{animationDelay: "100ms"}}>
            <div className="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Network className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Causal Graph</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Explore relationships between entities built from SEC filings and
              historical price correlations.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                Supplier dependency mapping
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                Sector interconnections
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                Directional strength weights
              </li>
            </ul>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in" style={{animationDelay: "200ms"}}>
            <div className="bg-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Evidence-Based</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Every prediction backed by transparent evidence and validated
              through backtesting.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-purple-600 rounded-full" />
                SEC 10-K filing analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-purple-600 rounded-full" />
                Statistical correlation tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-purple-600 rounded-full" />
                Bayesian weight updates
              </li>
            </ul>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="p-8 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-orange-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Real-Time Analysis</h3>
                <p className="text-gray-700">
                  Instant cascade predictions with sub-second latency. Test
                  scenarios with example earnings surprises or create your own.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Explainable AI</h3>
                <p className="text-gray-700">
                  Understand the "why" behind every prediction with causal
                  chains, evidence trails, and natural language explanations.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powered by Real Data
            </h2>
            <p className="text-gray-300 text-lg">
              Our causal graph is built from verified sources and continuously
              learning.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                25+
              </div>
              <div className="text-gray-300 text-lg">Entities</div>
              <p className="text-sm text-gray-400 mt-2">
                Companies, ETFs, and sectors
              </p>
            </Card>
            <Card className="p-8 text-center bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                32+
              </div>
              <div className="text-gray-300 text-lg">Verified Links</div>
              <p className="text-sm text-gray-400 mt-2">
                Causal relationships with evidence
              </p>
            </Card>
            <Card className="p-8 text-center bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                76%
              </div>
              <div className="text-gray-300 text-lg">Backtest Accuracy</div>
              <p className="text-sm text-gray-400 mt-2">
                Direction accuracy on historical events
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="p-12 md:p-16 text-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-purple-200">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to See the Cascade?
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Try predicting cascade effects for any earnings surprise scenario.
            See how one event ripples through the entire market.
          </p>
          <Link href="/predict">
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Predicting Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
