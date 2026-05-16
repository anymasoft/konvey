/**
 * Card representing one project in the picker grid.
 */
import type { ProjectSummary } from "@/types/project";
import { ProgressBar } from "../common/ProgressBar";

interface Props {
  project: ProjectSummary;
  onOpen: () => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ProjectCard({ project, onOpen }: Props) {
  const src = project.source_config_name ?? "?";
  const tgt = project.target_config_name ?? "?";
  const ed = project.ed_version ?? "?";

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      style={{
        background: "var(--k-panel)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-radius-md)",
        padding: 16,
        cursor: "pointer",
        boxShadow: "var(--k-shadow-sm)",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{project.name}</div>
      <div style={{ fontSize: 12, color: "var(--k-text-3)", marginBottom: 4 }}>
        {src} → {tgt}
      </div>
      <div style={{ fontSize: 11, color: "var(--k-text-3)", marginBottom: 12 }}>
        EnterpriseData {ed}
      </div>
      <div style={{ fontSize: 11, color: "var(--k-text-3)", marginBottom: 8 }}>
        Изменён: {formatDate(project.updated_at)}
      </div>
      <ProgressBar value={project.mapped_count} max={project.total_pcr_count || 1} showLabel />
    </div>
  );
}
