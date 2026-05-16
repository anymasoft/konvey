"""Konvey backend entry point — runs as Tauri sidecar.

Reads JSON-RPC requests from stdin, writes responses to stdout. Logs go to stderr.

Registered methods:
- ping               — health check
- parse_xsd          — parse EnterpriseData XSD
- parse_configuration — parse 1C XML configuration dump
- list_projects      — return summaries of all projects
- load_project       — load full project by id
- save_project       — save a Project
- create_project     — create new project (parses XSD + 2 configs)
- delete_project     — delete project by id

Run directly:
    python -m konvey_backend
"""

from __future__ import annotations

import logging
import sys

from konvey_backend import __version__, rpc
from konvey_backend.models.project import NewProjectData, Project
from konvey_backend.parsers import parse_configuration, parse_xsd
from konvey_backend.storage import (
    create_project,
    delete_project,
    list_projects,
    load_project,
    save_project,
)

# Logs go to stderr (stdout reserved for JSON-RPC responses)
logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="[konvey-backend] %(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger(__name__)


# === RPC methods ===

@rpc.method("ping")
def _ping() -> dict:
    """Health check — verifies that sidecar process is alive and responding."""
    return {"ok": True, "version": __version__}


@rpc.method("parse_xsd")
def _parse_xsd(path: str) -> dict:
    """Parse EnterpriseData XSD. Returns serialized EnterpriseDataSchema + summary."""
    schema = parse_xsd(path)
    return {
        "schema": schema.model_dump(mode="json"),
        "summary": schema.summary(),
    }


@rpc.method("parse_configuration")
def _parse_configuration(path: str) -> dict:
    """Parse 1C XML configuration dump folder."""
    config = parse_configuration(path)
    return {
        "configuration": config.model_dump(mode="json"),
        "summary": config.summary(),
    }


@rpc.method("list_projects")
def _list_projects() -> list[dict]:
    summaries = list_projects()
    return [s.model_dump(mode="json") for s in summaries]


@rpc.method("load_project")
def _load_project(id: str) -> dict:
    project = load_project(id)
    return project.model_dump(mode="json")


@rpc.method("save_project")
def _save_project(project: dict) -> dict:
    p = Project.model_validate(project)
    save_project(p)
    return {"ok": True, "id": p.id}


@rpc.method("create_project")
def _create_project(data: dict) -> dict:
    npd = NewProjectData.model_validate(data)
    project = create_project(npd)
    return project.model_dump(mode="json")


@rpc.method("delete_project")
def _delete_project(id: str) -> dict:
    delete_project(id)
    return {"ok": True}


def main() -> int:
    log.info("Konvey backend %s starting (PID %d)", __version__, sys.argv and 0)
    try:
        rpc.serve()
    except KeyboardInterrupt:
        log.info("Interrupted by signal")
    log.info("Konvey backend exiting cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
