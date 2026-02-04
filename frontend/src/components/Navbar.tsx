"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Sparkles, Network, Bell, Lightbulb, Map, Code2, Briefcase, Zap, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/predict", label: "Predict", icon: Sparkles },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/explore", label: "Explore", icon: Network },
    { href: "/portfolio", label: "Portfolio", icon: Briefcase },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/roadmap", label: "Roadmap", icon: Map },
    { href: "/vision", label: "Vision", icon: Lightbulb },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-green-500/30 bg-black/95 backdrop-blur-lg shadow-lg shadow-green-500/10">
      <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-bold group shrink-0"
        >
          <div className="bg-gradient-to-br from-green-500 to-cyan-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <TrendingUp className="h-5 w-5 text-black" />
          </div>
          <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent military-font">
            CONSEQUENCE_AI
          </span>
          <Badge
            variant="secondary"
            className="text-xs bg-green-500/20 text-green-400 border-green-500/50"
          >
            BETA
          </Badge>
        </Link>

        <div className="flex items-center gap-1.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const isVision = href === "/vision";

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all font-mono text-xs whitespace-nowrap ${
                  active
                    ? "bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-green-400 border border-green-500/50 shadow-lg shadow-green-500/20"
                    : "text-green-400/60 hover:text-green-400 hover:bg-green-500/10"
                } ${isVision ? "animate-pulse-glow" : ""}`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isVision && !active ? "animate-spin-slow" : ""}`} />
                <span className="font-medium">{label}</span>
                {isVision && !active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
