/**
 * Center of Workspace - three columns:
 *  - Source object tree (left)
 *  - EnterpriseData type tree (center)
 *  - Target object tree (right)
 *
 * In Sprint 0.5: no mapping lines, no drag-and-drop, no selection across columns.
 * Tree leaves carry data-mapping-anchor-id for Sprint 1's SVG overlay.
 *
 * Column widths are resizable via drag handles between panes (D14).
 * When ED auto-match fails (e.g., non-standard 1C object name), shows a list
 * of candidate ED types of the same category for manual selection.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import type { MetadataObject } from "@/types/configuration";
import type { XsdComplexType, EnterpriseDataSchema } from "@/types/enterprise-data";
import { TreeView, type TreeNode } from "./TreeView";
import styles from "./Workspace.module.css";

type Side = "source" | "ed" | "target";

function configObjectToTree(obj: MetadataObject, side: Side): TreeNode[] {
  const nodes: TreeNode[] = [];
  const sidePrefix = side;

  if (obj.attributes.length > 0) {
    nodes.push({
      id: `${obj.full_name}-header`,
      label: "Реквизиты шапки",
      iconName: "edit",
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
      iconName: "tabular-section",
      children: obj.tabular_sections.map((ts) => ({
        id: `${obj.full_name}-ts-${ts.name}`,
        label: ts.name,
        iconName: "tabular-section",
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
      iconName: "filter",
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
      iconName: "register-accum",
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
      iconName: "enum",
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

// Map 1C object type prefix -> Russian EnterpriseData type prefix
const TYPE_PREFIX_MAP: Record<string, string> = {
  Catalog: "Справочник",
  Document: "Документ",
  Enum: "Перечисление",
  InformationRegister: "РегистрСведений",
  AccumulationRegister: "РегистрНакопления",
  AccountingRegister: "РегистрБухгалтерии",
  ChartOfCharacteristicTypes: "ПланВидовХарактеристик",
  BusinessProcess: "БизнесПроцесс",
  Task: "Задача",
};

function findMatchingEdType(
  schema: EnterpriseDataSchema,
  selectedFullName: string,
): XsdComplexType | null {
  const [eng, ...rest] = selectedFullName.split(".");
  const name = rest.join(".");
  const ru = TYPE_PREFIX_MAP[eng];
  if (!ru) return null;
  return schema.complex_types[`${ru}.${name}`] ?? null;
}

/** Find ED types of the same category (e.g., all "Документ.*") that share a name fragment. */
function findCandidateEdTypes(
  schema: EnterpriseDataSchema,
  selectedFullName: string,
): XsdComplexType[] {
  const [eng] = selectedFullName.split(".");
  const ru = TYPE_PREFIX_MAP[eng];
  if (!ru) return [];
  const prefix = `${ru}.`;
  return Object.values(schema.complex_types).filter(
    (t) => t.name.startsWith(prefix) && !t.name.endsWith(".Строка") && t.name.split(".").length === 2,
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Column resize logic — Sprint 0.5 D14
// ──────────────────────────────────────────────────────────────────────────

interface PaneWidths {
  left: number; // percent
  center: number; // percent
  // right = 100 - left - center
}

const DEFAULT_WIDTHS: PaneWidths = { left: 30, center: 40 };
const MIN_PANE_PERCENT = 15;
const STORAGE_KEY = "konvey.workspace.paneWidths";

function loadPaneWidths(): PaneWidths {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDTHS;
    const parsed = JSON.parse(raw) as PaneWidths;
    if (
      typeof parsed.left === "number" &&
      typeof parsed.center === "number" &&
      parsed.left >= MIN_PANE_PERCENT &&
      parsed.center >= MIN_PANE_PERCENT &&
      100 - parsed.left - parsed.center >= MIN_PANE_PERCENT
    ) {
      return parsed;
    }
  } catch {}
  return DEFAULT_WIDTHS;
}

function savePaneWidths(w: PaneWidths) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  } catch {}
}

