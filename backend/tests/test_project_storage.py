"""Tests for project_storage (create/save/load/list/delete round-trip)."""

from __future__ import annotations

import pytest

from konvey_backend.models.project import NewProjectData
from konvey_backend.storage import (
    create_project,
    delete_project,
    list_projects,
    load_project,
    save_project,
)


def test_list_empty(tmp_projects_dir):
    """Empty directory returns empty list."""
    assert list_projects() == []


def test_create_and_load_roundtrip(tmp_projects_dir, sample_xsd_path, sample_config_dir):
    """create_project parses inputs and saves a project; load_project returns it back."""
    data = NewProjectData(
        name="Test Project",
        description="Hello",
        ed_xsd_path=str(sample_xsd_path),
        source_config_path=str(sample_config_dir),
        target_config_path=str(sample_config_dir),
        selected_objects=["Catalog.Контрагенты"],
    )
    project = create_project(data)
    assert project.name == "Test Project"
    assert project.id

    loaded = load_project(project.id)
    assert loaded.name == "Test Project"
    assert loaded.description == "Hello"
    assert loaded.selected_objects == ["Catalog.Контрагенты"]
    # Parsed data preserved
    assert loaded.enterprise_data.version == "1.8"
    assert "Catalog.Контрагенты" in loaded.source_configuration.objects


def test_list_after_create(tmp_projects_dir, sample_xsd_path, sample_config_dir):
    """list_projects returns summaries after creating projects."""
    data = NewProjectData(
        name="A",
        ed_xsd_path=str(sample_xsd_path),
        source_config_path=str(sample_config_dir),
        target_config_path=str(sample_config_dir),
    )
    create_project(data)
    create_project(data.model_copy(update={"name": "B"}))

    summaries = list_projects()
    assert len(summaries) == 2
    names = {s.name for s in summaries}
    assert names == {"A", "B"}


def test_delete(tmp_projects_dir, sample_xsd_path, sample_config_dir):
    """delete_project removes the JSON file."""
    data = NewProjectData(
        name="ToDelete",
        ed_xsd_path=str(sample_xsd_path),
        source_config_path=str(sample_config_dir),
        target_config_path=str(sample_config_dir),
    )
    project = create_project(data)
    assert len(list_projects()) == 1

    delete_project(project.id)
    assert len(list_projects()) == 0


def test_delete_nonexistent_is_noop(tmp_projects_dir):
    """delete_project on nonexistent id should not raise."""
    delete_project("nonexistent-id-12345")  # no raise


def test_load_nonexistent_raises(tmp_projects_dir):
    """load_project on missing id raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        load_project("nonexistent-id-12345")


def test_save_updates_timestamp(tmp_projects_dir, sample_xsd_path, sample_config_dir):
    """save_project updates the updated_at timestamp."""
    data = NewProjectData(
        name="Stamped",
        ed_xsd_path=str(sample_xsd_path),
        source_config_path=str(sample_config_dir),
        target_config_path=str(sample_config_dir),
    )
    project = create_project(data)
    original_updated = project.updated_at

    # Modify and save
    project.name = "Stamped Modified"
    save_project(project)

    loaded = load_project(project.id)
    assert loaded.name == "Stamped Modified"
    assert loaded.updated_at >= original_updated
