'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, TrendingUp, Target, DollarSign } from 'lucide-react';
import { ConsequenceAPI } from '@/lib/api';

interface BacktestRun {
  id: number;
  start_date: string;
  end_date: string;
  min_surprise: number;
  total_events: number;
  avg_accuracy: number | null;
  avg_mae: number | null;
  profitable_trades: number;
  total_roi: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export default function BacktestPage() {
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const data = await ConsequenceAPI.getBacktestRuns();
      setRuns(data);
    } catch (err) {
      // Silently handle - backend endpoints not implemented yet
      // This is expected until backend is deployed
      setRuns([]);
    }
  };

  const createNewRun = async () => {
    setLoading(true);
    try {
      const run = await ConsequenceAPI.createBacktestRun({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        min_surprise: 5.0,
        max_events: 500
      });

      const interval = setInterval(async () => {
        const updated = await ConsequenceAPI.getBacktestRun(run.id);
        if (updated.status === 'completed') {
          clearInterval(interval);
          setLoading(false);
          loadRuns();
        }
      }, 5000);
    } catch (err) {
      console.error('Failed to create backtest run:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black tactical-grid scanlines">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-block bg-cyan-500/10 border border-cyan-500 text-cyan-400 px-4 py-1 military-font text-xs mb-4">
            ⬢ VALIDATION SYSTEM ⬢
          </div>
          <h1 className="text-4xl font-bold mb-2 terminal-text military-font">
            &gt; HISTORICAL BACKTESTING
          </h1>
          <p className="text-sm text-green-400/70 font-mono">
            VALIDATE MODEL ACCURACY ACROSS 1000+ EARNINGS EVENTS | ROI SIMULATION ENABLED
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Target className="w-5 h-5" />}
            label="Avg Accuracy"
            value={runs[0]?.avg_accuracy ? `${(runs[0].avg_accuracy * 100).toFixed(1)}%` : '--'}
            color="green"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Profitable Trades"
            value={runs[0]?.profitable_trades || '--'}
            color="cyan"
          />
          <MetricCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Total ROI"
            value={runs[0]?.total_roi ? `${runs[0].total_roi.toFixed(1)}%` : '--'}
            color="yellow"
          />
          <MetricCard
            icon={<Play className="w-5 h-5" />}
            label="Events Tested"
            value={runs[0]?.total_events || '--'}
            color="blue"
          />
        </div>

        <Card className="p-6 hud-panel border-green-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-green-400 military-font">
              BACKTEST RUNS
            </h2>
            <Button
              onClick={createNewRun}
              disabled={loading}
              className="tactical-button military-font text-xs"
            >
              {loading ? 'RUNNING...' : 'NEW BACKTEST'}
            </Button>
          </div>

          {runs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-green-400/60 font-mono mb-4">
                NO BACKTEST RUNS YET
              </p>
              <p className="text-xs text-green-400/40 font-mono">
                Click &quot;NEW BACKTEST&quot; to validate model performance on historical data
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'green' | 'cyan' | 'yellow' | 'blue';
}) {
  const colorClasses = {
    green: 'text-green-400 border-green-500/30',
    cyan: 'text-cyan-400 border-cyan-500/30',
    yellow: 'text-yellow-400 border-yellow-500/30',
    blue: 'text-blue-400 border-blue-500/30',
  };

  return (
    <Card className={`p-4 hud-panel ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={colorClasses[color]}>{icon}</div>
        <span className="text-xs font-mono text-green-400/60">{label}</span>
      </div>
      <div className={`text-2xl font-bold military-font ${colorClasses[color]}`}>
        {value}
      </div>
    </Card>
  );
}

function RunCard({ run }: { run: BacktestRun }) {
  return (
    <div className="p-4 bg-black/40 border border-green-500/20 rounded hover:bg-green-500/5 transition">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-green-400">
            {new Date(run.start_date).toLocaleDateString()} - {new Date(run.end_date).toLocaleDateString()}
          </div>
          <div className="text-xs text-green-400/60 mt-1">
            {run.total_events} events •{' '}
            {run.avg_accuracy ? `${(run.avg_accuracy * 100).toFixed(1)}% accuracy` : 'N/A'} •{' '}
            {run.total_roi ? `${run.total_roi.toFixed(1)}% ROI` : 'N/A'}
          </div>
        </div>
        <div className={`text-xs font-mono px-2 py-1 rounded ${
          run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
          run.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {run.status.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
