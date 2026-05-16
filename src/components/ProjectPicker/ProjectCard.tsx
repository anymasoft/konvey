/**
 * Card representing one project in the picker grid.
 */
import type { ProjectSummary } from "@/types/project";
import { ProgressBar } from "../common/ProgressBar";
import styles from "./ProjectCard.module.css";

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
      className={styles.card}
    >
      <div className={styles.name}>{project.name}</div>
      <div className={styles.flow}>
        {src} <span className={styles.flowArrow}>→</span> {tgt}
      </div>
      <div className={styles.edVersion}>EnterpriseData {ed}</div>
      <div className={styles.date}>Изменён: {formatDate(project.updated_at)}</div>
      <ProgressBar value={project.mapped_count} max={project.total_pcr_count || 1} showLabel />
    </div>
  );
}
