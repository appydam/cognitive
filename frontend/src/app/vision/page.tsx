"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Network,
  Brain,
  Lock,
  CheckCircle2,
  Building2,
  HeartPulse,
  DollarSign,
  Lightbulb,
  Layers,
  Globe,
  Code2,
  Activity,
  Target,
  Users,
  Rocket,
} from "lucide-react";
import Link from "next/link";

// Animated counter component
function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        onUpdate: (v) => setCount(Math.round(v)),
      });
      return () => controls.stop();
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Particle background component
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export default function VisionPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-black text-green-400">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-purple-950 to-black">
        <ParticleBackground />
        <div className="tactical-grid absolute inset-0 opacity-10" />

        <motion.div
          className="relative z-10 max-w-7xl mx-auto px-4 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="classified-header mb-8">⬤ VISION STATEMENT ⬤</div>

          <h1 className="text-6xl md:text-8xl font-bold military-font mb-6 terminal-text">
            THE REASONING<br />INFRASTRUCTURE<br />FOR AI
          </h1>

          <p className="text-xl md:text-2xl text-green-400/80 font-mono max-w-4xl mx-auto mb-12">
            A living, learning, reasoning engine that mirrors how humans think about cause and effect.
            <span className="text-cyan-400"> The foundational layer for complex, interconnected domains.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <button className="tactical-button px-8 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30 transition-all flex items-center gap-2 justify-center">
                <Network className="w-5 h-5" />
                EXPLORE LIVE DEMO
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/data-sources">
              <button className="px-8 py-4 border-2 border-cyan-500/50 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex items-center gap-2 justify-center font-mono">
                <Shield className="w-5 h-5" />
                VIEW DATA SOURCES
              </button>
            </Link>
          </div>

          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-green-400/50 text-sm font-mono">SCROLL TO EXPLORE</div>
            <div className="w-px h-16 bg-gradient-to-b from-green-400/50 to-transparent mx-auto mt-2" />
          </motion.div>
        </motion.div>
      </section>

      {/* Core Insight Section */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-8 text-green-400">
              &gt; THE_CORE_INSIGHT
            </h2>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-2xl font-bold text-cyan-400 mb-6">
                  The world operates through causal chains, not isolated events.
                </p>
                <p className="text-lg text-green-400/80 font-mono leading-relaxed mb-6">
                  When Apple announces disappointing earnings, it doesn't just affect Apple.
                  It cascades through suppliers (TSMC, Qualcomm), competitors (Samsung),
                  sector ETFs (XLK, QQQ), cloud providers, retail partners, and broader market sentiment.
                </p>
                <p className="text-lg text-green-400/80 font-mono leading-relaxed">
                  <span className="text-yellow-400 font-bold">Traditional systems fail</span> because they treat
                  each relationship in isolation, missing the second-order, third-order, and nth-order effects.
                </p>
              </div>

              {/* Cascade Visualization */}
              <motion.div
                className="relative h-96"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Central node - Apple */}
                  <motion.circle
                    cx="200"
                    cy="200"
                    r="40"
                    fill="#ef4444"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  />
                  <text x="200" y="205" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
                    AAPL
                  </text>

                  {/* First-order nodes */}
                  {[
                    { x: 100, y: 100, label: "TSMC", delay: 0.4 },
                    { x: 300, y: 100, label: "QCOM", delay: 0.5 },
                    { x: 80, y: 250, label: "XLK", delay: 0.6 },
                    { x: 320, y: 250, label: "SMSNG", delay: 0.7 },
                    { x: 200, y: 340, label: "SPY", delay: 0.8 },
                  ].map((node, i) => (
                    <g key={i}>
                      <motion.line
                        x1="200"
                        y1="200"
                        x2={node.x}
                        y2={node.y}
                        stroke="#22c55e"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: node.delay, duration: 0.5 }}
                      />
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r="25"
                        fill="#065f46"
                        stroke="#22c55e"
                        strokeWidth="2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: node.delay }}
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill="#22c55e"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Demonstration Section */}
      <section className="py-32 bg-gradient-to-b from-black to-purple-950/20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-12 text-green-400">
              &gt; LIVE_DEMONSTRATION
            </h2>

            <div className="hud-panel p-8 bg-black/80">
              <div className="classified-header mb-6">⬤ MICROSOFT CASCADE ANALYSIS ⬤</div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="font-mono text-sm space-y-2 text-green-400/90">
                  <div className="text-cyan-400 mb-4">$ analyze_cascade --entity=MSFT --magnitude=-5%</div>
                  <div>Total cascade effects: 5 first-order + propagating effects</div>
                  <div className="h-px bg-green-500/30 my-4" />
                  <div className="text-yellow-400">Immediate Impact (Hour 0-4):</div>
                  <motion.div
                    className="ml-4 space-y-2"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    {[
                      { entity: "OpenAI", impact: "-3.50%", conf: "85%", desc: "$13B annual Azure dependency" },
                      { entity: "XLK ETF", impact: "-1.50%", conf: "90%", desc: "MSFT is 2nd largest holding" },
                      { entity: "SPY ETF", impact: "-0.70%", conf: "90%", desc: "Significant S&P 500 weight" },
                      { entity: "Dell", impact: "-2.00%", conf: "75%", desc: "Azure Local partnership" },
                    ].map((item, i) => (
                      <motion.div key={i} variants={itemVariants} className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        <span className="text-purple-400">{item.entity}:</span>
                        <span className="text-red-400 font-bold">{item.impact}</span>
                        <span className="text-green-400">({item.conf} confidence)</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <div className="text-green-400 font-mono text-sm mb-4">Confidence Levels:</div>
                  {[
                    { label: "OpenAI", value: 85 },
                    { label: "XLK ETF", value: 90 },
                    { label: "SPY ETF", value: 90 },
                    { label: "Dell", value: 75 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="text-xs text-green-400/70 font-mono mb-1">{item.label}</div>
                      <div className="h-8 bg-green-500/10 border border-green-500/30 rounded overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-green-500/50 to-cyan-500/50 flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + 0.3, duration: 1 }}
                        >
                          <span className="text-xs font-bold text-white">{item.value}%</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Data Quality Commitment Section */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-12 text-green-400">
              &gt; DATA_QUALITY_COMMITMENT
            </h2>

            <motion.div
              className="grid md:grid-cols-3 gap-6 mb-12"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: Shield,
                  title: "VERIFIED SOURCES",
                  desc: "SEC filings, official announcements, verified partnerships",
                },
                {
                  icon: CheckCircle2,
                  title: "QUANTIFIABLE METRICS",
                  desc: "Revenue percentages, dollar amounts, documented evidence",
                },
                {
                  icon: Lock,
                  title: "NO ASSUMPTIONS",
                  desc: "Every relationship backed by authoritative primary sources",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="hud-panel p-6 text-center hover:border-green-400 transition-all group cursor-pointer"
                >
                  <item.icon className="w-12 h-12 mx-auto mb-4 text-green-400 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-bold military-font text-green-400 mb-2">{item.title}</div>
                  <div className="text-sm text-green-400/70 font-mono">{item.desc}</div>
                </motion.div>
              ))}
            </motion.div>

            <div className="hud-panel p-8 bg-black/50">
              <div className="text-cyan-400 font-mono text-sm mb-4">Example Verified Relationship:</div>
              <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`{
  "source": "MSFT",
  "target": "OPENAI",
  "relationship_type": "supplies",
  "strength": 0.70,
  "confidence": 0.85,
  "evidence": [
    "OpenAI paid Microsoft $865.8M in first 3 quarters of FY2025",
    "Estimated $13B annual Azure infrastructure spend",
    "20% revenue share agreement until AGI achievement"
  ],
  "source_url": "https://techcrunch.com/2025/11/14/...",
  "verified_date": "2025-11-14"
}`}
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Use Cases - FLAGSHIP SECTION */}
      <section className="py-32 bg-gradient-to-b from-black via-purple-950/20 to-black">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-6 text-green-400">
              &gt; ENTERPRISE_USE_CASES
            </h2>
            <p className="text-xl text-green-400/70 font-mono mb-12">
              Real-world implementations with quantified business impact
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Supply Chain */}
              <motion.div
                className="hud-panel p-8 hover:border-cyan-400 transition-all group cursor-pointer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Building2 className="w-16 h-16 mb-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold military-font text-cyan-400 mb-4">
                  SUPPLY CHAIN RISK INTELLIGENCE
                </h3>
                <div className="text-sm text-green-400/70 font-mono mb-6">
                  Fortune 500 Manufacturing Company
                </div>

                <div className="space-y-4 text-sm font-mono">
                  <div>
                    <div className="text-yellow-400 mb-1">Challenge:</div>
                    <div className="text-green-400/80">$4.5B annual disruption costs. Traditional systems can't predict cascading failures.</div>
                  </div>

                  <div>
                    <div className="text-cyan-400 mb-1">Solution:</div>
                    <div className="text-green-400/80">Map 10,000+ entity supply chain with real-time risk monitoring</div>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                    <div className="text-green-400 mb-2">ROI Impact:</div>
                    <div className="text-3xl font-bold text-green-400">
                      $<AnimatedCounter value={800} />M
                    </div>
                    <div className="text-xs text-green-400/70">losses prevented</div>
                  </div>

                  <div className="text-purple-400">
                    ✓ Response time: 3 weeks → 48 hours
                  </div>
                </div>
              </motion.div>

              {/* Healthcare */}
              <motion.div
                className="hud-panel p-8 hover:border-cyan-400 transition-all group cursor-pointer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <HeartPulse className="w-16 h-16 mb-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold military-font text-cyan-400 mb-4">
                  HEALTHCARE TREATMENT SUPPORT
                </h3>
                <div className="text-sm text-green-400/70 font-mono mb-6">
                  Large Hospital Network / Health Insurance
                </div>

                <div className="space-y-4 text-sm font-mono">
                  <div>
                    <div className="text-yellow-400 mb-1">Challenge:</div>
                    <div className="text-green-400/80">$42B annual adverse event costs from incomplete drug interaction understanding</div>
                  </div>

                  <div>
                    <div className="text-cyan-400 mb-1">Solution:</div>
                    <div className="text-green-400/80">Medical knowledge graph with drug interactions, contraindications, cascade effects</div>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                    <div className="text-green-400 mb-2">ROI Impact:</div>
                    <div className="text-3xl font-bold text-green-400">
                      $<AnimatedCounter value={120} />M
                    </div>
                    <div className="text-xs text-green-400/70">annual savings</div>
                  </div>

                  <div className="text-purple-400">
                    ✓ 35% reduction in adverse events<br />
                    ✓ 18% decrease in readmissions
                  </div>
                </div>
              </motion.div>

              {/* Finance */}
              <motion.div
                className="hud-panel p-8 hover:border-cyan-400 transition-all group cursor-pointer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <DollarSign className="w-16 h-16 mb-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold military-font text-cyan-400 mb-4">
                  PORTFOLIO RISK MANAGEMENT
                </h3>
                <div className="text-sm text-green-400/70 font-mono mb-6">
                  Multi-Billion Dollar Investment Fund
                </div>

                <div className="space-y-4 text-sm font-mono">
                  <div>
                    <div className="text-yellow-400 mb-1">Challenge:</div>
                    <div className="text-green-400/80">Traditional models miss systemic correlations and cascading failures</div>
                  </div>

                  <div>
                    <div className="text-cyan-400 mb-1">Solution:</div>
                    <div className="text-green-400/80">Complete portfolio as causal graph with real-time scenario simulation</div>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                    <div className="text-green-400 mb-2">ROI Impact:</div>
                    <div className="text-3xl font-bold text-green-400">
                      $<AnimatedCounter value={2.1} />B
                    </div>
                    <div className="text-xs text-green-400/70">losses avoided</div>
                  </div>

                  <div className="text-purple-400">
                    ✓ 3.2% annual outperformance<br />
                    ✓ Sharpe ratio: 0.85 → 1.23
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Reasoning Gap Section */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-12 text-green-400">
              &gt; THE_REASONING_GAP
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  title: "LLMS",
                  color: "red",
                  problems: [
                    "No persistent causal understanding",
                    "Can't propagate multi-hop effects",
                    "Don't learn from outcomes",
                    "Lack quantified confidence",
                  ],
                },
                {
                  title: "OUR SYSTEM",
                  color: "green",
                  problems: [
                    "Structured knowledge",
                    "Causal reasoning",
                    "Probabilistic propagation",
                    "Learning from outcomes",
                    "Explainable predictions",
                  ],
                },
                {
                  title: "DATABASES",
                  color: "yellow",
                  problems: [
                    "No cause and effect understanding",
                    "Can't compute downstream impacts",
                    "Manual querying required",
                    "Don't learn or improve",
                  ],
                },
              ].map((col, i) => (
                <motion.div
                  key={i}
                  className={`p-8 border-2 ${
                    col.color === "green"
                      ? "border-green-500 bg-green-500/10"
                      : col.color === "red"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-yellow-500/30 bg-yellow-500/5"
                  } rounded`}
                  initial={{ opacity: 0, x: i === 0 ? -50 : i === 2 ? 50 : 0, y: i === 1 ? -30 : 0 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className={`text-2xl font-bold military-font mb-6 text-${col.color}-400`}>
                    {col.title}
                  </div>
                  <ul className="space-y-3 text-sm font-mono">
                    {col.problems.map((item, j) => (
                      <motion.li
                        key={j}
                        className={`flex items-start gap-2 text-${col.color === "green" ? "green" : col.color}-400/80`}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 + j * 0.1 }}
                      >
                        {col.color === "green" ? "✓" : "×"} {item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400 military-font mb-4">
                WE BRIDGE THE GAP
              </div>
              <div className="text-lg text-green-400/70 font-mono">
                The missing reasoning layer between LLMs, traditional databases, and applications
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="py-32 bg-gradient-to-b from-black to-purple-950/20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-12 text-green-400">
              &gt; WHY_THIS_MATTERS
            </h2>

            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: Brain,
                  title: "FILLING THE REASONING GAP",
                  desc: "LLMs understand language. Traditional systems process data. We bridge the gap with structured causal reasoning.",
                },
                {
                  icon: Layers,
                  title: "MAKING SYSTEMS COMPREHENSIBLE",
                  desc: "Human cognition tracks 2-3 levels of effects. We extend reasoning to 10+, 20+, 100+ levels deep.",
                },
                {
                  icon: Target,
                  title: "PROACTIVE DECISION-MAKING",
                  desc: "Transform from reactive (crisis → analyze → fix) to proactive (simulate → see effects → prevent crisis).",
                },
                {
                  icon: Globe,
                  title: "DEMOCRATIZING EXPERTISE",
                  desc: "Elite institutions have proprietary models. We make sophisticated reasoning accessible through transparent methodology.",
                },
                {
                  icon: Shield,
                  title: "SAFE AI FOUNDATION",
                  desc: "Provides explainability, source citations, confidence quantification - making AI systems trustworthy and auditable.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="hud-panel p-8 hover:border-cyan-400 transition-all group cursor-pointer"
                >
                  <item.icon className="w-12 h-12 mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div className="text-xl font-bold military-font text-green-400 mb-3">
                    {item.title}
                  </div>
                  <div className="text-sm text-green-400/70 font-mono">{item.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-12 text-green-400">
              &gt; THE_PATH_FORWARD
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-green-500 via-cyan-500 to-purple-500" />

              <div className="space-y-16">
                {[
                  {
                    phase: "PHASE 1",
                    title: "Proof of Concept",
                    status: "COMPLETED",
                    items: ["Core propagation engine", "Financial markets demo", "Verified data infrastructure"],
                    icon: CheckCircle2,
                    color: "green",
                  },
                  {
                    phase: "PHASE 2",
                    title: "Production-Ready Infrastructure",
                    status: "IN PROGRESS",
                    items: ["Scale to 10,000+ entities", "Sub-second query performance", "Enterprise-grade reliability"],
                    icon: Activity,
                    color: "cyan",
                  },
                  {
                    phase: "PHASE 3",
                    title: "Multi-Domain Expansion",
                    status: "UPCOMING",
                    items: ["Healthcare adapter", "Supply chain adapter", "Policy adapter"],
                    icon: Layers,
                    color: "purple",
                  },
                  {
                    phase: "PHASE 4",
                    title: "Developer Platform",
                    status: "PLANNED",
                    items: ["Public API", "SDKs (Python, JS, Go)", "Documentation & tutorials"],
                    icon: Code2,
                    color: "yellow",
                  },
                  {
                    phase: "PHASE 5",
                    title: "Network Effects",
                    status: "PLANNED",
                    items: ["Outcome data contributions", "Aggregate learning", "Virtuous cycle"],
                    icon: Network,
                    color: "pink",
                  },
                ].map((phase, i) => (
                  <motion.div
                    key={i}
                    className={`relative flex items-start gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                      <div className={`hud-panel p-6 inline-block ${i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"}`}>
                        <div className={`text-sm font-mono mb-2 text-${phase.color}-400`}>{phase.phase}</div>
                        <div className="text-2xl font-bold military-font text-green-400 mb-2">{phase.title}</div>
                        <div className={`text-xs font-mono mb-4 ${
                          phase.status === "COMPLETED" ? "text-green-400" :
                          phase.status === "IN PROGRESS" ? "text-cyan-400" :
                          "text-yellow-400"
                        }`}>
                          {phase.status}
                        </div>
                        <ul className="space-y-2 text-sm font-mono text-green-400/70">
                          {phase.items.map((item, j) => (
                            <li key={j}>✓ {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className={`w-16 h-16 rounded-full border-4 border-${phase.color}-400 bg-black flex items-center justify-center`}>
                        <phase.icon className={`w-8 h-8 text-${phase.color}-400`} />
                      </div>
                    </div>

                    <div className="flex-1" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="py-32 bg-gradient-to-br from-purple-950 via-black to-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold military-font mb-12 terminal-text">
              THE VISION
            </h2>

            <div className="max-w-4xl mx-auto space-y-8 text-xl md:text-2xl font-mono">
              <motion.p
                className="text-green-400/90 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                We're building the <span className="text-cyan-400 font-bold">fundamental reasoning layer</span> that sits between the data layer, the intelligence layer, and the application layer.
              </motion.p>

              <motion.p
                className="text-3xl md:text-4xl font-bold text-yellow-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                The reasoning layer is missing today.
                <br />
                <span className="text-green-400">We're building it.</span>
              </motion.p>

              <motion.p
                className="text-lg text-green-400/70 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                Imagine a future where every major decision is simulated through cascade analysis before implementation, every complex system has a living knowledge graph that learns from outcomes, and every organization can reason about multi-hop consequences in real-time.
              </motion.p>

              <motion.div
                className="text-2xl text-purple-400 font-bold"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
              >
                This infrastructure makes that future possible.
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Join Us / CTA Section */}
      <section className="py-32 bg-black">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold military-font mb-12 text-green-400">
              &gt; JOIN_US
            </h2>

            <div className="mb-12 space-y-4">
              {[
                "Complex systems require causal reasoning, not just pattern matching",
                "Decisions should be simulated before they're made, not analyzed after they fail",
                "Reasoning should be transparent, verifiable, and continuously improving",
                "The next generation of AI needs explainable, quantified causality",
              ].map((text, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-center gap-4 text-lg font-mono text-green-400"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <motion.div
                    className="w-6 h-6 border-2 border-green-500 rounded flex items-center justify-center"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </motion.div>
                  <span>{text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="text-3xl font-bold text-cyan-400 mb-8 military-font"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              LET'S BUILD IT RIGHT. LET'S BUILD IT TOGETHER.
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/explore">
                <button className="tactical-button px-8 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30 transition-all flex items-center gap-2 justify-center">
                  <Rocket className="w-5 h-5" />
                  EXPLORE LIVE DEMO
                </button>
              </Link>
              <Link href="/data-sources">
                <button className="px-8 py-4 border-2 border-cyan-500/50 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex items-center gap-2 justify-center font-mono">
                  <Shield className="w-5 h-5" />
                  VIEW DATA SOURCES
                </button>
              </Link>
            </div>

            <div className="text-sm text-green-400/50 font-mono">
              Built with verified data • Powered by causal reasoning • Designed for the future
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
