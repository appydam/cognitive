'use client';

import { useEffect, useState } from 'react';
import { alertClient } from '@/lib/websocket';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function CascadeAlertProvider() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    alertClient.connect();
    setConnected(true);

    const unsubscribe = alertClient.subscribe((alert) => {
      const { event, cascade } = alert;

      toast.custom((t) => (
        <div className="bg-slate-900 border border-green-400/50 p-4 rounded-lg min-w-[400px]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {event.surprise_percent > 0 ? (
                <TrendingUp className="w-6 h-6 text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-green-400 mb-1">
                {event.ticker} EARNINGS ALERT
              </div>
              <div className="text-xs text-slate-300 mb-2">
                {event.surprise_percent > 0 ? 'Beat' : 'Missed'} by{' '}
                <span className={event.surprise_percent > 0 ? 'text-green-400' : 'text-red-400'}>
                  {Math.abs(event.surprise_percent).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                Cascade: {cascade.total_effects} effects detected
              </div>
              <button
                onClick={() => {
                  window.location.href = `/predict?ticker=${event.ticker}&surprise=${event.surprise_percent}`;
                  toast.dismiss(t);
                }}
                className="text-xs bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 rounded px-3 py-1.5 text-green-400 font-medium transition-all"
              >
                View Full Cascade →
              </button>
            </div>
          </div>
        </div>
      ), {
        duration: 10000,
        position: 'top-right',
      });
    });

    return () => {
      unsubscribe();
      alertClient.disconnect();
    };
  }, []);

  return null;
}
