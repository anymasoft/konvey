import { useState } from "react";
import { backend } from "@/api/backend";
import { Input } from "../common/Input";
import { FilePicker } from "../common/FilePicker";
import type { WizardState } from "./Wizard";
import styles from "./Wizard.module.css";

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
    <div className={styles.stepBody}>
      <h2 className={styles.stepTitle}>Имя проекта и стандарт EnterpriseData</h2>

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
        <div className={styles.inlineChoices}>
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
          <label className={styles.disabledChoice}>
            <input type="radio" name="format" value="kd2" disabled /> КД 2.1 / Legacy
            <em>(в следующих релизах)</em>
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
          <div className={styles.fileHint}>
            Файл: <span className={styles.pathMono}>{state.xsdPath}</span>
          </div>
        )}
        {parsing && <div className={styles.parsingMessage}>Парсинг XSD...</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {state.xsdResult && (
          <div className={styles.parseResult}>
            EnterpriseData {state.xsdResult.schema.version}:{" "}
            {state.xsdResult.summary.total_complex} типов объектов,{" "}
            {state.xsdResult.summary.total_simple} простых типов
          </div>
        )}
      </div>
    </div>
  );
}
