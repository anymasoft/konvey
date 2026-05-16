# Открытые вопросы для архитектора

Накопленные неясности из Sprint 0. Каждый вопрос пронумерован для ссылок из кода (`# TODO: see QUESTIONS.md#NN`).

---

## Q1. Установка Rust toolchain на машине разработки

**Контекст:** На машине разработки установлен `rustup`, но без default toolchain (`rustup default stable` не выполнен). Tauri требует стабильного Rust для сборки.

**Текущий workaround:** Sprint 0 скелет создан без реальной сборки Tauri (только конфигурационные файлы). Владельцу нужно выполнить `rustup default stable` перед первой попыткой `npm run tauri dev`.

**Вопрос архитектору:** Это нормальный путь? Или закладываем bootstrap-скрипт, который проверяет окружение?

---

## Q2. pnpm vs npm

**Контекст:** Промпт указывает `pnpm`, но pnpm не установлен. Sprint 0 использует npm (см. ADR-006).

**Вопрос:** Переходим на pnpm на Sprint 1, или остаёмся на npm? Если pnpm — кто и когда устанавливает (документация в SETUP.md, разовая инструкция в README)?

---

## Q3. Tauri Sidecar в dev-режиме — `RULESGEN_SIDECAR_MODE=dev`

**Контекст:** Промпт упоминает переменную окружения для dev-режима sidecar (запуск Python напрямую из .venv вместо PyInstaller exe).

**Текущая реализация:** В `src-tauri/src/sidecar.rs` читается `KONVEY_SIDECAR_MODE`. Если `dev` — запускает `python -m konvey_backend`. Если не задано или `prod` — запускает упакованный exe.

**Вопрос:** Корректно ли назвать переменную `KONVEY_SIDECAR_MODE` (мы переименовали проект)? Это финальное имя?

---

## Q4. Категоризация типов EnterpriseData по имени

**Контекст:** В XSD EnterpriseData типы называются `Документ.РеализацияТоваровУслуг`, `Справочник.Контрагенты`, и т.д. Я делаю эвристику: prefix → category (`Документ.*` → `document`, `Справочник.*` → `catalog`).

**Реальная картина в XSD 1.8.6:** есть `КлючевыеСвойстваКонтрагент`, `СоставныеТипы.*`, `Перечисление.*` — нужна полная карта префиксов.

**Текущая реализация:** В `parsers/xsd_parser.py` есть мапа `RUSSIAN_PREFIX_TO_CATEGORY` с базовыми префиксами + fallback `other`.

**Вопрос:** Нужна ли в Sprint 1 более глубокая категоризация (например, `composite_key` для `КлючевыеСвойства*`, `tabular_section` для `*.Строка`)?

---

## Q5. Реальная мини-выгрузка 1С для тестов config_parser

**Контекст:** Парсер конфигурации в `parsers/config_parser.py` нуждается в реальной мини-выгрузке для интеграционного теста. На текущий момент у меня нет под рукой настоящей выгрузки.

**Текущий workaround:** Создал синтетическую fixture в `backend/tests/fixtures/sample_configuration/` с минимальной структурой: Configuration.xml + 1 Catalog + 1 Document + 1 Enum. Тесты проходят на этой fixture.

**Вопрос владельцу:** Можешь приложить мини-выгрузку какой-нибудь учебной 1С-базы (5-10 объектов)? Положим в `backend/tests/fixtures/real_sample_configuration/` и сделаем дополнительный integration test.

---

## Q6. Лицензия проекта

**Контекст:** В промпте указан MIT. Установлен MIT с правообладателем «Сергей <владелец проекта>».

**Вопрос:** Точная формулировка copyright holder для production-релиза? Имя компании / ИП / физ.лица?

---

## Q7. Стилизация и тёмная тема

**Контекст:** В Sprint 0 я подключил готовые стили из `examples/design/konvey-design.css` (от Claude Design) в `src/styles/global.css`. Это светлая тема Konvey (IBM Plex Sans/Mono, CSS-переменные `--k-*`).

**Жёсткое правило владельца:** никаких тёмных тем. В Settings соответствующий тоggle отсутствует.

**Вопрос:** В каком виде дизайнер передаст финальный design system? Будут ли стили отличаться от того, что в `konvey-design.css`?

