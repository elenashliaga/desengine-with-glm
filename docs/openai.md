# ChatGPT API (OpenAI) — локальная настройка

Эта лаборатория использует один LLM-сценарий: OpenAI по API-ключу и единую модель для `start` и `iterate`.

Эта настройка относится к админскому контуру. Пользователь без `OPENAI_API_KEY` всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `OPENAI_API_KEY` — ключ OpenAI API.

## Опциональное

Нет.

`DESENGINE_OPENAI_MODEL` — обязательная настройка модели для всей лаборатории. Она задаётся через `desengine.config.txt` и не имеет fallback в `desengine.config.json`.

## Как задать

Переименуй [desengine.config-example.txt](/Users/op/dev/sobakapav/desengine/desengine.config-example.txt:1) в `desengine.config.txt` и укажи в нём актуальный ключ OpenAI:

```
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=gpt-4.1-nano
```

`DESENGINE_OPENAI_MODEL` должен быть задан явно в `desengine.config.txt`.

Для доступа по email см. [access-control.md](/Users/op/dev/sobakapav/desengine/docs/access-control.md:1).
Админские команды сопровождения и smoke-check собраны в [tools/README.md](/Users/op/dev/sobakapav/desengine/tools/README.md:1).
