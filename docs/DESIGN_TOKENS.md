# Konvey Design Tokens

Каталог CSS-переменных из `src/styles/global.css` (исходник `examples/design/konvey-design.css` от Claude Design).

Все стили компонентов в `*.module.css` **обязаны** использовать эти переменные вместо hardcoded значений. Это обеспечивает единый visual language и упрощает будущие изменения темы.

> **Жёсткое правило:** дополнительной тёмной темы не будет. Все переменные определены под светлый industrial / utilitarian light theme. Решение владельца, не обсуждается.

---

## Backgrounds & surfaces

| Variable | Value | Where used |
|---|---|---|
| `--k-bg` | `#f4f4f5` | App background (тонко-серый) |
| `--k-panel` | `#ffffff` | Карточки, header, sidebar — основные панели |
| `--k-panel-2` | `#fafafa` | Workspace area (между панелями) |
| `--k-panel-sunk` | `#f7f7f8` | Hover backgrounds, утопленные секции (Bottom Dock active tab, focus states) |
| `--k-divider` | `#ececef` | Тонкие горизонтальные линии (между секциями Inspector, табами) |
| `--k-border` | `#e6e6e9` | Стандартные границы панелей |
| `--k-border-strong` | `#d6d6da` | Inputs, кнопки — более заметные границы |

## Text

| Variable | Value | Where used |
|---|---|---|
| `--k-text` | `#0e0e10` | Основной текст, заголовки |
| `--k-text-2` | `#4a4a52` | Вторичный текст (labels, supporting copy) |
| `--k-text-3` | `#7d7d85` | Подсказки, hint text, datestamps |
| `--k-text-4` | `#a8a8b0` | Disabled элементы, placeholder text |

## Accent (primary action)

| Variable | Value | Where used |
|---|---|---|
| `--k-accent` | `#2952d6` | Primary buttons, focus rings, активные индикаторы |
| `--k-accent-50` | `#eef2fc` | Subtle accent bg (focus glow, selected item) |
| `--k-accent-100` | `#dde5fa` | Чуть насыщеннее, для drag-target highlights |
| `--k-accent-text` | `#1e3da3` | Текст на accent-50 background |

## Status colors (mapping line colors, badges)

| Variable | Value | Use case |
|---|---|---|
| `--k-green` | `#1f8a5b` | Success — mapping confidence=high, exact type match |
| `--k-green-bg` | `#e7f3ec` | Background для success-badge |
| `--k-amber` | `#b07418` | Warning — confidence=medium, partial type match |
| `--k-amber-bg` | `#fbf2e0` | Background для warning |
| `--k-red` | `#b54545` | Error — type mismatch, conflict |
| `--k-red-bg` | `#fbe9e9` | Background для error |
| `--k-gray` | `#8a8a92` | Manual / skipped mappings, neutral indicator |

## Radii

| Variable | Value | Where used |
|---|---|---|
| `--k-radius-sm` | `3px` | Tree node selection background, small chips |
| `--k-radius` | `5px` | Default buttons, inputs |
| `--k-radius-md` | `7px` | Cards (ProjectCard), modals |
| `--k-radius-lg` | `10px` | Large containers, dialogs |

## Row heights (lists, trees)

| Variable | Value | Use case |
|---|---|---|
| `--k-row-h` | `24px` | Default tree node height |
| `--k-row-h-sm` | `22px` | Compact lists (sidebar items) |

## Shadows

| Variable | Value | Use case |
|---|---|---|
| `--k-shadow-sm` | `0 1px 0 rgba(15,15,20,0.04), 0 1px 2px rgba(15,15,20,0.04)` | ProjectCard idle |
| `--k-shadow-md` | `0 4px 12px rgba(15,15,20,0.08), 0 1px 2px rgba(15,15,20,0.06)` | ProjectCard hover, dropdowns |
| `--k-shadow-lg` | `0 24px 60px rgba(15,15,20,0.18), 0 4px 12px rgba(15,15,20,0.08)` | Modals, popovers |

## Typography

| Variable | Value | Use case |
|---|---|---|
| `--k-font-sans` | `'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Все UI-тексты (default font) |
| `--k-font-mono` | `'IBM Plex Mono', ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace` | Технические строки: типы полей (`xs:string`), пути (`Document.Реализация`), file paths, code in tooltips |

> IBM Plex шрифты подгружаются через `@import` из Google Fonts в `src/styles/extra.css`. Если интернет недоступен на машине разработки — fallback на Segoe UI.

---

## Базовые класс-помощники из `global.css`

В дополнение к переменным, `global.css` определяет несколько утилитарных классов, которые можно использовать в компонентах:

| Class | Эффект |
|---|---|
| `.k-app` | Применяется к корневому элементу App, ставит шрифт + цвета |
| `.k-mono` | Шрифт IBM Plex Mono, отключает лигатуры — для технических строк |
| `.k-header` | Высота 44px + base layout для top app bar |
| `.k-burger` | 26×26 grid-place кнопка для бургер-меню |
| `.k-logo` | Шрифт логотипа |
| `.k-project-name` | Стиль для inline-edit имени проекта |
| `.k-progress-block` | Прогресс-блок в header (flex 1, center) |
| `.k-progress-bar` | Тонкая полоска прогресс-бара (180×6) |
| `.k-btn` | Базовая кнопка. Модификаторы: `.k-btn.primary`, `.k-btn.ghost`, `.k-btn.icon`, `.k-btn.sm` |
| `.k-input` | Базовый input (определён в `extra.css`, не в `konvey-design.css`) |

---

## Правила использования

1. **CSS Modules только.** Все стили компонента в `Component.module.css`. Import: `import styles from './Component.module.css';` → `<div className={styles.foo}>`.

2. **Нет hardcoded цветов.** Если видишь `color: #fff` или `background: #ccc` в компоненте — заменить на соответствующую переменную. Если подходящей нет — добавить новую в `global.css` и задокументировать здесь.

3. **Runtime значения ОК.** Динамические стили из props (ширина прогресс-бара по %, позиция модала) — `style={{ width: \`${pct}%\` }}` — нормальный паттерн.

4. **Не дублировать `.k-btn` / `.k-input`.** Если компонент тривиальный — переиспользуй классы из `global.css` через `className="k-btn primary"`. Если нужны компонент-специфичные модификаторы — создай в `.module.css` через composes:
   ```css
   .myButton {
     composes: k-btn from global;
     /* доп. стили */
   }
   ```

5. **Иконографика.** Все SVG-иконки через `<Icon name="..." />` (создаётся в Iter 3). Размер всегда 14px или 16px в зависимости от контекста.

6. **Spacing.** Стандартные значения: 4px / 6px / 8px / 12px / 16px / 24px. Не использовать произвольные значения типа `padding: 7.5px`.

---

## Известные не-токенированные значения (TODO для будущих итераций)

- Точные размеры панелей Workspace (`width: 280px` для Left Sidebar, `340px` для Inspector) — задаются inline по дизайн-решению, но при изменении придётся править в нескольких местах. Sprint 1 может вынести в `--k-sidebar-w-default` / `--k-inspector-w-default`.
- Z-index layers (dropdown, modal, toast) — пока не нужны, появятся в Sprint 2.
- Transition durations — стандарт `120ms ease`; если будет несколько scope'ов (быстрые / медленные) — токенизировать в Sprint 1.5+.
