import { useState } from "react";
import { backend } from "@/api/backend";
import { FilePicker } from "../common/FilePicker";
import type { WizardState } from "./Wizard";

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}

export function Step3Target({ state, update }: Props) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (path: string) => {
    setParsing(true);
    setError(null);
    update({ targetPath: path, targetResult: null });
    try {
      const result = await backend.parseConfiguration(path);
      update({ targetResult: result });
    } catch (e) {
      setError(String(e));
    } finally {
      setParsing(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 16 }}>Конфигурация-приёмник</h2>
      <p style={{ margin: 0, fontSize: 12, color: "var(--k-text-3)" }}>
        Куда загружаются данные. Например, БП 3.0 или ЗУП.
      </p>

      <div className="k-field">
        <label className="k-label">Способ подачи</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          <label>
            <input type="radio" name="tgt-mode" defaultChecked /> Папка с выгрузкой XML конфигурации
          </label>
          <label style={{ color: "var(--k-text-4)" }}>
            <input type="radio" name="tgt-mode" disabled /> Подключиться к работающей базе 1С{" "}
            <span style={{ fontStyle: "italic" }}>(в следующих релизах)</span>
          </label>
          <label style={{ color: "var(--k-text-4)" }}>
            <input type="radio" name="tgt-mode" disabled /> Загрузить ранее распарсенный JSON{" "}
            <span style={{ fontStyle: "italic" }}>(в следующих релизах)</span>
          </label>
        </div>
      </div>

      <div className="k-field">
        <FilePicker
          mode="directory"
          label={state.targetPath ? "Выбрать другую папку..." : "Выбрать папку..."}
          onPick={handlePick}
          disabled={parsing}
        />
        {state.targetPath && (
          <div style={{ fontSize: 11, color: "var(--k-text-3)", marginTop: 4 }}>
            Папка: <span className="k-mono">{state.targetPath}</span>
          </div>
        )}
        {parsing && (
          <div style={{ fontSize: 12, color: "var(--k-text-3)", marginTop: 8 }}>
            Парсинг конфигурации (может занять до 30 сек)...
          </div>
        )}
        {error && (
          <div style={{ fontSize: 12, color: "var(--k-red)", marginTop: 8 }}>{error}</div>
        )}
        {state.targetResult && (
          <div
            style={{
              fontSize: 12,
              color: "var(--k-text-2)",
              marginTop: 8,
              padding: 8,
              background: "var(--k-panel-sunk)",
              borderRadius: "var(--k-radius)",
            }}
          >
            <div style={{ fontWeight: 500 }}>
              {state.targetResult.configuration.name}
              {state.targetResult.configuration.version && (
                <span style={{ color: "var(--k-text-3)" }}>
                  {" "}
                  ({state.targetResult.configuration.version})
                </span>
              )}
            </div>
            <div style={{ marginTop: 4, color: "var(--k-text-3)" }}>
              Всего объектов: {state.targetResult.summary.total}
            </div>
            <div style={{ marginTop: 2, fontSize: 11 }}>
              {Object.entries(state.targetResult.summary)
                .filter(([k]) => k.startsWith("type_"))
                .map(([k, v]) => `${k.replace("type_", "")}: ${v}`)
                .join(", ")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
