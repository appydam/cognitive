'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, Loader } from 'lucide-react';

export default function RoadmapPage() {
  const features = [
    {
      category: 'CORE INTELLIGENCE ✅',
      items: [
        { name: 'Causal Graph Database', status: 'live' as const, description: '558 entities, 1,151 relationships with multi-order cascade detection (live in production)' },
        { name: 'Cascade Prediction Engine', status: 'live' as const, description: 'BFS-based propagation with confidence scoring and 4-degree effects (76% direction accuracy)' },
        { name: 'Interactive Graph Explorer', status: 'live' as const, description: 'Force-directed 3D visualization with relationship filtering and entity search' },
        { name: 'Macro Indicators Layer', status: 'live' as const, description: '12 macro indicators (10Y yields, VIX, DXY, Bitcoin) with correlation mapping' },
        { name: 'Professional Landing Page', status: 'live' as const, description: 'Enterprise-grade design with trust indicators and graph visualizations' },
      ]
    },
    {
      category: 'DATA & INTELLIGENCE 🔧',
      items: [
        { name: 'SEC Filing Integration', status: 'live' as const, description: 'Automated 10-K parsing for verified supply chain relationships' },
        { name: 'Earnings Calendar System', status: 'live' as const, description: 'Upcoming earnings with cascade impact previews and historical data' },
        { name: 'Portfolio Analysis', status: 'live' as const, description: 'Real-time cascade impact analysis for custom portfolios with sector breakdown' },
        { name: 'Trade Signals Dashboard', status: 'live' as const, description: 'Automated signals based on cascade predictions with confidence thresholds' },
        { name: 'Alert System', status: 'live' as const, description: 'Real-time notifications for earnings and cascade events with customizable triggers' },
      ]
    },
    {
      category: 'ACCURACY & VALIDATION 🎯',
      items: [
        { name: 'Historical Backtesting', status: 'live' as const, description: '200+ backtested events with 76% direction accuracy validation' },
        { name: 'Accuracy Tracking Dashboard', status: 'building' as const, description: 'Real-time validation of predictions vs actual market movements (in testing)' },
        { name: 'Confidence Calibration', status: 'building' as const, description: 'Bayesian learning from outcomes to improve prediction confidence over time' },
      ]
    },
    {
      category: 'SCALE & PERFORMANCE 🚀',
      items: [
        { name: 'Knowledge Base Expansion', status: 'building' as const, description: 'Automated relationship discovery using NewsAPI, Finnhub (target: 500+ relationships)' },
        { name: 'Sub-Second Query Performance', status: 'planned' as const, description: 'Optimize graph traversal for <500ms response time at 10,000+ entities' },
        { name: 'Real-Time WebSocket Alerts', status: 'planned' as const, description: 'Live cascade notifications as earnings are released (not batch-processed)' },
      ]
    },
    {
      category: 'ENTERPRISE FEATURES 💼',
      items: [
        { name: 'Multi-Event Interference', status: 'planned' as const, description: 'Detect when multiple earnings create compounding or canceling cascade effects' },
        { name: 'Custom Entity Groups', status: 'planned' as const, description: 'User-defined sectors and relationships for specialized analysis' },
        { name: 'API Access & SDKs', status: 'planned' as const, description: 'RESTful API + Python/JS SDKs for programmatic access' },
        { name: 'White-Label Deployment', status: 'planned' as const, description: 'On-premise or private cloud deployment for institutional clients' },
      ]
    },
    {
      category: 'BEYOND MARKETS 🌍',
      items: [
        { name: 'Supply Chain Risk Intelligence', status: 'planned' as const, description: 'Map 10,000+ entity supply chains with real-time disruption monitoring' },
        { name: 'Healthcare Treatment Support', status: 'planned' as const, description: 'Medical knowledge graph with drug interactions and cascade effects' },
        { name: 'Policy Impact Simulation', status: 'planned' as const, description: 'Predict regulatory change cascades across industries and regions' },
        { name: 'Multi-Domain Adapters', status: 'planned' as const, description: 'Plugin architecture for custom domain knowledge graphs' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black tactical-grid scanlines">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12 text-center slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-400">Product Roadmap</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Building the Future of<br />Causal Intelligence
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From market cascade predictions to domain-agnostic reasoning infrastructure—track our progress from MVP to enterprise platform.
          </p>
        </div>

        <Card className="mb-12 p-6 bg-gradient-to-br from-green-950/10 to-black border-green-500/20">
          <h2 className="text-xl font-bold text-white mb-4">
            Our Development Principles
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-green-400 font-semibold mb-2">🎯 Radical Transparency</div>
              <p className="text-gray-400 leading-relaxed">
                This roadmap updates in real-time. Features move to "LIVE" immediately when shipped. No marketing fluff.
              </p>
            </div>
            <div>
              <div className="text-green-400 font-semibold mb-2">🏗️ Open Architecture</div>
              <p className="text-gray-400 leading-relaxed">
                Building modular, domain-agnostic infrastructure that others can build on top of.
              </p>
            </div>
            <div>
              <div className="text-green-400 font-semibold mb-2">📊 Evidence-Based</div>
              <p className="text-gray-400 leading-relaxed">
                Every feature backed by research, backtesting, or institutional feedback—not demo appeal.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-8">
          {features.map((category, idx) => (
            <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <h3 className="text-xl font-bold text-cyan-400 military-font mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.items.map((item, itemIdx) => (
                  <FeatureCard key={itemIdx} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card className="mt-12 p-8 bg-gradient-to-br from-cyan-950/10 to-black border-cyan-500/20">
          <div className="flex items-start gap-6">
            <div className="text-5xl">🌍</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-3">
                Beyond Markets: The Reasoning Infrastructure Vision
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Financial markets are our proof of concept. Our ultimate vision is domain-agnostic causal reasoning infrastructure that works across supply chains, healthcare, policy, and any complex interconnected system.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-black/40 p-4 rounded border border-green-500/20">
                  <div className="text-green-400 font-semibold mb-2">Today: Market Cascades</div>
                  <p className="text-gray-400">
                    558 entities, 1,151 relationships, 76% accuracy predicting earnings cascade effects
                  </p>
                </div>
                <div className="bg-black/40 p-4 rounded border border-cyan-500/20">
                  <div className="text-cyan-400 font-semibold mb-2">Tomorrow: Universal Reasoning</div>
                  <p className="text-gray-400">
                    Plug-and-play causal engine for any domain requiring multi-hop propagation analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-xs text-green-400/50 font-mono">
            Last updated: {new Date().toLocaleDateString()} • Built with transparency by the Consequence AI team
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ name, status, description }: {
  name: string;
  status: 'live' | 'building' | 'planned';
  description: string;
}) {
  const statusConfig = {
    live: {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      badge: 'LIVE',
      badgeClass: 'bg-green-500/20 text-green-400 border-green-400/50',
      borderClass: 'border-green-500/30',
    },
    building: {
      icon: <Loader className="w-5 h-5 text-yellow-400 animate-spin" />,
      badge: 'IN PROGRESS',
      badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50',
      borderClass: 'border-yellow-500/30',
    },
    planned: {
      icon: <Circle className="w-5 h-5 text-cyan-400/50" />,
      badge: 'PLANNED',
      badgeClass: 'bg-cyan-500/10 text-cyan-400/60 border-cyan-400/30',
      borderClass: 'border-cyan-500/20',
    },
  };

  const config = statusConfig[status];

  return (
    <Card className={`p-4 hud-panel ${config.borderClass} hover:bg-black/40 transition-all`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-bold text-green-400">{name}</h4>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${config.badgeClass}`}>
              {config.badge}
            </span>
          </div>
          <p className="text-xs text-green-400/60 font-mono leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}
