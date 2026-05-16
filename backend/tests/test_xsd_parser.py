"""Tests for XSD parser (parse_xsd)."""

from __future__ import annotations

import pytest

from konvey_backend.parsers.xsd_parser import parse_xsd


def test_parse_sample_xsd_basic(sample_xsd_path):
    """Happy path: synthetic XSD parses without errors."""
    schema = parse_xsd(sample_xsd_path)
    assert schema.version == "1.8"
    assert "EnterpriseData/1.8" in schema.namespace
    assert len(schema.complex_types) >= 5
    assert len(schema.simple_types) >= 2


def test_parse_sample_categorization(sample_xsd_path):
    """Categorization by Russian prefix works correctly."""
    schema = parse_xsd(sample_xsd_path)

    # Documents
    docs = schema.documents
    assert any(t.name == "Документ.РеализацияТоваровУслуг" for t in docs)

    # Catalogs
    cats = schema.catalogs
    assert any(t.name == "Справочник.Контрагенты" for t in cats)
    assert any(t.name == "Справочник.Номенклатура" for t in cats)

    # Composite key types
    comps = schema.composites
    assert any(t.name == "КлючевыеСвойстваКонтрагент" for t in comps)

    # Tabular section row (has 2+ dots)
    ts = [t for t in schema.complex_types.values() if t.category == "tabular_section"]
    assert any("Товары" in t.name for t in ts)


def test_parse_sample_enum_extraction(sample_xsd_path):
    """xs:simpleType with xs:enumeration captures enum values."""
    schema = parse_xsd(sample_xsd_path)
    enum_type = schema.simple_types.get("ВидКонтрагента")
    assert enum_type is not None
    assert enum_type.base_type == "string"
    enums = enum_type.restrictions.get("enumeration", [])
    assert "ЮридическоеЛицо" in enums
    assert "ФизическоеЛицо" in enums
    assert len(enums) == 3


def test_parse_sample_extension_pattern(sample_xsd_path):
    """xs:complexContent + xs:extension correctly captures parent_type."""
    schema = parse_xsd(sample_xsd_path)
    contractor = schema.complex_types.get("Справочник.Контрагенты")
    assert contractor is not None
    assert contractor.parent_type == "Object"
    # Fields come from the extension's sequence
    field_names = [f.name for f in contractor.fields]
    assert "Наименование" in field_names
    assert "ИНН" in field_names
    assert "Вид" in field_names


def test_parse_nonexistent_file_raises():
    """Missing XSD file raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        parse_xsd("/nonexistent/path/to/schema.xsd")


def test_parse_invalid_xml(tmp_path):
    """Invalid XML raises ValueError."""
    bad = tmp_path / "bad.xsd"
    bad.write_text("<not valid xml")
    with pytest.raises(ValueError):
        parse_xsd(bad)


@pytest.mark.skipif(
    not __import__("pathlib").Path(__file__).parent.joinpath("fixtures/EnterpriseData_1_8_6.xsd").exists(),
    reason="Real XSD fixture not present (optional integration test)",
)
def test_parse_real_xsd_1_8_smoke(real_xsd_1_8_path):
    """Smoke test against real EnterpriseData 1.8.6 XSD (~920 KB)."""
    schema = parse_xsd(real_xsd_1_8_path)
    # Should have hundreds of types
    assert len(schema.complex_types) > 100
    # Version extracted from namespace
    assert schema.version.startswith("1.")
    # At least some documents and catalogs
    assert len(schema.documents) > 0
    assert len(schema.catalogs) > 0
    # Summary works
    summary = schema.summary()
    assert summary["total_complex"] == len(schema.complex_types)
