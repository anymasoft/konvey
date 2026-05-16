"""Parser for 1C configuration XML dumps (output of Configurator).

Input: path to folder containing Configuration.xml and subfolders Catalogs/, Documents/, ...
Output: Configuration Pydantic model.

For each metadata object, we extract:
- name, synonym, type
- attributes (header attributes)
- tabular sections with their attributes
- enum values (for Enum)
- dimensions and resources (for Registers)

Forms, modules, templates, commands are skipped — we don't need them for exchange rules.
"""

from __future__ import annotations

from pathlib import Path

from lxml import etree

from konvey_backend.models.configuration import (
    Attribute,
    Configuration,
    MetadataObject,
    ObjectType,
    TabularSection,
)

# Mapping: folder name -> ObjectType
_FOLDER_TO_TYPE: dict[str, ObjectType] = {
    "Catalogs": "Catalog",
    "Documents": "Document",
    "InformationRegisters": "InformationRegister",
    "AccumulationRegisters": "AccumulationRegister",
    "AccountingRegisters": "AccountingRegister",
    "CalculationRegisters": "CalculationRegister",
    "Enums": "Enum",
    "ChartsOfAccounts": "ChartOfAccounts",
    "ChartsOfCharacteristicTypes": "ChartOfCharacteristicTypes",
    "ChartsOfCalculationTypes": "ChartOfCalculationTypes",
    "BusinessProcesses": "BusinessProcess",
    "Tasks": "Task",
    "ExchangePlans": "ExchangePlan",
    "CommonModules": "CommonModule",
}

# 1C XML namespaces (vary slightly between platform versions)
_MD_NS = "http://v8.1c.ru/8.3/MDClasses"
_CORE_NS = "http://v8.1c.ru/8.1/data/core"
_V8_NS = "http://v8.1c.ru/8.1/data/enterprise/current-config"


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def _findtext_any_ns(el: etree._Element, local_name: str) -> str | None:
    """Find direct child with given local name, ignoring namespace."""
    for child in el:
        if _local(child.tag) == local_name:
            return child.text
    return None


def _find_any_ns(el: etree._Element, local_name: str) -> etree._Element | None:
    for child in el:
        if _local(child.tag) == local_name:
            return child
    return None


def _findall_any_ns(el: etree._Element, local_name: str) -> list[etree._Element]:
    return [child for child in el if _local(child.tag) == local_name]


def _parse_type_value(type_el: etree._Element | None) -> tuple[str, int | None]:
    """Parse <Type> block. Returns (type_str, length).

    Simple case: <Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>50</v8:Length>...</v8:StringQualifiers></Type>
    Returns ('String', 50) for the above.

    Reference case: <Type><v8:Type>cfg:CatalogRef.Контрагенты</v8:Type></Type>
    Returns ('CatalogRef.Контрагенты', None).
    """
    if type_el is None:
        return ("Undefined", None)

    type_strs: list[str] = []
    length: int | None = None

    for child in type_el:
        local = _local(child.tag)
        if local == "Type" and child.text:
            t = child.text.strip()
            # Strip namespace prefixes like 'xs:', 'cfg:', 'v8:'
            if ":" in t:
                t = t.split(":", 1)[1]
            # Map xs:* primitive types to 1C-style names
            xs_map = {
                "string": "String",
                "decimal": "Number",
                "dateTime": "Date",
                "date": "Date",
                "boolean": "Boolean",
            }
            type_strs.append(xs_map.get(t, t))
        elif local in ("StringQualifiers", "NumberQualifiers"):
            len_el = _find_any_ns(child, "Length")
            if len_el is not None and len_el.text:
                try:
                    length = int(len_el.text)
                except ValueError:
                    pass

    type_str = " | ".join(type_strs) if type_strs else "Undefined"
    return (type_str, length)


def _parse_attribute(attr_el: etree._Element) -> Attribute | None:
    """Parse <Attribute> or <Dimension> / <Resource> element."""
    props = _find_any_ns(attr_el, "Properties")
    if props is None:
        return None

    name = _findtext_any_ns(props, "Name") or ""
    if not name:
        return None

    synonym = None
    syn_el = _find_any_ns(props, "Synonym")
    if syn_el is not None:
        content = _find_any_ns(syn_el, "content")
        if content is not None:
            synonym = content.text

    type_el = _find_any_ns(props, "Type")
    type_str, length = _parse_type_value(type_el)

    return Attribute(name=name, synonym=synonym, type=type_str, length=length)


def _parse_tabular_section(ts_el: etree._Element) -> TabularSection | None:
    """Parse <TabularSection> element."""
    props = _find_any_ns(ts_el, "Properties")
    if props is None:
        return None
    name = _findtext_any_ns(props, "Name") or ""
    if not name:
        return None

    synonym = None
    syn_el = _find_any_ns(props, "Synonym")
    if syn_el is not None:
        content = _find_any_ns(syn_el, "content")
        if content is not None:
            synonym = content.text

    # Tabular section children — sub-objects "Attribute"
    attrs: list[Attribute] = []
    children = _find_any_ns(ts_el, "ChildObjects")
    if children is not None:
        for attr_el in _findall_any_ns(children, "Attribute"):
            a = _parse_attribute(attr_el)
            if a is not None:
                attrs.append(a)

    return TabularSection(name=name, synonym=synonym, attributes=attrs)


