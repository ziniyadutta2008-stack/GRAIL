"""Deterministic workflow orchestration (Step Functions Standard plus routing code).

The orchestrator is not an LLM. It cannot invent tools, permissions or states. Every
execution ends at the Awaiting Human Review checkpoint (ADR-0007).
"""
