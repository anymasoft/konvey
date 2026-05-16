# Создание GitHub-репозитория для Konvey

Инструкция для владельца проекта по созданию публичного GitHub-репо и передаче доступа архитектору (Claude Opus).

## Зачем публичный

Архитектор (Claude Opus 4.7 в отдельной сессии) не имеет прямого коннектора к GitHub API. Самый надёжный способ дать ему доступ к коду — **публичный репозиторий**, который он читает через `raw.githubusercontent.com` без авторизации.

Для коммерческой части (лицензионный код, маркетинговые материалы, ключи) — заведём **второй приватный репо** позже. Это стандартная open-core модель.

## Шаги

### 1. Создание репо на GitHub

1. Зайди на https://github.com/new
2. **Repository name:** `konvey`
3. **Description:** `AI-генератор правил обмена данными между конфигурациями 1С через стандарт EnterpriseData (КД 3.1)`
4. **Visibility:** **Public** (важно — архитектору нужен доступ для чтения кода)
5. **НЕ ставь** галки:
   - ☐ Add a README file
   - ☐ Add .gitignore
   - ☐ Choose a license

   У нас уже всё есть в локальном репо.
6. Нажми **Create repository**
7. Скопируй URL вида `https://github.com/<USERNAME>/konvey.git`

### 2. Push локального репо

В терминале PowerShell в папке `C:\BUFFER\Konvey\`:

```powershell
cd C:\BUFFER\Konvey
git remote add origin https://github.com/<USERNAME>/konvey.git
git branch -M main
git push -u origin main
```

После пуша проверь, что код виден на https://github.com/<USERNAME>/konvey

### 3. Передача доступа архитектору

В новой сессии с Claude Opus в начале сообщения напиши примерно так:

```
Привет, Sprint 0 закончен. GitHub проекта: https://github.com/<USERNAME>/konvey

Ключевые файлы для ознакомления:
- docs/SPRINT_0_REPORT.md — отчёт по спринту
- docs/DECISIONS.md — принятые архитектурные решения
- docs/QUESTIONS.md — открытые вопросы для тебя
- backend/src/konvey_backend/parsers/xsd_parser.py — парсер XSD EnterpriseData
- src-tauri/src/main.rs — Tauri shell

Текущая ветка: main
Последний коммит: <короткий хеш + сообщение>

Ниже — полный текст SPRINT_0_REPORT.md:
<вставить текст отчёта>
```

Архитектор сможет читать любой файл по схеме:
- HTML view: `https://github.com/<USERNAME>/konvey/blob/main/<path>`
- Raw text: `https://raw.githubusercontent.com/<USERNAME>/konvey/main/<path>`

Например, для `docs/DECISIONS.md`:
- `https://raw.githubusercontent.com/<USERNAME>/konvey/main/docs/DECISIONS.md`

## Если репо должен быть приватным

Если по какой-то причине нужен приватный репо:
- Архитектор будет работать по медленной схеме: владелец передаёт через чат `git ls-files` + содержимое ключевых файлов
- Время на обратную связь увеличится в 2-3 раза
- Не рекомендуется до момента, когда в репо появится лицензионный код / ключи / маркетинг

## Что делать дальше после push

1. Передай URL архитектору
2. Передай SPRINT_0_REPORT.md в чате с архитектором
3. Жди от архитектора план Sprint 1 (mapping engine, drag-and-drop, auto-mapping по имени)
