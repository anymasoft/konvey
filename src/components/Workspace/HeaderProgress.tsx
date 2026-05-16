/**
 * Header progress display — shows mapping completion stats and warnings.
 *
 * Format: `[████░░░░░░] 0/0 mapped · 0 review · 0 conflicts`
 *
 * In Sprint 0.5 all values are 0 because no mapping engine exists yet.
 * In Sprint 1 these will reflect real ProjectMapping data.
 */
import styles from "./Workspace.module.css";

interface Props {
  mapped: number;
  total: number;
  review: number;
  conflicts: number;
}

export function HeaderProgress({ mapped, total, review, conflicts }: Props) {
  const pct = total > 0 ? Math.round((mapped / total) * 100) : 0;

  return (
    <div className={styles.headerCenter}>
      <div className={styles.headerProgressBar} title={`${pct}%`}>
        <div className={styles.headerProgressFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.headerProgressStats}>
        <span className={styles.headerProgressStat}>
          <span
            className={styles.headerProgressDot}
            style={{ background: "var(--k-green)" }}
          />
          {mapped}/{total} mapped
        </span>
        <span
          className={`${styles.headerProgressStat} ${review > 0 ? styles.headerProgressStatWarn : styles.headerProgressStatDim}`}
        >
          <span
            className={styles.headerProgressDot}
            style={{ background: review > 0 ? "var(--k-amber)" : "var(--k-text-4)" }}
          />
          {review} review
        </span>
        <span
          className={`${styles.headerProgressStat} ${conflicts > 0 ? styles.headerProgressStatErr : styles.headerProgressStatDim}`}
        >
          <span
            className={styles.headerProgressDot}
            style={{ background: conflicts > 0 ? "var(--k-red)" : "var(--k-text-4)" }}
          />
          {conflicts} conflicts
        </span>
      </div>
    </div>
  );
}
