/**
 * Generic tree view component.
 * Each node has: label, optional type-icon hint, optional children.
 * Renders <details>/<summary> for collapsibility (zero-dep, accessible).
 *
 * Sprint 0.5: each leaf node carries `data-mapping-anchor-id` so Sprint 1's
 * SVG mapping overlay can position lines via document.querySelector. The
 * attribute name MUST NOT change later.
 */
import type { ReactNode } from "react";
import styles from "./Workspace.module.css";

export interface TreeNode {
  id: string;
  label: string;
  hint?: string;
  children?: TreeNode[];
  /**
   * Anchor id for SVG mapping overlay (Sprint 1).
   * Format: `<side>:<objectName>.<fieldPath>` e.g. "source:Document.Реализация.Контрагент".
   * If not provided, the leaf is not a valid mapping target (e.g., group headers).
   */
  anchorId?: string;
  /** Field type for [data-field-type] CSS selectors */
  fieldType?: string;
}

interface Props {
  nodes: TreeNode[];
  emptyMessage?: ReactNode;
}

function TreeNodeView({ node }: { node: TreeNode }) {
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    // Leaf node — eligible mapping anchor (if anchorId set)
    return (
      <div
        className={styles.treeLeaf}
        data-mapping-anchor-id={node.anchorId}
        data-field-type={node.fieldType}
      >
        <span className={styles.treeNodeName}>{node.label}</span>
        {node.hint && (
          <span className={styles.treeNodeHint}>: {node.hint}</span>
        )}
      </div>
    );
  }

  return (
    <details open style={{ paddingLeft: 8 }}>
      <summary>
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
