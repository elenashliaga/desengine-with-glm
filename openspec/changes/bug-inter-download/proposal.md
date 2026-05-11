## Why

Production build через Turbopack может падать на `next/font/google` при сборке Inter, если окружение не может установить соединение с `fonts.gstatic.com`.

Наблюдаемый лог:
- Turbopack сообщает `Error while requesting resource` для нескольких `.woff2` файлов Inter.
- После неудачных запросов сборка падает с `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`.
- Import trace ведёт в `./app/layout.tsx`, где Inter подключён через `next/font/google`.

Важно: требование по UI остаётся прежним. Приложение должно использовать именно Inter и подключать его через Tailwind-подход проекта. Нельзя заменять Inter на "похожий" системный fallback как исправление бага.

## What Changes

- Фиксируем проблему как отдельный bug-change.
- Исследуем, почему сборка зависит от сетевого скачивания Inter в конкретном окружении.
- Выбираем решение, которое сохраняет Inter как канонический UI-шрифт.
- Проверяем, что `npm run build` воспроизводимо проходит в окружении без неожиданных сетевых падений.

## Capabilities

### New Capabilities
- *(пусто)*

### Modified Capabilities
- `ui-foundation`: шрифтовая основа должна оставаться на Inter и не ломать production build.

## Impact

- Build/инфраструктура: потребуется разобраться с поведением `next/font/google` и Turbopack при недоступности `fonts.gstatic.com`.
- UI: визуальный шрифт Inter должен сохраниться.
- Документация: возможно, потребуется зафиксировать требования к сетевому доступу или локальному способу поставки Inter.
