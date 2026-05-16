# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Konvey is

Desktop application for generating 1C:Enterprise 8.3 exchange rules in КД 3.1 / EnterpriseData format. User loads an XSD of EnterpriseData + two 1C configuration XML dumps (source + target); Konvey produces draft BSL modules (`МенеджерОбменаЧерезУниверсальныйФормат`) that user finishes in КД 3.1 itself.

Three-process architecture: Tauri 2 Rust shell + React/TS frontend in WebView2 + Python sidecar over JSON-RPC stdio.

## Process and roles

Three-party workflow documented in `docs/PROCESS.md`:

- **Architect** — Claude Opus 4.7 in a separate chat session. Writes sprint prompts. Has no direct repo access; reads via `raw.githubusercontent.com`.
- **Implementer** — Claude Code (you). Receives sprint prompt via the owner, implements, reports.
- **Owner** — human. Tests results, relays information between architect and implementer.

Each sprint produces `docs/SPRINT_N_REPORT.md` and updates `docs/QUESTIONS.md` (numbered Q1, Q2, ...). All architectural decisions go to `docs/DECISIONS.md` as ADR-NNN records.

**Current state:** Sprint 0 closed (vertical slice verified, ADR-007). Sprint 0.5 "Visual Foundation" in progress — Iter 1 (models v2 + check-env) shipped, Iter 2-5 pending.

When starting work, read in order: `docs/SPRINT_0_REPORT.md` → most recent SPRINT_*_REPORT → `docs/DECISIONS.md` → `docs/QUESTIONS.md` → the current sprint's prompt from the owner.

## Common commands

```powershell
# Pre-flight (verify env: rustc, link.exe, node, python venv, etc.)
.\scripts\check-env.ps1

# Dev mode — opens the window, hot-reloads frontend, sidecar from venv
.\scripts\dev.ps1

# Production build (Python -> single exe via PyInstaller, then Tauri .msi)
.\scripts\build-sidecar.ps1
npm run tauri build

# Backend tests (run all)
cd backend
.\.venv\Scripts\python.exe -m pytest -v

# Single backend test
.\.venv\Scripts\python.exe -m pytest tests/test_xsd_parser.py::test_parse_sample_xsd_basic -v

# Frontend tests (Vitest)
npm test

# Single frontend test file
npm test -- src/components/common/Button.test.tsx
```

`dev.ps1` is the canonical entry point: it sources `msvc-env.ps1` (loads VsDevCmd.bat for `link.exe`), runs `ensure-sidecar-placeholder.ps1` (Tauri 2 demands the externalBin path exist even in dev), sets `KONVEY_SIDECAR_MODE=dev` + `KONVEY_SIDECAR_PYTHON=<venv python.exe>` + `KONVEY_BACKEND_DIR`, then `npm run tauri dev`.

## High-level architecture

```
React/TS frontend (WebView2)
  └─ src/api/backend.ts: typed wrapper over Tauri `invoke('call_backend', ...)`
       │
       ▼
Tauri Rust shell (src-tauri/src/)
  ├─ lib.rs: registers Tauri commands `call_backend`, `stop_sidecar`
  └─ sidecar.rs: spawns Python via $KONVEY_SIDECAR_PYTHON, manages stdin/stdout
       │ JSON-RPC 2.0 over stdio (one JSON object per line)
       │ stderr → drained into `log::info!("[sidecar.stderr] ...")`
       ▼
Python sidecar (backend/src/konvey_backend/)
  ├─ __main__.py: starts rpc.serve(), routes by method name
  ├─ rpc.py: minimal JSON-RPC dispatcher (@rpc.method decorator)
  ├─ models/: Pydantic v2 (Project, EnterpriseDataSchema, Configuration)
  ├─ parsers/: lxml-based XSD parser + 1C XML configuration parser
  └─ storage/: JSON files in %APPDATA%\Konvey\Projects\<uuid>.json
```

**Frontend** (`src/`): React 18 + TypeScript + Vite + Zustand. Two stores: `appStore` (screen routing, current project id) and `projectStore` (open project data). Three screens: Project Picker → Wizard (4 steps) → Workspace (3-pane: Source / EnterpriseData / Target).

**Project model** (`backend/src/konvey_backend/models/project.py`): one Pydantic object serialised to a single JSON file. Embeds full parsed `EnterpriseDataSchema` + two `Configuration` objects + `mappings: list[dict]`. `schema_version: int` enables on-load migrations via `storage.migrate_project_dict()`.

