"use client";

import { useState } from "react";
import {
  Database,
  Globe,
  Server,
  Cpu,
  Network,
  GitBranch,
  Box,
  BarChart3,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

export default function ArchitecturePage() {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">System Design</h1>
                <p className="text-sm text-slate-600">Consequence AI Architecture</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700">
                529 Entities
              </div>
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700">
                341 Links
              </div>
              <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700">
                &lt;100ms Response
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Diagram */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Request Flow Diagram */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Request Flow</h2>

          <div className="relative">
            {/* Horizontal connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-300 -translate-y-1/2 hidden lg:block" style={{ top: "120px" }} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative z-10">
              {/* Client */}
              <div
                className={`bg-white border-2 rounded-lg p-4 transition-all ${
                  hoveredComponent === "client"
                    ? "border-blue-500 shadow-lg shadow-blue-500/20"
                    : "border-slate-200"
                }`}
                onMouseEnter={() => setHoveredComponent("client")}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Client</div>
                    <div className="text-xs text-slate-500">Browser</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>• React 19</div>
                  <div>• WebSocket</div>
                  <div>• Cache (6hr)</div>
                </div>
              </div>

              {/* CDN */}
              <div
                className={`bg-white border-2 rounded-lg p-4 transition-all ${
                  hoveredComponent === "cdn"
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "border-slate-200"
                }`}
                onMouseEnter={() => setHoveredComponent("cdn")}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-cyan-100 rounded flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">CDN</div>
                    <div className="text-xs text-slate-500">Vercel Edge</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>• Next.js 16</div>
                  <div>• SSR + RSC</div>
                  <div>• Global edge</div>
                </div>
              </div>

              {/* API Gateway */}
              <div
                className={`bg-white border-2 rounded-lg p-4 transition-all ${
                  hoveredComponent === "api"
                    ? "border-green-500 shadow-lg shadow-green-500/20"
                    : "border-slate-200"
                }`}
                onMouseEnter={() => setHoveredComponent("api")}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <Server className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">API Gateway</div>
                    <div className="text-xs text-slate-500">FastAPI</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>• Python 3.13</div>
                  <div>• 18 endpoints</div>
                  <div>• Async I/O</div>
                </div>
              </div>

              {/* Engine */}
              <div
                className={`bg-white border-2 rounded-lg p-4 transition-all ${
                  hoveredComponent === "engine"
                    ? "border-amber-500 shadow-lg shadow-amber-500/20"
                    : "border-slate-200"
                }`}
                onMouseEnter={() => setHoveredComponent("engine")}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Engine</div>
                    <div className="text-xs text-slate-500">BFS Core</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>• Graph BFS</div>
                  <div>• Decay logic</div>
                  <div>• 4 orders deep</div>
                </div>
              </div>

              {/* Database */}
              <div
                className={`bg-white border-2 rounded-lg p-4 transition-all ${
                  hoveredComponent === "db"
                    ? "border-purple-500 shadow-lg shadow-purple-500/20"
                    : "border-slate-200"
                }`}
                onMouseEnter={() => setHoveredComponent("db")}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <Database className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Database</div>
                    <div className="text-xs text-slate-500">PostgreSQL</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>• 8 tables</div>
                  <div>• ACID</div>
                  <div>• Daily backup</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Components */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Core Components</h2>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: In-Memory Graph */}
            <div className="border-2 border-purple-200 rounded-xl bg-purple-50/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">In-Memory Graph</h3>
                  <p className="text-sm text-slate-600">CausalGraph data structure</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">529</div>
                  <div className="text-xs text-slate-600">Entities</div>
                  <div className="text-xs text-slate-500">512 companies, 17 ETFs</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">341</div>
                  <div className="text-xs text-slate-600">Relationships</div>
                  <div className="text-xs text-slate-500">4 types, avg 1.3 degree</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Relationship Breakdown</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2 border border-purple-100">
                    <span className="text-sm text-slate-700">Correlated</span>
                    <span className="font-semibold text-purple-600">184</span>
                  </div>
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2 border border-purple-100">
                    <span className="text-sm text-slate-700">In Sector</span>
                    <span className="font-semibold text-purple-600">86</span>
                  </div>
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2 border border-purple-100">
                    <span className="text-sm text-slate-700">Competes With</span>
                    <span className="font-semibold text-purple-600">36</span>
                  </div>
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2 border border-purple-100">
                    <span className="text-sm text-slate-700">Customer Of</span>
                    <span className="font-semibold text-purple-600">35</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: BFS Algorithm */}
            <div className="border-2 border-amber-200 rounded-xl bg-amber-50/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">BFS Propagation Algorithm</h3>
                  <p className="text-sm text-slate-600">Cascade prediction engine</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-amber-100 mb-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Algorithm Steps</h4>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex gap-2">
                    <span className="font-semibold text-amber-600 w-5">1.</span>
                    <span>Queue trigger event (entity, magnitude)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-amber-600 w-5">2.</span>
                    <span>Pop from queue, create Effect</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-amber-600 w-5">3.</span>
                    <span>For each outgoing link: decay magnitude</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-amber-600 w-5">4.</span>
                    <span>Check thresholds & enqueue targets</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-amber-600 w-5">5.</span>
                    <span>Return sorted cascade effects</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Magnitude Thresholds</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2 border border-amber-100">
                    <span className="text-sm text-slate-700">Order 1 (Direct)</span>
                    <span className="font-semibold text-amber-600">0.5%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2 border border-amber-100">
                    <span className="text-sm text-slate-700">Order 2 (Chain)</span>
                    <span className="font-semibold text-amber-600">0.2%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2 border border-amber-100">
                    <span className="text-sm text-slate-700">Order 3+ (Deep)</span>
                    <span className="font-semibold text-amber-600">0.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Pipeline */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Data Pipeline</h2>

          <div className="border-2 border-emerald-200 rounded-xl bg-emerald-50/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">ETL & Data Ingestion</h3>
                <p className="text-sm text-slate-600">Automated data collection from multiple sources</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-emerald-100 text-center">
                <BarChart3 className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 mb-1">504</div>
                <div className="text-sm text-slate-600 mb-1">S&P 500 Entities</div>
                <div className="text-xs text-slate-500">From Wikipedia</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-100 text-center">
                <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 mb-1">1,322</div>
                <div className="text-sm text-slate-600 mb-1">Price Correlations</div>
                <div className="text-xs text-slate-500">From Yahoo Finance</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-100 text-center">
                <BarChart3 className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 mb-1">15</div>
                <div className="text-sm text-slate-600 mb-1">SEC Relationships</div>
                <div className="text-xs text-slate-500">From 10-K Filings</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border border-emerald-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Data Sources</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>SEC EDGAR (10-K supplier relationships)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>Yahoo Finance (prices, correlations)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>Wikipedia (S&P 500 table)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>Manual verification (34 curated links)</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Processing</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>Data validation & cleaning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>Entity deduplication</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>Strength calculation (correlations)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    <span>Incremental daily updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Characteristics */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">System Characteristics</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-2 border-slate-200 rounded-xl p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Scalability</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5" />
                  <span>Horizontal API scaling</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5" />
                  <span>Database read replicas</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5" />
                  <span>CDN edge caching</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5" />
                  <span>Stateless design</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-slate-200 rounded-xl p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Reliability</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                  <span>Health check monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                  <span>Automatic failover</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                  <span>Daily DB backups</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                  <span>99.9% uptime SLA</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-slate-200 rounded-xl p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Performance</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5" />
                  <span>&lt;100ms API response</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5" />
                  <span>O(1) graph lookups</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5" />
                  <span>Async I/O processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5" />
                  <span>Client-side caching</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
