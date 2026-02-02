"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioEditor from "@/components/PortfolioEditor";
import HoldingsTable from "@/components/HoldingsTable";
import PortfolioOverview from "@/components/PortfolioOverview";
import PortfolioWhatIf from "@/components/PortfolioWhatIf";
import MacroSensitivity from "@/components/MacroSensitivity";
import PortfolioGraph from "@/components/PortfolioGraph";
import HedgeSuggestions from "@/components/HedgeSuggestions";
import { getPortfolio } from "@/lib/portfolio";
import { ConsequenceAPI } from "@/lib/api";
import { PortfolioAnalysis } from "@/types/api";

export default function PortfolioPage() {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    analyzePortfolio();
  }, [refreshTrigger]);

  const analyzePortfolio = async () => {
    const portfolio = getPortfolio();

    if (portfolio.holdings.length === 0) {
      setAnalysis(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await ConsequenceAPI.analyzePortfolio(portfolio.holdings);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to analyze portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold military-font text-green-400 mb-2">
          &gt; MY PORTFOLIO
        </h1>
        <p className="text-sm text-green-400/60 font-mono">
          Your personal risk cockpit — see how market cascades, macro shocks, and hidden connections affect YOUR money
        </p>
      </div>

      {/* Overview Cards */}
      {analysis && <PortfolioOverview analysis={analysis} />}

      {/* Hedge Suggestions */}
      {analysis && <div className="mb-6"><HedgeSuggestions analysis={analysis} /></div>}

      {/* Main Content Tabs */}
      <Tabs defaultValue="holdings" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-black/60 border border-green-500/30 p-1.5 rounded-lg">
          <TabsTrigger
            value="holdings"
            className="military-font text-xs !text-green-400/60 data-[state=active]:!bg-green-500/20 data-[state=active]:!text-green-400 data-[state=active]:border data-[state=active]:border-green-400/50 hover:!text-green-400/80 transition-all"
          >
            HOLDINGS
          </TabsTrigger>
          <TabsTrigger
            value="whatif"
            className="military-font text-xs !text-green-400/60 data-[state=active]:!bg-green-500/20 data-[state=active]:!text-green-400 data-[state=active]:border data-[state=active]:border-green-400/50 hover:!text-green-400/80 transition-all"
          >
            WHAT IF
          </TabsTrigger>
          <TabsTrigger
            value="macro"
            className="military-font text-xs !text-green-400/60 data-[state=active]:!bg-green-500/20 data-[state=active]:!text-green-400 data-[state=active]:border data-[state=active]:border-green-400/50 hover:!text-green-400/80 transition-all"
          >
            MACRO RISK
          </TabsTrigger>
          <TabsTrigger
            value="graph"
            className="military-font text-xs !text-green-400/60 data-[state=active]:!bg-green-500/20 data-[state=active]:!text-green-400 data-[state=active]:border data-[state=active]:border-green-400/50 hover:!text-green-400/80 transition-all"
          >
            GRAPH
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          <Card className="p-6 hud-panel border-green-500/30">
            <div className="mb-4">
              <h2 className="text-lg military-font text-green-400 mb-1">
                &gt; ADD HOLDINGS
              </h2>
              <p className="text-xs text-green-400/60 font-mono">
                Add stocks, ETFs, or sectors from the causal graph
              </p>
            </div>
            <PortfolioEditor onPortfolioChange={handlePortfolioChange} />
          </Card>

          <Card className="p-6 hud-panel border-green-500/30">
            <div className="mb-4">
              <h2 className="text-lg military-font text-green-400 mb-1">
                &gt; YOUR HOLDINGS
              </h2>
              <p className="text-xs text-green-400/60 font-mono">
                Cascade exposure score: how many entities can cascade into each holding
              </p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-sm font-mono text-green-400/60">
                  ANALYZING PORTFOLIO...
                </div>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded">
                <p className="text-xs font-mono text-red-400">&gt; ERROR: {error}</p>
              </div>
            ) : analysis ? (
              <HoldingsTable
                analysis={analysis}
                onHoldingRemoved={handlePortfolioChange}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-mono text-green-400/40">
                  No holdings added yet. Add your first holding above to get started.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="whatif">
          <PortfolioWhatIf />
        </TabsContent>

        <TabsContent value="macro">
          <MacroSensitivity />
        </TabsContent>

        <TabsContent value="graph">
          <PortfolioGraph />
        </TabsContent>
      </Tabs>
    </div>
  );
}
