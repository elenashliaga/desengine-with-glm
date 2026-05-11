## Why

Production build через Turbopack падал на загрузке Inter через `next/font/google`, если окружение не могло установить соединение с `fonts.gstatic.com`.

Наблюдаемый лог:
- Turbopack сообщает `Error while requesting resource` для нескольких `.woff2` файлов Inter.
- После неудачных запросов сборка падает с `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`.
- Import trace вёл в `./app/layout.tsx`, где Inter был подключён через `next/font/google`.

Важно: требование по UI остаётся прежним. Приложение должно использовать именно Inter и подключать его через Tailwind-подход проекта. Нельзя заменять Inter на "похожий" системный fallback как исправление бага.

## What Changes

- Фиксируем проблему как отдельный bug-change.
- Переводим поставку Inter на локальные assets в репозитории.
- Подключаем Inter через `next/font/local`, сохраняя текущую Tailwind-переменную `--font-ui`.
- Убираем зависимость production build от внешнего скачивания шрифта во время сборки.
- Фиксируем контракт локальной поставки Inter в OpenSpec.

## Capabilities

### New Capabilities
- *(пусто)*

### Modified Capabilities
- `ui-foundation`: шрифтовая основа должна оставаться на Inter и не ломать production build.

## Impact

- Build/инфраструктура: production build больше не зависит от `fonts.gstatic.com` для Inter.
- UI: визуальный шрифт Inter должен сохраниться.
- Документация: зафиксирован локальный способ поставки Inter как каноническое решение.
