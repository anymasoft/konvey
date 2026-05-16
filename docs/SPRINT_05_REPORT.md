# Sprint 0.5 Report — Visual Foundation

**Дата завершения:** 2026-05-17
**Исполнитель:** Claude Code
**Архитектор:** Claude Opus 4.7
**Прошлый отчёт:** [SPRINT_0_REPORT.md](SPRINT_0_REPORT.md)

---

## TL;DR

Sprint 0.5 закрыт. UI основа доведена до состояния «правильный DOM + правильные стили + иконки» — это позиционирует Sprint 1 на чистый функциональный mapping engine, а не на параллельный рефакторинг.

**Главные достижения:**
- Все компоненты переведены с inline `style={{}}` на **CSS Modules** (ADR-009) — теперь работают `:hover`, `:focus-visible`, transitions, attribute selectors
- Создан `Icon.tsx` с **36 inline SVG** (ADR-010), zero external dependencies
- **Resizable columns + sidebars** через shared `useColumnResize` hook (D14 — пользовательский запрос). Ширины сохраняются в localStorage
- **Header progress visualization** (прогресс-бар + 3 цветных счётчика mapped/review/conflicts)
- **Inspector** показывает богатую object-info при выборе объекта (структурные counters + placeholder под Sprint 1 mapping data)
- **Wizard step indicators** с зелёными чек-иконками для пройденных шагов
- **Models v2** в backend: `XsdField.namespace`, `XsdComplexType.namespace`, `Project.schema_version`, `mappings: list[dict]` + миграция v1→v2 (готовность к Sprint 2 extensions без новой миграции)
- `scripts/check-env.ps1` — pre-flight проверка окружения, закрывает Q1 + Q9

**Bonus сюрприз:** в Iter 4 случайно отлично сработал паттерн **«candidate list при failed auto-match»** — когда EnterpriseData тип не найден по имени, middle pane показывает все типы того же класса для ручной навигации. Пользователь это особо отметил.

---

## D1–D14 — Выполнение deliverables

Sprint 0.5 промпт Opus'а содержал 14 deliverables (D1–D13 + bonus D14 от владельца).

| ID | Deliverable | Status | Комментарий |
|---|---|---|---|
| D1 | CSS Modules migration | ✓ done | Все 10+ компонентов переписаны. Inline styles остались только для runtime значений (ширина прогресс-бара по %, dynamic flex basis) — это разрешённый паттерн |
| D2 | DESIGN_TOKENS.md | ✓ done | Полный каталог CSS-переменных в `docs/DESIGN_TOKENS.md`. 47 токенов: backgrounds, text, accent, status, radii, shadows, typography |
| D3 | Icon.tsx + 30+ SVG | ✓ done | **36 иконок** (12 metadata types + 6 navigation + 14 actions + 4 status) + 2 helper-функции (`iconNameForObjectType`, `iconNameForEdCategory`). Inline SVG, zero deps (ADR-010) |
| D4 | Header progress visualization | ✓ done | Прогресс-бар 180×6px с заливкой + 3 счётчика с colored dots (зелёный mapped, амбер review, красный conflicts). В Sprint 0.5 значения 0; реальные данные в Sprint 1 |
| D5 | Bottom Dock 4 tabs | ✓ done | Табы Problems / Generated XML / AI Chat / History — каждый с иконкой. **Честные empty states** со ссылкой на Sprint N (антипаттерн mock-данных строго соблюдён) |
| D6 | Inspector 2 states | ✓ done | Default empty state + object-selected state с iконкой типа, synonym, structure counters (Реквизиты/ТЧ/Поля ТЧ/Значения в Enum), placeholder под Sprint 1 mapping section, placeholder под Sprint 3 handlers |
| D7 | Hover/active/focus states | ✓ done | Реализовано через CSS Modules: ProjectCard `translateY(-2px)` + усиление shadow на hover, sidebar items с accent-50 при selected, hover-bg-tint на tree nodes, transition: 100-120ms ease везде |
| D8 | `data-mapping-anchor-id` на tree leaves | ✓ done | Реализовано в Iter 2 при переписывании TreeView. Format: `<side>:<objectName>.<fieldPath>`. **Контракт зафиксирован, не меняем в Sprint 1+** |
| D9 | Schema versioning + migration v1→v2 | ✓ done | `Project.schema_version: int = 2`, `migrate_project_dict()` идемпотентная, **6 unit-тестов** (round-trip, идемпотентность, переименование `namespace`→`primary_namespace`). pytest: 30 → 36 passed |
| D10 | check-env.ps1 + .sh | ✓ done | Проверяет node, npm, python ≥3.11, rustc, cargo, link.exe (через VsDevCmd discovery), git, backend venv, node_modules, sidecar placeholder. Точные remediation hints на каждый fail. **Не устанавливает** — только проверяет (по требованию Opus). Закрывает Q1 + Q9 |
| D11 | Docs update | ✓ done | README quick start обновлён через `check-env.ps1`. ADR-009 (CSS Modules), ADR-010 (inline SVG). DESIGN_TOKENS.md создан в Iter 2. Этот SPRINT_05_REPORT |
| D12 | schema_version (часть D9) | ✓ done | Объединено с D9 |
| D13 | DESIGN_TOKENS.md (часть D2) | ✓ done | Объединено с D2 |
| **D14** | **Resizable columns + sidebars** | ✓ done | **Bonus** — пользовательский запрос. MappingArea колонки + ObjectsSidebar + Inspector — все resizable через ЛКМ-drag границ. Единый hook `useColumnResize` с localStorage persistence. Min/max ограничения предотвращают коллапс |

