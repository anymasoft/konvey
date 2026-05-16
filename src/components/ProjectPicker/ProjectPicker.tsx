/**
 * ProjectPicker - first screen on app launch.
 *
 * Behavior:
 *  - On mount: calls backend.listProjects() and renders cards.
 *  - Empty state: shows "Нет проектов" + "Создать первый проект" CTA.
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
import styles from "./ProjectPicker.module.css";

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
    return <div className={styles.loadingMessage}>Загрузка проектов...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorMessage}>
        <p className={styles.errorText}>Ошибка загрузки списка проектов: {error}</p>
        <p className={styles.errorHint}>
          Возможно, backend sidecar ещё не запустился. Подожди пару секунд и обнови экран.
        </p>
      </div>
    );
  }

  const isEmpty = projects.length === 0;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.logo}>Konvey</div>
        <Button variant="primary" onClick={goToWizard}>
          + Новый проект
        </Button>
      </header>

      {isEmpty ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateLabel}>Проектов пока нет</div>
          <Button variant="primary" onClick={goToWizard}>
            Создать первый проект
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <input
              className={`k-input ${styles.search}`}
              type="search"
              placeholder="Поиск по имени проекта..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={`k-input ${styles.sortSelect}`}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="recent">Недавние</option>
              <option value="name">По имени</option>
            </select>
          </div>

          <div className={styles.grid}>
            {filteredSorted.map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={() => openProject(p.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
