"""Models for 1C configuration XML dump (Catalogs/, Documents/, ...)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ObjectType = Literal[
    "Catalog",
    "Document",
    "InformationRegister",
    "AccumulationRegister",
    "AccountingRegister",
    "CalculationRegister",
    "Enum",
    "ChartOfAccounts",
    "ChartOfCharacteristicTypes",
    "ChartOfCalculationTypes",
    "BusinessProcess",
    "Task",
    "ExchangePlan",
    "CommonModule",
    "Other",
]


class Attribute(BaseModel):
    """Реквизит объекта 1С (header attribute, tab. section attribute, register dimension/resource)."""

    name: str
    synonym: str | None = None
    type: str  # 'String', 'Number(15,2)', 'Date', 'CatalogRef.Контрагенты', 'DocumentRef.Реализация'
    length: int | None = None  # для String / Number


class TabularSection(BaseModel):
    """Табличная часть документа или справочника."""

    name: str
    synonym: str | None = None
    attributes: list[Attribute] = Field(default_factory=list)


class MetadataObject(BaseModel):
    """Объект метаданных конфигурации 1С."""

    name: str  # 'Контрагенты' (без префикса типа)
    full_name: str  # 'Catalog.Контрагенты'
    synonym: str | None = None
    object_type: ObjectType
    attributes: list[Attribute] = Field(default_factory=list)
    tabular_sections: list[TabularSection] = Field(default_factory=list)
    enum_values: list[str] | None = None  # only for Enum
    dimensions: list[Attribute] = Field(default_factory=list)  # only for Registers
    resources: list[Attribute] = Field(default_factory=list)  # only for Registers


class Configuration(BaseModel):
    """Распарсенная выгрузка XML конфигурации 1С."""

    name: str  # из Configuration.xml/Properties/Name
    synonym: str | None = None
    version: str | None = None  # configuration.Version
    vendor: str | None = None
    objects: dict[str, MetadataObject] = Field(default_factory=dict)
    # ключ: full_name типа 'Catalog.Контрагенты'

    def summary(self) -> dict[str, int]:
        """Returns counts per object_type."""
        result: dict[str, int] = {"total": len(self.objects)}
        for obj in self.objects.values():
            key = f"type_{obj.object_type}"
            result[key] = result.get(key, 0) + 1
        return result

    def by_type(self, object_type: ObjectType) -> list[MetadataObject]:
        return [o for o in self.objects.values() if o.object_type == object_type]
