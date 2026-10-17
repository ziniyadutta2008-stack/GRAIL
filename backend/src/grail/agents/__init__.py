"""Constrained, domain-specific agent contracts (CLAUDE.md section 14).

Agents receive a versioned input envelope and return schema-validated JSON proposals.
They write only to proposal storage and can never change authoritative governance
status, approve decisions, close remediation or mark evidence sufficient.
"""
