"""Tests for 1C configuration parser (parse_configuration)."""

from __future__ import annotations

import pytest

from konvey_backend.parsers.config_parser import parse_configuration


def test_parse_sample_configuration(sample_config_dir):
    """Happy path: synthetic mini-configuration parses without errors."""
    config = parse_configuration(sample_config_dir)
    assert config.name == "УчебнаяКонфигурация"
    assert config.version == "1.0.0.1"
    assert config.vendor == "Konvey Test"
    # 3 objects: 1 Catalog, 1 Document, 1 Enum
    assert len(config.objects) == 3


def test_parse_sample_catalog(sample_config_dir):
    """Catalog parsing: attributes with types extracted."""
    config = parse_configuration(sample_config_dir)
    contractor = config.objects.get("Catalog.Контрагенты")
    assert contractor is not None
    assert contractor.object_type == "Catalog"
    assert contractor.synonym == "Контрагенты"

    attr_names = {a.name for a in contractor.attributes}
    assert "ИНН" in attr_names
    assert "КПП" in attr_names
    assert "Вид" in attr_names

    # ИНН has length 12
    inn = next(a for a in contractor.attributes if a.name == "ИНН")
    assert inn.length == 12
    assert inn.type == "String"

    # Вид is EnumRef
    vid = next(a for a in contractor.attributes if a.name == "Вид")
    assert "EnumRef.ВидыКонтрагентов" in vid.type


def test_parse_sample_document_with_tabular(sample_config_dir):
    """Document with tabular section."""
    config = parse_configuration(sample_config_dir)
    doc = config.objects.get("Document.РеализацияТоваровУслуг")
    assert doc is not None
    assert doc.object_type == "Document"

    # Header attributes
    attr_names = {a.name for a in doc.attributes}
    assert "Контрагент" in attr_names
    assert "Сумма" in attr_names

    # Tabular section
    assert len(doc.tabular_sections) == 1
    tovary = doc.tabular_sections[0]
    assert tovary.name == "Товары"
    ts_attr_names = {a.name for a in tovary.attributes}
    assert "Номенклатура" in ts_attr_names
    assert "Количество" in ts_attr_names
    assert "Цена" in ts_attr_names


def test_parse_sample_enum(sample_config_dir):
    """Enum with values."""
    config = parse_configuration(sample_config_dir)
    e = config.objects.get("Enum.ВидыКонтрагентов")
    assert e is not None
    assert e.object_type == "Enum"
    assert e.enum_values is not None
    assert "ЮридическоеЛицо" in e.enum_values
    assert "ФизическоеЛицо" in e.enum_values
    assert len(e.enum_values) == 3


def test_parse_sample_summary(sample_config_dir):
    """Summary returns correct counts."""
    config = parse_configuration(sample_config_dir)
    s = config.summary()
    assert s["total"] == 3
    assert s.get("type_Catalog") == 1
    assert s.get("type_Document") == 1
    assert s.get("type_Enum") == 1


def test_parse_nonexistent_folder():
    """Missing folder raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        parse_configuration("/nonexistent/folder/path")


def test_parse_folder_without_configuration_xml(tmp_path):
    """Folder without Configuration.xml raises ValueError."""
    with pytest.raises(ValueError, match="Configuration.xml"):
        parse_configuration(tmp_path)


def test_by_type_filter(sample_config_dir):
    """by_type returns objects of specified type."""
    config = parse_configuration(sample_config_dir)
    catalogs = config.by_type("Catalog")
    assert len(catalogs) == 1
    assert catalogs[0].name == "Контрагенты"
