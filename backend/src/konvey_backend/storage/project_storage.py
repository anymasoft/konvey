"""Project storage layer.

Each project is a single JSON file `<uuid>.json` in:
- Windows: %APPDATA%\\Konvey\\Projects\\
- Linux/macOS: ~/.config/Konvey/Projects/

list_projects() — reads all JSON files, returns lightweight summaries (без полного
парсинга XSD/Configuration внутри — экономия памяти при отображении в Picker'е).

For testing, the directory can be overridden via env KONVEY_PROJECTS_DIR.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

from konvey_backend.models.configuration import Configuration
from konvey_backend.models.enterprise_data import EnterpriseDataSchema
from konvey_backend.models.project import (
    CURRENT_PROJECT_SCHEMA_VERSION,
    NewProjectData,
    Project,
    ProjectSummary,
)
from konvey_backend.parsers.config_parser import parse_configuration
from konvey_backend.parsers.xsd_parser import parse_xsd

log = logging.getLogger(__name__)


def migrate_project_dict(data: dict) -> dict:
    """Migrate a project dict from an older schema version to CURRENT_PROJECT_SCHEMA_VERSION.

    Idempotent: calling on an already-current dict is a no-op.

    Migrations applied:
      v1 -> v2: add `schema_version=2`, ensure `mappings=[]`, ensure
                `enterprise_data.primary_namespace` (renamed from `namespace`),
                ensure `enterprise_data.extension_namespaces=[]`.
    """
    current = data.get("schema_version", 1)

    if current >= CURRENT_PROJECT_SCHEMA_VERSION:
        return data

    # v1 -> v2
    if current == 1:
        log.info(
            "Migrating project %s from schema v1 to v2",
            data.get("id", "<unknown>"),
        )
        if "mappings" not in data:
            data["mappings"] = []
        if "enterprise_data" in data and isinstance(data["enterprise_data"], dict):
            ed = data["enterprise_data"]
            # Rename `namespace` -> `primary_namespace` if v1 schema used the old name.
            if "primary_namespace" not in ed and "namespace" in ed:
                ed["primary_namespace"] = ed["namespace"]
            if "extension_namespaces" not in ed:
                ed["extension_namespaces"] = []
        data["schema_version"] = 2
        current = 2

    # Future migrations slot in here:
    # if current == 2: ... -> 3

    return data


def projects_dir() -> Path:
    """Return path to Konvey projects directory, creating it if missing.

    Override via env var KONVEY_PROJECTS_DIR (useful for tests).
    """
    override = os.environ.get("KONVEY_PROJECTS_DIR")
    if override:
        p = Path(override)
    elif sys.platform == "win32":
        appdata = os.environ.get("APPDATA")
        if not appdata:
            raise RuntimeError("APPDATA environment variable not set on Windows")
        p = Path(appdata) / "Konvey" / "Projects"
    else:
        # Linux / macOS
        xdg = os.environ.get("XDG_CONFIG_HOME")
        base = Path(xdg) if xdg else Path.home() / ".config"
        p = base / "Konvey" / "Projects"

    p.mkdir(parents=True, exist_ok=True)
    return p


def _project_path(project_id: str) -> Path:
    return projects_dir() / f"{project_id}.json"


def list_projects() -> list[ProjectSummary]:
    """List all projects — returns summaries only (does not load full configurations)."""
    out: list[ProjectSummary] = []
    for f in projects_dir().glob("*.json"):
        try:
            with f.open(encoding="utf-8") as fp:
                data = json.load(fp)
            # Build summary directly from JSON without instantiating full Project
            # (avoids re-validating large EnterpriseDataSchema for every entry)
            # No migration needed for summary - we only read top-level fields.
            out.append(
                ProjectSummary(
                    id=data["id"],
                    name=data["name"],
                    description=data.get("description"),
                    source_config_name=data.get("source_configuration", {}).get("name"),
                    target_config_name=data.get("target_configuration", {}).get("name"),
                    ed_version=data.get("enterprise_data", {}).get("version"),
                    created_at=datetime.fromisoformat(data["created_at"]),
                    updated_at=datetime.fromisoformat(data["updated_at"]),
                    # Sprint 0.5: mapping counts still 0 - mapping engine in Sprint 1.
                    mapped_count=len(data.get("mappings", [])),
                    total_pcr_count=0,
                    unresolved_count=0,
                )
            )
        except (json.JSONDecodeError, KeyError, ValueError):
            # Skip corrupted project file silently
            continue

    # Sort by updated_at desc
    out.sort(key=lambda s: s.updated_at, reverse=True)
    return out


def load_project(project_id: str) -> Project:
    """Load full Project by id, applying schema migrations if needed."""
    p = _project_path(project_id)
    if not p.exists():
        raise FileNotFoundError(f"Project not found: {project_id}")
    with p.open(encoding="utf-8") as fp:
        data = json.load(fp)
    data = migrate_project_dict(data)
    return Project.model_validate(data)


def save_project(project: Project) -> None:
    """Save Project to disk. Overwrites existing file with same id."""
    project.updated_at = datetime.now(project.updated_at.tzinfo)
    p = _project_path(project.id)
    # Use Pydantic's JSON encoder for proper datetime serialization
    data = project.model_dump(mode="json")
    with p.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)


def create_project(data: NewProjectData) -> Project:
    """Parse inputs (XSD + 2 configurations) and create a new Project."""
    ed: EnterpriseDataSchema = parse_xsd(data.ed_xsd_path)
    src: Configuration = parse_configuration(data.source_config_path)
    tgt: Configuration = parse_configuration(data.target_config_path)

    project = Project(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description,
        enterprise_data=ed,
        source_configuration=src,
        target_configuration=tgt,
        selected_objects=data.selected_objects,
    )
    save_project(project)
    return project


def delete_project(project_id: str) -> None:
    """Delete project JSON file by id. No-op if not found."""
    p = _project_path(project_id)
    if p.exists():
        p.unlink()
