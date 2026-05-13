## Context

Сейчас основной protected-контур уже проверяет доступ в route-файлах:
- `/tasks`, `/tasks/[taskId]`, `/tasks/[taskId]/[screen]`, `/tasks/[taskId]/check`, `/tasks/[taskId]/done`, `/tasks/[taskId]/next`
- `/levels`, `/levels/[levelId]`

Но дополнительно существует повторный guard в компоненте `components/desengine/tasks/TasksPage.tsx`.

## Goal

Сделать единый архитектурный слой access-guard:
- только route entry points;
- ноль access-redirect логики внутри UI-компонентов.

## Non-goals

- Изменение логики allowlist-верификации.
- Изменение cookie/session формата доступа.

## Decision

1. `requireAccessOrRedirect` вызывается только из route-файлов (`app/**/page.tsx`, при необходимости route handlers).
2. Компоненты в `components/**` не вызывают access-guard функции.
3. `TasksPage` теряет внутренний guard и остаётся серверным data/UI-компонентом.

## Current Exceptions Found

- `components/desengine/tasks/TasksPage.tsx` — содержит `requireAccessOrRedirect(canonicalPath)`.

## Verification

- Поиск по `components/**` не находит `requireAccessOrRedirect(`.
- Все защищённые route-файлы сохраняют явный вызов guard.
