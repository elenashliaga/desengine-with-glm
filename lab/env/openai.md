# ChatGPT API (OpenAI) — локальная настройка

Эта лаборатория использует переменные окружения.

## Обязательное

- `OPENAI_API_KEY` — ключ OpenAI API.

## Опциональное

- `DESENGINE_OPENAI_MODEL` — модель (по умолчанию задаётся в коде).

## Как задать

Создай файл `lab/.env.local` (он игнорируется git) и добавь:

```
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=...
DESENGINE_ALLOWLIST_BASE_URL=...
DESENGINE_ALLOWLIST_SALT=...
```

Для доступа по email см. `lab/env/access-control.md`.
