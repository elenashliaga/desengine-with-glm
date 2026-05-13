# ChatGPT API (OpenAI) — локальная настройка

## Аудитория

- Администратор локальной установки.
- Инженер сопровождения, который настраивает активного LLM-провайдера.

Эта лаборатория использует общий LLM-слой. OpenAI можно держать рядом с другими провайдерами в одном `desengine.config.txt`, а активный провайдер выбирается через `DESENGINE_LLM_PROVIDER`.

Эта настройка относится к админскому контуру. Пользователь без `OPENAI_API_KEY` всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `OPENAI_API_KEY` — ключ OpenAI API.

## Отдельно важно

`DESENGINE_OPENAI_MODEL` — обязательная настройка модели для всей лаборатории. Она задаётся через `desengine.config.txt` и не имеет fallback в `desengine.config.json`.

## Как задать

Переименуй [desengine.config-example.txt](desengine.config-example.txt:1) в `desengine.config.txt` и укажи в нём актуальный ключ OpenAI:

```
DESENGINE_LLM_PROVIDER=openai
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=gpt-4.1-nano
```

`DESENGINE_OPENAI_MODEL` должен быть задан явно в `desengine.config.txt`.

Для доступа по email см. [access-control.md](docs/access-control.md).
Для onboarding-источника и ручного обновления см. [onboarding.md](docs/onboarding.md).
Админские команды сопровождения и smoke-check собраны в [tools/README.md](tools/README.md).