export function MappingArea() {
  const project = useProjectStore((s) => s.project);
  const selectedFullName = useProjectStore((s) => s.selectedObjectFullName);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [widths, setWidths] = useState<PaneWidths>(() => loadPaneWidths());
  const [draggingDivider, setDraggingDivider] = useState<"first" | "second" | null>(null);
  const [edTypeOverride, setEdTypeOverride] = useState<string | null>(null);

  // Reset ED override when user picks a different object
  useEffect(() => {
    setEdTypeOverride(null);
  }, [selectedFullName]);

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
    if (edTypeOverride) {
      return project.enterprise_data.complex_types[edTypeOverride] ?? null;
    }
    return findMatchingEdType(project.enterprise_data, selectedFullName);
  }, [project, selectedFullName, edTypeOverride]);

  const candidateEdTypes = useMemo(() => {
    if (!project || !selectedFullName || edType) return [];
    return findCandidateEdTypes(project.enterprise_data, selectedFullName);
  }, [project, selectedFullName, edType]);

  // ── Resizer handlers ──
  const onMouseDownDivider = useCallback(
    (which: "first" | "second") => (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggingDivider(which);
    },
    [],
  );

  useEffect(() => {
    if (!draggingDivider) return;

    const onMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = ((e.clientX - rect.left) / rect.width) * 100;

      setWidths((prev) => {
        let next: PaneWidths;
        if (draggingDivider === "first") {
          // left | center boundary
          const newLeft = Math.max(
            MIN_PANE_PERCENT,
            Math.min(relativeX, 100 - MIN_PANE_PERCENT - prev.center),
          );
          // Adjust center so right stays the same
          const right = 100 - prev.left - prev.center;
          const newCenter = 100 - newLeft - right;
          if (newCenter < MIN_PANE_PERCENT) return prev;
          next = { left: newLeft, center: newCenter };
        } else {
          // center | right boundary
          const newCenter = Math.max(
            MIN_PANE_PERCENT,
            Math.min(relativeX - prev.left, 100 - prev.left - MIN_PANE_PERCENT),
          );
          next = { left: prev.left, center: newCenter };
        }
        return next;
      });
    };

    const onMouseUp = () => {
      setDraggingDivider(null);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.classList.add(styles.bodyDragging);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.classList.remove(styles.bodyDragging);
    };
  }, [draggingDivider]);

  // Persist widths when drag ends
  useEffect(() => {
    if (draggingDivider === null) {
      savePaneWidths(widths);
    }
  }, [draggingDivider, widths]);

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

  const rightPercent = 100 - widths.left - widths.center;

  return (
    <div ref={containerRef} className={styles.mappingArea}>
      {/* === Left pane: source === */}
      <div className={styles.pane} style={{ flex: `0 0 calc(${widths.left}% - 2px)` }}>
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

      {/* === Divider 1: left | center === */}
      <div
        className={`${styles.paneResizer} ${draggingDivider === "first" ? styles.paneResizerActive : ""}`}
        onMouseDown={onMouseDownDivider("first")}
        title="Перетащить для изменения ширины"
      />

      {/* === Center pane: EnterpriseData === */}
      <div className={styles.pane} style={{ flex: `0 0 calc(${widths.center}% - 4px)` }}>
        <div className={styles.paneTitle}>EnterpriseData {project.enterprise_data.version}</div>
        <div className={styles.paneBody}>
          {edType ? (
            <>
              <div style={{ marginBottom: 8, padding: "2px 4px", fontWeight: 500, fontSize: 12 }}>
                {edType.name}
                {edTypeOverride && (
                  <button
                    className="k-btn"
                    style={{ marginLeft: 8, fontSize: 10, padding: "2px 6px", height: 20 }}
                    onClick={() => setEdTypeOverride(null)}
                  >
                    × сбросить выбор
                  </button>
                )}
              </div>
              <TreeView nodes={xsdTypeToTree(project.enterprise_data, edType.name)} />
            </>
          ) : (
            <>
              <div className={styles.paneEmpty}>
                Соответствующий тип EnterpriseData не найден по имени.
                <div className={styles.paneEmptyHint}>
                  Выберите подходящий тип из списка ниже. В Sprint 1+ это будет
                  автоматизировано (auto-mapping + AI suggestions).
                </div>
              </div>
              {candidateEdTypes.length > 0 && (
                <ul className={styles.candidateList}>
                  <li className={styles.candidateGroupHeader}>
                    Все типы того же класса ({candidateEdTypes.length}):
                  </li>
                  {candidateEdTypes.map((t) => (
                    <li
                      key={t.name}
                      className={styles.candidateItem}
                      onClick={() => setEdTypeOverride(t.name)}
                    >
                      {t.name}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* === Divider 2: center | right === */}
      <div
        className={`${styles.paneResizer} ${draggingDivider === "second" ? styles.paneResizerActive : ""}`}
        onMouseDown={onMouseDownDivider("second")}
        title="Перетащить для изменения ширины"
      />

      {/* === Right pane: target === */}
      <div
        className={`${styles.pane} ${styles.paneLast}`}
        style={{ flex: `0 0 calc(${rightPercent}% - 2px)` }}
      >
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