**Sprint 0.5 итог: 14/14 done.**

---

## Принятые архитектурные решения

Полный текст в [DECISIONS.md](DECISIONS.md).

| ADR | Дата | Краткое решение |
|---|---|---|
| **ADR-009** | 2026-05-17 | Стилизация: CSS Modules + CSS-переменные из `konvey-design.css`. Никаких UI-фреймворков (Tailwind/styled-components/etc) |
| **ADR-010** | 2026-05-17 | Иконки: inline SVG в `Icon.tsx`. Никаких lucide-react / react-icons / heroicons-react |

Всего в DECISIONS.md теперь **10 ADR** (ADR-001 до ADR-010).

---

## Бонус-фичи (не было в плане Opus, но добавлены)

| # | Что | Когда | Зачем |
|---|---|---|---|
| 1 | **Resizable columns** в MappingArea | Iter 2 (раннее, перед запросом) | DOM нужен под Sprint 1 SVG-anchors |
| 2 | **Resizable sidebars** | Iter 3 | Пользователь явно попросил |
| 3 | **`useColumnResize` hook** — общий | Iter 3 | DRY между MappingArea и sidebars |
| 4 | **ED candidate list при failed auto-match** | Iter 2 (вместе с visual fix) | UX: real УП-конфигурация не матчится по имени, и пустая колонка была неинформативна |
| 5 | **Search icon в Sidebar input** | Iter 3 | Полировка под мокап Claude Design |
| 6 | **Inferred icons на leaf TreeView nodes** | Iter 3 | Type-based visual cue (`CatalogRef.*` → 📒 catalog icon) |
| 7 | **Wizard step checks** (зелёные галочки для пройденных) | Iter 4 | Полировка под мокап |
| 8 | **Inspector с богатым object-state** (4 counter-cells + sections) | Iter 4 | Иначе Inspector выглядит пустым весь Sprint 0.5 |

---

## Метрики

