import type { Metadata } from "next";
import { Inter, Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { TrendingUp } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron"
});
const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-share-tech-mono"
});

export const metadata: Metadata = {
  title: "Consequence AI - Causal Reasoning for Markets",
  description: "Predict cascade effects in complex systems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${orbitron.variable} ${shareTechMono.variable} bg-black`} suppressHydrationWarning>
        <Navbar />
        <main className="min-h-screen bg-black">
          {children}
        </main>
        <footer className="bg-black border-t-2 border-green-500/30 tactical-grid scanlines py-12 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3 text-lg font-bold mb-4">
                  <div className="bg-green-500/20 border-2 border-green-500 p-2 target-reticle">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="terminal-text military-font">
                    CONSEQUENCE_AI
                  </span>
                </div>
                <p className="text-green-400/70 text-xs font-mono">
                  DOMAIN-AGNOSTIC CAUSAL REASONING INFRASTRUCTURE<br />
                  CASCADE EFFECT PREDICTION SYSTEM
                </p>
              </div>
              <div>
                <h4 className="military-font text-green-400 text-sm mb-3">&gt; OPERATIONS</h4>
                <div className="space-y-2 text-xs font-mono">
                  <a
                    href="/predict"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    PREDICT_CASCADE
                  </a>
                  <a
                    href="/explore"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    EXPLORE_GRAPH
                  </a>
                  <a
                    href="/accuracy"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    TRACK_RECORD
                  </a>
                  <a
                    href="/data-sources"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    DATA_SOURCES
                  </a>
                </div>
              </div>
              <div>
                <h4 className="military-font text-cyan-400 text-sm mb-3">&gt; TECH_STACK</h4>
                <div className="space-y-2 text-xs font-mono">
                  <p className="text-cyan-400/70 flex items-center gap-2">
                    <span className="pulse-dot w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    BACKEND: FastAPI + PostgreSQL
                  </p>
                  <p className="text-cyan-400/70 flex items-center gap-2">
                    <span className="pulse-dot w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                    FRONTEND: Next.js 16 + React 19
                  </p>
                  <p className="text-cyan-400/70 flex items-center gap-2">
                    <span className="pulse-dot w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                    AI_CORE: Bayesian Learning Engine
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-green-500/20 mt-8 pt-8 text-center text-xs text-green-400/50 military-font">
              © 2025 CONSEQUENCE_AI_SYSTEMS | CLEARANCE_LEVEL: PUBLIC | STATUS: OPERATIONAL
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
