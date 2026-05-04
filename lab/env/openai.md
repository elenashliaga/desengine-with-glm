# ChatGPT API (OpenAI) — локальная настройка

Эта лаборатория использует переменные окружения и явный выбор LLM-провайдера.

## Обязательное

- `DESENGINE_LLM_PROVIDER=openai` — активирует облачный режим.
- `OPENAI_API_KEY` — ключ OpenAI API.

## Опциональное

- `DESENGINE_OPENAI_MODEL` — модель (по умолчанию задаётся в коде).
- `DESENGINE_INIT_LLM_PROVIDER` — отдельный провайдер для инициирующего запуска уровня.
- `DESENGINE_INIT_OPENAI_MODEL` — отдельная OpenAI-модель для инициирующего запуска уровня.

## Как задать

Создай файл `lab/.env.local` (он игнорируется git) и добавь:

```
DESENGINE_LLM_PROVIDER=openai
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=...
DESENGINE_INIT_LLM_PROVIDER=openai
DESENGINE_INIT_OPENAI_MODEL=gpt-4o-2024-08-06
DESENGINE_ALLOWLIST_BASE_URL=...
DESENGINE_ALLOWLIST_SALT=...
```

Если `DESENGINE_INIT_*` не заданы, инициирующий запуск уровня использует обычные OpenAI-настройки.

Для доступа по email см. `lab/env/access-control.md`.
Для локального режима см. `lab/env/ollama.md`.
