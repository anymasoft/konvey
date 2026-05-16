# Handover to Claude Opus 4.7 — Sprint 0.5 завершён

> **Этот документ — готовая копипаста для передачи архитектору.** Открой новую сессию или продолжи существующую с Opus, скопируй текст ниже в сообщение.

---

## Сообщение для Opus (актуальная версия после Sprint 0.5)

```
Привет! Sprint 0.5 "Visual Foundation" завершён. Все 14 deliverables done +
8 bonus фич (включая твою главную D14 — resizable, и предложенное владельцем
расширение D14 на sidebars).

ССЫЛКИ ДЛЯ ЧТЕНИЯ:
- SPRINT_05_REPORT (полный отчёт):
  https://raw.githubusercontent.com/anymasoft/konvey/main/docs/SPRINT_05_REPORT.md
- DECISIONS.md (10 ADR, добавлены 009 и 010):
  https://raw.githubusercontent.com/anymasoft/konvey/main/docs/DECISIONS.md
- QUESTIONS.md (закрыты Q1-Q9, добавлены Q13-Q15):
  https://raw.githubusercontent.com/anymasoft/konvey/main/docs/QUESTIONS.md
- DESIGN_TOKENS.md (47 CSS-переменных):
  https://raw.githubusercontent.com/anymasoft/konvey/main/docs/DESIGN_TOKENS.md
- REFERENCE_EXT.md (ext1:* extensions для Sprint 2):
  https://raw.githubusercontent.com/anymasoft/konvey/main/docs/REFERENCE_EXT.md
- CLAUDE.md (memory для будущих Claude Code сессий):
  https://raw.githubusercontent.com/anymasoft/konvey/main/CLAUDE.md

ИСХОДНИКИ ДЛЯ ОБЗОРА (ключевые места которые поменялись в 0.5):
- src/components/icons/Icon.tsx — 36 inline SVG + helpers
  iconNameForObjectType / iconNameForEdCategory
- src/components/Workspace/useColumnResize.ts — общий hook для drag-resize
- src/components/Workspace/Workspace.module.css — финальный CSS Workspace
- src/components/Workspace/HeaderProgress.tsx — прогресс-бар + 3 счётчика
- src/components/Workspace/Inspector.tsx — object-state UI (Sprint 1 расширит
  до mapping details)
- src/components/Workspace/MappingArea.tsx — три pane с resizable dividers +
  ED candidate list при failed auto-match
- backend/src/konvey_backend/models/enterprise_data.py — добавлены namespace
  поля под Sprint 2 ext1
- backend/src/konvey_backend/models/project.py — schema_version=2, mappings
  list placeholder
- backend/src/konvey_backend/storage/project_storage.py —
  migrate_project_dict() v1->v2
- scripts/check-env.ps1 — pre-flight check (закрывает Q1+Q9)

ЧТО ИЗМЕНИЛОСЬ ВО ВЗАИМОДЕЙСТВИИ С UI ПО СРАВНЕНИЮ С SPRINT 0:
- Все inline style={{}} переписаны на CSS Modules (ADR-009)
- Header теперь имеет полноценный progress block — bar + три счётчика с
  цветными dot'ами (mapped/review/conflicts). В 0.5 все значения 0.
- Inspector при выборе объекта показывает: type icon + name + synonym +
  stat box (Реквизиты, ТЧ, Поля ТЧ, Значения) + placeholders под mapping и
  handlers секции
- Wizard step indicators — зелёные круги с галочками для пройденных,
  синие с цифрой для активного, серые для будущих
- TreeView: каждый leaf node имеет data-mapping-anchor-id="<side>:<obj>.<field>"
  (контракт для Sprint 1 SVG overlay), type-inferred icon (CatalogRef.* -> 📒)
- ObjectsSidebar и Inspector resizable (drag ЛКМ)
- MappingArea колонки resizable
- Bottom Dock: 4 таба с иконками (Problems/Generated XML/AI Chat/History) —
  все показывают честные empty states "Sprint N feature"

КЛЮЧЕВЫЕ КОНТРАКТЫ ДЛЯ SPRINT 1:

1. SVG mapping anchors. Каждый leaf node в TreeView имеет:
   data-mapping-anchor-id="<side>:<objectName>.<fieldPath>"
   Например: source:Document.Реализация.Контрагент
             ed:Документ.РеализацияТоваровУслуг.Контрагент
             target:Document.Реализация.Контрагент
   Имя атрибута зафиксировано — Sprint 1 SVG overlay использует
   document.querySelector('[data-mapping-anchor-id="..."]').

2. Project schema v2. Project.mappings: list[dict] — placeholder. Sprint 1
   заменит на list[ObjectMapping] без миграции (Pydantic примет dict-формат
   если у новых ObjectMapping будут совместимые поля при model_validate).

3. CSS токены. Все цвета через var(--k-*) переменные. Mapping line colors
   в Sprint 1:
     зелёный (high confidence, exact type)    -> var(--k-green)    #1f8a5b
     амбер  (medium / partial type)           -> var(--k-amber)    #b07418
     красный (mismatch / conflict)            -> var(--k-red)      #b54545
     серый (manual / skipped)                 -> var(--k-gray)     #8a8a92

4. Icon API. <Icon name="..." size={14} /> — 36 имён в IconName union.
   Если Sprint 1 нужна новая иконка — добавить в Icon.tsx union + ICON_DEFS
   (запись inline SVG из MIT/ISC источника). Никаких dependencies.

ОТВЕТЫ НА Q1-Q9 - все ранее ответили, реализовано.

НОВЫЕ ВОПРОСЫ Q13-Q15:
- Q13: учебная база УЦ№1 — владелец обещал, ждём 3-5 дней
- Q14: SVG overlay подход для mapping линий — подтверди что
       ResizeObserver + scroll listener + requestAnimationFrame подход OK
- Q15: где хранить resizable widths? Сейчас localStorage (machine-local
       preference). Альтернатива — в Project JSON (sync через backend).
       На Sprint 1 нужно решить.

ЧТО ЖДЁМ ОТ ТЕБЯ:
1. Подтверди что Sprint 1 plan (mapping engine) можно запускать как
   планировалось, или нужны коррективы из-за visual foundation
2. Скорректируй Sprint 1 prompt — Phase D1 (CSS Modules) и Phase A
   (pre-flight) уже сделаны, можно сократить
3. Реши Q14 (SVG overlay подход) и Q15 (где хранить widths)
4. Если будут новые UX-замечания после визуального просмотра —
   добавь в Sprint 1 prompt

ЧЕСТНЫЙ REVIEW ОТ ВЛАДЕЛЬЦА (после визуальной проверки):
+ Дизайн в окне теперь близок к мокапу Claude Design
+ Иконки в TreeView, header, sidebar, dock — все на месте
+ Resizable работает плавно, ширины сохраняются между сессиями
+ Header progress block выглядит как в мокапе (бар + counters)
+ Wizard со step checks смотрится профессионально
+ Inspector с object info — полезен и информативен
+ "ED candidate list при failed auto-match" — особо удачная находка,
  владелец явно отметил

ГОТОВЫ К SPRINT 1 (mapping engine + drag-and-drop + auto-mapping).
```

---

## Что сделать владельцу

1. Открыть https://claude.ai (продолжить ту же сессию с Opus, где он прислал Sprint 1 prompt после Sprint 0)
2. Вставить **весь блок выше** (от "Привет!" до "Готовы к Sprint 1 ...") как новое сообщение
3. Подождать пока Opus прочитает все raw URLs через `raw.githubusercontent.com` и подтвердит/скорректирует Sprint 1 prompt
4. Передать финальный Sprint 1 prompt мне (Claude Code) для исполнения

## Альтернативная подача

Если у Opus возникнут проблемы с raw.githubusercontent.com (cache, lag) — скопируй ему текст:
- `SPRINT_05_REPORT.md` (этот файл)
- `DECISIONS.md` ADR-009 и ADR-010 (новые)
- `QUESTIONS.md` Q13-Q15 (новые)

Все три файла короче 50 KB вместе — войдут в одно сообщение.
