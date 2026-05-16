/**
 * Right Inspector — Sprint 0.5: two states based on selection.
 *
 * State A (default): empty placeholder explaining Inspector will become active in Sprint 1.
 * State B (object selected): shows basic object metadata + statistics counters (all 0
 *         until mapping engine ships).
 *
 * No mock data. When Sprint 1 lands ObjectMapping, the second state will pivot to show
 * search strategy, ПКО settings, list of handlers, etc.
 */
import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { Icon, iconNameForObjectType } from "@/components/icons";
import { useColumnResize } from "./useColumnResize";
import styles from "./Workspace.module.css";

export function Inspector() {
  const [collapsed, setCollapsed] = useState(false);
  const project = useProjectStore((s) => s.project);
  const selectedFullName = useProjectStore((s) => s.selectedObjectFullName);

  const { width, isDragging, dragHandleProps } = useColumnResize({
    storageKey: "konvey.workspace.inspectorWidth",
    defaultWidth: 340,
    minWidth: 240,
    maxWidth: 600,
    edge: "right",
  });

  const selectedObject = useMemo(() => {
    if (!project || !selectedFullName) return null;
    return project.source_configuration.objects[selectedFullName] ?? null;
  }, [project, selectedFullName]);

  if (collapsed) {
    return (
      <aside
        className={styles.inspectorCollapsed}
        onClick={() => setCollapsed(false)}
        title="Раскрыть Inspector"
      >
        <div className={styles.inspectorCollapsedLabel}>Inspector</div>
      </aside>
    );
  }

  // Compute totals if an object is selected
  const totalAttrs = selectedObject?.attributes.length ?? 0;
  const totalTabSections = selectedObject?.tabular_sections.length ?? 0;
  const totalTabFields =
    selectedObject?.tabular_sections.reduce((sum, ts) => sum + ts.attributes.length, 0) ?? 0;

  return (
    <>
      <div
        className={`${styles.sidebarResizer} ${isDragging ? styles.sidebarResizerActive : ""}`}
        {...dragHandleProps}
      />

      <aside className={styles.inspector} style={{ width: `${width}px` }}>
        <header className={styles.inspectorHeader}>
          <div className={styles.inspectorTitle}>Inspector</div>
          <button
            onClick={() => setCollapsed(true)}
            className={styles.inspectorCollapseBtn}
            title="Свернуть"
            aria-label="Свернуть Inspector"
          >
            <Icon name="chevron-right" size={12} />
          </button>
        </header>

        <div className={styles.inspectorBody}>
          {!selectedObject ? (
            <>
              <p>Выберите объект в боковой панели слева или элемент в центральной области.</p>
              <p className={styles.inspectorHint}>
                Контекстный Inspector с деталями маппинга появится в Sprint 1 —
                вместе с линиями связей и drag-and-drop.
              </p>
            </>
          ) : (
            <>
              {/* Section: object header */}
              <div className={styles.inspectorSection}>
                <div className={styles.inspectorObjectHeader}>
                  <Icon
                    name={iconNameForObjectType(selectedObject.object_type)}
                    size={16}
                    style={{ color: "var(--k-accent)" }}
                  />
                  <div className={styles.inspectorObjectName}>{selectedObject.name}</div>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span className={styles.inspectorObjectType}>
                    {selectedObject.object_type}
                  </span>
                </div>
                {selectedObject.synonym && (
                  <div
                    className={styles.inspectorHint}
                    style={{ marginTop: 8, fontStyle: "italic" }}
                  >
                    {selectedObject.synonym}
                  </div>
                )}
              </div>

              {/* Section: structural counts */}
              <div className={styles.inspectorSection}>
                <div className={styles.inspectorSectionTitle}>Структура</div>
                <div className={styles.inspectorStatBox}>
                  <div className={styles.inspectorStatCell}>
                    <div className={styles.inspectorStatLabel}>Реквизиты</div>
                    <div className={styles.inspectorStatValue}>{totalAttrs}</div>
                  </div>
                  <div className={styles.inspectorStatCell}>
                    <div className={styles.inspectorStatLabel}>ТЧ</div>
                    <div className={styles.inspectorStatValue}>{totalTabSections}</div>
                  </div>
                  <div className={styles.inspectorStatCell}>
                    <div className={styles.inspectorStatLabel}>Поля ТЧ</div>
                    <div className={styles.inspectorStatValue}>{totalTabFields}</div>
                  </div>
                  {selectedObject.enum_values && (
                    <div className={styles.inspectorStatCell}>
                      <div className={styles.inspectorStatLabel}>Значения</div>
                      <div className={styles.inspectorStatValue}>
                        {selectedObject.enum_values.length}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section: mapping stats (Sprint 1+ data, all 0 in 0.5) */}
              <div className={styles.inspectorSection}>
                <div className={styles.inspectorSectionTitle}>Маппинг</div>
                <div className={styles.inspectorFieldRow}>
                  <span className={styles.inspectorFieldLabel}>Mapped</span>
                  <span className={styles.inspectorFieldValue}>0 / {totalAttrs + totalTabFields}</span>
                </div>
                <div className={styles.inspectorFieldRow}>
                  <span className={styles.inspectorFieldLabel}>Unresolved</span>
                  <span className={styles.inspectorFieldValue}>—</span>
                </div>
                <div className={styles.inspectorFieldRow}>
                  <span className={styles.inspectorFieldLabel}>Search strategy</span>
                  <span className={styles.inspectorFieldValue}>—</span>
                </div>
                <p className={styles.inspectorHint} style={{ marginTop: 12 }}>
                  Активируется в Sprint 1 после запуска auto-mapping.
                </p>
              </div>

              {/* Section: handlers placeholder */}
              <div className={styles.inspectorSection}>
                <div className={styles.inspectorSectionTitle}>Обработчики</div>
                <p className={styles.inspectorHint}>
                  Список ПередКонвертациейОбъекта / ПриКонвертацииДанныхXDTO / ПослеКонвертацииОбъекта
                  появится в Sprint 3 вместе с BSL-генератором.
                </p>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
