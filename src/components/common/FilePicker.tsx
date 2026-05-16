/**
 * Wrapper around Tauri @tauri-apps/plugin-dialog file picker.
 * Falls back to a stub when not running inside Tauri (e.g., vitest, browser).
 */
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "./Button";

interface Props {
  label: string;
  mode: "file" | "directory";
  filters?: { name: string; extensions: string[] }[];
  onPick: (path: string) => void;
  disabled?: boolean;
}

export function FilePicker({ label, mode, filters, onPick, disabled }: Props) {
  const handleClick = async () => {
    try {
      const result = await open({
        multiple: false,
        directory: mode === "directory",
        filters,
      });
      if (typeof result === "string") {
        onPick(result);
      }
    } catch (e) {
      // Not in Tauri context (e.g., browser dev mode without Tauri) — log and noop
      console.error("FilePicker error:", e);
    }
  };

  return (
    <Button onClick={handleClick} disabled={disabled} variant="secondary">
      {label}
    </Button>
  );
}
