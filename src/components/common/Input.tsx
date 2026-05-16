/**
 * Text input. Uses k-input class.
 */
import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className = "", id, ...rest }: Props) {
  return (
    <div className="k-field">
      {label && <label htmlFor={id} className="k-label">{label}</label>}
      <input id={id} className={`k-input ${className}`.trim()} {...rest} />
      {hint && <div className="k-hint">{hint}</div>}
    </div>
  );
}
