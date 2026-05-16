/**
 * Right Inspector - Sprint 0.5 shows only two states (empty + object selected),
 * no mock data. Full mapping details arrive in Sprint 1.
 */
import { useState } from "react";
import styles from "./Workspace.module.css";

export function Inspector() {
  const [collapsed, setCollapsed] = useState(false);

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
    <aside className={styles.inspector}>
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
  );
}
