# ChatGPT API (OpenAI) — локальная настройка

Эта лаборатория использует один LLM-сценарий: OpenAI по API-ключу и единую модель для `start` и `iterate`.

Эта настройка относится к админскому контуру. Пользователь без `OPENAI_API_KEY` всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `OPENAI_API_KEY` — ключ OpenAI API.

## Опциональное

- `DESENGINE_OPENAI_MODEL` — модель для всей лаборатории (по умолчанию задаётся в коде).

## Как задать

Переименуй [lab/config-example.txt](/Users/op/dev/sobakapav/desengine/lab/config-example.txt:1) в `lab/config.txt` и укажи в нём актуальный ключ OpenAI:

```
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=gpt-4.1-nano
```

`DESENGINE_OPENAI_MODEL` уже предзаполнен типовым значением, поэтому обычно достаточно заменить только `OPENAI_API_KEY`.

Для доступа по email см. `lab/env/access-control.md`.
