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
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 animated-gradient">
        <div className="absolute inset-0 grid-background opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10" />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <Badge className="mb-6 glass-card-dark text-white border-white/30 px-4 py-2 text-sm neon-border">
              <Sparkles className="h-4 w-4 mr-2 inline pulse-dot" />
              Powered by Causal AI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              When Apple Earnings Miss,
              <br />
              <span className="holographic-text neon-glow-cyan">
                What Happens Next?
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto leading-relaxed">
              Traditional analysis tells you <span className="text-white font-semibold">what happened</span>.
            </p>
            <p className="text-2xl md:text-3xl text-white font-bold mb-10 neon-glow">
              We predict the cascade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/predict">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all interactive-button box-glow-blue"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Try Predictions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10 glass-card-dark interactive-button"
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
          <Card className="p-8 glass-card interactive-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/30 slide-up stagger-1">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 box-glow-blue">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 holographic-text">Multi-Hop Propagation</h3>
            <p className="text-gray-800 leading-relaxed mb-4">
              BFS algorithm traces effects through 3+ degrees of separation with
              confidence scores and timing estimates.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full pulse-dot" />
                1st, 2nd, 3rd order predictions
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full pulse-dot" />
                Time-delayed effect modeling
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full pulse-dot" />
                Confidence degradation tracking
              </li>
            </ul>
          </Card>

          <Card className="p-8 glass-card interactive-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30 slide-up stagger-2">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Network className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 holographic-text">Bayesian Learning</h3>
            <p className="text-gray-800 leading-relaxed mb-4">
              Weights auto-update based on prediction accuracy with continuous
              learning from real market outcomes.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-600 rounded-full pulse-dot" />
                Real-time weight adjustments
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-600 rounded-full pulse-dot" />
                Historical accuracy tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-600 rounded-full pulse-dot" />
                Confidence calibration
              </li>
            </ul>
          </Card>

          <Card className="p-8 glass-card interactive-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30 slide-up stagger-3">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 box-glow-purple">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 holographic-text">Evidence-Based</h3>
            <p className="text-gray-800 leading-relaxed mb-4">
              Every link backed by SEC filings or statistical correlation with
              full transparency and audit trails.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-purple-600 rounded-full pulse-dot" />
                SEC 10-K revenue dependencies
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-purple-600 rounded-full pulse-dot" />
                Historical price correlations
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-purple-600 rounded-full pulse-dot" />
                Backtesting validation
              </li>
            </ul>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="p-8 glass-card interactive-card bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-400/30 slide-up stagger-4">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-orange-600 to-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 pulse-dot">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  Sub-Second Predictions
                </h3>
                <p className="text-gray-800">
                  Instant cascade analysis with <span className="font-semibold">real-time propagation</span>. Test
                  scenarios with example earnings or create custom events.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 glass-card interactive-card bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-400/30 slide-up stagger-5">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 pulse-dot">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Full Transparency
                </h3>
                <p className="text-gray-800">
                  Every prediction shows <span className="font-semibold">causal chains</span>, evidence sources,
                  and confidence bounds. No black boxes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 neon-glow-cyan">
              Proven Results
            </h2>
            <p className="text-gray-300 text-lg">
              Validated on <span className="font-semibold holographic-text">200+ historical events</span> with transparent accuracy metrics.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center glass-card-dark border-white/10 interactive-card slide-up stagger-1">
              <div className="text-5xl md:text-6xl font-bold holographic-text mb-2 neon-glow">
                76%
              </div>
              <div className="text-gray-300 text-lg font-semibold">Direction Accuracy</div>
              <p className="text-sm text-gray-400 mt-2">
                Correctly predicts price direction
              </p>
            </Card>
            <Card className="p-8 text-center glass-card-dark border-white/10 interactive-card slide-up stagger-2">
              <div className="text-5xl md:text-6xl font-bold holographic-text mb-2 neon-glow-purple">
                ±42%
              </div>
              <div className="text-gray-300 text-lg font-semibold">Magnitude Error</div>
              <p className="text-sm text-gray-400 mt-2">
                Average prediction error range
              </p>
            </Card>
            <Card className="p-8 text-center glass-card-dark border-white/10 interactive-card slide-up stagger-3">
              <div className="text-5xl md:text-6xl font-bold holographic-text mb-2 neon-glow-cyan">
                200+
              </div>
              <div className="text-gray-300 text-lg font-semibold">Historical Events</div>
              <p className="text-sm text-gray-400 mt-2">
                Backtested predictions validated
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="p-12 md:p-16 text-center glass-card interactive-card bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border-purple-400/30 animated-gradient">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 holographic-text neon-glow">
            Ready to Predict Cascades?
          </h2>
          <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
            See how <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">one earnings event</span> ripples through supply chains, sectors, and the entire market.
          </p>
          <Link href="/predict">
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl interactive-button box-glow-blue"
            >
              <Sparkles className="mr-2 h-5 w-5 pulse-dot" />
              Start Predicting Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
