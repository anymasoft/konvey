/**
 * Thin progress bar. Used in ProjectCard (mapping progress) and header.
 * Uses k-progress-bar class from konvey design CSS.
 */

interface Props {
  value: number;
  max: number;
  showLabel?: boolean;
}

export function ProgressBar({ value, max, showLabel = false }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="k-progress-block">
      <div className="k-progress-bar">
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--k-accent)",
            transition: "width 200ms",
          }}
        />
      </div>
      {showLabel && (
        <span className="k-mono" style={{ fontSize: 11 }}>
          {value}/{max}
        </span>
      )}
    </div>
  );
}
