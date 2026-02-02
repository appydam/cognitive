"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText } from "lucide-react";
import { addHolding, importHoldingsFromText } from "@/lib/portfolio";
import { ConsequenceAPI } from "@/lib/api";
import { SearchResult } from "@/types/api";

interface PortfolioEditorProps {
  onPortfolioChange: () => void;
}

export default function PortfolioEditor({ onPortfolioChange }: PortfolioEditorProps) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchEntities = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const result = await ConsequenceAPI.searchEntities(query, 10);
      setSearchResults(result.results);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleTickerChange = (value: string) => {
    setTicker(value);
    searchEntities(value);
  };

  const handleSelectEntity = (entity: SearchResult) => {
    setTicker(entity.id);
    setSearchResults([]);
  };

  const handleAddHolding = () => {
    setError(null);

    if (!ticker.trim()) {
      setError("Entity ticker is required");
      return;
    }

    const sharesNum = parseFloat(shares);
    if (!shares.trim() || isNaN(sharesNum) || sharesNum <= 0) {
      setError("Valid number of shares is required");
      return;
    }

    const costBasisNum = costBasis.trim() ? parseFloat(costBasis) : undefined;
    if (costBasis.trim() && (isNaN(costBasisNum!) || costBasisNum! <= 0)) {
      setError("Cost basis must be a positive number");
      return;
    }

    try {
      addHolding({
        entity_id: ticker.trim().toUpperCase(),
        shares: sharesNum,
        cost_basis: costBasisNum,
        added_at: new Date().toISOString(),
      });

      // Reset form
      setTicker("");
      setShares("");
      setCostBasis("");
      setSearchResults([]);

      // Notify parent
      onPortfolioChange();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkImport = () => {
    setError(null);

    if (!bulkText.trim()) {
      setError("Please enter holdings to import");
      return;
    }

    try {
      const holdings = importHoldingsFromText(bulkText);

      if (holdings.length === 0) {
        setError("No valid holdings found in text");
        return;
      }

      // Add all holdings
      holdings.forEach(holding => addHolding(holding));

      // Reset
      setBulkText("");
      setShowBulkImport(false);

      // Notify parent
      onPortfolioChange();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Single Add Form */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4 relative">
          <Input
            placeholder="Ticker (e.g., AAPL)"
            value={ticker}
            onChange={(e) => handleTickerChange(e.target.value.toUpperCase())}
            className="bg-black/40 border-green-500/30 text-green-400 placeholder:text-green-400/30 font-mono text-xs"
          />
          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-black/95 border border-green-500/30 rounded shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectEntity(result)}
                  className="w-full px-3 py-2 text-left hover:bg-green-500/10 transition border-b border-green-500/10 last:border-b-0"
                >
                  <div className="text-xs font-mono text-green-400 font-bold">
                    {result.id}
                  </div>
                  <div className="text-[10px] font-mono text-green-400/60">
                    {result.name} • {result.type}
                    {result.sector && ` • ${result.sector}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-3">
          <Input
            type="number"
            placeholder="Shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="bg-black/40 border-green-500/30 text-green-400 placeholder:text-green-400/30 font-mono text-xs"
          />
        </div>

        <div className="col-span-3">
          <Input
            type="number"
            placeholder="Cost Basis (optional)"
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            className="bg-black/40 border-green-500/30 text-green-400 placeholder:text-green-400/30 font-mono text-xs"
          />
        </div>

        <div className="col-span-2">
          <Button
            onClick={handleAddHolding}
            className="w-full tactical-button text-xs h-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            ADD
          </Button>
        </div>
      </div>

      {/* Bulk Import Toggle */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowBulkImport(!showBulkImport)}
          className="text-[10px] font-mono text-cyan-400/70 hover:text-cyan-400 transition flex items-center gap-1"
        >
          <FileText className="h-3 w-3" />
          {showBulkImport ? "Hide" : "Show"} Bulk Import
        </button>
      </div>

      {/* Bulk Import Form */}
      {showBulkImport && (
        <div className="p-3 bg-cyan-500/5 border border-cyan-400/30 rounded space-y-2">
          <div className="text-[10px] font-mono text-cyan-400/60">
            Paste holdings in format: TICKER SHARES [COST_BASIS]
            <br />
            Example: AAPL 50 150.25, NVDA 20, MSFT 30 300
          </div>
          <textarea
            placeholder="AAPL 50 150.25, NVDA 20, MSFT 30 300"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full h-20 bg-black/40 border border-cyan-400/30 rounded p-2 text-cyan-400 placeholder:text-cyan-400/30 font-mono text-xs resize-none"
          />
          <Button
            onClick={handleBulkImport}
            className="w-full tactical-button text-xs"
            variant="outline"
          >
            IMPORT HOLDINGS
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-400/30 rounded">
          <p className="text-xs font-mono text-red-400">&gt; {error}</p>
        </div>
      )}

      {searching && (
        <div className="text-[10px] font-mono text-green-400/40">
          Searching entities...
        </div>
      )}
    </div>
  );
}
