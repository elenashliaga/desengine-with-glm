# GLM (Zhipu AI / z.ai) — локальная настройка

## Аудитория

- Администратор локальной установки.
- Инженер сопровождения, который настраивает активного LLM-провайдера.

Эта лаборатория использует общий LLM-слой. GLM можно держать рядом с OpenAI, DeepSeek и Gemini в одном `desengine.config.txt`, а активный провайдер выбирается через `LLM_PROVIDER`.

Эта настройка относится к админскому контуру. Пользователь без ключа активного провайдера всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `GLM_API_KEY` — ключ API от z.ai / Zhipu AI.
- `GLM_MODEL` — модель GLM для всей лаборатории.
- `GLM_BASE_URL` — базовый URL GLM API.

## Как задать

Переименуй [desengine.config-example.txt](desengine.config-example.txt) в `desengine.config.txt` и укажи в нём GLM как активный провайдер:

```env
LLM_PROVIDER=glm
GLM_API_KEY=...
GLM_MODEL=glm-5
GLM_BASE_URL=https://api.z.ai/api/coding/paas/v4
```

Если OpenAI-, DeepSeek- и Gemini-конфиги тоже лежат рядом, они не конфликтуют с GLM, пока активным остаётся `LLM_PROVIDER=glm`.

## Текущее ограничение

В текущей версии адаптера GLM запросы лаборатории выполняются в text-only режиме: если у уровня есть картинки, они не передаются в GLM API. Текстовый контекст задачи и ограничения по JSON-ответу при этом сохраняются.

## Поддерживаемые провайдеры

Адаптер GLM совместим с любым OpenAI-совместимым API, использующим endpoint `/chat/completions`:
- **z.ai** — `https://api.z.ai/api/coding/paas/v4`
- **Zhipu AI (BigModel)** — `https://open.bigmodel.cn/api/paas/v4`
- Любой другой OpenAI-совместимый endpoint

Для доступа по email см. [access-control.md](docs/access-control.md).
Для onboarding-источника и ручного обновления см. [onboarding.md](docs/onboarding.md).
Админские команды сопровождения и smoke-check собраны в [tools/README.md](tools/README.md).
