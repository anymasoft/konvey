/**
 * Left sidebar of Workspace — list of objects selected for exchange,
 * grouped by metadata type. Click to select an object → activates Center.
 */
import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";

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
    <aside
      style={{
        width: 280,
        flexShrink: 0,
        background: "var(--k-panel)",
        borderRight: "1px solid var(--k-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 8, borderBottom: "1px solid var(--k-divider)" }}>
        <input
          className="k-input"
          type="search"
          placeholder="Поиск по объекту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
        {project.selected_objects.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--k-text-3)", padding: 8 }}>
            Ни одного объекта в обмене.
            <br />
            (В Sprint 0 объекты выбираются в Wizard'е и не редактируются здесь.)
          </div>
        ) : (
          Object.entries(groupedObjects).map(([type, fullNames]) => (
            <details key={type} open>
              <summary
                style={{
                  cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--k-text-2)",
                }}
              >
                {type} ({fullNames.length})
              </summary>
              <ul style={{ listStyle: "none", padding: "0 0 4px 12px", margin: 0 }}>
                {fullNames.map((fn) => {
                  const isSelected = fn === selected;
                  const name = fn.split(".").slice(1).join(".");
                  return (
                    <li
                      key={fn}
                      onClick={() => setSelected(fn)}
                      style={{
                        padding: "3px 6px",
                        fontSize: 12,
                        cursor: "pointer",
                        background: isSelected ? "var(--k-accent-50)" : "transparent",
                        color: isSelected ? "var(--k-accent-text)" : "var(--k-text)",
                        borderRadius: "var(--k-radius-sm)",
                      }}
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

      <div
        style={{
          padding: 8,
          borderTop: "1px solid var(--k-divider)",
          fontSize: 11,
          color: "var(--k-text-3)",
        }}
      >
        Всего в обмене: {project.selected_objects.length} объектов
      </div>
    </aside>
  );
}
