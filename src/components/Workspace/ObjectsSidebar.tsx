/**
 * Left sidebar of Workspace — list of objects selected for exchange,
 * grouped by metadata type. Click to select an object → activates Center.
 */
import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import styles from "./Workspace.module.css";

export function ObjectsSidebar() {
  const project = useProjectStore((s) => s.project);
  const selected = useProjectStore((s) => s.selectedObjectFullName);
  const setSelected = useProjectStore((s) => s.setSelectedObject);

  const [search, setSearch] = useState("");

  const groupedObjects = useMemo(() => {
    if (!project) return {};
    const out: Record<string, string[]> = {};
    for (const fullName of project.selected_objects) {
      const [typ] = fullName.split(".", 1);
      if (search && !fullName.toLowerCase().includes(search.toLowerCase())) continue;
      if (!out[typ]) out[typ] = [];
      out[typ].push(fullName);
    }
    for (const k of Object.keys(out)) out[k].sort();
    return out;
  }, [project, search]);

  if (!project) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarSearch}>
        <input
          className="k-input"
          type="search"
          placeholder="Поиск по объекту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div className={styles.sidebarBody}>
        {project.selected_objects.length === 0 ? (
          <div className={styles.sidebarEmpty}>
            Ни одного объекта в обмене.
            <br />
            (Объекты выбираются в Wizard'е и пока не редактируются здесь.)
          </div>
        ) : (
          Object.entries(groupedObjects).map(([type, fullNames]) => (
            <details key={type} open className={styles.sidebarTypeGroup}>
              <summary>
                {type} ({fullNames.length})
              </summary>
              <ul className={styles.sidebarItemList}>
                {fullNames.map((fn) => {
                  const isSelected = fn === selected;
                  const name = fn.split(".").slice(1).join(".");
                  return (
                    <li
                      key={fn}
                      onClick={() => setSelected(fn)}
                      className={`${styles.sidebarItem} ${isSelected ? styles.sidebarItemSelected : ""}`}
                    >
                      {name}
                    </li>
                  );
                })}
              </ul>
            </details>
          ))
        )}
      </div>

      <div className={styles.sidebarFooter}>
        Всего в обмене: {project.selected_objects.length} объектов
      </div>
    </aside>
  );
}
