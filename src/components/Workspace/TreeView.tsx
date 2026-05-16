/**
 * Generic tree view component.
 * Each node has: label, optional type-icon hint, optional children.
 * Renders <details>/<summary> for collapsibility (zero-dep, accessible).
 */
import type { ReactNode } from "react";

export interface TreeNode {
  id: string;
  label: string;
  hint?: string;
  children?: TreeNode[];
}

interface Props {
  nodes: TreeNode[];
  emptyMessage?: ReactNode;
}

function TreeNodeView({ node }: { node: TreeNode }) {
  const hasChildren = node.children && node.children.length > 0;
  if (!hasChildren) {
    return (
      <div className="k-tree-leaf" style={{ paddingLeft: 16, fontSize: 12 }}>
        <span>{node.label}</span>
        {node.hint && (
          <span style={{ color: "var(--k-text-3)", marginLeft: 8 }}>
            : <span className="k-mono">{node.hint}</span>
          </span>
        )}
      </div>
    );
  }
  return (
    <details open style={{ paddingLeft: 8 }}>
      <summary style={{ cursor: "pointer", fontSize: 12, padding: "2px 0" }}>
        <span style={{ fontWeight: 500 }}>{node.label}</span>
        {node.hint && (
          <span style={{ color: "var(--k-text-3)", marginLeft: 8, fontSize: 11 }}>
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
