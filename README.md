# Konvey

AI-генератор правил обмена данными между конфигурациями 1С:Предприятие 8.3 через стандарт **EnterpriseData** (КД 3.1).

> Status: **Sprint 0 — skeleton scaffold**, не production-ready. См. [docs/SPRINT_0_REPORT.md](docs/SPRINT_0_REPORT.md).

## Что это

Konvey — desktop-приложение, которое генерирует **черновики BSL-модулей правил обмена** между двумя 1С-конфигурациями. На вход — XSD EnterpriseData + две выгрузки XML конфигураций; на выход — два BSL-модуля «МенеджерОбменаЧерезУниверсальныйФормат» (по одному на каждую сторону обмена), которые пользователь дорабатывает в КД 3.1.

Это не замена КД 3, а **ускоритель первого черновика**. Целевая аудитория — 1С-интеграторы и разработчики обменов.

```
КОНФИГУРАЦИЯ-ИСТОЧНИК → [правила выгрузки] → EnterpriseData XML → [правила загрузки] → КОНФИГУРАЦИЯ-ПРИЁМНИК
                            ↑                                            ↑
                            └── Konvey генерирует черновик ──────────────┘
```

## Технологический стек

- **Desktop shell:** [Tauri 2](https://tauri.app) (Rust + WebView2 на Windows)
- **Frontend:** React 18 + TypeScript 5 + Vite + CSS Modules
- **Backend (sidecar):** Python 3.11 + lxml + Pydantic v2, упаковка через PyInstaller
- **Связь:** Tauri commands (TS↔Rust) + JSON-RPC over stdio (Rust↔Python)
- **State management:** Zustand
- **Persistence:** JSON-файлы проектов в `%APPDATA%\Konvey\Projects\`

Подробное обоснование — [docs/DECISIONS.md](docs/DECISIONS.md) (ADR-001).

## Quick start (для разработчика)

### Требования

- Windows 10/11
- Node.js 20+
- Python 3.11+
- Rust toolchain (`rustup default stable`)
- git

### Установка

```powershell
git clone https://github.com/<USER>/konvey.git
cd konvey

# Backend (Python sidecar)
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .[dev]
cd ..

# Frontend
npm install
```

### Dev-режим

```powershell
.\scripts\dev.ps1
```

Под капотом запускается `npm run tauri dev` — Tauri откроет окно с React-приложением, Python sidecar запустится через переменную `KONVEY_SIDECAR_MODE=dev`.

### Production-сборка

```powershell
# Сначала упаковать Python sidecar
.\scripts\build-sidecar.ps1

# Потом собрать Tauri
npm run tauri build
```

Результат: `.msi`-установщик в `src-tauri/target/release/bundle/msi/`.

### Тесты

```powershell
# Python
cd backend
.\.venv\Scripts\python.exe -m pytest

# Frontend
npm test
```

## Структура репозитория

```
konvey/
├── docs/                 # PROCESS, DECISIONS, QUESTIONS, REFERENCE_TOPICS, SPRINT_N_REPORT
├── src-tauri/            # Tauri (Rust) shell
├── src/                  # Frontend (React + TypeScript)
├── backend/              # Python sidecar (парсеры, генератор, RPC)
├── scripts/              # Build и dev скрипты
├── examples/             # Design assets, эталонные BSL модули
└── .vscode/              # IDE settings
```

## Архитектурные решения

Все принятые решения зафиксированы в [docs/DECISIONS.md](docs/DECISIONS.md) (формат ADR).

Ключевые:
- **ADR-001:** Tauri + React + Python sidecar (не Electron, не чистый Rust)
- **ADR-002:** JSON-файлы для persistence (не SQLite)
- **ADR-003:** JSON-RPC over stdio (не HTTP)
- **ADR-005:** Имя проекта — Konvey (не RulesGen)

## Процесс разработки

См. [docs/PROCESS.md](docs/PROCESS.md). Роли:
- **Архитектор** — Claude Opus 4.7 (отдельная сессия)
- **Исполнитель** — Claude Code
- **Владелец** — человек, принимает решения, тестирует, передаёт информацию

Цикл: промпт → реализация → SPRINT_N_REPORT.md → следующий промпт.

## License

MIT — см. [LICENSE](LICENSE).
