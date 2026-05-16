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
import styles from "./Workspace.module.css";

type DockTab = "problems" | "xml" | "ai" | "history";

const DOCK_TAB_DEFINITIONS: Array<{ key: DockTab; label: string; sprint: string }> = [
  { key: "problems", label: "Problems", sprint: "Sprint 2" },
  { key: "xml", label: "Generated XML", sprint: "Sprint 3" },
  { key: "ai", label: "AI Chat", sprint: "Sprint 2" },
  { key: "history", label: "History", sprint: "Sprint 4+" },
];

export function Workspace() {
  const project = useProjectStore((s) => s.project);
  const closeProject = useAppStore((s) => s.closeProject);
  const [dockTab, setDockTab] = useState<DockTab | null>(null);

  if (!project) return null;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div
          className={styles.burger}
          onClick={closeProject}
          title="К списку проектов"
        >
          ≡
        </div>
        <div className={styles.logo}>Konvey</div>
        <div className={styles.divider}>·</div>
        <div className={styles.projectName}>{project.name}</div>
        <div className={styles.headerCenter}>
          {project.source_configuration.name} → {project.target_configuration.name} ·
          EnterpriseData {project.enterprise_data.version}
        </div>
        <div className={styles.headerActions}>
          <button className="k-btn" disabled title="Доступно после Sprint 2">
            Validate
          </button>
          <button className="k-btn" disabled title="Доступно после Sprint 3">
            Preview
          </button>
          <button className="k-btn" disabled title="Доступно после Sprint 3">
            Export
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <ObjectsSidebar />
        <MappingArea />
        <Inspector />
      </div>

      <div className={styles.bottomDock}>
        <div className={styles.dockTabs}>
          {DOCK_TAB_DEFINITIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDockTab(dockTab === key ? null : key)}
              className={`${styles.dockTab} ${dockTab === key ? styles.dockTabActive : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        {dockTab && (
          <div className={styles.dockContent}>
            {dockTab === "problems" && "Проблемы появятся после запуска валидации (Sprint 2)."}
            {dockTab === "xml" && "Сгенерированные правила XML появятся после маппинга (Sprint 3)."}
            {dockTab === "ai" && "AI помощник появится после интеграции с Anthropic API (Sprint 2)."}
            {dockTab === "history" && "История изменений проекта появится после первого сохранения (Sprint 4+)."}
          </div>
        )}
      </div>
    </div>
  );
}
