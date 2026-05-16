/**
 * Icon component — inline SVG library.
 *
 * No external dependencies (no lucide-react / react-icons / heroicons).
 * SVG paths are inspired by Lucide (ISC license) and Heroicons (MIT) — both
 * permit re-use including modification. Stroke-style, 24x24 viewBox.
 *
 * Usage:
 *   <Icon name="document" size={16} />
 *   <Icon name="check" size={14} className={styles.statusIcon} />
 *
 * Adding new icons:
 *   1. Pick from https://lucide.dev/ or https://heroicons.com/
 *   2. Add path to ICON_DEFS below
 *   3. Add name to IconName union
 */
import type { CSSProperties } from "react";

export type IconName =
  // 1C metadata type icons
  | "document"
  | "catalog"
  | "enum"
  | "register-info"
  | "register-accum"
  | "chart-accounts"
  | "business-process"
  | "task"
  | "other"
  | "key-properties"
  | "common-properties"
  | "tabular-section"
  // Navigation / disclosure
  | "chevron-down"
  | "chevron-right"
  | "chevron-up"
  | "chevron-left"
  | "arrow-right"
  | "arrow-left"
  // Actions
  | "search"
  | "filter"
  | "plus"
  | "check"
  | "x"
  | "edit"
  | "trash"
  | "menu"
  | "settings"
  | "export"
  | "validate"
  | "preview"
  | "refresh"
  | "play"
  // Status
  | "info"
  | "warning"
  | "error"
  | "success";

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
  style?: CSSProperties;
  /** Accessible label (read by screen readers). If omitted, icon is decorative. */
  "aria-label"?: string;
}

/**
 * Each entry is the inner SVG markup (without <svg> wrapper).
 * Coords assume 24x24 viewBox, stroke-width inherited from CSS.
 */
const ICON_DEFS: Record<IconName, JSX.Element> = {
  // === 1C metadata types ===
  // Document — a paper sheet with corner folded + lines
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </>
  ),
  // Catalog — book with bookmark
  catalog: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="10" y1="6" x2="16" y2="6" />
    </>
  ),
  // Enum — bulleted list
  enum: (
    <>
      <line x1="8" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="20" y2="12" />
      <line x1="8" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  // InformationRegister — database stack
  "register-info": (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6a9 3 0 0 0 18 0V5" />
      <path d="M3 11v6a9 3 0 0 0 18 0v-6" />
    </>
  ),
  // AccumulationRegister — bar chart
  "register-accum": (
    <>
      <line x1="6" y1="20" x2="6" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="18" y1="20" x2="18" y2="14" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </>
  ),
  // ChartOfAccounts — balance scale
  "chart-accounts": (
    <>
      <path d="M12 3v18" />
      <path d="M5 7l-2 6h4z" />
      <path d="M19 7l-2 6h4z" />
      <path d="M5 13a2 2 0 0 0 4 0" />
      <path d="M15 13a2 2 0 0 0 4 0" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </>
  ),
  // BusinessProcess — flow with arrow
  "business-process": (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h6a3 3 0 0 1 3 3v6" />
      <polyline points="15 11 18 14 21 11" />
    </>
  ),
  // Task — checklist with checkbox
  task: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  // Other — generic box
  other: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </>
  ),
  // KeyProperties — key
  "key-properties": (
    <>
      <path d="M15 7a4 4 0 1 1-4 4l-7 7v3h3l1-1v-2h2v-2h2l2.5-2.5" />
      <circle cx="17" cy="7" r="1.5" />
    </>
  ),
  // CommonProperties — link / share
  "common-properties": (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  // TabularSection — table grid
  "tabular-section": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </>
  ),

  // === Navigation ===
  "chevron-down": <polyline points="6 9 12 15 18 9" />,
  "chevron-right": <polyline points="9 6 15 12 9 18" />,
  "chevron-up": <polyline points="6 15 12 9 18 15" />,
  "chevron-left": <polyline points="15 6 9 12 15 18" />,
  "arrow-right": (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  "arrow-left": (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),

  // === Actions ===
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  export: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  validate: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </>
  ),
  preview: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  refresh: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  play: <polygon points="5 3 19 12 5 21 5 3" />,

  // === Status ===
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  warning: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  className,
  color,
  style,
  "aria-label": ariaLabel,
}: Props) {
  const path = ICON_DEFS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {path}
    </svg>
  );
}

/**
 * Map 1C ObjectType (English) -> icon name. Used in TreeView and ObjectsSidebar.
 */
export function iconNameForObjectType(objectType: string): IconName {
  switch (objectType) {
    case "Catalog":
    case "ChartOfCharacteristicTypes":
      return "catalog";
    case "Document":
      return "document";
    case "Enum":
      return "enum";
    case "InformationRegister":
      return "register-info";
    case "AccumulationRegister":
    case "CalculationRegister":
      return "register-accum";
    case "AccountingRegister":
    case "ChartOfAccounts":
    case "ChartOfCalculationTypes":
      return "chart-accounts";
    case "BusinessProcess":
      return "business-process";
    case "Task":
      return "task";
    default:
      return "other";
  }
}

/**
 * Map EnterpriseData type category -> icon name. Used for ED type display.
 */
export function iconNameForEdCategory(category: string): IconName {
  switch (category) {
    case "document":
      return "document";
    case "catalog":
      return "catalog";
    case "enum":
      return "enum";
    case "register":
      return "register-info";
    case "composite":
    case "key_properties":
      return "key-properties";
    case "common_properties":
      return "common-properties";
    case "tabular_section":
    case "tabular_section_row":
      return "tabular-section";
    case "chart_of_accounts":
      return "chart-accounts";
    case "business_process":
      return "business-process";
    case "task":
      return "task";
    default:
      return "other";
  }
}
