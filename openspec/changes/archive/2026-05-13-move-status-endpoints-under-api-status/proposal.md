## Why

В API есть разрозненные status-эндпойнты верхнего уровня (`/api/llm-status`, `/api/openai-status`), из-за чего дерево маршрутов выглядит непоследовательно.

Нужно унифицировать структуру и собрать status-маршруты в общем пространстве `/api/status/*` без сохранения legacy-роутов.

## What Changes

- Перенести `GET /api/llm-status` в `GET /api/status/llm`.
- Перенести `GET /api/openai-status` в `GET /api/status/openai`.
- Удалить старые директории `app/api/llm-status` и `app/api/openai-status` без thin-wrapper и редиректов.
- Обновить спецификацию capability `llm` и задачи change.

## Capabilities

### Modified Capabilities

- `llm`: меняются канонические URL status-эндпойнтов.

## Impact

- Внутренние клиенты должны использовать новые пути `/api/status/*`.
- Старые URL перестают работать сразу после релиза change.
