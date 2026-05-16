/**
 * ProjectPicker — first screen on app launch.
 *
 * Behavior:
 *  - On mount: calls backend.listProjects() and renders cards.
 *  - Empty state: shows "Проектов пока нет" + "Создать новый проект" CTA.
 *  - With projects: grid of ProjectCard + "+ Новый проект" button top-right.
 *  - Search field above the grid (visible always, but filters only when >1 project).
 *  - Sort dropdown: "Недавние" (default) / "По имени".
 */
import { useEffect, useMemo, useState } from "react";
import { backend } from "@/api/backend";
import { useAppStore } from "@/stores/appStore";
import type { ProjectSummary } from "@/types/project";
import { Button } from "../common/Button";
import { ProjectCard } from "./ProjectCard";

type SortKey = "recent" | "name";

export function ProjectPicker() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const goToWizard = useAppStore((s) => s.goToWizard);
  const openProject = useAppStore((s) => s.openProject);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await backend.listProjects();
        if (!cancelled) {
          setProjects(list);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSorted = useMemo(() => {
    let arr = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((p) => p.name.toLowerCase().includes(q));
    }
    arr = [...arr];
    if (sortKey === "name") {
      arr.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    } else {
      arr.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    }
    return arr;
  }, [projects, search, sortKey]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--k-text-3)" }}>Загрузка проектов…</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--k-red)" }}>Ошибка загрузки списка проектов: {error}</p>
        <p style={{ color: "var(--k-text-3)" }}>
          Возможно, backend sidecar ещё не запустился. Подожди пару секунд и обнови экран.
        </p>
      </div>
    );
  }

  const isEmpty = projects.length === 0;

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto", background: "var(--k-bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div className="k-logo" style={{ fontSize: 18 }}>
          Konvey
        </div>
        <Button variant="primary" onClick={goToWizard}>
          + Новый проект
        </Button>
      </header>

      {isEmpty ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            gap: 12,
            color: "var(--k-text-3)",
          }}
        >
          <div style={{ fontSize: 16 }}>Проектов пока нет</div>
          <Button variant="primary" onClick={goToWizard}>
            Создать первый проект
          </Button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <input
              className="k-input"
              type="search"
              placeholder="Поиск по имени проекта..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 400 }}
            />
            <select
              className="k-input"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={{ width: 160 }}
            >
              <option value="recent">Недавние</option>
              <option value="name">По имени</option>
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {filteredSorted.map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={() => openProject(p.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
