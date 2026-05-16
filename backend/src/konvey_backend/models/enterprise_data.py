"""Models for EnterpriseData XSD schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# Categories assigned heuristically by Russian type-name prefix.
# Examples:
#   "Документ.РеализацияТоваровУслуг" -> "document"
#   "Справочник.Контрагенты"          -> "catalog"
#   "Справочник.Контрагенты.Договоры" -> "tabular_section" (if "...Строка" suffix)
#   "КлючевыеСвойстваКонтрагент"      -> "composite"
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
    """xs:simpleType — primitive with restrictions / enumerations."""

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


class XsdComplexType(BaseModel):
    """xs:complexType — describes a structured object (document, catalog, composite key, ...)."""

    name: str
    category: TypeCategory
    parent_type: str | None = None  # для xs:complexContent + xs:extension
    fields: list[XsdField] = Field(default_factory=list)
    annotation: str | None = None


class EnterpriseDataSchema(BaseModel):
    """Parsed XSD-схема EnterpriseData."""

    version: str  # from targetNamespace, e.g. "1.8" or "1.8.6" if can extract
    namespace: str
    simple_types: dict[str, XsdSimpleType] = Field(default_factory=dict)
    complex_types: dict[str, XsdComplexType] = Field(default_factory=dict)

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
        """Returns counts per category — used in UI as "737 types: 234 docs, ..."."""
        result: dict[str, int] = {"total_complex": len(self.complex_types), "total_simple": len(self.simple_types)}
        for t in self.complex_types.values():
            key = f"category_{t.category}"
            result[key] = result.get(key, 0) + 1
        return result
