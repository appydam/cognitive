'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EffectResponse, ExplainedEffect, EarningsEventRequest } from '@/types/api';
import { ConsequenceAPI } from '@/lib/api';

interface CausalChainModalProps {
  effect: EffectResponse | null;
  triggerParams: EarningsEventRequest;
  onClose: () => void;
}

export function CausalChainModal({ effect, triggerParams, onClose }: CausalChainModalProps) {
  const [explainedEffect, setExplainedEffect] = useState<ExplainedEffect | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!effect) return;

    // Fetch detailed explanation
    setLoading(true);
    ConsequenceAPI.explainCascade(triggerParams)
      .then((response) => {
        // Find the matching effect in top_effects
        const match = response.top_effects.find(
          (e) => e.effect.entity === effect.entity
        );
        setExplainedEffect(match || null);
      })
      .catch((err) => console.error('Failed to load explanation:', err))
      .finally(() => setLoading(false));
  }, [effect, triggerParams]);

  if (!effect) return null;

  const { cause_path } = effect;

  return (
    <Dialog open={!!effect} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            Causal Chain: {cause_path[0]} → {effect.entity}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Skeleton: Show cause_path immediately */}
          {!explainedEffect ? (
            <ChainSkeleton effect={effect} loading={loading} />
          ) : (
            <DetailedChain explainedEffect={explainedEffect} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Skeleton view while loading
function ChainSkeleton({ effect, loading }: { effect: EffectResponse; loading: boolean }) {
  return (
    <div className="space-y-4">
      {effect.cause_path.map((entity, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div className="flex items-center gap-2 my-2 pl-8">
              <div className="w-0.5 h-8 bg-gradient-to-b from-slate-600 to-slate-700"></div>
              <ChevronDown className="w-4 h-4 text-slate-600" />
              {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
            </div>
          )}
          <div className={cn(
            "p-4 rounded-lg border",
            idx === 0 && "bg-blue-500/10 border-blue-400/30",
            idx === effect.cause_path.length - 1 && "bg-green-500/10 border-green-400/30",
            idx > 0 && idx < effect.cause_path.length - 1 && "bg-slate-800 border-slate-700"
          )}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-slate-100">{entity}</div>
              {loading && idx > 0 && idx < effect.cause_path.length - 1 && (
                <div className="text-xs text-slate-500">Loading details...</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Detailed view with evidence
function DetailedChain({ explainedEffect }: { explainedEffect: ExplainedEffect }) {
  const { steps, narrative, confidence_factors } = explainedEffect;

  return (
    <div className="space-y-6">
      {/* Trigger */}
      <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-400/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-slate-100">
              {explainedEffect.trigger.entity}
            </div>
            <div className="text-xs text-blue-400 mt-1">Trigger Event</div>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-2xl font-bold",
              explainedEffect.trigger.magnitude_percent < 0 ? "text-red-400" : "text-green-400"
            )}>
              {explainedEffect.trigger.magnitude_percent > 0 ? "+" : ""}
              {explainedEffect.trigger.magnitude_percent.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-500">100% confidence</div>
          </div>
        </div>
      </div>

      {/* Steps */}
      {steps.map((step, idx) => (
        <div key={idx}>
          {/* Arrow with relationship */}
          <div className="flex items-start gap-3 my-3 pl-8">
            <div className="w-0.5 h-12 bg-gradient-to-b from-slate-600 to-slate-700 mt-2"></div>
            <div className="flex-1">
              <ChevronDown className="w-4 h-4 text-slate-600 mb-1" />
              <div className="text-xs font-mono text-slate-400">
                {step.relationship.replace(/_/g, ' ')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Strength: {(step.strength * 100).toFixed(0)}% •
                Delay: {step.delay_days.toFixed(1)} days •
                Confidence: {(step.confidence * 100).toFixed(0)}%
              </div>
              {/* Evidence */}
              {step.evidence && step.evidence.length > 0 && (
                <div className="mt-2 space-y-1">
                  {step.evidence.map((ev, i) => (
                    <div key={i} className="text-[10px] text-green-400/70 flex items-start gap-1">
                      <span className="text-green-400">→</span>
                      <span className="leading-tight">{ev}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Target entity */}
          <div className={cn(
            "p-4 rounded-lg border",
            idx === steps.length - 1 ? "bg-green-500/10 border-green-400/30" : "bg-slate-800 border-slate-700"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-100">{step.to}</div>
                {idx === steps.length - 1 && (
                  <div className="text-xs text-green-400 mt-1">Final Effect</div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {(step.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Narrative */}
      {narrative && (
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Full Explanation</h4>
          <p className="text-xs text-slate-400 leading-relaxed">{narrative}</p>
        </div>
      )}

      {/* Confidence Breakdown */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Confidence Breakdown</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Base Confidence</span>
            <span className="text-slate-300 font-mono">
              {(confidence_factors.base_confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Chain Length Penalty</span>
            <span className="text-slate-300 font-mono">
              {(confidence_factors.chain_length_penalty * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Relationship Confidence</span>
            <span className="text-slate-300 font-mono">
              {(confidence_factors.relationship_confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-px bg-slate-700 my-2"></div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-300">Final Confidence</span>
            <span className="text-green-400 font-mono">
              {(confidence_factors.final_confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
