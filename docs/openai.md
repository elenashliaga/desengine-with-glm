# ChatGPT API (OpenAI) — локальная настройка

## Аудитория

- Администратор локальной установки.
- Инженер сопровождения, который настраивает активного LLM-провайдера.

Эта лаборатория использует общий LLM-слой. OpenAI можно держать рядом с другими провайдерами в одном `desengine.config.txt`, а активный провайдер выбирается через `LLM_PROVIDER`.

Эта настройка относится к админскому контуру. Пользователь без `OPENAI_API_KEY` всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `OPENAI_API_KEY` — ключ OpenAI API.
- `OPENAI_MODEL` — модель OpenAI для всей лаборатории.
- `OPENAI_BASE_URL` — базовый URL OpenAI API.

Все три параметра задаются через `desengine.config.txt` и не имеют fallback в `desengine.config.json` или скрытых endpoint-литералов в runtime.

## Как задать

Переименуй [desengine.config-example.txt](desengine.config-example.txt:1) в `desengine.config.txt` и укажи в нём актуальный ключ OpenAI:

```
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-nano
OPENAI_BASE_URL=https://api.openai.com/v1
```

Для доступа по email см. [access-control.md](docs/access-control.md).
Для onboarding-источника и ручного обновления см. [onboarding.md](docs/onboarding.md).
Админские команды сопровождения и smoke-check собраны в [tools/README.md](tools/README.md).
