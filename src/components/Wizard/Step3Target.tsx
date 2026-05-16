import { useState } from "react";
import { backend } from "@/api/backend";
import { FilePicker } from "../common/FilePicker";
import type { WizardState } from "./Wizard";
import styles from "./Wizard.module.css";

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
    <div className={styles.stepBody}>
      <h2 className={styles.stepTitle}>Конфигурация-приёмник</h2>
      <p className={styles.stepDescription}>
        Куда загружаются данные. Например, БП 3.0 или ЗУП.
      </p>

      <div className="k-field">
        <label className="k-label">Способ подачи</label>
        <div className={styles.modeChoices}>
          <label>
            <input type="radio" name="tgt-mode" defaultChecked /> Папка с выгрузкой XML конфигурации
          </label>
          <label className={styles.disabledChoice}>
            <input type="radio" name="tgt-mode" disabled /> Подключиться к работающей базе 1С
            <em>(в следующих релизах)</em>
          </label>
          <label className={styles.disabledChoice}>
            <input type="radio" name="tgt-mode" disabled /> Загрузить ранее распарсенный JSON
            <em>(в следующих релизах)</em>
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
          <div className={styles.fileHint}>
            Папка: <span className={styles.pathMono}>{state.targetPath}</span>
          </div>
        )}
        {parsing && (
          <div className={styles.parsingMessage}>
            Парсинг конфигурации (может занять до 30 сек)...
          </div>
        )}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {state.targetResult && (
          <div className={styles.parseResult}>
            <div className={styles.parseResultName}>
              {state.targetResult.configuration.name}
              {state.targetResult.configuration.version && (
                <span className={styles.parseResultDim}>
                  {" "}({state.targetResult.configuration.version})
                </span>
              )}
            </div>
            <div className={styles.parseResultDim} style={{ marginTop: 4 }}>
              Всего объектов: {state.targetResult.summary.total}
            </div>
            <div className={styles.parseResultBreakdown}>
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
