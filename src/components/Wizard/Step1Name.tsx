import { useState } from "react";
import { backend } from "@/api/backend";
import { Input } from "../common/Input";
import { FilePicker } from "../common/FilePicker";
import type { WizardState } from "./Wizard";

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}

export function Step1Name({ state, update }: Props) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleXsdPick = async (path: string) => {
    setParsing(true);
    setError(null);
    update({ xsdPath: path, xsdResult: null });
    try {
      const result = await backend.parseXsd(path);
      update({ xsdResult: result });
    } catch (e) {
      setError(String(e));
    } finally {
      setParsing(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 16 }}>Имя проекта и стандарт EnterpriseData</h2>

      <Input
        id="proj-name"
        label="Имя проекта"
        placeholder="Обмен УТ 11.5 ↔ БП 3.0"
        value={state.name}
        onChange={(e) => update({ name: e.target.value })}
      />

      <div className="k-field">
        <label className="k-label">Описание (опционально)</label>
        <textarea
          className="k-input"
          rows={3}
          value={state.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>

      <div className="k-field">
        <label className="k-label">Формат правил</label>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <label>
            <input
              type="radio"
              name="format"
              value="kd3"
              checked={state.format === "kd3"}
              onChange={() => update({ format: "kd3" })}
            />{" "}
            КД 3.1 / EnterpriseData
          </label>
          <label style={{ color: "var(--k-text-4)" }}>
            <input type="radio" name="format" value="kd2" disabled />{" "}
            КД 2.1 / Legacy{" "}
            <span style={{ fontStyle: "italic" }}>(в следующих релизах)</span>
          </label>
        </div>
      </div>

      <div className="k-field">
        <label className="k-label">XSD-схема EnterpriseData</label>
        <FilePicker
          mode="file"
          label={state.xsdPath ? "Заменить XSD..." : "Загрузить XSD..."}
          filters={[{ name: "XSD Schema", extensions: ["xsd"] }]}
          onPick={handleXsdPick}
          disabled={parsing}
        />
        {state.xsdPath && (
          <div style={{ fontSize: 11, color: "var(--k-text-3)", marginTop: 4 }}>
            Файл: <span className="k-mono">{state.xsdPath}</span>
          </div>
        )}
        {parsing && (
          <div style={{ fontSize: 12, color: "var(--k-text-3)", marginTop: 8 }}>
            Парсинг XSD...
          </div>
        )}
        {error && (
          <div style={{ fontSize: 12, color: "var(--k-red)", marginTop: 8 }}>{error}</div>
        )}
        {state.xsdResult && (
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
            EnterpriseData {state.xsdResult.schema.version}:{" "}
            {state.xsdResult.summary.total_complex} типов объектов,{" "}
            {state.xsdResult.summary.total_simple} простых типов
          </div>
        )}
      </div>
    </div>
  );
}
