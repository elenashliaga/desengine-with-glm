## MODIFIED Requirements

### Requirement: LLM status API живёт в пространстве `/api/status/*`

Система SHALL публиковать status-эндпойнт LLM в едином пространстве `/api/status/*`.

#### Scenario: Клиент запрашивает общий статус LLM
- **WHEN** клиент делает `GET /api/status/llm`
- **THEN** система отвечает `200` и возвращает JSON статуса LLM с полем `ok=true`

#### Scenario: Клиент пытается использовать устаревший openai-эндпойнт
- **WHEN** клиент делает `GET /api/status/openai`
- **THEN** система не предоставляет отдельный статус-эндпойнт для OpenAI
- **AND** каноническим путём остаётся только `GET /api/status/llm`
