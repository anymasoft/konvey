/**
 * Right Inspector — Sprint 0.5 shows only two states (empty + object selected),
 * no mock data. Full mapping details arrive in Sprint 1.
 *
 * Width is resizable via the divider on the left edge of the inspector.
 * Width persisted in localStorage (key: konvey.workspace.inspectorWidth).
 */
import { useState } from "react";
import { useColumnResize } from "./useColumnResize";
import styles from "./Workspace.module.css";

export function Inspector() {
  const [collapsed, setCollapsed] = useState(false);

  const { width, isDragging, dragHandleProps } = useColumnResize({
    storageKey: "konvey.workspace.inspectorWidth",
    defaultWidth: 340,
    minWidth: 240,
    maxWidth: 600,
    edge: "right",
  });

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
          >
            →
          </button>
        </header>

        <div className={styles.inspectorBody}>
          <p>Выберите элемент в центральной области для просмотра деталей.</p>
          <p className={styles.inspectorHint}>
            В Sprint 0 контекстный Inspector не активен — он появится в Sprint 1+ вместе
            с mapping-линиями и взаимодействием между деревьями.
          </p>
        </div>
      </aside>
    </>
  );
}
