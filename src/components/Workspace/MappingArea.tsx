/**
 * Center of Workspace — three columns:
 *  - Source object tree (left)
 *  - EnterpriseData type tree (center)
 *  - Target object tree (right)
 *
 * In Sprint 0: no mapping lines, no drag-and-drop, no selection across columns.
 * Just structural trees rendered.
 */
import { useMemo } from "react";
import { useProjectStore } from "@/stores/projectStore";
import type { MetadataObject } from "@/types/configuration";
import type { XsdComplexType, EnterpriseDataSchema } from "@/types/enterprise-data";
import { TreeView, type TreeNode } from "./TreeView";

function configObjectToTree(obj: MetadataObject): TreeNode[] {
  const nodes: TreeNode[] = [];

  if (obj.attributes.length > 0) {
    nodes.push({
      id: `${obj.full_name}-header`,
      label: "Реквизиты шапки",
      children: obj.attributes.map((a) => ({
        id: `${obj.full_name}-attr-${a.name}`,
        label: a.name,
        hint: a.type,
      })),
    });
  }

  if (obj.tabular_sections.length > 0) {
    nodes.push({
      id: `${obj.full_name}-ts`,
      label: "Табличные части",
      children: obj.tabular_sections.map((ts) => ({
        id: `${obj.full_name}-ts-${ts.name}`,
        label: ts.name,
        children: ts.attributes.map((a) => ({
          id: `${obj.full_name}-ts-${ts.name}-${a.name}`,
          label: a.name,
          hint: a.type,
        })),
      })),
    });
  }

  if (obj.dimensions.length > 0) {
    nodes.push({
      id: `${obj.full_name}-dims`,
      label: "Измерения",
      children: obj.dimensions.map((a) => ({
        id: `${obj.full_name}-dim-${a.name}`,
        label: a.name,
        hint: a.type,
      })),
    });
  }

  if (obj.resources.length > 0) {
    nodes.push({
      id: `${obj.full_name}-res`,
      label: "Ресурсы",
      children: obj.resources.map((a) => ({
        id: `${obj.full_name}-res-${a.name}`,
        label: a.name,
        hint: a.type,
      })),
    });
  }

  if (obj.enum_values) {
    nodes.push({
      id: `${obj.full_name}-vals`,
      label: "Значения",
      children: obj.enum_values.map((v) => ({
        id: `${obj.full_name}-val-${v}`,
        label: v,
      })),
    });
  }

  return nodes;
}

// Convert XSD complex type to TreeNode children — recursive only one level deep
// to avoid blowing up the UI on Sprint 0. Composite types expand on click later (Sprint 1+).
function xsdTypeToTree(
  schema: EnterpriseDataSchema,
  typeName: string,
  visited: Set<string> = new Set(),
): TreeNode[] {
  if (visited.has(typeName)) {
    return [{ id: `${typeName}-circular`, label: "(циклическая ссылка)" }];
  }
  visited.add(typeName);

  const ct = schema.complex_types[typeName];
  if (!ct) {
    const st = schema.simple_types[typeName];
    if (st) {
      return [{ id: typeName, label: typeName, hint: st.base_type }];
    }
    return [{ id: typeName, label: typeName, hint: "(тип не найден в схеме)" }];
  }

  return ct.fields.map((f) => {
    const childCt = schema.complex_types[f.type_ref];
    const requiredMark = f.is_required ? "★" : "—";
    if (childCt) {
      return {
        id: `${typeName}-${f.name}`,
        label: f.name,
        hint: `${requiredMark} ${f.type_ref}`,
        children: xsdTypeToTree(schema, f.type_ref, new Set(visited)),
      };
    }
    return {
      id: `${typeName}-${f.name}`,
      label: f.name,
      hint: `${requiredMark} ${f.type_ref}`,
    };
  });
}

function findMatchingEdType(
  schema: EnterpriseDataSchema,
  selectedFullName: string,
): XsdComplexType | null {
  // selectedFullName: "Document.РеализацияТоваровУслуг" -> look for "Документ.РеализацияТоваровУслуг"
  const [eng, ...rest] = selectedFullName.split(".");
  const name = rest.join(".");
  // Heuristic mapping English type prefix -> Russian
  const map: Record<string, string> = {
    Catalog: "Справочник",
    Document: "Документ",
    Enum: "Перечисление",
    InformationRegister: "РегистрСведений",
    AccumulationRegister: "РегистрНакопления",
    AccountingRegister: "РегистрБухгалтерии",
  };
  const ru = map[eng];
  if (!ru) return null;
  const candidate = `${ru}.${name}`;
  return schema.complex_types[candidate] ?? null;
}

export function MappingArea() {
  const project = useProjectStore((s) => s.project);
  const selectedFullName = useProjectStore((s) => s.selectedObjectFullName);

  const sourceObj = useMemo(() => {
    if (!project || !selectedFullName) return null;
    return project.source_configuration.objects[selectedFullName] ?? null;
  }, [project, selectedFullName]);

  const targetObj = useMemo(() => {
    if (!project || !selectedFullName) return null;
    return project.target_configuration.objects[selectedFullName] ?? null;
  }, [project, selectedFullName]);

  const edType = useMemo(() => {
    if (!project || !selectedFullName) return null;
    return findMatchingEdType(project.enterprise_data, selectedFullName);
  }, [project, selectedFullName]);

  if (!project) return null;

  if (!selectedFullName) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-text-3)",
          fontSize: 14,
        }}
      >
        Выберите объект в боковой панели слева, чтобы начать маппинг
      </div>
    );
  }

  const titleBarStyle = {
    padding: "6px 8px",
    fontSize: 11,
    fontWeight: 600,
    background: "var(--k-panel-sunk)",
    borderBottom: "1px solid var(--k-divider)",
    color: "var(--k-text-2)",
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--k-panel-2)" }}>
      <div
        style={{
          flex: "0 0 30%",
          borderRight: "1px solid var(--k-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={titleBarStyle}>
          {project.source_configuration.name} → EnterpriseData
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
          {sourceObj ? (
            <TreeView nodes={configObjectToTree(sourceObj)} />
          ) : (
            <div style={{ fontSize: 12, color: "var(--k-text-3)" }}>
              Объект {selectedFullName} не найден в конфигурации источника.
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: "0 0 40%",
          borderRight: "1px solid var(--k-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={titleBarStyle}>
          EnterpriseData {project.enterprise_data.version}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
          {edType ? (
            <TreeView nodes={xsdTypeToTree(project.enterprise_data, edType.name)} />
          ) : (
            <div style={{ fontSize: 12, color: "var(--k-text-3)" }}>
              Соответствующий тип EnterpriseData не найден автоматически.
              <br />
              <span style={{ fontSize: 11 }}>
                (В Sprint 1+ будет ручной выбор + AI-подсказки.)
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: "1 1 30%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={titleBarStyle}>
          EnterpriseData → {project.target_configuration.name}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
          {targetObj ? (
            <TreeView nodes={configObjectToTree(targetObj)} />
          ) : (
            <div style={{ fontSize: 12, color: "var(--k-text-3)" }}>
              Объект {selectedFullName} не найден в конфигурации приёмника.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
