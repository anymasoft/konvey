"""Models for EnterpriseData XSD schema.

Sprint 0.5 update: added namespace support for `ext1:*` extension packages
(see docs/REFERENCE_EXT.md and ADR-008). In Sprint 0.5 these fields are
always set to None by the parser; multi-namespace parsing arrives in Sprint 2.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# Categories assigned heuristically by Russian type-name prefix.
# Sprint 1 will expand this list to 16+ categories per Opus's Q4 answer
# (key_properties, common_properties, tabular_section_row, etc).
TypeCategory = Literal[
    "document",
    "catalog",
    "register",
    "enum",
    "composite",
    "tabular_section",
    "chart_of_accounts",
    "chart_of_characteristic_types",
    "business_process",
    "task",
    "other",
]


class XsdSimpleType(BaseModel):
    """xs:simpleType - primitive with restrictions / enumerations."""

    name: str
    base_type: str  # xs:string, xs:decimal, ns1:Идентификатор, ...
    restrictions: dict = Field(default_factory=dict)
    # restrictions may contain: pattern, enumeration (list[str]),
    # maxLength, minLength, fractionDigits, etc.


class XsdField(BaseModel):
    """xs:element inside a xs:complexType."""

    name: str
    type_ref: str  # имя типа (может быть simpleType или complexType, может быть с префиксом)
    min_occurs: int = 1
    max_occurs: int | str = 1  # int or 'unbounded'
    is_required: bool = True

    # Sprint 0.5: namespace-aware fields (for ext1:* extensions in Sprint 2+).
    # None = primary namespace of the schema. Non-None URI = field belongs to
    # an extension package (see REFERENCE_EXT.md).
    namespace: str | None = None


class XsdComplexType(BaseModel):
    """xs:complexType - describes a structured object (document, catalog, composite key, ...)."""

    name: str
    category: TypeCategory
    parent_type: str | None = None  # для xs:complexContent + xs:extension
    fields: list[XsdField] = Field(default_factory=list)
    annotation: str | None = None

    # Sprint 0.5: type belongs to which XSD package (URI). None = primary.
    namespace: str | None = None


class EnterpriseDataSchema(BaseModel):
    """Parsed XSD-схема EnterpriseData.

    Sprint 0.5: introduces `primary_namespace` (renamed from `namespace`) and
    `extension_namespaces` for future multi-namespace support. In Sprint 0.5
    `extension_namespaces` is always empty - the parser reads only the root
    XSD file without resolving `xs:import` directives. Multi-namespace
    extension parsing lands in Sprint 2.
    """

    version: str  # from targetNamespace, e.g. "1.8" or "1.8.6" if can extract

    # Sprint 0.5: `namespace` renamed to `primary_namespace` to make room for
    # extension_namespaces. We keep `namespace` as a computed alias for
    # backward compat with the TypeScript types until Sprint 1 ports them.
    primary_namespace: str = ""
    extension_namespaces: list[str] = Field(default_factory=list)

    simple_types: dict[str, XsdSimpleType] = Field(default_factory=dict)
    complex_types: dict[str, XsdComplexType] = Field(default_factory=dict)

    # ── Backward-compat alias so existing code/tests that read `.namespace`
    #    continue to work. Will be removed in Sprint 2 once frontend types
    #    are migrated to `primary_namespace`.
    @property
    def namespace(self) -> str:
        return self.primary_namespace

    @property
    def documents(self) -> list[XsdComplexType]:
        return [t for t in self.complex_types.values() if t.category == "document"]

    @property
    def catalogs(self) -> list[XsdComplexType]:
        return [t for t in self.complex_types.values() if t.category == "catalog"]

    @property
    def registers(self) -> list[XsdComplexType]:
        return [t for t in self.complex_types.values() if t.category == "register"]

    @property
    def enums(self) -> list[XsdComplexType]:
        return [t for t in self.complex_types.values() if t.category == "enum"]

    @property
    def composites(self) -> list[XsdComplexType]:
        return [t for t in self.complex_types.values() if t.category == "composite"]

    def summary(self) -> dict[str, int]:
        """Returns counts per category - used in UI as "737 types: 234 docs, ..."."""
        result: dict[str, int] = {
            "total_complex": len(self.complex_types),
            "total_simple": len(self.simple_types),
            "extension_namespaces": len(self.extension_namespaces),
        }
        for t in self.complex_types.values():
            key = f"category_{t.category}"
            result[key] = result.get(key, 0) + 1
        return result
