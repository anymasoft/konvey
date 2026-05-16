"""Konvey backend — Python sidecar for Tauri shell.

Parses XSD schemas (EnterpriseData) and 1C XML configuration dumps,
generates BSL exchange rules, manages project storage as JSON files.

Talks to Tauri via JSON-RPC 2.0 over stdin/stdout.
"""

__version__ = "0.1.0"
