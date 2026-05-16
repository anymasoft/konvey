# Architecture Decision Records — Konvey

Принятые архитектурные решения проекта. Формат описан в [PROCESS.md](PROCESS.md#adr-architecture-decision-records).

---

## ADR-001: Выбор технологического стека (Tauri 2 + React/TS + Python sidecar)

**Дата:** 2026-05-16
**Статус:** accepted

**Контекст:**
Konvey — desktop-приложение для генерации правил обмена 1С КД 3.1. Требования:
- Один установщик, ноль зависимостей у пользователя (`.msi` для Windows)
- Frontend — современный реактивный UI (деревья метаданных, линии маппинга, drag-and-drop в Sprint 1+)
- Backend — парсинг XSD-схем EnterpriseData (~700 типов), парсинг XML-выгрузок 1С (тысячи объектов), генерация BSL-кода
- Интеграция с Anthropic API для AI-маппинга (Sprint 2+)
- Дистрибуция в РФ — Anthropic API недоступен напрямую, будет проксироваться через VPS вне РФ (Sprint позже)

Рассмотренные альтернативы:

1. **Чистый Rust backend (Tauri + Rust)** — отвергнут: парсинг XSD/XML лучше всего в Python через lxml, перевод в Rust удвоил бы сложность Sprint 0; зрелый Anthropic SDK существует на Python
2. **Electron** — отвергнут: размер бандла 100-150 МБ vs ~70 МБ у Tauri; больше memory footprint
3. **PyWebView** — отвергнут: хрупкая дистрибуция, проблемы с native dialogs на Windows, опыт с Agenter показал лимиты

**Решение:**
- **Desktop shell:** Tauri 2.0 (использует системный WebView2 на Windows)
- **Frontend:** React 18 + TypeScript 5 + Vite + CSS Modules (без Tailwind — у владельца своя цветовая система из Agenter)
- **Backend:** Python 3.11 sidecar, упакованный через PyInstaller (single exe ~40-60 МБ)
- **Связь Frontend↔Backend:** Tauri commands (TS↔Rust) + JSON-RPC over stdio между Rust и Python sidecar
- **State management (frontend):** Zustand
- **Persistence:** JSON-файлы проектов в `%APPDATA%\Konvey\Projects\`
- **XML/XSD parsing (Python):** lxml
- **Type safety (Python):** Pydantic v2

**Последствия:**
- Финальный установщик ~70 МБ, zero-deps для пользователя
- Сложность Sprint 0: настройка Tauri Sidecar + PyInstaller IPC — известная острая точка, может потребовать workaround'ов
- При необходимости можно поэтапно мигрировать parser на Rust в будущем (когда продукт стабилизируется)

---

## ADR-002: Persistence как JSON-файлы проектов (не SQLite)

**Дата:** 2026-05-16
**Статус:** accepted

**Контекст:**
Проекты Konvey — это структуры данных среднего размера (метаданные двух конфигураций + маппинги + handlers, ~1-10 МБ JSON). Нужно хранить, версионировать, экспортировать/импортировать.

**Решение:**
Каждый проект — один JSON-файл `<project-id>.json` в `%APPDATA%\Konvey\Projects\`. Без SQLite, без БД.

**Обоснование:**
- Git-friendly: можно положить проект в репо команды, diff'ить, merge'ить
- Простой формат для импорта/экспорта между машинами
- Не нужны миграции схемы БД при изменении структуры (плюс перед бета-релизом)
- При увеличении размера проекта (>50 МБ) можно перейти на split-файлы или SQLite — но это не текущая проблема

**Последствия:**
- Загрузка проекта при открытии — потенциально медленная для крупных проектов (но загружается раз в сессию)
- Auto-save должен быть продуман: full rewrite файла при каждом save, либо append-only WAL (Sprint позже)
- Один проект = один файл — простая mental model

---

## ADR-003: JSON-RPC over stdio для связи Rust↔Python

**Дата:** 2026-05-16
**Статус:** accepted

**Контекст:**
Tauri Sidecar — это процесс, который запускается Rust-частью Tauri и общается через stdin/stdout. Нужно выбрать протокол общения.

Варианты:
1. **HTTP-сервер в Python (FastAPI / Flask) + HTTP-клиент в Rust** — отвергнут: проблемы с портами, firewall, медленнее, лишний слой
2. **gRPC через Unix sockets / Named Pipes** — отвергнут: сложность настройки на Windows, лишние зависимости
3. **Простой JSON-RPC 2.0 через stdin/stdout** — выбран

**Решение:**
JSON-RPC 2.0 минималистичный — реализуем сами в `backend/src/konvey_backend/rpc.py`. Каждый запрос/ответ — одна JSON-строка с newline-разделителем.

**Последствия:**
- Простая отладка (видно входы/выходы в текстовом виде)
- Нет проблем с network/firewall
- stderr — для логов sidecar (не путать со stdout, где идут ответы RPC)
- Ограничение: размер одного сообщения — практически до десятков МБ (читать построчно — OK для нашего случая)

---

## ADR-004: Внутренняя модель проекта — единый Pydantic-объект Project

**Дата:** 2026-05-16
**Статус:** accepted

**Контекст:**
Нужно структурировать данные проекта Konvey. Варианты: разделить на несколько связанных JSON-файлов (manifest + configs + mappings) или хранить всё в одном объекте.

**Решение:**
Единая Pydantic-модель `Project` со всей структурой:

```python
class Project(BaseModel):
    id: str  # UUID4
    name: str
    description: str | None
    enterprise_data: EnterpriseDataSchema  # парсенная XSD
    source_configuration: Configuration    # парсенная исходная (с метаданными)
    target_configuration: Configuration    # парсенная приёмник
    selected_objects: list[str]            # "Document.Реализация", "Catalog.Контрагенты"
    # Sprint 1+:
    # mappings: list[Mapping] = []
    # handlers: dict[str, str] = {}
    created_at: datetime
    updated_at: datetime
```

Сериализация — один JSON-файл на проект.

**Последствия:**
- При open проекта парсинг XSD/Configuration не повторяется (он уже распарсен и закэширован в JSON проекта)
- Размер JSON — десятки МБ (XSD парсится в ~5 МБ структуры, Configuration — несколько МБ). Допустимо для текущей фазы.
- При смене версии XSD или re-dump конфигурации — соответствующее поле проекта обновляется.

---

## ADR-005: Имя проекта — Konvey (не RulesGen из промпта Opus)

**Дата:** 2026-05-16
**Статус:** accepted

**Контекст:**
Промпт от архитектора (Claude Opus) использует временное имя `RulesGen`. Параллельно владелец выбрал бренд **Konvey** и купил домен `konvey.pro`.

**Решение:**
Использую `Konvey` во всех именах файлов, namespace, идентификаторах:
- Папка backend-пакета: `konvey_backend`
- Tauri app identifier: `pro.konvey.app`
- Windows AppData: `%APPDATA%\Konvey\`
- Tauri Sidecar binary: `konvey-backend-<target>.exe`

**Последствия:**
- При референсах на промпт Opus имена различаются — это нормально, ADR фиксирует выбор бренда
- В docs/SPRINT_0_REPORT.md явно указано переименование, чтобы архитектор не подумал, что это ошибка

---

## ADR-006: Package manager — npm (не pnpm) для Sprint 0

**Дата:** 2026-05-16
**Статус:** accepted (может быть superseded если установим pnpm)

**Контекст:**
Промпт Opus указывает `pnpm`. На машине разработки pnpm не установлен, но есть npm (нативно с Node.js).

**Решение:**
Для Sprint 0 — используем npm. Все команды в скриптах и докуменации — `npm install`, `npm run dev`, `npx tauri dev`.

**Последствия:**
- npm работает медленнее pnpm на крупных монорепо, но для нашего размера разница незаметна
- В любой момент можно переключиться на pnpm одной командой (`npm install -g pnpm` + `pnpm import`)
- В Sprint 1+ при желании поднимем `pnpm` (надо будет добавить `pnpm-lock.yaml`)

---

## ADR-007: Vertical Slice верифицирован end-to-end

**Дата:** 2026-05-16
**Статус:** accepted

**Контекст:**
Sprint 0 SPRINT_0_REPORT.md помечал D11 (vertical slice TS↔Rust↔Python) как `⚠ partial` — код написан, но `cargo build` / `npm install` / `npm run tauri dev` ни разу не запускались. Это был наибольший риск Sprint 0.

В ходе разблокировки запуска возникло **5 разовых блокеров**, каждый из которых пофикшен и закоммичен в `main`:

| # | Блокер | Commit с фиксом |
|---|---|---|
| 1 | VS 2022 Community сломана (`vswhere` возвращал `[]`) — продукт не зарегистрирован | (внешняя установка Build Tools 2022) |
| 2 | `link.exe` не в системном PATH (MSVC tools не добавляются автоматически) | `572fa93` — `scripts/msvc-env.ps1` через `VsDevCmd.bat` |
| 3 | Tauri 2 требует existence-check для `externalBin` даже в dev mode | `0d911c0` — `scripts/ensure-sidecar-placeholder.ps1` |
| 4 | Em-dashes (`—`) в .ps1 ломают парсер PowerShell 5.1 на русской Windows (CP-1251) | `2527478` — все скрипты pure ASCII |
| 5 | `icons/icon.ico` отсутствует — `tauri-build` падает | `e8ae39c` — минимальный 16x16 placeholder |
| 6 | Rust `tokio::timeout` tuple — `Some(status)` вместо `Ok(status)` | `768715c` |
| 7 | Tauri 2 требует `src-tauri/capabilities/default.json` для `dialog`/`fs` plugins (file picker не открывался) | `af941bc` |
| 8 | `Command::new("python")` брал system Python без `konvey_backend` (зависание парсинга XSD) | `16b67f5` — использовать `$env:KONVEY_SIDECAR_PYTHON` |

**Результат после фиксов:**
- `.\scripts\dev.ps1` запускает окно Konvey за ~1 минуту (первая сборка cargo)
- Project Picker → Wizard (4 шага) → Workspace с тремя деревьями работает
- Парсинг **реального** `EnterpriseData_1_8_6.xsd` (920 KB, 737 типов) через TS → Rust JSON-RPC → Python lxml → возврат в TS — **подтверждено визуально на скриншотах владельца**
- Парсинг 1C XML configuration dump → Pydantic → UI tree — подтверждено визуально
- Project persists в `%APPDATA%\Konvey\Projects\<uuid>.json` — подтверждено перезапуском приложения
- Python sidecar lifecycle (spawn at start, graceful shutdown via `stdin.shutdown()`) — работает
- File picker (нативный Windows dialog) через Tauri 2 dialog plugin — работает

**Решение:**
D11 Sprint 0 переводится из `⚠ partial` в `✓ done`. ADR-001 (стек Tauri 2 + React/TS + Python sidecar) **подтверждён работоспособностью**, fallback на PyWebView из ADR-001 «Последствия» больше не рассматривается.

**Последствия:**
- Sprint 1 Phase A.2 (запуск tauri dev) — уже сделано, в Sprint 1 plan можно сократить
- Все 8 разовых блокеров задокументированы в SPRINT_0_REPORT.md для будущих разработчиков
- `scripts/setup.ps1` уже есть; в Sprint 1 переименовать в `check-env.ps1` и расширить под требования Opus (Q9)

---

## ADR-008: EnterpriseData extensions (`ext1:*` namespace) — отложено в Sprint 2+

**Дата:** 2026-05-16
**Статус:** accepted

**Контекст:**
Получены официальные документы 1С по расширению формата EnterpriseData (`examples/enterprise_data_docs/04_Rasshirenie_formata_obmena.pdf`). Полное описание механизма — в [REFERENCE_EXT.md](REFERENCE_EXT.md).

Расширения нужны для добавления полей в типовые обмены (1С:ERP, УТ, БП) **без снятия конфигурации с поддержки**. На выходе в XML маркируются как `<ext1:ИмяСвойства>...</ext1:ИмяСвойства>`.

**Решение:**
1. **Sprint 1:** не реализуем расширения, но в модели данных закладываем поля для namespace-aware маппинга:
   - `XsdField.namespace: str | None = None`
   - `FieldMapping.ed_namespace: str | None = None`
2. **Sprint 2:** парсер XSD читает `xs:import`, строит граф пакетов, поддерживает multi-namespace схему. UI отображает расширения с префиксом `ext1:` и иконкой.
3. **Sprint 3:** BSL генератор поддерживает `ИнициализироватьРасширениеПравилаКонвертацииОбъекта` + `ПространствоИмен` параметр в `ДобавитьПКС`.

**Последствия:**
- В Sprint 1 модель Project уже готова к расширениям (миграции не понадобятся в Sprint 2)
- Если в Sprint 1 пользователь попробует загрузить XSD-пакет-расширение — парсер не упадёт, просто проигнорирует `xs:import` и отобразит только содержимое корневого XSD
- ExchangeMessage.xsd (базовая wrapper-схема для всех EnterpriseData пакетов) сохранён в `examples/enterprise_data_docs/` — используется как reference для генерации sample XML обменного сообщения в Sprint 1.5+