**XSD parser** (`parsers/xsd_parser.py`): categorises EnterpriseData types by Russian-prefix heuristic (`Документ.*` → `document`, `Справочник.*` → `catalog`, etc.). Sprint 0.5 has 11 categories; Sprint 1 expands to 16+ (see Opus's Q4 answer in QUESTIONS.md).

**Sprint 1 contract: SVG mapping lines** will be positioned via `document.querySelector('[data-mapping-anchor-id="<side>:<object>.<field>"]')`. Sprint 0.5 must set this attribute on every leaf TreeView node and **must not change the attribute name later**.

## Key conventions and ADRs

Full text in `docs/DECISIONS.md`. The ones that affect almost every PR:

- **ADR-001** — Stack is fixed: Tauri 2 + React/TS + Python sidecar via PyInstaller. PyWebView fallback was a contingency in case Tauri sidecar IPC failed; ADR-007 confirms it works, fallback no longer considered.
- **ADR-002** — Persistence is plain JSON files, one per project, no SQLite. Migrations via `schema_version` field in Project, applied in `storage.migrate_project_dict()` on load.
- **ADR-003** — Rust↔Python IPC is JSON-RPC 2.0 over stdio (one JSON object per line). No HTTP, no sockets. stdout is the response channel — Python logs **must** go to stderr.
- **ADR-005** — Project name is **Konvey** (not `RulesGen` from old prompts). All identifiers: `konvey`, `Konvey`, `pro.konvey.app`, `konvey-backend-<target>.exe`, `%APPDATA%\Konvey\`.
- **ADR-006** — npm, not pnpm. Don't switch until Sprint 5+.
- **ADR-008** — EnterpriseData extensions (`ext1:*` namespace) are deferred to Sprint 2+, but models already carry `XsdField.namespace`, `XsdComplexType.namespace`, `EnterpriseDataSchema.extension_namespaces` to avoid future migrations. Background and BSL examples in `docs/REFERENCE_EXT.md`.

## Domain notes

КД 3.1 / EnterpriseData generates a BSL module with imperative procedures that register conversion rules:

- **ПКО** (Правило Конвертации Объекта) — one rule per object pair `<1C object> ↔ <EnterpriseData type>`
- **ПКС** (Правило Конвертации Свойства) — per-field rule inside a ПКО
- **ПКТЧ** — tabular section rule
- **ПОД** — what to export, filters
- **ПКПД** — predefined values (enums, predefined catalog items)

For each pair of configurations Konvey emits **two** BSL modules — one for the source (export rules), one for the target (import rules). EnterpriseData is the wire format between them.

Reference fixtures and docs in `examples/enterprise_data_docs/` (official 1C PDFs + `ExchangeMessage.xsd` wrapper schema) and `backend/tests/fixtures/EnterpriseData_*.xsd` (real schemas, used in smoke tests).

## Environment gotchas

These cost an entire day to discover in Sprint 0. **All eight are documented in ADR-007** with the commit hashes that fixed them. Future Claude Code instances on a fresh machine will hit some of these:

1. **VS Build Tools, not VS Community** — `vswhere` may report `[]` if Community is partially installed. Standalone Build Tools 2022 via `vs_BuildTools.exe` is what works.
2. **`link.exe` is never in system PATH** — `scripts/msvc-env.ps1` invokes `VsDevCmd.bat` via a **temp .bat file** (cmd /c has a hard limit on argument length that long VS paths exceed).
3. **PowerShell scripts MUST be pure ASCII.** PowerShell 5.1 on Russian Windows reads `.ps1` as CP-1251 ANSI — UTF-8 em-dashes (`—`) get decoded as garbage and break quote parsing. Use `-` and `:` instead.
4. **System Python ≠ venv Python.** `Command::new("python")` in sidecar.rs picks up system Python which lacks `konvey_backend`. Always go through `$KONVEY_SIDECAR_PYTHON` env var that `dev.ps1` sets.
5. **Tauri 2 sidecar existence check** runs in dev mode too. `scripts/ensure-sidecar-placeholder.ps1` copies venv `python.exe` to `src-tauri/binaries/konvey-backend-x86_64-pc-windows-msvc.exe` so `cargo build` doesn't fail. `build-sidecar.ps1` overwrites with the real PyInstaller exe for production.
6. **Tauri 2 capabilities** — `dialog.open()`, `fs.read`, `shell.open` are gated by `src-tauri/capabilities/default.json`. Adding a Tauri plugin without a matching permission entry silently makes its commands no-op.

When in doubt, run `.\scripts\check-env.ps1` first — it surfaces missing pieces with exact remediation steps.

## What not to do

- **No dark theme** — hard rule from owner. There must be no theme toggle, no `prefers-color-scheme: dark` rules, no `dark:` class hooks.
- **No new dependencies without an ADR.** Especially no UI libraries (Tailwind, Material UI, icon packs), no animation libraries (framer-motion, react-spring), no graph libraries (react-flow). Stick to React + Zustand + Vite + CSS Modules.
- **No mock data in Inspector / Bottom Dock / Generated XML.** Until the relevant sprint implements them, show honest empty states like "Sprint N feature".
- **Do not parse SCHEME folders directly.** This rule lives in the older `agenter/` project (separate codebase), but if you encounter the path: the canonical interface to 1C metadata is `parsers/config_parser.py`, never Read/Glob on raw XML.
- **Do not bypass `dev.ps1`.** Running `npm run tauri dev` directly skips the MSVC env load and sidecar placeholder — fails with `link.exe not found` or `externalBin path doesn't exist`.
- **Do not modify the `agenter/` legacy project or `.claude/` skills** even if they are visible elsewhere on the file system — Konvey is a separate codebase living in `C:\BUFFER\Konvey\` (or wherever the repo is cloned).

## When something is unclear

Open `docs/QUESTIONS.md`, add `Q<N>. <topic>` with context and your tentative answer, mark the related code `# TODO: see QUESTIONS.md#N`, continue with a best-guess implementation. The next architect message will resolve it. **Never block on a single question** — always have a working fallback.
