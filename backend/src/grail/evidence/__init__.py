"""Evidence objects and freshness.

Every evidence object needs a classification, owner, source, collected date and a
review or expiry date. Files move from a quarantine prefix to the protected evidence
prefix only after extension, MIME type, signature and size checks.
"""
