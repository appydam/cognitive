import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { TrendingUp } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {children}
        </main>
        <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-12 mt-20 relative overflow-hidden">
          <div className="absolute inset-0 grid-background opacity-10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 text-xl font-bold mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg box-glow-blue">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="holographic-text neon-glow-cyan">
                    Consequence AI
                  </span>
                </div>
                <p className="text-gray-300 text-sm">
                  Domain-agnostic causal reasoning infrastructure for predicting
                  cascade effects in complex systems.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 neon-glow">Product</h4>
                <div className="space-y-2 text-sm">
                  <a
                    href="/predict"
                    className="block text-gray-300 hover:text-white transition-all hover:translate-x-1"
                  >
                    → Predict Cascade
                  </a>
                  <a
                    href="/explore"
                    className="block text-gray-300 hover:text-white transition-all hover:translate-x-1"
                  >
                    → Explore Graph
                  </a>
                  <a
                    href="/accuracy"
                    className="block text-gray-300 hover:text-white transition-all hover:translate-x-1"
                  >
                    → Track Record
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 neon-glow-purple">Technology</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300 flex items-center gap-2">
                    <span className="pulse-dot w-2 h-2 bg-green-500 rounded-full"></span>
                    Built with FastAPI & Next.js
                  </p>
                  <p className="text-gray-300 flex items-center gap-2">
                    <span className="pulse-dot w-2 h-2 bg-blue-500 rounded-full"></span>
                    Powered by Causal AI
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
              © 2025 Consequence AI. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
