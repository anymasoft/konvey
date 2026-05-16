/**
 * useColumnResize - reusable hook for drag-to-resize vertical column dividers.
 *
 * Supports:
 *  - persistence via localStorage key
 *  - configurable min/max bounds in pixels
 *  - "left" mode (drag right edge of element) for left sidebars
 *  - "right" mode (drag left edge of element) for right inspectors
 *
 * Returns { width, startDrag, isDragging } and a ref-based dragHandleProps to
 * spread onto the divider element.
 */
import { useCallback, useEffect, useState } from "react";

type Edge = "left" | "right"; // which edge of the resized element the handle controls

interface Options {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  edge: Edge;
}

interface Result {
  width: number;
  isDragging: boolean;
  /** Spread on the divider element */
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    role: "separator";
    "aria-orientation": "vertical";
    title: string;
  };
}

function loadWidth(storageKey: string, fallback: number, min: number, max: number): number {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
      return parsed;
    }
  } catch {}
  return fallback;
}

export function useColumnResize({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  edge,
}: Options): Result {
  const [width, setWidth] = useState<number>(() =>
    loadWidth(storageKey, defaultWidth, minWidth, maxWidth),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setStartX(e.clientX);
      setStartWidth(width);
      setIsDragging(true);
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      // For left-edge handle (left sidebar): dragging right → wider
      // For right-edge handle (right inspector): dragging right → narrower
      const delta = edge === "left" ? dx : -dx;
      const next = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
      setWidth(next);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    // Visual cue: change cursor app-wide while dragging
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, startX, startWidth, edge, minWidth, maxWidth]);

  // Persist when drag ends
  useEffect(() => {
    if (!isDragging) {
      try {
        localStorage.setItem(storageKey, String(width));
      } catch {}
    }
  }, [isDragging, width, storageKey]);

  return {
    width,
    isDragging,
    dragHandleProps: {
      onMouseDown: startDrag,
      role: "separator",
      "aria-orientation": "vertical",
      title: "Перетащить для изменения ширины",
    },
  };
}
