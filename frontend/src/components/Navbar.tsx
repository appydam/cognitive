import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <TrendingUp className="h-6 w-6" />
          Consequence AI
        </Link>

        <div className="flex gap-6">
          <Link
            href="/predict"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Predict
          </Link>
          <Link
            href="/explore"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/accuracy"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Track Record
          </Link>
        </div>
      </div>
    </nav>
  );
}
