/**
 * Right Inspector — in Sprint 0 always shows empty state.
 * Will become contextual in Sprint 1+ (mapping details, object settings, field info).
 */
import { useState } from "react";

export function Inspector() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside
        style={{
          width: 30,
          flexShrink: 0,
          background: "var(--k-panel)",
          borderLeft: "1px solid var(--k-border)",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 8,
        }}
        onClick={() => setCollapsed(false)}
        title="Раскрыть Inspector"
      >
        <div style={{ writingMode: "vertical-rl", fontSize: 11, color: "var(--k-text-3)" }}>
          Inspector
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 340,
        flexShrink: 0,
        background: "var(--k-panel)",
        borderLeft: "1px solid var(--k-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--k-divider)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600 }}>Inspector</div>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "var(--k-text-3)",
          }}
          title="Свернуть"
        >
          →
        </button>
      </header>

      <div style={{ flex: 1, padding: 16, color: "var(--k-text-3)", fontSize: 12 }}>
        <p>Выберите элемент в центральной области для просмотра деталей.</p>
        <p style={{ marginTop: 16, fontSize: 11 }}>
          В Sprint 0 контекстный Inspector не активен — он появится в Sprint 1+ вместе
          с mapping-линиями и взаимодействием между деревьями.
        </p>
      </div>
    </aside>
  );
}
