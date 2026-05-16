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
import { Icon, type IconName } from "@/components/icons";
import { ObjectsSidebar } from "./ObjectsSidebar";
import { MappingArea } from "./MappingArea";
import { Inspector } from "./Inspector";
import { HeaderProgress } from "./HeaderProgress";
import styles from "./Workspace.module.css";

type DockTab = "problems" | "xml" | "ai" | "history";

const DOCK_TAB_DEFINITIONS: Array<{ key: DockTab; label: string; icon: IconName }> = [
  { key: "problems", label: "Problems", icon: "warning" },
  { key: "xml", label: "Generated XML", icon: "document" },
  { key: "ai", label: "AI Chat", icon: "info" },
  { key: "history", label: "History", icon: "refresh" },
];

export function Workspace() {
  const project = useProjectStore((s) => s.project);
  const closeProject = useAppStore((s) => s.closeProject);
  const [dockTab, setDockTab] = useState<DockTab | null>(null);

  if (!project) return null;

  // Sprint 0.5: mapping engine not implemented yet, all counts are 0.
  // Sprint 1 will compute these from project.mappings.
  const mapped = 0;
  const total = 0;
  const review = 0;
  const conflicts = 0;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button
          className={styles.burger}
          onClick={closeProject}
          title="К списку проектов"
          aria-label="К списку проектов"
        >
          <Icon name="menu" size={16} />
        </button>
        <div className={styles.logo}>Konvey</div>
        <div className={styles.divider}>·</div>
        <div className={styles.projectName} title={project.name}>
          {project.name}
        </div>

        <HeaderProgress mapped={mapped} total={total} review={review} conflicts={conflicts} />

        <div className={styles.headerActions}>
          <button className={`k-btn ${styles.headerBtn}`} disabled title="Доступно после Sprint 2">
            <Icon name="validate" size={14} />
            Validate
          </button>
          <button className={`k-btn ${styles.headerBtn}`} disabled title="Доступно после Sprint 3">
            <Icon name="preview" size={14} />
            Preview
          </button>
          <button className={`k-btn ${styles.headerBtn}`} disabled title="Доступно после Sprint 3">
            <Icon name="export" size={14} />
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
          {DOCK_TAB_DEFINITIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setDockTab(dockTab === key ? null : key)}
              className={`${styles.dockTab} ${dockTab === key ? styles.dockTabActive : ""}`}
            >
              <Icon name={icon} size={12} />
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
