## ADDED Requirements

### Requirement: LLM status API живёт в пространстве `/api/status/*`

Система SHALL публиковать status-эндпойнты LLM в едином пространстве `/api/status/*`.

#### Scenario: Клиент запрашивает общий статус LLM
- **WHEN** клиент делает `GET /api/status/llm`
- **THEN** система отвечает `200` и возвращает JSON статуса LLM с полем `ok=true`

#### Scenario: Клиент запрашивает статус OpenAI-совместимого контура
- **WHEN** клиент делает `GET /api/status/openai`
- **THEN** система отвечает `200` и возвращает JSON статуса LLM с полем `ok=true`

## MODIFIED Requirements

### Requirement: На MVP используется настраиваемый LLM-провайдер

Система SHALL использовать на MVP тот сетевой LLM-провайдер, который выбран конфигурацией приложения.

Поддерживаются только режимы провайдеров, доступных по ключу.

Поддерживаются как минимум следующие режимы:
- OpenAI по ключу;
- DeepSeek.
- Google Gemini.

Активный провайдер SHALL выбираться через локальный env-конфиг запуска (`desengine.config.txt` или эквивалентные env vars процесса), а не через `desengine.config.json`.

#### Scenario: Конфигурация выбрала сетевой провайдер
- **WHEN** приложение настроено на конкретный сетевой провайдер по ключу
- **THEN** система отправляет LLM-запросы через этот провайдер

#### Scenario: Конфигурация выбрала DeepSeek
- **WHEN** приложение настроено на режим DeepSeek
- **THEN** система отправляет LLM-запросы через адаптер DeepSeek

#### Scenario: Конфигурация выбрала Google Gemini
- **WHEN** приложение настроено на режим Google Gemini
- **THEN** система отправляет LLM-запросы через адаптер Google Gemini

#### Scenario: Оператор переключает активный провайдер
- **WHEN** оператор меняет `LLM_PROVIDER` и provider-specific модель в `desengine.config.txt`
- **THEN** и `start`, и `iterate` используют новый активный провайдер без изменений в коде

#### Scenario: Оператор проверяет статус провайдера через API
- **WHEN** оператор делает `GET /api/status/llm` или `GET /api/status/openai`
- **THEN** система возвращает диагностический статус активного LLM-контура