```
Commits в Sprint 0.5: 8 (от 7131f87 до ff7331f)
Files changed: 25
LOC added/removed: +2863 / -582 (net +2281)

Tests:
  Python pytest: 36 passed (30 → 36, +6 migration tests)
  TS vitest: 4 passed (без изменений в Sprint 0.5)

Файлы новые:
  src/components/icons/Icon.tsx            (397 LOC)
  src/components/icons/index.ts            (2 LOC)
  src/components/Workspace/useColumnResize.ts (78 LOC)
  src/components/Workspace/HeaderProgress.tsx (47 LOC)
  src/App.module.css                       (4 LOC)
  src/components/ProjectPicker/*.module.css (~80 LOC)
  src/components/Wizard/Wizard.module.css   (181 LOC)
  src/components/Workspace/Workspace.module.css (~340 LOC)
  backend/tests/test_migration_v1_to_v2.py  (76 LOC)
  scripts/check-env.ps1, check-env.sh       (~210 LOC)
  docs/DESIGN_TOKENS.md                     (~160 LOC)
  docs/SPRINT_05_REPORT.md                  (этот файл)

Файлы изменены значительно:
  src/components/ProjectPicker/{ProjectPicker,ProjectCard}.tsx — на CSS Modules
  src/components/Wizard/{Wizard,Step1-4}.tsx                   — на CSS Modules
  src/components/Workspace/{Workspace,Inspector,MappingArea,ObjectsSidebar,TreeView}.tsx — на CSS Modules + icons + resize
  src/App.tsx
  backend/src/konvey_backend/models/{enterprise_data,project}.py — namespace fields + schema_version
  backend/src/konvey_backend/storage/project_storage.py — migrate_project_dict()
```

---

## Тестовое покрытие

```
============================= test session starts =============================
platform win32 -- Python 3.11.0, pytest-9.0.3, pluggy-1.6.0
collected 36 items

tests/test_config_parser.py ........                                     [ 22%]
tests/test_migration_v1_to_v2.py ......                                  [ 38%]
tests/test_project_storage.py .......                                    [ 58%]
tests/test_rpc.py ........                                               [ 80%]
tests/test_xsd_parser.py .......                                         [100%]

============================== 36 passed in 0.33s ==============================
```

Новые тесты в Iter 1 — все 6 migration-тестов:
- `test_migrate_adds_schema_version`
- `test_migrate_adds_mappings`
- `test_migrate_renames_namespace_to_primary_namespace`
- `test_migrated_dict_validates_as_project`
- `test_migrate_idempotent_on_v2`
- `test_migrate_idempotent_on_current_version`

Smoke на реальном `EnterpriseData_1_8_6.xsd` (920 KB) продолжает работать.

---

## Что готово для Sprint 1

✅ **DOM-контракт зафиксирован.** Sprint 1 может полагаться на:
- `data-mapping-anchor-id="<side>:<object>.<field>"` на каждом leaf node TreeView
- `data-field-type` на каждом leaf — для CSS-стилизации по типам
- CSS-переменные `--k-green`, `--k-amber`, `--k-red` готовы для mapping line colors

✅ **Schema v2 готова.** `mappings: list[dict]` в Project — placeholder под Sprint 1 `list[ObjectMapping]`. Миграция не понадобится.

✅ **Namespace поля в моделях.** `XsdField.namespace` / `XsdComplexType.namespace` / `EnterpriseDataSchema.extension_namespaces` — закладка под Sprint 2 `ext1:*` extensions.

✅ **Icon API готов.** Любой Sprint 1 UI элемент использует `<Icon name="..." size={...} />`. Если потребуется новая иконка — добавить в `IconName` union и `ICON_DEFS`.

✅ **Resizable layout.** Sprint 1 SVG mapping overlay должен учитывать что колонки меняют размер; `useColumnResize` уже работает с `ResizeObserver`-совместимым подходом.

✅ **Inspector context structure.** В Sprint 1 добавить новые секции (mapping details, Approve/Reject buttons) — CSS уже готов (`.inspectorSection`, `.inspectorFieldRow`, `.inspectorStatBox`).

---

## Что НЕ сделано (намеренно, осталось для Sprint 1)

❌ Mapping engine — auto-mapping по именам, composite resolution, FieldMapping/ObjectMapping модели
❌ SVG overlay для линий маппинга между деревьями
❌ Drag-and-drop полей между колонками
❌ LLM-интеграция (Sprint 2)
❌ BSL генератор (Sprint 3)
❌ Validation против XSD-схемы (Sprint 2)
❌ Multi-namespace XSD parsing (Sprint 2)
❌ Расширение xsd_parser до 16+ категорий (Sprint 1)

