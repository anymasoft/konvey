"""Top-level project model — единый объект, сериализуемый в один JSON-файл."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, Field

from konvey_backend.models.configuration import Configuration
from konvey_backend.models.enterprise_data import EnterpriseDataSchema


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ProjectSummary(BaseModel):
    """Lightweight summary for ProjectPicker list — без полной выгрузки configurations."""

    id: str
    name: str
    description: str | None = None
    source_config_name: str | None = None
    target_config_name: str | None = None
    ed_version: str | None = None
    created_at: datetime
    updated_at: datetime
    # Mapping progress — заполнятся в Sprint 1+. В Sprint 0 всегда 0/0.
    mapped_count: int = 0
    total_pcr_count: int = 0


class Project(BaseModel):
    """Полный объект проекта — сериализуется в один JSON-файл `<id>.json`."""

    id: str  # UUID4
    name: str
    description: str | None = None

    enterprise_data: EnterpriseDataSchema
    source_configuration: Configuration
    target_configuration: Configuration

    # Names like 'Document.Реализация', 'Catalog.Контрагенты'
    selected_objects: list[str] = Field(default_factory=list)

    # Sprint 1+: mappings: list[Mapping] = []
    # Sprint 1+: handlers: dict[str, str] = {}

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)

    def summary(self) -> ProjectSummary:
        return ProjectSummary(
            id=self.id,
            name=self.name,
            description=self.description,
            source_config_name=self.source_configuration.name,
            target_config_name=self.target_configuration.name,
            ed_version=self.enterprise_data.version,
            created_at=self.created_at,
            updated_at=self.updated_at,
            mapped_count=0,
            total_pcr_count=0,
        )


class NewProjectData(BaseModel):
    """Input для backend.create_project."""

    name: str
    description: str | None = None
    ed_xsd_path: str
    source_config_path: str
    target_config_path: str
    selected_objects: list[str] = Field(default_factory=list)
