import { useMemo, useState } from "react";
import type { Configuration } from "@/types/configuration";
import type { WizardState } from "./Wizard";
import styles from "./Wizard.module.css";

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
    <div className={styles.stepBodyWide}>
      <h2 className={styles.stepTitle} style={{ marginBottom: 8 }}>
        Объекты для обмена
      </h2>
      <p className={styles.stepDescription} style={{ marginBottom: 16 }}>
        Отметьте объекты, которые должны участвовать в обмене. В Sprint 0 поддержано простое
        выделение без auto-resolve зависимостей — нужные справочники добавьте вручную.
      </p>

      <div className={styles.sideTabs}>
        <button
          onClick={() => setActiveSide("source")}
          className={activeSide === "source" ? "k-btn primary" : "k-btn"}
        >
          Источник: {state.sourceResult?.configuration.name ?? "—"}
        </button>
        <button
          onClick={() => setActiveSide("target")}
          className={activeSide === "target" ? "k-btn primary" : "k-btn"}
        >
          Приёмник: {state.targetResult?.configuration.name ?? "—"}
        </button>
      </div>

      <div className={styles.step4Layout}>
        <div className={styles.objectTreePanel}>
          {Object.entries(grouped).map(([type, objects]) => (
            <details key={type} open className={styles.typeGroup}>
              <summary>
                {type} ({objects.length})
              </summary>
              <ul className={styles.typeGroupList}>
                {objects.map((obj) => (
                  <li key={obj.full_name} className={styles.typeGroupItem}>
                    <input
                      type="checkbox"
                      checked={state.selectedObjects.includes(obj.full_name)}
                      onChange={() => toggle(obj.full_name)}
                    />
                    <span>{obj.name}</span>
                    {obj.synonym && <span className="synonym">— {obj.synonym}</span>}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <aside className={styles.selectedList}>
          <div className={styles.selectedHeader}>Выбрано ({selectedCount})</div>
          {selectedCount === 0 ? (
            <div className={styles.selectedEmpty}>Никаких объектов не выбрано.</div>
          ) : (
            <ul className={styles.selectedItems}>
              {state.selectedObjects.map((n) => (
                <li key={n} className={styles.selectedItem}>
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
