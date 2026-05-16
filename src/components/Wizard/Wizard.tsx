/**
 * NewProjectWizard — 4 steps:
 *  1. Name + EnterpriseData XSD version
 *  2. Source configuration (folder dump)
 *  3. Target configuration (folder dump)
 *  4. Select objects to exchange
 *
 * State is local (not in store) — wizard is throw-away if canceled.
 */
import { useState } from "react";
import { backend } from "@/api/backend";
import { useAppStore } from "@/stores/appStore";
import type { XsdParseResult } from "@/types/enterprise-data";
import type { ConfigParseResult } from "@/types/configuration";
import { Button } from "../common/Button";
import { Step1Name } from "./Step1Name";
import { Step2Source } from "./Step2Source";
import { Step3Target } from "./Step3Target";
import { Step4Objects } from "./Step4Objects";

export interface WizardState {
  name: string;
  description: string;
  format: "kd3" | "kd2";  // kd2 is disabled in Sprint 0
  xsdPath: string;
  xsdResult: XsdParseResult | null;

  sourcePath: string;
  sourceResult: ConfigParseResult | null;

  targetPath: string;
  targetResult: ConfigParseResult | null;

  selectedObjects: string[];
}

const INITIAL: WizardState = {
  name: "",
  description: "",
  format: "kd3",
  xsdPath: "",
  xsdResult: null,
  sourcePath: "",
  sourceResult: null,
  targetPath: "",
  targetResult: null,
  selectedObjects: [],
};

export function Wizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToPicker = useAppStore((s) => s.goToPicker);
  const openProject = useAppStore((s) => s.openProject);

  const update = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));

  const handleCancel = () => {
    if (confirm("Отменить создание проекта? Все введённые данные будут потеряны.")) {
      goToPicker();
    }
  };

  const canAdvance = (): boolean => {
    if (step === 1) {
      return state.name.trim().length >= 3 && state.xsdResult !== null;
    }
    if (step === 2) {
      return state.sourceResult !== null;
    }
    if (step === 3) {
      return state.targetResult !== null;
    }
    return true; // step 4
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const project = await backend.createProject({
        name: state.name.trim(),
        description: state.description.trim() || null,
        ed_xsd_path: state.xsdPath,
        source_config_path: state.sourcePath,
        target_config_path: state.targetPath,
        selected_objects: state.selectedObjects,
      });
      await openProject(project.id);
    } catch (e) {
      setError(String(e));
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--k-bg)",
      }}
    >
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--k-border)",
          background: "var(--k-panel)",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Новый проект Konvey</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                background: s <= step ? "var(--k-accent)" : "var(--k-border)",
                borderRadius: 2,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--k-text-3)", marginTop: 6 }}>
          Шаг {step} из 4
        </div>
      </header>

      <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {step === 1 && <Step1Name state={state} update={update} />}
        {step === 2 && <Step2Source state={state} update={update} />}
        {step === 3 && <Step3Target state={state} update={update} />}
        {step === 4 && <Step4Objects state={state} update={update} />}
      </main>

      {error && (
        <div
          style={{
            padding: "8px 24px",
            background: "var(--k-red-bg)",
            color: "var(--k-red)",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <footer
        style={{
          padding: 16,
          borderTop: "1px solid var(--k-border)",
          background: "var(--k-panel)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button variant="ghost" onClick={handleCancel}>Отмена</Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="secondary"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
            disabled={step === 1}
          >
            ← Назад
          </Button>
          {step < 4 ? (
            <Button
              variant="primary"
              onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3 | 4))}
              disabled={!canAdvance()}
            >
              Далее →
            </Button>
          ) : (
            <Button variant="primary" onClick={handleCreate} disabled={creating}>
              {creating ? "Создание..." : "Создать проект"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
