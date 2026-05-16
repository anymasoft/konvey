import { useState } from "react";
import { backend } from "@/api/backend";
import { FilePicker } from "../common/FilePicker";
import type { WizardState } from "./Wizard";
import styles from "./Wizard.module.css";

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}

export function Step2Source({ state, update }: Props) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (path: string) => {
    setParsing(true);
    setError(null);
    update({ sourcePath: path, sourceResult: null });
    try {
      const result = await backend.parseConfiguration(path);
      update({ sourceResult: result });
    } catch (e) {
      setError(String(e));
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className={styles.stepBody}>
      <h2 className={styles.stepTitle}>Конфигурация-источник</h2>
      <p className={styles.stepDescription}>
        Откуда выгружаются данные. Например, рабочая база УТ или ERP.
      </p>

      <div className="k-field">
        <label className="k-label">Способ подачи</label>
        <div className={styles.modeChoices}>
          <label>
            <input type="radio" name="src-mode" defaultChecked /> Папка с выгрузкой XML конфигурации
          </label>
          <label className={styles.disabledChoice}>
            <input type="radio" name="src-mode" disabled /> Подключиться к работающей базе 1С
            <em>(в следующих релизах)</em>
          </label>
          <label className={styles.disabledChoice}>
            <input type="radio" name="src-mode" disabled /> Загрузить ранее распарсенный JSON
            <em>(в следующих релизах)</em>
          </label>
        </div>
      </div>

      <div className="k-field">
        <FilePicker
          mode="directory"
          label={state.sourcePath ? "Выбрать другую папку..." : "Выбрать папку..."}
          onPick={handlePick}
          disabled={parsing}
        />
        {state.sourcePath && (
          <div className={styles.fileHint}>
            Папка: <span className={styles.pathMono}>{state.sourcePath}</span>
          </div>
        )}
        {parsing && (
          <div className={styles.parsingMessage}>
            Парсинг конфигурации (может занять до 30 сек)...
          </div>
        )}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {state.sourceResult && (
          <div className={styles.parseResult}>
            <div className={styles.parseResultName}>
              {state.sourceResult.configuration.name}
              {state.sourceResult.configuration.version && (
                <span className={styles.parseResultDim}>
                  {" "}({state.sourceResult.configuration.version})
                </span>
              )}
            </div>
            <div className={styles.parseResultDim} style={{ marginTop: 4 }}>
              Всего объектов: {state.sourceResult.summary.total}
            </div>
            <div className={styles.parseResultBreakdown}>
              {Object.entries(state.sourceResult.summary)
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
