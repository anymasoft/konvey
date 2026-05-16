"""Tests for JSON-RPC dispatcher."""

from __future__ import annotations

import json

import pytest

from konvey_backend import rpc


@pytest.fixture(autouse=True)
def _reset_handlers():
    """Each test starts with a clean handler registry."""
    snapshot = dict(rpc._HANDLERS)
    rpc._HANDLERS.clear()
    yield
    rpc._HANDLERS.clear()
    rpc._HANDLERS.update(snapshot)


def test_dispatch_simple_call():
    @rpc.method("add")
    def add(a, b):
        return a + b

    req = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "add", "params": {"a": 2, "b": 3}})
    resp = rpc.handle_request(req)
    assert resp == {"jsonrpc": "2.0", "id": 1, "result": 5}


def test_dispatch_positional_params():
    @rpc.method("greet")
    def greet(name):
        return f"hello {name}"

    req = json.dumps({"jsonrpc": "2.0", "id": "x", "method": "greet", "params": ["world"]})
    resp = rpc.handle_request(req)
    assert resp == {"jsonrpc": "2.0", "id": "x", "result": "hello world"}


def test_parse_error_returns_32700():
    resp = rpc.handle_request("not valid json")
    assert resp is not None
    assert resp["error"]["code"] == -32700


def test_method_not_found():
    req = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "unknown"})
    resp = rpc.handle_request(req)
    assert resp is not None
    assert resp["error"]["code"] == -32601


def test_invalid_params_returns_32602():
    @rpc.method("strict")
    def strict(required_arg):  # noqa: ARG001
        return "ok"

    req = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "strict", "params": {"wrong": "x"}})
    resp = rpc.handle_request(req)
    assert resp is not None
    assert resp["error"]["code"] == -32602


def test_handler_exception_returns_32603():
    @rpc.method("boom")
    def boom():
        raise RuntimeError("kaboom")

    req = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "boom"})
    resp = rpc.handle_request(req)
    assert resp is not None
    assert resp["error"]["code"] == -32603
    assert "kaboom" in resp["error"]["data"]["message"]


def test_notification_no_response():
    @rpc.method("notify_me")
    def notify_me():
        return "ignored"

    req = json.dumps({"jsonrpc": "2.0", "method": "notify_me"})  # no 'id'
    resp = rpc.handle_request(req)
    assert resp is None


def test_invalid_jsonrpc_version():
    req = json.dumps({"jsonrpc": "1.0", "id": 1, "method": "anything"})
    resp = rpc.handle_request(req)
    assert resp is not None
    assert resp["error"]["code"] == -32600
