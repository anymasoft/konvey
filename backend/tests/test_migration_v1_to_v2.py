"""Tests for project schema migration v1 -> v2 (Sprint 0.5).

A v1 project JSON on disk has:
  - no `schema_version` field
  - no `mappings` field
  - `enterprise_data.namespace` (later renamed to `primary_namespace`)
  - no `enterprise_data.extension_namespaces`

After migration the dict must be valid input for Project.model_validate().
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from konvey_backend.models.project import CURRENT_PROJECT_SCHEMA_VERSION, Project
from konvey_backend.storage import migrate_project_dict


def _make_v1_dict() -> dict:
    """Build a minimal v1 project dict, as if saved by Sprint 0."""
    return {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "Legacy v1 project",
        "description": None,
        "enterprise_data": {
            "version": "1.8",
            "namespace": "http://v8.1c.ru/edi/edi_stnd/EnterpriseData/1.8",
            "simple_types": {},
            "complex_types": {},
        },
        "source_configuration": {
            "name": "UT",
            "synonym": None,
            "version": None,
            "vendor": None,
            "objects": {},
        },
        "target_configuration": {
            "name": "BP",
            "synonym": None,
            "version": None,
            "vendor": None,
            "objects": {},
        },
        "selected_objects": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def test_migrate_adds_schema_version():
    data = _make_v1_dict()
    assert "schema_version" not in data
    migrated = migrate_project_dict(data)
    assert migrated["schema_version"] == CURRENT_PROJECT_SCHEMA_VERSION


def test_migrate_adds_mappings():
    data = _make_v1_dict()
    assert "mappings" not in data
    migrated = migrate_project_dict(data)
    assert migrated["mappings"] == []


def test_migrate_renames_namespace_to_primary_namespace():
    data = _make_v1_dict()
    assert "namespace" in data["enterprise_data"]
    assert "primary_namespace" not in data["enterprise_data"]
    migrated = migrate_project_dict(data)
    ed = migrated["enterprise_data"]
    # primary_namespace must be set to the original namespace value
    assert ed["primary_namespace"] == "http://v8.1c.ru/edi/edi_stnd/EnterpriseData/1.8"
    # extension_namespaces must be initialised empty
    assert ed["extension_namespaces"] == []


def test_migrated_dict_validates_as_project():
    """End-to-end: v1 dict -> migrate -> Project.model_validate succeeds."""
    data = _make_v1_dict()
    migrated = migrate_project_dict(data)
    project = Project.model_validate(migrated)
    assert project.schema_version == CURRENT_PROJECT_SCHEMA_VERSION
    assert project.name == "Legacy v1 project"
    assert project.mappings == []
    assert project.enterprise_data.primary_namespace.endswith("/1.8")


def test_migrate_idempotent_on_v2():
    """Calling migrate on already-v2 dict should not change anything."""
    data = _make_v1_dict()
    once = migrate_project_dict(data)
    twice = migrate_project_dict(once.copy())
    assert once["schema_version"] == twice["schema_version"]
    assert once["mappings"] == twice["mappings"]


def test_migrate_idempotent_on_current_version():
    """A dict that already has schema_version = current must be returned unchanged."""
    data = {
        "schema_version": CURRENT_PROJECT_SCHEMA_VERSION,
        "id": "x",
        "name": "y",
        "mappings": [{"id": "test"}],
    }
    migrated = migrate_project_dict(dict(data))
    assert migrated["schema_version"] == CURRENT_PROJECT_SCHEMA_VERSION
    assert migrated["mappings"] == [{"id": "test"}]
