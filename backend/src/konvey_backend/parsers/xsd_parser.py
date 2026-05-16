"""Parser for EnterpriseData XSD schemas.

Input: path to .xsd file.
Output: EnterpriseDataSchema Pydantic model.

The parser handles:
- xs:complexType with xs:complexContent + xs:extension (the EnterpriseData pattern)
- xs:simpleType with xs:restriction (enumerations, patterns, length limits)
- xs:sequence with xs:element (fields)
- xs:any — skipped (these are extension points)

Categorization heuristic: by Russian type-name prefix.
"""

from __future__ import annotations

import re
from pathlib import Path

from lxml import etree

from konvey_backend.models.enterprise_data import (
    EnterpriseDataSchema,
    TypeCategory,
    XsdComplexType,
    XsdField,
    XsdSimpleType,
)

XS = "http://www.w3.org/2001/XMLSchema"
NS = {"xs": XS}

# Prefix -> category mapping. Order matters: more specific first.
# A type name like "Документ.X.Y.Строка" should match "tabular_section" (suffix-based)
# before falling through to "Документ" prefix.
_PREFIX_RULES: list[tuple[str, TypeCategory]] = [
    ("Документ.", "document"),
    ("Справочник.", "catalog"),
    ("Перечисление.", "enum"),
    ("РегистрСведений.", "register"),
    ("РегистрНакопления.", "register"),
    ("РегистрБухгалтерии.", "register"),
    ("РегистрРасчёта.", "register"),
    ("ПланСчетов.", "chart_of_accounts"),
    ("ПланВидовХарактеристик.", "chart_of_characteristic_types"),
    ("БизнесПроцесс.", "business_process"),
    ("Задача.", "task"),
    ("КлючевыеСвойства", "composite"),
    ("СоставноеЗначение.", "composite"),
    ("ВидДокумента.", "enum"),
    ("ВидСправочника.", "enum"),
]


def _categorize(name: str) -> TypeCategory:
    """Assign category based on type-name prefix/suffix."""
    # Tabular section rows in EnterpriseData are named "<Object>.<TS>" or "<Object>.<TS>.Строка"
    # Heuristic: if the name has 2+ dots, it's probably a tabular section.
    if name.endswith(".Строка") or name.count(".") >= 2:
        return "tabular_section"
    for prefix, category in _PREFIX_RULES:
        if name.startswith(prefix):
            return category
    return "other"


def _local(tag: str) -> str:
    """Strip namespace from tag name."""
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def _strip_ns(type_ref: str) -> str:
    """'tns:Документ.Реализация' -> 'Документ.Реализация'."""
    if ":" in type_ref:
        return type_ref.split(":", 1)[1]
    return type_ref


def _parse_simple_type(el: etree._Element) -> XsdSimpleType:
    """Parse <xs:simpleType name="..."> element."""
    name = el.get("name", "")
    base_type = ""
    restrictions: dict = {}

    restr = el.find(f"{{{XS}}}restriction")
    if restr is not None:
        base_type = _strip_ns(restr.get("base", ""))
        # Enumerations
        enums = [e.get("value") for e in restr.findall(f"{{{XS}}}enumeration") if e.get("value") is not None]
        if enums:
            restrictions["enumeration"] = enums
        # Other restrictions
        for facet in ("maxLength", "minLength", "pattern", "fractionDigits", "totalDigits", "minInclusive", "maxInclusive"):
            f = restr.find(f"{{{XS}}}{facet}")
            if f is not None and f.get("value") is not None:
                restrictions[facet] = f.get("value")

    return XsdSimpleType(name=name, base_type=base_type, restrictions=restrictions)


def _parse_field(el: etree._Element) -> XsdField:
    """Parse <xs:element name="..." type="..." />."""
    name = el.get("name", "")
    type_ref = _strip_ns(el.get("type", "") or "")
    min_occurs = int(el.get("minOccurs", "1"))
    raw_max = el.get("maxOccurs", "1")
    max_occurs: int | str = raw_max if raw_max == "unbounded" else int(raw_max)
    is_required = min_occurs > 0
    return XsdField(
        name=name,
        type_ref=type_ref,
        min_occurs=min_occurs,
        max_occurs=max_occurs,
        is_required=is_required,
    )


def _parse_complex_type(el: etree._Element) -> XsdComplexType:
    """Parse <xs:complexType name="..."> element.

    Handles both flat complexType and xs:complexContent + xs:extension pattern.
    """
    name = el.get("name", "")
    parent_type: str | None = None
    fields: list[XsdField] = []

    # Annotation (documentation)
    annotation: str | None = None
    ann = el.find(f"{{{XS}}}annotation/{{{XS}}}documentation")
    if ann is not None and ann.text:
        annotation = ann.text.strip()

    # Case 1: xs:complexContent / xs:extension
    cc = el.find(f"{{{XS}}}complexContent")
    if cc is not None:
        ext = cc.find(f"{{{XS}}}extension")
        if ext is not None:
            parent_type = _strip_ns(ext.get("base", ""))
            # Fields from extension
            seq = ext.find(f"{{{XS}}}sequence")
            if seq is not None:
                for child in seq.findall(f"{{{XS}}}element"):
                    fields.append(_parse_field(child))

    # Case 2: flat xs:sequence directly under complexType
    seq = el.find(f"{{{XS}}}sequence")
    if seq is not None:
        for child in seq.findall(f"{{{XS}}}element"):
            fields.append(_parse_field(child))

    return XsdComplexType(
        name=name,
        category=_categorize(name),
        parent_type=parent_type,
        fields=fields,
        annotation=annotation,
    )


def _extract_version(target_namespace: str) -> str:
    """Extract version like '1.8' from URI 'http://v8.1c.ru/edi/edi_stnd/EnterpriseData/1.8'."""
    m = re.search(r"/([\d.]+)/?$", target_namespace)
    return m.group(1) if m else "unknown"


def parse_xsd(path: str | Path) -> EnterpriseDataSchema:
    """Parse EnterpriseData XSD file."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"XSD file not found: {path}")
    if not p.is_file():
        raise ValueError(f"Not a file: {path}")

    try:
        tree = etree.parse(str(p))
    except etree.XMLSyntaxError as e:
        raise ValueError(f"Invalid XML in {path}: {e}") from e

    root = tree.getroot()
    if _local(root.tag) != "schema":
        raise ValueError(f"Root element is not xs:schema (got {root.tag})")

    target_namespace = root.get("targetNamespace", "")
    version = _extract_version(target_namespace)

    simple_types: dict[str, XsdSimpleType] = {}
    for el in root.findall(f"{{{XS}}}simpleType"):
        st = _parse_simple_type(el)
        if st.name:
            simple_types[st.name] = st

    complex_types: dict[str, XsdComplexType] = {}
    for el in root.findall(f"{{{XS}}}complexType"):
        ct = _parse_complex_type(el)
        if ct.name:
            complex_types[ct.name] = ct

    return EnterpriseDataSchema(
        version=version,
        namespace=target_namespace,
        simple_types=simple_types,
        complex_types=complex_types,
    )
