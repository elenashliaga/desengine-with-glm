# DeepSeek API — локальная настройка

## Аудитория

- Администратор локальной установки.
- Инженер сопровождения, который настраивает активного LLM-провайдера.

Эта лаборатория использует общий LLM-слой. DeepSeek можно держать рядом с OpenAI в одном `desengine.config.txt`, а активный провайдер выбирается через `DESENGINE_LLM_PROVIDER`.

Эта настройка относится к админскому контуру. Пользователь без ключа активного провайдера всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `DEEPSEEK_API_KEY` — ключ DeepSeek API.
- `DESENGINE_DEEPSEEK_MODEL` — модель DeepSeek для всей лаборатории.

## Опциональное

- `DESENGINE_DEEPSEEK_BASE_URL` — базовый URL DeepSeek API. По умолчанию используется `https://api.deepseek.com`.

## Как задать

Переименуй [desengine.config-example.txt](/Users/op/dev/sobakapav/desengine/desengine.config-example.txt:1) в `desengine.config.txt` и укажи в нём DeepSeek как активный провайдер:

```env
DESENGINE_LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=...
DESENGINE_DEEPSEEK_MODEL=deepseek-v4-flash
DESENGINE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

Если OpenAI-конфиг тоже лежит рядом, он не конфликтует с DeepSeek, пока активным остаётся `DESENGINE_LLM_PROVIDER=deepseek`.

## Текущее ограничение

В текущей версии адаптера DeepSeek запросы лаборатории выполняются в text-only режиме: если у уровня есть картинки, они не передаются в DeepSeek API. Текстовый контекст задачи и ограничения по JSON-ответу при этом сохраняются.

Для доступа по email см. [access-control.md](/Users/op/dev/sobakapav/desengine/docs/access-control.md:1).
Для onboarding-источника и ручного обновления см. [onboarding.md](/Users/op/dev/sobakapav/desengine/docs/onboarding.md:1).
Админские команды сопровождения и smoke-check собраны в [tools/README.md](/Users/op/dev/sobakapav/desengine/tools/README.md:1).