---

## Известные ограничения и долг

1. **Vitest test coverage слабый** — всего 4 теста на Button. Sprint 1 должен расширить vitest до 15-20 тестов компонентов
2. **CLAUDE.md vs README.md** — частично дублируют setup-инструкции. Это OK для разных аудиторий (CLAUDE.md для AI инстансов, README.md для людей)
3. **Иконки Heroicons-style** — приемлемое качество, но дизайнер может прислать кастомный набор. Замена тривиальна (один файл `Icon.tsx`)
4. **Tooltips** — пока через `title` attribute (нативный browser). Если дизайн потребует custom tooltips — Sprint 2

---

## Открытые вопросы (новые в Sprint 0.5)

См. также [QUESTIONS.md](QUESTIONS.md). Новые добавления:

**Q13.** Учебная база УЦ№1 — Opus в плане Sprint 1 ожидает выгрузку. Владелец сказал «3-5 дней». До получения integration test остаётся под `@pytest.mark.skip`. Это уточнение к Q10.

**Q14.** Sprint 1 будет использовать **SVG overlay поверх трёх tree-панелей** для рисования mapping линий. Текущая структура DOM (panes с indивидуальным scroll) усложняет позиционирование anchor'ов при scroll событиях. Подход: `ResizeObserver` + `scroll` listener на каждой панели, debounced `requestAnimationFrame`. Это в плане Opus, но стоит подтвердить что подход остаётся.

**Q15.** Resizable sidebars и columns сохраняют ширины в **localStorage**, не в Project JSON. Это означает: разные машины с тем же проектом будут иметь разные layout. Sprint 1 решает — оставляем как machine-local preference, или переносим в Project (тогда нужно sync через backend)?

---

## Финальная самооценка

**Что получилось хорошо:**
- 8 commits в Sprint 0.5 (равномерные, conventional commits — каждая фаза = 1-2 commit'а)
- Все 14 deliverables done, плюс **8 bonus features** включая мелочи UX
- Sprint 0 → Sprint 0.5 переход прошёл без regressions: все 30 тестов Sprint 0 продолжают работать + 6 новых
- ADR-формат соблюдён, 2 новых ADR (009, 010) с реальным обоснованием

**Что можно было лучше:**
- Vitest покрытие осталось на уровне Sprint 0 (4 теста). Стоило добавить хотя бы snapshot-тесты на ключевые компоненты (Workspace, ObjectsSidebar)
- Поздняя реакция на UX-bug «лупа накладывается на placeholder» — должен был заметить при первичной интеграции иконок (Iter 3), а не после feedback'а в Iter 4
- Не сделал кеширование parsed XSD/Configuration на disk-side: при каждом open проекта парсится снова. Это вопрос производительности, актуально для крупных конфигураций (ERP — 50K+ объектов). Отложено в Sprint 2 (Q16 ниже не добавлял, упомянул здесь)

**Самая большая риск-точка к Sprint 1:** **SVG mapping overlay**. Если будет лагать на 200+ маппингах в реальной УП-базе — придётся переоптимизировать (Canvas вместо SVG, viewport culling, debouncing). Не блокер, но потенциальная подзадача.

---

## Контрольные команды для владельца

После `git pull` всё должно работать без дополнительных шагов:

```powershell
# Smoke check
cd C:\BUFFER\Konvey
.\scripts\check-env.ps1
# Должно быть всё OK

# Run tests
cd backend
.\.venv\Scripts\python.exe -m pytest tests/ -v
# Должно быть 36 passed

cd ..
npm test
# Должно быть 4 passed

# Dev run
.\scripts\dev.ps1
# Окно откроется, Vite HMR подхватит код
```

В окне:
- **Project Picker** — увидишь свои проекты с прогресс-барами
- **Wizard** — нажми «+ Новый проект», заметь зелёные галочки для пройденных шагов
- **Workspace** — header с прогресс-баром и цветными счётчиками, sidebar с иконками типов, кликни на объект — Inspector справа покажет структуру
- **Граница sidebar и колонок** — drag ЛКМ для ресайза
