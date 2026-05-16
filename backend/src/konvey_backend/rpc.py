"""Minimal JSON-RPC 2.0 over stdio.

Reads one JSON request per line from stdin, writes one JSON response per line
to stdout. Logs go to stderr (must not pollute stdout).

Methods are registered via @rpc.method('name') decorator. Each method handler
receives parsed params (dict or list) and returns a JSON-serializable result
or raises an exception (converted to JSON-RPC error response).

Errors follow JSON-RPC 2.0 codes:
- -32700  Parse error (invalid JSON)
- -32600  Invalid Request (missing method / wrong jsonrpc version)
- -32601  Method not found
- -32602  Invalid params (e.g., Pydantic validation error)
- -32603  Internal error (any other exception)
"""

from __future__ import annotations

import json
import logging
import sys
import traceback
from typing import Any, Callable

log = logging.getLogger(__name__)

# Registry of method name -> handler
_HANDLERS: dict[str, Callable[..., Any]] = {}


def method(name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator to register a JSON-RPC handler."""

    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        if name in _HANDLERS:
            raise RuntimeError(f"Method already registered: {name}")
        _HANDLERS[name] = fn
        return fn

    return decorator


def _ok(req_id: Any, result: Any) -> dict:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _err(req_id: Any, code: int, message: str, data: Any = None) -> dict:
    err: dict = {"code": code, "message": message}
    if data is not None:
        err["data"] = data
    return {"jsonrpc": "2.0", "id": req_id, "error": err}


def handle_request(raw: str) -> dict | None:
    """Process a single line. Returns response dict, or None for notifications.

    For notification (no 'id') errors are still suppressed silently per spec.
    """
    # Parse JSON
    try:
        req = json.loads(raw)
    except json.JSONDecodeError as e:
        return _err(None, -32700, "Parse error", str(e))

    if not isinstance(req, dict):
        return _err(None, -32600, "Invalid Request", "Request must be a JSON object")

    req_id = req.get("id")
    is_notification = "id" not in req

    if req.get("jsonrpc") != "2.0":
        if is_notification:
            return None
        return _err(req_id, -32600, "Invalid Request", "jsonrpc field must be '2.0'")

    method_name = req.get("method")
    if not isinstance(method_name, str):
        if is_notification:
            return None
        return _err(req_id, -32600, "Invalid Request", "method field required")

    handler = _HANDLERS.get(method_name)
    if handler is None:
        if is_notification:
            return None
        return _err(req_id, -32601, f"Method not found: {method_name}")

    params = req.get("params", {})

    try:
        # Call handler. Params can be dict (kwargs) or list (args).
        if isinstance(params, dict):
            result = handler(**params)
        elif isinstance(params, list):
            result = handler(*params)
        else:
            return _err(req_id, -32602, "Invalid params", "params must be object or array")
    except TypeError as e:
        # Likely wrong arguments — treat as -32602
        if is_notification:
            return None
        return _err(req_id, -32602, "Invalid params", str(e))
    except Exception as e:  # noqa: BLE001 — JSON-RPC needs all errors caught
        log.exception("Handler %s raised", method_name)
        if is_notification:
            return None
        return _err(
            req_id,
            -32603,
            "Internal error",
            {"exception": type(e).__name__, "message": str(e), "traceback": traceback.format_exc()},
        )

    if is_notification:
        return None
    return _ok(req_id, result)


def serve(stdin=sys.stdin, stdout=sys.stdout) -> None:
    """Read lines from stdin, dispatch, write responses to stdout. Blocking loop."""
    log.info("RPC server started, methods: %s", sorted(_HANDLERS.keys()))
    for line in stdin:
        line = line.strip()
        if not line:
            continue
        response = handle_request(line)
        if response is not None:
            try:
                stdout.write(json.dumps(response, ensure_ascii=False, default=str) + "\n")
                stdout.flush()
            except (BrokenPipeError, OSError):
                log.warning("stdout pipe broken — exiting RPC loop")
                break
    log.info("RPC server exiting (stdin closed)")