def _parse_object_xml(xml_path: Path, object_type: ObjectType) -> MetadataObject | None:
    """Parse a single XML file for a 1C metadata object."""
    try:
        tree = etree.parse(str(xml_path))
    except etree.XMLSyntaxError:
        return None

    root = tree.getroot()
    # Root is typically <MetaDataObject ...><Catalog ...> ... </Catalog></MetaDataObject>
    # Find the inner object (Catalog, Document, etc.)
    inner = None
    for child in root:
        local = _local(child.tag)
        if local == object_type:
            inner = child
            break
        # Some platforms wrap differently; accept Properties at any nesting
        if local == "Properties":
            inner = root
            break

    if inner is None:
        # Try root itself
        inner = root

    props = _find_any_ns(inner, "Properties")
    if props is None:
        return None

    name = _findtext_any_ns(props, "Name") or xml_path.stem
    synonym = None
    syn_el = _find_any_ns(props, "Synonym")
    if syn_el is not None:
        content = _find_any_ns(syn_el, "content")
        if content is not None:
            synonym = content.text

    full_name = f"{object_type}.{name}"

    attrs: list[Attribute] = []
    tabular_sections: list[TabularSection] = []
    enum_values: list[str] | None = None
    dimensions: list[Attribute] = []
    resources: list[Attribute] = []

    children = _find_any_ns(inner, "ChildObjects")
    if children is not None:
        for child in children:
            local = _local(child.tag)
            if local == "Attribute":
                a = _parse_attribute(child)
                if a is not None:
                    attrs.append(a)
            elif local == "TabularSection":
                ts = _parse_tabular_section(child)
                if ts is not None:
                    tabular_sections.append(ts)
            elif local == "Dimension":
                d = _parse_attribute(child)
                if d is not None:
                    dimensions.append(d)
            elif local == "Resource":
                r = _parse_attribute(child)
                if r is not None:
                    resources.append(r)
            elif local == "EnumValue":
                if enum_values is None:
                    enum_values = []
                ev_props = _find_any_ns(child, "Properties")
                if ev_props is not None:
                    ev_name = _findtext_any_ns(ev_props, "Name")
                    if ev_name:
                        enum_values.append(ev_name)

    return MetadataObject(
        name=name,
        full_name=full_name,
        synonym=synonym,
        object_type=object_type,
        attributes=attrs,
        tabular_sections=tabular_sections,
        enum_values=enum_values,
        dimensions=dimensions,
        resources=resources,
    )


def _parse_configuration_xml(config_xml_path: Path) -> tuple[str, str | None, str | None, str | None]:
    """Parse Configuration.xml — extract Name, Synonym, Version, Vendor."""
    tree = etree.parse(str(config_xml_path))
    root = tree.getroot()

    # Root structure: <MetaDataObject><Configuration><Properties>...</Properties></Configuration></MetaDataObject>
    inner_el = _find_any_ns(root, "Configuration")
    inner = inner_el if inner_el is not None else root
    props = _find_any_ns(inner, "Properties")
    if props is None:
        return (config_xml_path.parent.name, None, None, None)

    name = _findtext_any_ns(props, "Name") or config_xml_path.parent.name
    version = _findtext_any_ns(props, "Version")
    vendor = _findtext_any_ns(props, "Vendor")

    synonym = None
    syn_el = _find_any_ns(props, "Synonym")
    if syn_el is not None:
        content = _find_any_ns(syn_el, "content")
        if content is not None:
            synonym = content.text

    return (name, synonym, version, vendor)


def parse_configuration(folder: str | Path) -> Configuration:
    """Parse a folder containing Configuration.xml and metadata subfolders."""
    root = Path(folder)
    if not root.exists():
        raise FileNotFoundError(f"Configuration folder not found: {folder}")
    if not root.is_dir():
        raise ValueError(f"Not a directory: {folder}")

    config_xml = root / "Configuration.xml"
    if not config_xml.exists():
        raise ValueError(f"Configuration.xml not found in {folder}")

    name, synonym, version, vendor = _parse_configuration_xml(config_xml)

    objects: dict[str, MetadataObject] = {}

    for folder_name, obj_type in _FOLDER_TO_TYPE.items():
        type_dir = root / folder_name
        if not type_dir.exists() or not type_dir.is_dir():
            continue

        # Each metadata object is represented as <ObjectName>.xml
        for xml_file in type_dir.glob("*.xml"):
            obj = _parse_object_xml(xml_file, obj_type)
            if obj is not None:
                objects[obj.full_name] = obj

    return Configuration(
        name=name,
        synonym=synonym,
        version=version,
        vendor=vendor,
        objects=objects,
    )
