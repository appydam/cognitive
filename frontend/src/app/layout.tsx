import type { Metadata } from "next";
import { Inter, Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CascadeAlertProvider } from "@/components/CascadeAlertToast";
import { Toaster } from "sonner";
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
        <CascadeAlertProvider />
        <Toaster />
        <Navbar />
        <main className="min-h-screen bg-black">
          {children}
        </main>
        <footer className="bg-black border-t-2 border-green-500/30 tactical-grid scanlines py-12 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
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
                    href="/signals"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    TRADE_SIGNALS
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
                    href="/backtest"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    BACKTEST_ENGINE
                  </a>
                  <a
                    href="/data-sources"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    DATA_SOURCES
                  </a>
                  <a
                    href="/architecture"
                    className="block text-green-400/70 hover:text-green-400 transition-all status-indicator"
                  >
                    SYSTEM_ARCHITECTURE
                  </a>
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
