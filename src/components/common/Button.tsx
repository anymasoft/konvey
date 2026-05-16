/**
 * Generic button. Uses k-btn classes from konvey design CSS.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "secondary", children, className = "", ...rest }: Props) {
  // konvey-design.css uses `.k-btn.primary`, `.k-btn.ghost` (variant as second class)
  const variantClass = variant === "secondary" ? "" : variant;
  const cls = `k-btn ${variantClass} ${className}`.trim();
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
