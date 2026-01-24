"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Sparkles, Network, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/predict", label: "Predict", icon: Sparkles },
    { href: "/explore", label: "Explore", icon: Network },
    { href: "/accuracy", label: "Track Record", icon: BarChart3 },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold group"
        >
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Consequence AI
          </span>
          <Badge
            variant="secondary"
            className="ml-2 text-xs bg-purple-100 text-purple-700 border-purple-200"
          >
            Beta
          </Badge>
        </Link>

        <div className="flex gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive(href)
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
