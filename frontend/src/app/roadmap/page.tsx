'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, Loader } from 'lucide-react';

export default function RoadmapPage() {
  const features = [
    {
      category: 'CORE INTELLIGENCE',
      items: [
        { name: 'Causal Graph Database', status: 'live' as const, description: 'Real-time entity relationship mapping with 3rd-order cascade detection' },
        { name: 'Earnings Cascade Prediction', status: 'live' as const, description: 'AI-powered propagation engine with confidence scoring' },
        { name: 'Interactive Graph Explorer', status: 'live' as const, description: 'Force-directed visualization with causal chain highlighting' },
      ]
    },
    {
      category: 'REAL-TIME SYSTEMS',
      items: [
        { name: 'Live Earnings Alert System', status: 'building' as const, description: 'WebSocket-based instant cascade notifications for earnings events as they occur' },
        { name: 'Historical Backtesting Engine', status: 'building' as const, description: 'Validate model accuracy across 1000+ past events with ROI simulation' },
      ]
    },
    {
      category: 'FUTURE VISION',
      items: [
        { name: 'Portfolio Impact Scanner', status: 'planned' as const, description: 'Analyze how specific earnings events affect your entire portfolio' },
        { name: 'Multi-Event Interference Analysis', status: 'planned' as const, description: 'Detect when multiple earnings events create compounding or canceling effects' },
        { name: 'Alternative Event Types', status: 'planned' as const, description: 'Expand beyond earnings to M&A, regulatory changes, macro events, supply chain disruptions' },
        { name: 'Causal Database API', status: 'planned' as const, description: 'Standalone graph database product for institutional quant teams' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black tactical-grid scanlines">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12 text-center slide-up">
          <div className="inline-block bg-cyan-500/10 border border-cyan-500 text-cyan-400 px-4 py-1 military-font text-xs mb-6">
            ⬢ DEVELOPMENT ROADMAP ⬢
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 terminal-text military-font">
            &gt; BUILDING THE FUTURE OF<br />CAUSAL INTELLIGENCE
          </h1>
          <p className="text-base text-green-400/70 font-mono max-w-2xl mx-auto leading-relaxed">
            We&apos;re not just building a product—we&apos;re creating the foundational infrastructure for
            understanding cause-and-effect in financial markets. Our vision extends beyond cascade
            predictions to a fully decoupled causal reasoning platform that the entire industry can build on.
          </p>
        </div>

        <Card className="mb-12 p-8 hud-panel border-green-500/30 bg-gradient-to-br from-green-500/5 to-cyan-500/5">
          <h2 className="text-2xl font-bold text-green-400 military-font mb-4">
            OUR COMMITMENT
          </h2>
          <div className="space-y-3 text-sm text-green-400/80 font-mono leading-relaxed">
            <p>
              <strong className="text-green-400">Radical Transparency:</strong> This roadmap is updated
              in real-time. When a feature ships, it moves to &quot;LIVE&quot; immediately. No marketing fluff.
            </p>
            <p>
              <strong className="text-green-400">Open Architecture:</strong> We&apos;re building Consequence AI
              as a loosely coupled system. The causal graph database will be released as a standalone
              product—because great infrastructure should be accessible to everyone building in this space.
            </p>
            <p>
              <strong className="text-green-400">Evidence-Based Development:</strong> Every feature on this
              roadmap is backed by user research, academic literature, or institutional feedback. We build
              what moves the needle, not what looks impressive in demos.
            </p>
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

        <Card className="mt-12 p-8 hud-panel border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔓</div>
            <div>
              <h3 className="text-xl font-bold text-yellow-400 military-font mb-3">
                THE CAUSAL DATABASE: OPEN INFRASTRUCTURE FOR EVERYONE
              </h3>
              <p className="text-sm text-yellow-400/80 font-mono leading-relaxed mb-4">
                We believe causal reasoning infrastructure shouldn&apos;t be locked behind a single application.
                That&apos;s why we&apos;re architecting our system to release the <strong>Causal Graph Database</strong> as
                a standalone, open product.
              </p>
              <div className="space-y-2 text-xs text-yellow-400/70 font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>Plug-and-play graph database with entity relationships, propagation rules, and confidence scoring</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>RESTful API + GraphQL interface for maximum flexibility</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>Designed for hedge funds, quant teams, and fintech builders who want causality without reinventing the wheel</span>
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
