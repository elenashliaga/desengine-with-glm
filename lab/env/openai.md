# ChatGPT API (OpenAI) — локальная настройка

Эта лаборатория использует один LLM-сценарий: OpenAI по API-ключу и единую модель для `start` и `iterate`.

Эта настройка относится к админскому контуру. Пользователь без `OPENAI_API_KEY` всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `OPENAI_API_KEY` — ключ OpenAI API.

## Опциональное

- `DESENGINE_OPENAI_MODEL` — модель для всей лаборатории (по умолчанию задаётся в коде).

## Как задать

Создай файл `lab/.env.local` (он игнорируется git) на основе [lab/.env.local.example](/Users/op/dev/olgapavlova/desengine/lab/.env.local.example:1) и оставь в нём только актуальные LLM-переменные:

```
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=...
```

Для доступа по email см. `lab/env/access-control.md`.
