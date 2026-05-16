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

## Q8. Anthropic API key — где хранить

**Контекст:** Sprint 0 не интегрирует Anthropic API. Но архитектурно — где хранить API key пользователя на disk? Plain text JSON в %APPDATA% — небезопасно.

**Варианты для Sprint 2:**
- Windows Credential Manager (через `keyring` Python библиотеку)
- DPAPI encryption
- Plain text + предупреждение пользователю

**Вопрос:** Какой паттерн использовать в Sprint 2, когда API key потребуется?
