"""Explainability module for causal chains."""

from .trace import (
    trace_causal_chain,
    explain_effect,
    generate_narrative,
    explain_cascade,
    CausalExplanation,
)

__all__ = [
    "trace_causal_chain",
    "explain_effect",
    "generate_narrative",
    "explain_cascade",
    "CausalExplanation",
]
