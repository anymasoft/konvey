/**
 * Generic tree view component.
 * Each node has: label, optional type-icon hint, optional children.
 * Renders <details>/<summary> for collapsibility (zero-dep, accessible).
 *
 * Sprint 0.5: each leaf node carries `data-mapping-anchor-id` so Sprint 1's
 * SVG mapping overlay can position lines via document.querySelector. The
 * attribute name MUST NOT change later.
 *
 * Visual icons (Iter 3): leaf nodes get an icon inferred from fieldType
 * (CatalogRef.* → catalog, DocumentRef.* → document, EnumRef.* → enum, etc.).
 * Group nodes get an explicit `iconName` if provided by the parent component.
 */
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import styles from "./Workspace.module.css";

export interface TreeNode {
  id: string;
  label: string;
  hint?: string;
  children?: TreeNode[];
  /**
   * Anchor id for SVG mapping overlay (Sprint 1).
   * Format: `<side>:<objectName>.<fieldPath>` e.g. "source:Document.Реализация.Контрагент".
   */
  anchorId?: string;
  /** Field type for inferring icon (CatalogRef.Контрагенты → catalog) */
  fieldType?: string;
  /** Override icon for group nodes (e.g., "Реквизиты шапки" gets a custom one) */
  iconName?: IconName;
}

interface Props {
  nodes: TreeNode[];
  emptyMessage?: ReactNode;
}

/** Infer icon from a field's 1C/XSD type string. */
function inferIconForFieldType(fieldType: string | undefined): IconName | null {
  if (!fieldType) return null;
  if (fieldType.startsWith("CatalogRef.")) return "catalog";
  if (fieldType.startsWith("DocumentRef.")) return "document";
  if (fieldType.startsWith("EnumRef.")) return "enum";
  if (
    fieldType.startsWith("InformationRegisterRecordType.") ||
    fieldType.startsWith("AccumulationRegisterRecordType.")
  ) {
    return "register-info";
  }
  if (fieldType.startsWith("ChartOfAccountsRef.")) return "chart-accounts";
  if (fieldType.startsWith("BusinessProcessRef.")) return "business-process";
  if (fieldType.startsWith("TaskRef.")) return "task";
  // Composite EnterpriseData types
  if (fieldType.startsWith("КлючевыеСвойства")) return "key-properties";
  if (fieldType.startsWith("ОбщиеСвойства")) return "common-properties";
  if (fieldType.startsWith("Документ.")) return "document";
  if (fieldType.startsWith("Справочник.")) return "catalog";
  if (fieldType.startsWith("Перечисление.")) return "enum";
  return null;
}

function TreeNodeView({ node }: { node: TreeNode }) {
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    // Leaf node — eligible mapping anchor (if anchorId set)
    const inferredIcon = inferIconForFieldType(node.fieldType);
    return (
      <div
        className={styles.treeLeaf}
        data-mapping-anchor-id={node.anchorId}
        data-field-type={node.fieldType}
      >
        {inferredIcon && (
          <Icon name={inferredIcon} size={12} className={styles.treeNodeHint} />
        )}
        <span className={styles.treeNodeName}>{node.label}</span>
        {node.hint && <span className={styles.treeNodeHint}>: {node.hint}</span>}
      </div>
    );
  }

  return (
    <details open style={{ paddingLeft: 8 }}>
      <summary>
        {node.iconName && (
          <Icon
            name={node.iconName}
            size={12}
            style={{ color: "var(--k-text-3)", marginRight: 4 }}
          />
        )}
        <span style={{ fontWeight: 500 }}>{node.label}</span>
        {node.hint && (
          <span
            style={{
              color: "var(--k-text-3)",
              marginLeft: 8,
              fontSize: 11,
              fontFamily: "var(--k-font-mono)",
            }}
          >
            {node.hint}
          </span>
        )}
      </summary>
      <div>
        {node.children!.map((c) => (
          <TreeNodeView key={c.id} node={c} />
        ))}
      </div>
    </details>
  );
}

export function TreeView({ nodes, emptyMessage }: Props) {
  if (nodes.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 12, color: "var(--k-text-3)" }}>
        {emptyMessage ?? "Пусто"}
      </div>
    );
  }
  return (
    <div>
      {nodes.map((n) => (
        <TreeNodeView key={n.id} node={n} />
      ))}
    </div>
  );
}
