"""Pytest configuration and shared fixtures."""

from __future__ import annotations

from pathlib import Path

import pytest

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
def sample_xsd_path() -> Path:
    """Minimal synthetic EnterpriseData XSD (small, for unit tests)."""
    return FIXTURES / "sample_enterprise_data.xsd"


@pytest.fixture
def real_xsd_1_8_path() -> Path:
    """Real EnterpriseData XSD 1.8.6 (~920 KB) for integration tests."""
    return FIXTURES / "EnterpriseData_1_8_6.xsd"


@pytest.fixture
def real_xsd_1_6_path() -> Path:
    """Real EnterpriseData XSD 1.6.23 (~786 KB) for integration tests."""
    return FIXTURES / "EnterpriseData_1_6_23.xsd"


@pytest.fixture
def sample_config_dir() -> Path:
    """Minimal synthetic 1C configuration dump for unit tests."""
    return FIXTURES / "sample_configuration"


@pytest.fixture
def tmp_projects_dir(tmp_path, monkeypatch) -> Path:
    """Override KONVEY_PROJECTS_DIR to a per-test tmp directory."""
    d = tmp_path / "projects"
    d.mkdir()
    monkeypatch.setenv("KONVEY_PROJECTS_DIR", str(d))
    return d
