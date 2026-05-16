# Handover to Claude Opus 4.7 — Sprint 0 завершён

> **Этот документ — готовая копипаста для передачи архитектору (Claude Opus 4.7).** Открой новую сессию с Opus, скопируй текст ниже целиком в первое сообщение.

---

## Сообщение для Opus

```
Привет! Sprint 0 проекта Konvey (бывший RulesGen в твоём промпте, переименован
по решению владельца — см. ADR-005) завершён.

GitHub: https://github.com/anymasoft/konvey
Ветка: main
Visibility: Public — читай через raw.githubusercontent.com без коннекторов

Ключевые URL для тебя:
- Отчёт Sprint 0: https://raw.githubusercontent.com/anymasoft/konvey/main/docs/SPRINT_0_REPORT.md
- ADR-записи:      https://raw.githubusercontent.com/anymasoft/konvey/main/docs/DECISIONS.md
- Вопросы:         https://raw.githubusercontent.com/anymasoft/konvey/main/docs/QUESTIONS.md
- README:          https://raw.githubusercontent.com/anymasoft/konvey/main/README.md
- Process doc:     https://raw.githubusercontent.com/anymasoft/konvey/main/docs/PROCESS.md
- KD 3.1 справка:  https://raw.githubusercontent.com/anymasoft/konvey/main/docs/REFERENCE_TOPICS.md

Ключевые исходники для просмотра:
- backend/src/konvey_backend/parsers/xsd_parser.py     (parser EnterpriseData XSD)
- backend/src/konvey_backend/parsers/config_parser.py  (parser 1C XML dump)
- backend/src/konvey_backend/storage/project_storage.py (JSON file persistence)
- backend/src/konvey_backend/rpc.py                    (JSON-RPC 2.0 over stdio)
- backend/src/konvey_backend/__main__.py               (sidecar entry point)
- src-tauri/src/lib.rs                                 (Tauri commands)
- src-tauri/src/sidecar.rs                             (Python process lifecycle)
- src/App.tsx + src/components/{ProjectPicker,Wizard,Workspace}
- src/api/backend.ts                                   (typed wrapper Tauri→Python)

Что точно работает (проверено end-to-end):
✅ Python backend: 30/30 pytest PASSED, включая smoke на реальном XSD 1.8.6 (920 KB)
✅ Frontend tests: 4/4 vitest PASSED
✅ Vite dev server поднимается на :5173
✅ GitHub repo создан, код запушен, public

Что НЕ удалось проверить в этой итерации:
❌ Полный tauri dev (vertical slice TS↔Rust↔Python) — упало на стадии cargo build
   с ошибкой "error: linker 'link.exe' not found"
   Причина: на машине разработки установлена VS 2022 Community, но без workload
   "Desktop development with C++" (нет MSVC linker). Это известная острая точка
   Tauri на Windows. См. Q9 в QUESTIONS.md — записал как опыт для Sprint 1.
   Решение: ставится standalone vs_BuildTools.exe с компонентом VCTools.

Принятые решения (полный текст в DECISIONS.md):
- ADR-001: стек Tauri 2 + React/TS + Python sidecar
- ADR-002: persistence как JSON-файлы
- ADR-003: JSON-RPC over stdio (Rust ↔ Python)
- ADR-004: единый Project Pydantic model
- ADR-005: имя Konvey (не RulesGen)
- ADR-006: npm (не pnpm) для Sprint 0

Открытые вопросы для тебя (9 штук в QUESTIONS.md):
- Q1: Rust toolchain — установлен
- Q2: pnpm vs npm — пока npm
- Q3: env-var KONVEY_SIDECAR_MODE — подтверди имя
- Q4: глубокая категоризация Russian-prefix → category в XSD
- Q5: реальная мини-выгрузка 1С для integration теста (опционально)
- Q6: точная формулировка copyright holder
- Q7: финальный design system от дизайнера
- Q8: Anthropic API key storage strategy
- Q9: pre-flight check скрипт (для Sprint 1)

Что ждём от тебя:
1. Ответы на 9 открытых вопросов
2. План Sprint 1: что включать?
   - Mapping engine (drag-and-drop линий между деревьями)?
   - Auto-mapping по имени реквизита (без LLM)?
   - Right Inspector с контекстом по выбранному маппингу?
   - Сохранение mappings в Project JSON?
3. Приоритет тестового кейса: УТ↔БП vs ERP↔БП vs что-то иное?

Структура репозитория (для контекста):
- docs/                  — 6 .md документов (PROCESS, DECISIONS, QUESTIONS, REFERENCE_TOPICS, GITHUB_SETUP, SPRINT_0_REPORT)
- src-tauri/             — Rust shell (Cargo.toml, main.rs, lib.rs, sidecar.rs)
- src/                   — React frontend (components, stores, types, api)
- backend/               — Python sidecar (models, parsers, storage, rpc, tests)
- scripts/               — build-sidecar.ps1, dev.ps1
- examples/design/       — assets от Claude Design (CSS, JSX, mockup HTML)
- examples/bsl/          — 9.7 MB пример БSL модуля МенеджерОбменаЧерезУниверсальныйФормат
                            (это reference data того, что мы будем генерировать)

Метрики Sprint 0:
- 91 файл в репо
- Python: ~1200 LOC, тесты: ~430 LOC
- TS/TSX: ~2000 LOC
- Rust: ~250 LOC
- 7 git commits (conventional commits)

Технологический стек (зафиксирован):
- Tauri 2 + WebView2
- React 18 + TypeScript 5 + Vite + Zustand
- Python 3.11 + lxml + Pydantic v2 (sidecar)
- JSON-RPC 2.0 over stdio (Rust ↔ Python)
- JSON files в %APPDATA%\Konvey\Projects\ (без SQLite)

Полный отчёт читай через:
https://raw.githubusercontent.com/anymasoft/konvey/main/docs/SPRINT_0_REPORT.md

Готов к Sprint 1 после твоего разбора.
```

---

## Что сделать владельцу

1. Открыть https://claude.ai/new (новая сессия)
2. Выбрать модель Claude Opus 4.7 Adaptive
3. Вставить **весь блок выше** (от "Привет!" до "Готов к Sprint 1 после твоего разбора.") как первое сообщение
4. Подождать пока Opus прочитает все URLs через `raw.githubusercontent.com` и ответит
5. Передать ответ обратно сюда — переходим к Sprint 1

## Альтернативная подача (если у Opus возникнут проблемы с raw URL)

В крайнем случае, если Opus не сможет читать raw.githubusercontent.com, скопируй ему текст SPRINT_0_REPORT.md, DECISIONS.md и QUESTIONS.md прямо в чат. Все три файла короче 30 KB вместе — войдёт в одно сообщение.
