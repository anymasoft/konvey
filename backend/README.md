# konvey-backend

Python sidecar для Konvey. Запускается из Tauri (Rust) через stdin/stdout JSON-RPC.

## Установка для разработки

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .[dev]
```

## Запуск напрямую (dev)

```powershell
.\.venv\Scripts\python.exe -m konvey_backend
```

После запуска sidecar читает JSON-RPC из stdin построчно. Пример запроса:

```json
{"jsonrpc":"2.0","id":1,"method":"parse_xsd","params":{"path":"tests/fixtures/EnterpriseData_1_8_6.xsd"}}
```

## Тесты

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

## Сборка через PyInstaller

```powershell
..\scripts\build-sidecar.ps1
```

Результат: `src-tauri/binaries/konvey-backend-x86_64-pc-windows-msvc.exe`.

## Структура

```
backend/
├── pyproject.toml
└── src/konvey_backend/
    ├── __main__.py        # entry point, читает stdin, пишет stdout
    ├── rpc.py             # JSON-RPC 2.0 over stdio (минимальная имплементация)
    ├── models/            # Pydantic-модели (Project, EnterpriseDataSchema, Configuration)
    ├── parsers/           # xsd_parser.py + config_parser.py (через lxml)
    └── storage/           # project_storage.py — JSON files в %APPDATA%\Konvey\Projects\
```
