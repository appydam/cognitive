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
    <div className="min-h-screen bg-black">
      {/* Hero Section - Military Command Center */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-green-950 to-black scanlines tactical-grid">
        {/* Classified header */}
        <div className="classified-header">
          ⬤ CLASSIFIED - CAUSAL INTELLIGENCE SYSTEM - CLEARANCE LEVEL 5 ⬤
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-5xl mx-auto">
            {/* System status */}
            <div className="mb-6 flex justify-center gap-8 military-font text-xs">
              <div className="status-indicator text-green-400">SYSTEM ONLINE</div>
              <div className="status-indicator text-green-400">AI CORE ACTIVE</div>
              <div className="status-indicator text-green-400">NETWORK SECURE</div>
            </div>

            <div className="hud-panel p-8 mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 terminal-text military-font leading-tight">
                &gt; INITIALIZE CASCADE PREDICTION
                <br />
                <span className="text-3xl md:text-5xl text-cyan-400">
                  &gt; QUANTUM CAUSAL ANALYSIS_
                </span>
              </h1>

              <div className="bg-black/60 border border-green-500/30 p-6 mb-6 font-mono text-sm text-green-400 text-left">
                <div className="mb-2">&gt; MISSION BRIEF:</div>
                <div className="ml-4 mb-3">
                  WHEN: [AAPL] EARNINGS MISS -8.0%<br />
                  WHAT: TRADITIONAL INTEL = POST-MORTEM ANALYSIS<br />
                  <span className="text-red-400 font-bold">
                    CRITICAL: WE PREDICT THE CASCADE BEFORE IT HAPPENS
                  </span>
                </div>
                <div className="text-cyan-400 animate-pulse">
                  &gt; MULTI-HOP PROPAGATION ENGINE: [ACTIVE]<br />
                  &gt; BAYESIAN LEARNING CORE: [ONLINE]<br />
                  &gt; CONFIDENCE THRESHOLD: [76% DIRECTIONAL ACCURACY]
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/predict">
                <Button
                  size="lg"
                  className="tactical-button text-base px-10 py-7 shadow-xl"
                >
                  <Target className="mr-2 h-5 w-5" />
                  ENGAGE PREDICTION SYSTEM
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button
                  size="lg"
                  variant="outline"
                  className="tactical-button text-base px-10 py-7"
                >
                  <Network className="mr-2 h-5 w-5" />
                  ACCESS GRAPH DATABASE
                </Button>
              </Link>
            </div>

            {/* Threat level indicator */}
            <div className="mt-8 text-xs military-font text-green-400/60">
              THREAT ANALYSIS LEVEL: <span className="text-yellow-400">ELEVATED</span> |
              PREDICTION CORES: <span className="text-green-400">3/3</span> |
              UPTIME: <span className="text-green-400">99.97%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black tactical-grid py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="mb-4 inline-block bg-green-500/10 border border-green-500 text-green-400 px-6 py-2 military-font text-sm">
              ⬢ SYSTEM ARCHITECTURE ⬢
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 terminal-text military-font">
              &gt; THREE-LAYER INTELLIGENCE ENGINE
            </h2>
            <p className="text-xl text-green-400/70 max-w-2xl mx-auto font-mono">
              DOMAIN-AGNOSTIC CAUSAL REASONING INFRASTRUCTURE<br />
              REAL-TIME LEARNING FROM LIVE MARKET DATA
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="hud-panel p-8 hud-corners slide-up stagger-1 hover:border-green-400 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-500/20 border-2 border-green-500 w-14 h-14 flex items-center justify-center target-reticle">
                  <TrendingUp className="h-7 w-7 text-green-400" />
                </div>
                <div className="text-xs military-font text-green-400/60">
                  MODULE_001<br />STATUS: ACTIVE
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 terminal-text military-font">
                &gt; MULTI-HOP PROPAGATION
              </h3>
              <p className="text-green-300/80 leading-relaxed mb-4 font-mono text-sm">
                BFS ALGORITHM TRACES EFFECTS THROUGH 3+ DEGREES OF SEPARATION.
                CONFIDENCE SCORING AND TEMPORAL MODELING ENABLED.
              </p>
              <ul className="space-y-2 text-xs text-green-400 font-mono">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full pulse-dot" />
                  1ST, 2ND, 3RD ORDER PREDICTIONS
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full pulse-dot" />
                  TIME-DELAYED EFFECT MODELING
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-green-400 rounded-full pulse-dot" />
                  CONFIDENCE DEGRADATION TRACKING
                </li>
              </ul>
            </Card>

            <Card className="hud-panel p-8 hud-corners slide-up stagger-2 hover:border-cyan-400 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-cyan-500/20 border-2 border-cyan-500 w-14 h-14 flex items-center justify-center target-reticle">
                  <Network className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="text-xs military-font text-cyan-400/60">
                  MODULE_002<br />STATUS: ACTIVE
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-cyan-400 military-font">
                &gt; BAYESIAN LEARNING CORE
              </h3>
              <p className="text-cyan-300/80 leading-relaxed mb-4 font-mono text-sm">
                WEIGHTS AUTO-UPDATE BASED ON PREDICTION ACCURACY. CONTINUOUS
                LEARNING FROM REAL MARKET OUTCOMES.
              </p>
              <ul className="space-y-2 text-xs text-cyan-400 font-mono">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-cyan-400 rounded-full pulse-dot" />
                  REAL-TIME WEIGHT ADJUSTMENTS
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-cyan-400 rounded-full pulse-dot" />
                  HISTORICAL ACCURACY TRACKING
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-cyan-400 rounded-full pulse-dot" />
                  CONFIDENCE CALIBRATION
                </li>
              </ul>
            </Card>

            <Card className="hud-panel p-8 hud-corners slide-up stagger-3 hover:border-yellow-400 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-500/20 border-2 border-yellow-500 w-14 h-14 flex items-center justify-center target-reticle">
                  <Shield className="h-7 w-7 text-yellow-400" />
                </div>
                <div className="text-xs military-font text-yellow-400/60">
                  MODULE_003<br />STATUS: ACTIVE
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-yellow-400 military-font">
                &gt; EVIDENCE VALIDATION
              </h3>
              <p className="text-yellow-300/80 leading-relaxed mb-4 font-mono text-sm">
                EVERY LINK BACKED BY SEC FILINGS OR STATISTICAL CORRELATION.
                FULL TRANSPARENCY AND AUDIT TRAILS.
              </p>
              <ul className="space-y-2 text-xs text-yellow-400 font-mono">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-yellow-400 rounded-full pulse-dot" />
                  SEC 10-K REVENUE DEPENDENCIES
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-yellow-400 rounded-full pulse-dot" />
                  HISTORICAL PRICE CORRELATIONS
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-yellow-400 rounded-full pulse-dot" />
                  BACKTESTING VALIDATION
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section - Mission Performance */}
      <div className="bg-black scanlines tactical-grid py-20 relative overflow-hidden border-t-2 border-green-500/30">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block bg-red-500/10 border border-red-500 text-red-400 px-6 py-2 military-font text-xs mb-4">
              ⬢ MISSION PERFORMANCE METRICS ⬢
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 terminal-text military-font">
              &gt; COMBAT-TESTED ACCURACY
            </h2>
            <p className="text-green-400/70 text-sm font-mono">
              VALIDATED ON 200+ HISTORICAL EVENTS | LIVE MARKET CONDITIONS<br />
              FULL TRANSPARENCY | ALL METRICS AUDITABLE
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="hud-panel p-8 text-center cyber-border slide-up stagger-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
              <div className="text-xs military-font text-green-400/60 mb-2">METRIC_A</div>
              <div className="text-6xl md:text-7xl font-bold terminal-text mb-2">
                76<span className="text-4xl">%</span>
              </div>
              <div className="text-green-400 text-sm font-mono mb-2">DIRECTION ACCURACY</div>
              <div className="h-2 bg-black border border-green-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{width: '76%'}}></div>
              </div>
              <p className="text-xs text-green-400/60 mt-3 font-mono">
                CORRECTLY PREDICTS PRICE DIRECTION
              </p>
            </Card>

            <Card className="hud-panel p-8 text-center cyber-border slide-up stagger-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
              <div className="text-xs military-font text-cyan-400/60 mb-2">METRIC_B</div>
              <div className="text-6xl md:text-7xl font-bold text-cyan-400 mb-2">
                ±42<span className="text-4xl">%</span>
              </div>
              <div className="text-cyan-400 text-sm font-mono mb-2">MAGNITUDE ERROR</div>
              <div className="h-2 bg-black border border-cyan-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400" style={{width: '58%'}}></div>
              </div>
              <p className="text-xs text-cyan-400/60 mt-3 font-mono">
                AVERAGE PREDICTION ERROR RANGE
              </p>
            </Card>

            <Card className="hud-panel p-8 text-center cyber-border slide-up stagger-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
              <div className="text-xs military-font text-yellow-400/60 mb-2">METRIC_C</div>
              <div className="text-6xl md:text-7xl font-bold text-yellow-400 mb-2">
                200<span className="text-4xl">+</span>
              </div>
              <div className="text-yellow-400 text-sm font-mono mb-2">VALIDATED EVENTS</div>
              <div className="h-2 bg-black border border-yellow-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400" style={{width: '100%'}}></div>
              </div>
              <p className="text-xs text-yellow-400/60 mt-3 font-mono">
                BACKTESTED PREDICTIONS
              </p>
            </Card>
          </div>

          {/* System status readout */}
          <div className="hud-panel p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="text-center">
                <div className="text-green-400/60">UPTIME</div>
                <div className="text-green-400 font-bold">99.97%</div>
              </div>
              <div className="text-center">
                <div className="text-green-400/60">LATENCY</div>
                <div className="text-green-400 font-bold">&lt;500ms</div>
              </div>
              <div className="text-center">
                <div className="text-green-400/60">ENTITIES</div>
                <div className="text-green-400 font-bold">105 NODES</div>
              </div>
              <div className="text-center">
                <div className="text-green-400/60">LINKS</div>
                <div className="text-green-400 font-bold">160 EDGES</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Mission Deployment */}
      <div className="bg-black tactical-grid py-20">
        <div className="container mx-auto px-4">
          <Card className="hud-panel p-12 md:p-16 text-center cyber-border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 via-cyan-500 to-transparent"></div>

            <div className="mb-6">
              <div className="inline-block bg-green-500/10 border border-green-500 text-green-400 px-6 py-2 military-font text-xs mb-4">
                ⬢ DEPLOYMENT AUTHORIZATION REQUIRED ⬢
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 terminal-text military-font">
              &gt; INITIATE CASCADE PREDICTION<br />
              <span className="text-cyan-400">&gt; MISSION READY_</span>
            </h2>

            <p className="text-lg text-green-400/80 mb-8 max-w-2xl mx-auto font-mono">
              OBSERVE HOW A SINGLE EARNINGS EVENT PROPAGATES THROUGH<br />
              <span className="text-cyan-400">SUPPLY CHAINS → SECTORS → ENTIRE MARKET</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/predict">
                <Button
                  size="lg"
                  className="tactical-button text-base px-12 py-7 relative group"
                >
                  <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Target className="mr-2 h-5 w-5" />
                  DEPLOY PREDICTION ENGINE
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 text-xs military-font text-green-400/50 font-mono">
              CLEARANCE LEVEL: PUBLIC | DEPLOYMENT STATUS: AUTHORIZED | MISSION: GO
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
