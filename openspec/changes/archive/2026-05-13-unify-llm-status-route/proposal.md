## Why

Сейчас status API для LLM продублирован двумя URL: `/api/status/llm` и `/api/status/openai`, хотя `openai` — лишь один из провайдеров общего LLM-контура.

Это создаёт лишнюю сущность в API и не даёт дополнительной ценности.

## What Changes

- Оставить единый универсальный маршрут `GET /api/status/llm`.
- Удалить `GET /api/status/openai`.
- Обновить OpenSpec и задачи change.

## Capabilities

### Modified Capabilities

- `llm`: status API унифицировано до одного канонического URL.
