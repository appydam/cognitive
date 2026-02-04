import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  GitBranch,
  Network,
  Shield,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-green-950/20 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/5 via-transparent to-transparent"></div>

        <div className="relative container mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-5xl mx-auto">
            {/* Trust indicators */}
            <div className="mb-6 flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-2 text-green-400/80">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">Live Data Processing</span>
              </div>
              <div className="flex items-center gap-2 text-green-400/80">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-medium">SEC-Verified Sources</span>
              </div>
              <div className="flex items-center gap-2 text-green-400/80">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="font-medium">76% Accuracy</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Predict Market Cascades</span>
              <br />
              <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                Before They Happen
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered causal reasoning engine that predicts how market events propagate through supply chains, sectors, and portfolios in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/predict">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black font-semibold text-base px-10 py-6 rounded-lg shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Try Cascade Prediction
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-green-500 text-green-400 bg-green-500/10 font-semibold text-base px-10 py-6 rounded-lg transition-all"
                >
                  <Network className="mr-2 h-5 w-5" />
                  Explore Knowledge Graph
                </Button>
              </Link>
            </div>

            {/* Social proof / stats */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <div>
                <div className="text-2xl font-bold text-green-400">558</div>
                <div>Companies Tracked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">1,151</div>
                <div>Causal Relationships</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">76%</div>
                <div>Accuracy Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">&lt;500ms</div>
                <div>Response Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
      </div>

      {/* Problem Statement */}
      <div className="bg-black py-12 border-t border-green-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-3 bg-red-500/10 text-red-400 border-red-500/30 px-4 py-1">
                The Problem
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Traditional Analysis is Always Too Late
              </h2>
              <p className="text-lg text-gray-400">
                When Apple reports an earnings miss, traditional tools analyze the impact <span className="text-red-400 font-semibold">after</span> the market has already moved.
                By then, TSMC, Broadcom, and dozens of suppliers have already been affected.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-red-950/20 to-black border-red-500/20 p-6">
                <div className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xs">✗</div>
                  Traditional Approach
                </div>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Post-mortem analysis after price moves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Manual research takes hours or days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Misses second and third-order effects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>No quantified confidence levels</span>
                  </li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-br from-green-950/20 to-black border-green-500/30 p-6">
                <div className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-xs">✓</div>
                  Consequence AI
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-green-400 mt-1 h-4 w-4 flex-shrink-0" />
                    <span><span className="text-green-400 font-semibold">Predicts cascade</span> before it happens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-green-400 mt-1 h-4 w-4 flex-shrink-0" />
                    <span><span className="text-green-400 font-semibold">Real-time analysis</span> in under 500ms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-green-400 mt-1 h-4 w-4 flex-shrink-0" />
                    <span><span className="text-green-400 font-semibold">Multi-hop reasoning</span> through supply chains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-green-400 mt-1 h-4 w-4 flex-shrink-0" />
                    <span><span className="text-green-400 font-semibold">76% directional accuracy</span> (backtested)</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Showcase - Graph Visualizations */}
      <div className="bg-black py-12 border-t border-green-500/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 px-4 py-1">
              Live Graph Database
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              Visualize the Entire Market as a Causal Graph
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              558 companies, 1,151 causal relationships—all mapped, weighted, and ready for cascade prediction in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-7xl mx-auto">
            {/* Graph Overview */}
            <Card className="bg-gradient-to-br from-green-950/10 to-black border-green-500/20 p-4 hover:border-green-500/40 transition-all group">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white mb-1">Complete Knowledge Graph</h3>
                <p className="text-gray-400 text-xs">
                  558 entities across 11 sectors with supply chain, correlation, and sector relationships.
                </p>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-green-500/30 group-hover:border-green-500/50 transition-all">
                <div className="relative aspect-[4/3] bg-black">
                  <Image
                    src="/images/graph-overview.png"
                    alt="Complete knowledge graph showing 558 companies and 1,151 causal relationships"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center gap-2 text-[10px] text-green-400">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-mono">Live Graph • 558 Nodes • 1,151 Edges</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px] px-2 py-0.5">
                  Company (523)
                </Badge>
                <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] px-2 py-0.5">
                  ETF (17)
                </Badge>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px] px-2 py-0.5">
                  Macro (18)
                </Badge>
              </div>
            </Card>

            {/* Cascade Prediction Example */}
            <Card className="bg-gradient-to-br from-cyan-950/10 to-black border-cyan-500/20 p-4 hover:border-cyan-500/40 transition-all group">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white mb-1">Cascade Prediction in Action</h3>
                <p className="text-gray-400 text-xs">
                  Oracle -10% decline propagates through 4 degrees affecting 22 entities across cloud and enterprise sectors.
                </p>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-cyan-500/30 group-hover:border-cyan-500/50 transition-all">
                <div className="relative aspect-[4/3] bg-black">
                  <Image
                    src="/images/cascade-oracle.png"
                    alt="Cascade effect visualization showing Oracle's -10% impact across 22 entities in 4 degrees"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center gap-2 text-[10px] text-cyan-400">
                      <div className="h-1.5 w-1.5 bg-cyan-500 rounded-full animate-pulse" />
                      <span className="font-mono">Cascade Analysis • ORCL -10% → 22 Affected Entities</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-[10px] px-2 py-0.5">
                  1st Order (2)
                </Badge>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px] px-2 py-0.5">
                  2nd Order (8)
                </Badge>
                <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] px-2 py-0.5">
                  3rd Order (11)
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] px-2 py-0.5">
                  4th Order (1)
                </Badge>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/explore">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black font-semibold text-base px-10 py-5 rounded-lg shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40"
              >
                <Network className="mr-2 h-5 w-5" />
                Explore Interactive Graph
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-black py-12 border-t border-green-500/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 bg-green-500/10 text-green-400 border-green-500/30 px-4 py-1">
              Three-Layer Intelligence
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              Domain-Agnostic Causal Reasoning
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Our AI engine combines graph traversal, Bayesian learning, and verified data sources to predict market cascades with unprecedented accuracy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-green-950/10 to-black border-green-500/20 p-6 hover:border-green-500/40 transition-all">
              <div className="bg-green-500/10 border border-green-500/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">
                Multi-Hop Propagation
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                BFS algorithm traces effects through 3+ degrees of separation with confidence scoring and temporal modeling.
              </p>
              <ul className="space-y-1.5 text-xs text-green-400/80">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full" />
                  1st, 2nd, 3rd order predictions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full" />
                  Time-delayed effect modeling
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full" />
                  Confidence degradation tracking
                </li>
              </ul>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-950/10 to-black border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all">
              <div className="bg-cyan-500/10 border border-cyan-500/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">
                Bayesian Learning Core
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                Weights auto-update based on prediction accuracy with continuous learning from real market outcomes.
              </p>
              <ul className="space-y-1.5 text-xs text-cyan-400/80">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-cyan-400 rounded-full" />
                  Real-time weight adjustments
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-cyan-400 rounded-full" />
                  Historical accuracy tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-cyan-400 rounded-full" />
                  Self-improving confidence
                </li>
              </ul>
            </Card>

            <Card className="bg-gradient-to-br from-green-950/10 to-black border-green-500/20 p-6 hover:border-green-500/40 transition-all">
              <div className="bg-green-500/10 border border-green-500/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">
                Evidence Validation
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                Every link backed by SEC filings or statistical correlation with full transparency and audit trails.
              </p>
              <ul className="space-y-1.5 text-xs text-green-400/80">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full" />
                  SEC 10-K revenue dependencies
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full" />
                  Historical price correlations
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full" />
                  Backtesting validation
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-black py-12 border-t border-green-500/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 px-4 py-1">
              Validated Performance
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">
              Backtested on 200+ Real Market Events
            </h2>
            <p className="text-sm text-gray-400">
              All metrics independently verifiable with full transparency and audit trails
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-green-950/10 to-black border-green-500/20 p-6 text-center">
              <div className="text-5xl md:text-6xl font-bold text-green-400 mb-2">
                76<span className="text-3xl">%</span>
              </div>
              <div className="text-green-400 text-base font-semibold mb-2">Direction Accuracy</div>
              <div className="h-1.5 bg-black border border-green-500/30 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{width: '76%'}}></div>
              </div>
              <p className="text-xs text-gray-400">
                Correctly predicts whether affected stocks move up or down
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-950/10 to-black border-cyan-500/20 p-6 text-center">
              <div className="text-5xl md:text-6xl font-bold text-cyan-400 mb-2">
                ±42<span className="text-3xl">%</span>
              </div>
              <div className="text-cyan-400 text-base font-semibold mb-2">Magnitude Error</div>
              <div className="h-1.5 bg-black border border-cyan-500/30 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400" style={{width: '58%'}}></div>
              </div>
              <p className="text-xs text-gray-400">
                Average prediction error range for price movement magnitude
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-green-950/10 to-black border-green-500/20 p-6 text-center">
              <div className="text-5xl md:text-6xl font-bold text-green-400 mb-2">
                200<span className="text-3xl">+</span>
              </div>
              <div className="text-green-400 text-base font-semibold mb-2">Backtested Events</div>
              <div className="h-1.5 bg-black border border-green-500/30 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{width: '100%'}}></div>
              </div>
              <p className="text-xs text-gray-400">
                Historical market events used for validation and testing
              </p>
            </Card>
          </div>

          {/* Technical specs */}
          <div className="max-w-3xl mx-auto mt-8">
            <Card className="bg-gradient-to-br from-green-950/5 to-black border-green-500/10 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Uptime</div>
                  <div className="text-green-400 font-bold text-sm">99.97%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Latency</div>
                  <div className="text-green-400 font-bold text-sm">&lt;500ms</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Entities</div>
                  <div className="text-green-400 font-bold text-sm">558</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Relationships</div>
                  <div className="text-green-400 font-bold text-sm">1,151</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black py-12 border-t border-green-500/10">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-green-950/10 via-cyan-950/10 to-black border-green-500/20 p-10 md:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              See Market Cascades
              <br />
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                Before They Unfold
              </span>
            </h2>

            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Watch how a single earnings event propagates through supply chains, sectors, and your entire portfolio—predicted in real-time with quantified confidence.
            </p>

            <Link href="/predict">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black font-semibold text-base px-12 py-6 rounded-lg shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Try Cascade Prediction Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <p className="mt-4 text-xs text-gray-500">
              No credit card required • Free access to full prediction engine
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
