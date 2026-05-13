## Context

В результате предыдущего рефакторинга появились два status-эндпойнта под `api/status`: `llm` и `openai`.
Оба возвращают один и тот же результат `getLlmStatus()`.

## Goal

Свести статус LLM к одному каноническому маршруту и убрать дублирование API.

## Decision

- Канонический и единственный route: `GET /api/status/llm`.
- `GET /api/status/openai` удаляется без thin-wrapper и редиректов.

## Testing

- Проверить, что `app/api/status/llm/route.ts` проходит линт.
- Проверить отсутствие `app/api/status/openai/route.ts`.
- Проверить, что в коде/документации нет обращений к `/api/status/openai` вне архивных артефактов change.
