/**
 * Center of Workspace - three columns:
 *  - Source object tree (left)
 *  - EnterpriseData type tree (center)
 *  - Target object tree (right)
 *
 * In Sprint 0.5: no mapping lines, no drag-and-drop, no selection across columns.
 * Tree leaves carry data-mapping-anchor-id for Sprint 1's SVG overlay.
 *
 * Sprint 1 will add resizable column dividers between panes.
 */
import { useMemo } from "react";
import { useProjectStore } from "@/stores/projectStore";
import type { MetadataObject } from "@/types/configuration";
import type { XsdComplexType, EnterpriseDataSchema } from "@/types/enterprise-data";
import { TreeView, type TreeNode } from "./TreeView";
import styles from "./Workspace.module.css";

type Side = "source" | "ed" | "target";

function configObjectToTree(obj: MetadataObject, side: Side): TreeNode[] {
  const nodes: TreeNode[] = [];
  const sidePrefix = side; // "source" or "target"

  if (obj.attributes.length > 0) {
    nodes.push({
      id: `${obj.full_name}-header`,
      label: "Реквизиты шапки",
      children: obj.attributes.map((a) => ({
        id: `${obj.full_name}-attr-${a.name}`,
        label: a.name,
        hint: a.type,
        anchorId: `${sidePrefix}:${obj.full_name}.${a.name}`,
        fieldType: a.type,
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
          anchorId: `${sidePrefix}:${obj.full_name}.${ts.name}.${a.name}`,
          fieldType: a.type,
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
        anchorId: `${sidePrefix}:${obj.full_name}.dim.${a.name}`,
        fieldType: a.type,
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
        anchorId: `${sidePrefix}:${obj.full_name}.res.${a.name}`,
        fieldType: a.type,
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
        anchorId: `${sidePrefix}:${obj.full_name}.enum.${v}`,
        fieldType: "EnumValue",
      })),
    });
  }

  return nodes;
}

function xsdTypeToTree(
  schema: EnterpriseDataSchema,
  typeName: string,
  pathSoFar: string = "",
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
    const currentPath = pathSoFar ? `${pathSoFar}.${f.name}` : f.name;

    if (childCt) {
      return {
        id: `${typeName}-${f.name}`,
        label: f.name,
        hint: `${requiredMark} ${f.type_ref}`,
        children: xsdTypeToTree(schema, f.type_ref, currentPath, new Set(visited)),
      };
    }
    return {
      id: `${typeName}-${f.name}`,
      label: f.name,
      hint: `${requiredMark} ${f.type_ref}`,
      anchorId: `ed:${ct.name}.${currentPath}`,
      fieldType: f.type_ref,
    };
  });
}

function findMatchingEdType(
  schema: EnterpriseDataSchema,
  selectedFullName: string,
): XsdComplexType | null {
  const [eng, ...rest] = selectedFullName.split(".");
  const name = rest.join(".");
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
      <div className={styles.mappingArea}>
        <div className={styles.mappingPlaceholder}>
          Выберите объект в боковой панели слева, чтобы начать маппинг
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mappingArea}>
      <div className={styles.pane} style={{ flex: "0 0 30%" }}>
        <div className={styles.paneTitle}>
          {project.source_configuration.name} → EnterpriseData
        </div>
        <div className={styles.paneBody}>
          {sourceObj ? (
            <TreeView nodes={configObjectToTree(sourceObj, "source")} />
          ) : (
            <div className={styles.paneEmpty}>
              Объект {selectedFullName} не найден в конфигурации источника.
            </div>
          )}
        </div>
      </div>

      <div className={styles.pane} style={{ flex: "0 0 40%" }}>
        <div className={styles.paneTitle}>
          EnterpriseData {project.enterprise_data.version}
        </div>
        <div className={styles.paneBody}>
          {edType ? (
            <TreeView nodes={xsdTypeToTree(project.enterprise_data, edType.name)} />
          ) : (
            <div className={styles.paneEmpty}>
              Соответствующий тип EnterpriseData не найден автоматически.
              <div className={styles.paneEmptyHint}>
                (В Sprint 1+ будет ручной выбор + AI-подсказки.)
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.pane} ${styles.paneLast}`} style={{ flex: "1 1 30%" }}>
        <div className={styles.paneTitle}>
          EnterpriseData → {project.target_configuration.name}
        </div>
        <div className={styles.paneBody}>
          {targetObj ? (
            <TreeView nodes={configObjectToTree(targetObj, "target")} />
          ) : (
            <div className={styles.paneEmpty}>
              Объект {selectedFullName} не найден в конфигурации приёмника.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
