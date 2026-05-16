/**
 * Workspace — main screen layout:
 *   Header
 *   ─────────────────────────────────────
 *   Left Sidebar | Center (3 trees) | Inspector
 *   ─────────────────────────────────────
 *   Bottom Dock (placeholder — Sprint 1+ filled)
 */
import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useProjectStore } from "@/stores/projectStore";
import { ObjectsSidebar } from "./ObjectsSidebar";
import { MappingArea } from "./MappingArea";
import { Inspector } from "./Inspector";

export function Workspace() {
  const project = useProjectStore((s) => s.project);
  const closeProject = useAppStore((s) => s.closeProject);
  const [dockTab, setDockTab] = useState<"problems" | "xml" | "ai" | "history" | null>(null);

  if (!project) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        className="k-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 12px",
          height: 44,
          background: "var(--k-panel)",
          borderBottom: "1px solid var(--k-border)",
        }}
      >
        <div
          className="k-burger"
          style={{ width: 26, height: 26, display: "grid", placeItems: "center", cursor: "pointer" }}
          onClick={closeProject}
          title="К списку проектов"
        >
          ≡
        </div>
        <div className="k-logo">Konvey</div>
        <div style={{ color: "var(--k-text-3)" }}>·</div>
        <div className="k-project-name">{project.name}</div>
        <div style={{ flex: 1, color: "var(--k-text-3)", textAlign: "center", fontSize: 11 }}>
          {project.source_configuration.name} → {project.target_configuration.name} ·{" "}
          EnterpriseData {project.enterprise_data.version}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="k-btn" disabled title="Доступно в следующих спринтах">Validate</button>
          <button className="k-btn" disabled title="Доступно в следующих спринтах">Preview</button>
          <button className="k-btn" disabled title="Доступно в следующих спринтах">Export</button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ObjectsSidebar />
        <MappingArea />
        <Inspector />
      </div>

      <div
        style={{
          borderTop: "1px solid var(--k-border)",
          background: "var(--k-panel)",
          fontSize: 11,
          color: "var(--k-text-3)",
        }}
      >
        <div style={{ display: "flex", gap: 0, padding: "4px 8px" }}>
          {(
            [
              ["problems", "Problems"],
              ["xml", "Generated XML"],
              ["ai", "AI Chat"],
              ["history", "History"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setDockTab(dockTab === key ? null : key)}
              style={{
                background: dockTab === key ? "var(--k-panel-sunk)" : "transparent",
                border: "none",
                padding: "4px 12px",
                fontSize: 11,
                cursor: "pointer",
                color: "var(--k-text-2)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {dockTab && (
          <div style={{ padding: 12, color: "var(--k-text-3)", minHeight: 60 }}>
            Эта панель ({dockTab}) будет доступна в следующих спринтах.
          </div>
        )}
      </div>
    </div>
  );
}
