import { useMemo, useState } from "react";
import type { Configuration } from "@/types/configuration";
import type { WizardState } from "./Wizard";

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}

type Side = "source" | "target";

export function Step4Objects({ state, update }: Props) {
  const [activeSide, setActiveSide] = useState<Side>("source");

  const configMap: Record<Side, Configuration | null> = {
    source: state.sourceResult?.configuration ?? null,
    target: state.targetResult?.configuration ?? null,
  };

  const grouped = useMemo(() => {
    const cfg = configMap[activeSide];
    if (!cfg) return {};
    const out: Record<string, typeof cfg.objects[string][]> = {};
    for (const obj of Object.values(cfg.objects)) {
      const t = obj.object_type;
      if (!out[t]) out[t] = [];
      out[t].push(obj);
    }
    for (const t of Object.keys(out)) {
      out[t].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }
    return out;
  }, [activeSide, configMap]);

  const toggle = (fullName: string) => {
    const set = new Set(state.selectedObjects);
    if (set.has(fullName)) set.delete(fullName);
    else set.add(fullName);
    update({ selectedObjects: Array.from(set) });
  };

  const selectedCount = state.selectedObjects.length;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ margin: 0, fontSize: 16, marginBottom: 8 }}>Объекты для обмена</h2>
      <p style={{ fontSize: 12, color: "var(--k-text-3)", marginBottom: 16 }}>
        Отметьте объекты, которые должны участвовать в обмене. В Sprint 0 поддержано простое
        выделение без auto-resolve зависимостей — нужные справочники добавьте вручную.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveSide("source")}
          className={activeSide === "source" ? "k-btn k-btn-primary" : "k-btn"}
        >
          Источник: {state.sourceResult?.configuration.name ?? "—"}
        </button>
        <button
          onClick={() => setActiveSide("target")}
          className={activeSide === "target" ? "k-btn k-btn-primary" : "k-btn"}
        >
          Приёмник: {state.targetResult?.configuration.name ?? "—"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 16,
          height: "calc(100vh - 320px)",
        }}
      >
        <div
          style={{
            background: "var(--k-panel)",
            border: "1px solid var(--k-border)",
            borderRadius: "var(--k-radius-md)",
            overflow: "auto",
            padding: 8,
          }}
        >
          {Object.entries(grouped).map(([type, objects]) => (
            <details key={type} open>
              <summary
                style={{
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--k-text-2)",
                }}
              >
                {type} ({objects.length})
              </summary>
              <ul style={{ listStyle: "none", padding: "0 0 0 16px", margin: 0 }}>
                {objects.map((obj) => (
                  <li
                    key={obj.full_name}
                    style={{
                      padding: "2px 4px",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={state.selectedObjects.includes(obj.full_name)}
                      onChange={() => toggle(obj.full_name)}
                    />
                    <span>{obj.name}</span>
                    {obj.synonym && (
                      <span style={{ color: "var(--k-text-3)", fontSize: 11 }}>
                        — {obj.synonym}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <aside
          style={{
            background: "var(--k-panel)",
            border: "1px solid var(--k-border)",
            borderRadius: "var(--k-radius-md)",
            padding: 12,
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
            Выбрано ({selectedCount})
          </div>
          {selectedCount === 0 ? (
            <div style={{ fontSize: 11, color: "var(--k-text-3)" }}>
              Никаких объектов не выбрано.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
              {state.selectedObjects.map((n) => (
                <li
                  key={n}
                  style={{
                    padding: "3px 0",
                    borderBottom: "1px solid var(--k-divider)",
                  }}
                >
                  {n}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