---

## Q9. MSVC Build Tools — обнаружено при первой попытке запуска

**Контекст:** Tauri 2 на Windows требует MSVC linker (`link.exe`), который входит в workload «Desktop development with C++» Visual Studio. На машине разработки была установлена VS 2022 Community **без** этого workload — `cargo build` упал с `error: linker 'link.exe' not found`.

**Найденное решение:** установка C++ workload через `vs_installer modify --add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended` (~3-7 GB, 10-20 мин).

**Что не сделано в Sprint 0:** не было автоматизированного pre-flight чека окружения. Sprint 0 SETUP.md просто пишет "Rust toolchain", но не проверяет наличие C++ tools.

**Вопрос архитектору:** в Sprint 1 добавить `scripts/check-env.ps1`, который перед `npm run tauri dev` проверяет:
- `rustc --version`
- `link.exe` доступен в PATH
- `node --version`, `npm --version`
- Python venv существует в `backend/.venv/`

И даёт чёткое сообщение «установите вот это» при сбое любой проверки.

---

## Q13. Учебная база УЦ№1 — статус ожидания

**Контекст:** Opus в Sprint 1 plan ожидает мини-выгрузку из учебной 1С-базы УЦ№1 (УТ + БП) для integration теста auto-mapper'а. Владелец сказал «3-5 дней».

**Текущее состояние:** integration test `test_auto_mapper_integration_uchebnaya.py` будет создан в Sprint 1 с `@pytest.mark.skip("waits for owner's fixture")` до получения базы.

**Вопрос:** ничего блокирующего сейчас. Когда база появится — положу в `backend/tests/fixtures/uchebnaya_ut/` и `uchebnaya_bp/`, сниму skip.

---

## Q14. SVG mapping overlay — подход к синхронизации позиций

**Контекст:** Sprint 1 plan от Opus предлагает SVG-overlay поверх трёх tree-pane для линий маппинга. Линии должны переcчитываться при:
- resize окна
- resize колонок (drag dividers)
- scroll внутри каждой панели
- expand/collapse групп в TreeView
- toggle Inspector collapse

**Текущая идея:** `ResizeObserver` на корне MappingArea + scroll listener на каждой панели + `requestAnimationFrame` для batching. Каждый leaf node имеет `data-mapping-anchor-id`, ищем через `document.querySelector('[data-mapping-anchor-id="..."]').getBoundingClientRect()`.

**Concern:** при 200+ маппингах на крупной УП-конфигурации перерасчёт линий каждый scroll может тормозить. Заранее оптимизация (Canvas вместо SVG, viewport culling) — над/недо? Опыт react-flow подсказывает что SVG 200 элементов — OK. Но если есть сомнения — стоит обсудить.

**Вопрос архитектору:** подтверди подход или предложи альтернативу.

---

## Q15. Resizable widths — где хранить (machine-local vs Project-level)

**Контекст:** Sprint 0.5 D14 реализован: ширины колонок и сайдбаров сохраняются в **`localStorage`** (machine-local). При синхронизации проекта через git между двумя машинами — каждая машина будет иметь свой layout.

**Альтернатива:** хранить widths в `Project.ui_preferences` field, sync через backend save_project.

**Pros локально (текущий выбор):**
- Каждый пользователь привыкает к своему layout, не мешает другому
- Не загрязняет project JSON (UI state vs project data разнесены)

**Pros в Project:**
- "Открыл проект на новой машине — увидел тот же layout"
- Может быть важно если widths становятся "design-level" (Sprint 2+ — например, у объекта `Document.X` пользователь предпочитает 50% width для middle pane)

**Вопрос:** оставляем как есть в Sprint 1 (localStorage) или мигрируем в Project? Если в Project — миграция v2→v3.

---

## Q8. Anthropic API key — где хранить

**Контекст:** Sprint 0 не интегрирует Anthropic API. Но архитектурно — где хранить API key пользователя на disk? Plain text JSON в %APPDATA% — небезопасно.

**Варианты для Sprint 2:**
- Windows Credential Manager (через `keyring` Python библиотеку)
- DPAPI encryption
- Plain text + предупреждение пользователю

**Вопрос:** Какой паттерн использовать в Sprint 2, когда API key потребуется?
